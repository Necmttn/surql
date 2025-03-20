import { handleCommand } from "./lib/commands.ts";
import { loadConfig, CONFIG_FILENAME_JSON, CONFIG_FILENAME_TS } from "./lib/config.ts";
import { exists } from "@std/fs";
import { processFile, processDB } from "./lib/commands.ts";

/**
 * Represents a table definition from SurrealDB schema
 */
export interface TableDefinition {
  name: string;
  fields: Array<{
    name: string;
    type: string;
    optional: boolean;
    reference?: {
      table: string;
      isOption: boolean;
    };
  }>;
}

/**
 * Parses a SurrealDB type string into components
 * @param type The type string from SurrealDB schema
 * @returns Object containing baseType, isOption flag, and optional reference information
 */
export function parseType(type: string): { baseType: string; isOption: boolean; reference?: { table: string; isOption: boolean } } {
  let isOption = false;
  let baseType = type;
  let reference: { table: string; isOption: boolean } | undefined;

  // Remove any REFERENCE or other keywords that might appear after the type
  baseType = baseType.replace(/\s+REFERENCE.*$/i, '');

  // Handle option types
  if (baseType.startsWith("option<")) {
    isOption = true;
    baseType = baseType.slice(7, -1);
  }

  // Handle record references
  if (baseType.startsWith("record<")) {
    const tableName = baseType.slice(7, -1);
    reference = {
      table: tableName,
      isOption: isOption
    };
    baseType = "record";
  }

  // Handle references arrays
  if (baseType.startsWith("references<")) {
    const tableName = baseType.slice(11, -1);
    reference = {
      table: tableName,
      isOption: isOption
    };
    baseType = "references";
  }

  // Handle array types
  if (baseType.startsWith("array<")) {
    const innerType = baseType.slice(6, -1);
    if (innerType.startsWith("record<")) {
      const tableName = innerType.slice(7, -1);
      reference = {
        table: tableName,
        isOption: false
      };
      baseType = "array_record";
    } else if (innerType === "float") {
      baseType = "array_float";
    } else {
      baseType = "array";
    }
  }

  return { baseType, isOption, reference };
}

/**
 * Parses SurrealQL content to extract table definitions
 * @param content The SurrealQL content as a string
 * @returns Array of table definitions
 */
export function parseSurQL(content: string): TableDefinition[] {
  const tables: TableDefinition[] = [];
  const lines = content.split("\n");
  let currentTable: TableDefinition | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith("--")) continue;

    // Check for table definition
    if (trimmedLine.startsWith("DEFINE TABLE")) {
      if (currentTable) {
        tables.push(currentTable);
      }
      // Extract table name, handling OVERWRITE keyword
      const tableMatch = trimmedLine.match(/DEFINE TABLE (?:OVERWRITE )?(\w+)/);
      if (tableMatch) {
        const tableName = tableMatch[1];
        currentTable = {
          name: tableName,
          fields: [],
        };
      }
      continue;
    }

    // Check for field definition
    if (trimmedLine.startsWith("DEFINE FIELD") && currentTable) {
      // Modified regex to better match field definitions
      const fieldMatch = trimmedLine.match(/DEFINE FIELD (?:OVERWRITE )?(\w+) ON ([a-zA-Z_0-9]+) TYPE ([^;]+)/);
      if (fieldMatch) {
        const [, fieldName, tableName, fieldType] = fieldMatch;

        // Find the correct table for this field
        // Normalize table names for comparison
        const normalizedTableName = tableName.toLowerCase();

        // Find the table we want to add this field to
        let targetTable = tables.find(t => t.name.toLowerCase() === normalizedTableName);
        if (!targetTable && currentTable && currentTable.name.toLowerCase() === normalizedTableName) {
          targetTable = currentTable;
        }

        if (targetTable) {
          const cleanType = fieldType.trim();
          const { baseType, isOption, reference } = parseType(cleanType);

          targetTable.fields.push({
            name: fieldName,
            type: baseType,
            optional: trimmedLine.includes("OPTIONAL") || isOption,
            reference
          });
        }
      }
    }
  }

  // Add the last table if exists
  if (currentTable) {
    tables.push(currentTable);
  }

  return tables;
}

/**
 * Formats a table name to a type name (snake_case to PascalCase + "Type")
 * @param tableName The table name to format
 * @returns Formatted type name
 */
export function formatTypeName(tableName: string): string {
  // Convert snake_case to PascalCase and add Type suffix
  return `${tableName
    .toLowerCase()
    .replace(/-/g, '_')
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')}Type`;
}

/**
 * Formats a table name to a schema name (snake_case to PascalCase)
 * @param tableName The table name to format
 * @returns Formatted schema name
 */
export function formatSchemaName(tableName: string): string {
  // Convert snake_case to PascalCase
  return tableName
    .toLowerCase()
    .replace(/-/g, '_')
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Generates TypeBox schemas from table definitions
 * @param tables Array of table definitions
 * @returns String containing generated TypeBox schemas
 */
export function generateTypeBoxSchemas(tables: TableDefinition[]): string {
  // Define RecordIdType helper
  const recordIdTypeHelper = `
// Type for representing a RecordId in TypeBox
const RecordIdType = <T extends string>(_table: T) => Type.Unsafe<RecordId<T>>();
`;

  // Generate type definitions with references
  const schemaDefinitions = tables.map(table => {
    const { name, fields } = table;
    const typeName = formatTypeName(name);
    const schemaName = formatSchemaName(name);
    const needsRecursive = name === "telegram_message"; // Only telegram_message needs recursive for self-reference

    const fieldDefinitions = fields.map(field => {
      let typeBoxType: string;

      switch (field.type.toLowerCase()) {
        case "int":
        case "number":
          typeBoxType = "Type.Integer()";
          break;
        case "float":
          typeBoxType = "Type.Number()";
          break;
        case "bool":
          typeBoxType = "Type.Boolean()";
          break;
        case "datetime":
          typeBoxType = "Type.String({ format: 'date-time' })";
          break;
        case "array":
          typeBoxType = "Type.Array(Type.String())";
          break;
        case "array_float":
          typeBoxType = "Type.Array(Type.Number())";
          break;
        case "array_record":
          if (field.reference) {
            // Use union type with RecordIdType for references
            typeBoxType = `Type.Array(RecordIdType('${field.reference.table}'))`;
          } else {
            typeBoxType = "Type.Array(Type.Record(Type.String(), Type.Unknown()))";
          }
          break;
        case "object":
          typeBoxType = "Type.Record(Type.String(), Type.Unknown())";
          break;
        case "record":
          if (field.reference) {
            // Special case for self-reference in reply_to_message_id
            if (field.name === "reply_to_message_id" && field.reference.table === "telegram_message") {
              typeBoxType = "This";
            } else {
              // Use string reference here with union type for RecordId
              typeBoxType = `RecordIdType('${field.reference.table}')`;
            }
          } else {
            typeBoxType = "Type.Record(Type.String(), Type.Unknown())";
          }
          break;
        case "references":
          if (field.reference) {
            // Use union type with RecordIdType for references
            typeBoxType = `Type.Array(RecordIdType('${field.reference.table}'))`;
          } else {
            typeBoxType = "Type.Array(Type.String())";
          }
          break;
        default:
          typeBoxType = "Type.String()";
      }

      if (field.optional) {
        typeBoxType = `Type.Optional(${typeBoxType})`;
      }

      return `  ${field.name}: ${typeBoxType}`;
    }).join(',\n');

    // Add ID field at the beginning of each type
    const idField = `  id: RecordIdType('${name}'),\n`;
    const allFields = idField + fieldDefinitions;

    // Different format for recursive vs regular types
    if (needsRecursive) {
      return `// Type declaration for ${schemaName}
export const ${typeName} = Type.Recursive(This => Type.Object({
${allFields}
}), {
  $id: '${name}',
});
`;
    }

    return `// Type declaration for ${schemaName}
export const ${typeName} = Type.Object({
${allFields}
}, {
  $id: '${name}',
});
`;
  }).join('\n\n');

  // Create Module registration
  const moduleRegistration = `
const Module = Type.Module({
  ${tables.map(table => `${table.name}: ${formatTypeName(table.name)}`).join(',\n  ')},
});

${tables.map(table => {
    const schemaName = formatSchemaName(table.name);
    return `const ${schemaName} = Module.Import('${table.name}');\nexport type ${schemaName} = Static<typeof ${schemaName}>;`;
  }).join('\n')}
`;
  const header = `// This file is generated by surql-gen. Do not edit it manually. \n\n//created at ${new Date().toLocaleString()} by @necmttn`;
  // Combine everything with proper imports
  return `${header}\n\nimport { Type, type Static } from "@sinclair/typebox";\nimport type { RecordId } from "surrealdb";\n\n${recordIdTypeHelper}\n${schemaDefinitions}\n\n${moduleRegistration}`;
}

/**
 * Validates and fixes references in table definitions
 * @param tables Array of table definitions to validate
 * @returns Array of validated and fixed table definitions
 */
export function validateReferences(tables: TableDefinition[]): TableDefinition[] {
  // Create a set of all defined table names for fast lookup
  const tableNames = new Set(tables.map(t => t.name.toLowerCase()));

  // Process each table to fix references to non-existent tables
  return tables.map(table => {
    const fixedFields = table.fields.map(field => {
      // If field has a reference to a table that doesn't exist
      if (field.reference && !tableNames.has(field.reference.table.toLowerCase())) {
        // For array_record, change to generic array of records
        if (field.type === 'array_record') {
          return {
            ...field,
            type: 'array',
            reference: undefined
          };
        }
        // For record references, change to generic record
        if (field.type === 'record') {
          return {
            ...field,
            reference: undefined
          };
        }
        // For references, change to array
        if (field.type === 'references') {
          return {
            ...field,
            type: 'array',
            reference: undefined
          };
        }
      }

      // Special case for embedding field which should be array_float
      if (field.name === 'embedding' && field.type === 'array') {
        return {
          ...field,
          type: 'array_float'
        };
      }

      return field;
    });

    return {
      ...table,
      fields: fixedFields
    };
  });
}

// Export cli handler 
export { handleCommand };

// This is the entry point when the module is run directly
if (import.meta.main) {
  const args = Deno.args;

  // If no args are provided, look for config files in the current directory
  if (args.length === 0) {
    const { log, spinner } = await import("@clack/prompts");
    const chalk = await import("chalk");
    const { processDB } = await import("./lib/commands.ts");

    const configSpinner = spinner();
    configSpinner.start("Checking for configuration files");

    const hasTypeScriptConfig = await exists(CONFIG_FILENAME_TS);
    const hasJsonConfig = await exists(CONFIG_FILENAME_JSON);

    if (hasTypeScriptConfig || hasJsonConfig) {
      const config = await loadConfig();
      const configType = hasTypeScriptConfig ? "TypeScript" : "JSON";
      configSpinner.message(`Found ${chalk.default.green(configType)} configuration`);

      if (config.db?.url) {
        configSpinner.message(`Using database URL: ${chalk.default.cyan(config.db.url)}`);
        configSpinner.stop(`Running with ${chalk.default.green(configType)} configuration`);
        await processDB(); // Call processDB with no arguments to use the config values
      } else {
        configSpinner.stop(chalk.default.yellow("Configuration found but missing database URL"));
        log.error("Config found but no database URL specified.");
        log.info("Please provide an input file or database URL.");
        Deno.exit(1);
      }
    } else {
      configSpinner.stop(chalk.default.red("No configuration files found"));
      log.info("Run 'deno run -A mod.ts --help' for usage information.");
      Deno.exit(1);
    }
  } else {
    await handleCommand(args);
  }
}
