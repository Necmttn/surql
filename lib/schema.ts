import { Type, type Static } from "@sinclair/typebox";
import type { RecordId } from "surrealdb";
import { createSelectType, createInsertType, createUpdateType, createFilterType } from "./typebox.ts";

/**
 * Represents a table definition from SurrealDB schema
 */
export interface TableDefinition {
  name: string;
  description?: string;
  fields: Array<{
    name: string;
    type: string;
    optional: boolean;
    description?: string;
    defaultValue?: string;
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

  // Remove trailing semicolons if present
  baseType = baseType.replace(/;$/, '');

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
 * Extracts comment string from a line containing a COMMENT clause
 * @param line The line to extract from
 * @returns The extracted comment or undefined if not found
 */
function extractComment(line: string): string | undefined {
  // Find the position of COMMENT keyword
  const commentIndex = line.indexOf("COMMENT");
  if (commentIndex === -1) return undefined;

  // Look for both single and double quotes
  let startQuoteIndex = line.indexOf('"', commentIndex);
  const quoteChar = startQuoteIndex !== -1 ? '"' : "'";

  // If no double quote, try single quote
  if (startQuoteIndex === -1) {
    startQuoteIndex = line.indexOf("'", commentIndex);
    if (startQuoteIndex === -1) return undefined;
  }

  // Find the closing quote
  const endQuoteIndex = line.indexOf(quoteChar, startQuoteIndex + 1);
  if (endQuoteIndex === -1) return undefined;

  // Extract the content between quotes
  return line.substring(startQuoteIndex + 1, endQuoteIndex);
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
  let currentDescription: string | undefined = undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Process comments as potential descriptions for fields
    if (trimmedLine.startsWith("--")) {
      // Save comment as a potential description for the next field
      const descriptionText = trimmedLine.substring(2).trim();
      if (descriptionText) {
        currentDescription = descriptionText;
      }
      continue;
    }

    // Skip empty lines
    if (!trimmedLine) {
      currentDescription = undefined; // Reset description on empty line
      continue;
    }

    // Check for table definition
    if (trimmedLine.startsWith("DEFINE TABLE")) {
      if (currentTable) {
        tables.push(currentTable);
      }
      // Extract table name, handling OVERWRITE keyword
      const tableMatch = trimmedLine.match(/DEFINE TABLE (?:OVERWRITE )?(\w+)/);

      if (tableMatch) {
        const tableName = tableMatch[1];

        // Check for COMMENT in the table definition
        let tableDescription: string | undefined = undefined;
        const commentDescription = extractComment(trimmedLine);
        if (commentDescription) {
          tableDescription = commentDescription;
        } else {
          // If COMMENT is not in this line, use the previous comment line
          tableDescription = currentDescription;
        }

        currentTable = {
          name: tableName,
          description: tableDescription,
          fields: [],
        };
      }
      currentDescription = undefined; // Reset description
      continue;
    }

    // Check for field definition
    if (trimmedLine.startsWith("DEFINE FIELD") && currentTable) {
      // Modified regex to match field definitions, extracting only the type part
      // This regex captures field_name, table_name, and type even if there's a semicolon at the end
      const fieldMatch = trimmedLine.match(/DEFINE FIELD (?:OVERWRITE )?(\w+) ON ([a-zA-Z_0-9]+) TYPE ([^; ]+)/);
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

          // Store the comment line description, will use if no COMMENT clause is found
          const lineDescription = currentDescription;

          // Check for inline COMMENT in the line
          const commentDescription = extractComment(trimmedLine);

          // Look for default value and comment in subsequent lines
          let defaultValue: string | undefined = undefined;
          let multilineCommentDescription: string | undefined = undefined;

          // Look ahead for DEFAULT, VALUE, or COMMENT clauses
          let j = i + 1;
          while (j < lines.length) {
            const nextLine = lines[j].trim();

            // Stop looking if we hit an empty line or a new define statement
            if (!nextLine || nextLine.startsWith("DEFINE")) {
              break;
            }

            // Check for DEFAULT clause
            if (nextLine.startsWith("DEFAULT")) {
              const defaultMatch = nextLine.match(/DEFAULT (?:ALWAYS )?(.+?)(?:;|$)/);
              if (defaultMatch) {
                defaultValue = defaultMatch[1].trim();
              }
            }

            // Check for VALUE clause (which is a form of default)
            if (nextLine.startsWith("VALUE")) {
              const valueMatch = nextLine.match(/VALUE (.+?)(?:;|$)/);
              if (valueMatch) {
                defaultValue = valueMatch[1].trim();
              }
            }

            // Check for COMMENT clause if not found in the main line
            if (!commentDescription && nextLine.includes("COMMENT")) {
              multilineCommentDescription = extractComment(nextLine);
            }

            j++;
          }

          // If we found lines with DEFAULT/VALUE/COMMENT, skip those lines
          if (j > i + 1) {
            i = j - 1; // -1 because the loop will increment i
          }

          // Prioritize COMMENT clause descriptions over comment line descriptions
          // First check inline COMMENT, then multiline COMMENT, then comment line
          const finalDescription = commentDescription || multilineCommentDescription || lineDescription;

          targetTable.fields.push({
            name: fieldName,
            type: baseType,
            optional: trimmedLine.includes("OPTIONAL") || isOption,
            description: finalDescription,
            defaultValue,
            reference
          });
        }
      }
      currentDescription = undefined; // Reset description after field is defined
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

  // Add import for helper functions
  const imports = `import { Type, type Static } from "@sinclair/typebox";
import type { RecordId } from "surrealdb";
import { createSelectType, createInsertType, createUpdateType, createFilterType } from "./typebox.ts";
`;

  // Generate type definitions with references
  const schemaDefinitions = tables.map(table => {
    const { name, fields, description } = table;
    const typeName = formatTypeName(name);
    const schemaName = formatSchemaName(name);
    const needsRecursive = name === "telegram_message"; // Only telegram_message needs recursive for self-reference

    const fieldDefinitions = fields.map(field => {
      let typeBoxType: string;
      const typeOptions: string[] = [];

      // Add description if available
      if (field.description) {
        typeOptions.push(`description: '${field.description.replace(/'/g, "\\'")}'`);
      }

      // Add default value if available
      if (field.defaultValue) {
        typeOptions.push(`default: ${field.defaultValue}`);
      }

      // Build type options string
      const typeOptionsStr = typeOptions.length > 0 ? `{ ${typeOptions.join(', ')} }` : '';

      switch (field.type.toLowerCase()) {
        case "int":
        case "number":
          typeBoxType = typeOptionsStr ? `Type.Integer(${typeOptionsStr})` : "Type.Integer()";
          break;
        case "float":
          typeBoxType = typeOptionsStr ? `Type.Number(${typeOptionsStr})` : "Type.Number()";
          break;
        case "bool":
          typeBoxType = typeOptionsStr ? `Type.Boolean(${typeOptionsStr})` : "Type.Boolean()";
          break;
        case "datetime": {
          // Add format hint for datetime plus any other options
          const dateTimeOptions = [...typeOptions].join(', ');
          typeBoxType = `Type.Date({ ${dateTimeOptions} })`;
          break;
        }
        case "array":
          typeBoxType = typeOptionsStr
            ? `Type.Array(Type.String(), ${typeOptionsStr})`
            : "Type.Array(Type.String())";
          break;
        case "array_float":
          typeBoxType = typeOptionsStr
            ? `Type.Array(Type.Number(), ${typeOptionsStr})`
            : "Type.Array(Type.Number())";
          break;
        case "array_record":
          if (field.reference) {
            // Use union type with RecordIdType for references
            typeBoxType = typeOptionsStr
              ? `Type.Array(RecordIdType('${field.reference.table}'), ${typeOptionsStr})`
              : `Type.Array(RecordIdType('${field.reference.table}'))`;
          } else {
            typeBoxType = typeOptionsStr
              ? `Type.Array(Type.Record(Type.String(), Type.Unknown()), ${typeOptionsStr})`
              : "Type.Array(Type.Record(Type.String(), Type.Unknown()))";
          }
          break;
        case "object":
          typeBoxType = typeOptionsStr
            ? `Type.Record(Type.String(), Type.Unknown(), ${typeOptionsStr})`
            : "Type.Record(Type.String(), Type.Unknown())";
          break;
        case "record":
          if (field.reference) {
            // Special case for self-reference in reply_to_message_id
            if (field.name === "reply_to_message_id" && field.reference.table === "telegram_message") {
              typeBoxType = "This";
            } else {
              // Use string reference here with union type for RecordId
              typeBoxType = typeOptionsStr
                ? `RecordIdType('${field.reference.table}', ${typeOptionsStr})`
                : `RecordIdType('${field.reference.table}')`;
            }
          } else {
            typeBoxType = typeOptionsStr
              ? `Type.Record(Type.String(), Type.Unknown(), ${typeOptionsStr})`
              : "Type.Record(Type.String(), Type.Unknown())";
          }
          break;
        case "references":
          if (field.reference) {
            // Use union type with RecordIdType for references
            typeBoxType = typeOptionsStr
              ? `Type.Array(RecordIdType('${field.reference.table}'), ${typeOptionsStr})`
              : `Type.Array(RecordIdType('${field.reference.table}'))`;
          } else {
            typeBoxType = typeOptionsStr
              ? `Type.Array(Type.String(), ${typeOptionsStr})`
              : "Type.Array(Type.String())";
          }
          break;
        default:
          typeBoxType = typeOptionsStr ? `Type.String(${typeOptionsStr})` : "Type.String()";
          break;
      }

      // Make optional if needed (already handled the datetime format)
      if (field.type.toLowerCase() !== "datetime" && field.optional) {
        typeBoxType = `Type.Optional(${typeBoxType})`;
      }

      return `  ${field.name}: ${typeBoxType}`;
    });

    // Prepare schema options with description if available
    const schemaOptions = description
      ? `{
  $id: '${name}',
  description: '${description.replace(/'/g, "\\'")}'
}`
      : `{
  $id: '${name}'
}`;

    // Generate schema with helper types
    const schemaDefinition = needsRecursive
      ? `
// Type declaration for ${schemaName}
export const ${typeName} = Type.Recursive(This => Type.Object({
${fieldDefinitions.join(",\n")}
}), ${schemaOptions});

// Helper types for ${schemaName}
export const ${schemaName}Select = createSelectType(${typeName});
export const ${schemaName}Insert = createInsertType(${typeName});
export const ${schemaName}Update = createUpdateType(${typeName});
export const ${schemaName}Filter = createFilterType(${typeName});
`
      : `
// Type declaration for ${schemaName}
export const ${typeName} = Type.Object({
${fieldDefinitions.join(",\n")}
}, ${schemaOptions});

// Helper types for ${schemaName}
export const ${schemaName}Select = createSelectType(${typeName});
export const ${schemaName}Insert = createInsertType(${typeName});
export const ${schemaName}Update = createUpdateType(${typeName});
export const ${schemaName}Filter = createFilterType(${typeName});
`;

    return schemaDefinition;
  });

  // Generate module exports
  const moduleExports = `
const Module = Type.Module({
${tables.map(table => `  ${table.name}: ${formatTypeName(table.name)}`).join(",\n")}
});

${tables
      .map(
        table => `const ${formatSchemaName(table.name)} = Module.Import('${table.name}');
export type ${formatSchemaName(table.name)} = Static<typeof ${formatSchemaName(table.name)}>;
// Helper type exports
export type ${formatSchemaName(table.name)}Select = Static<typeof ${formatSchemaName(table.name)}Select>;
export type ${formatSchemaName(table.name)}Insert = Static<typeof ${formatSchemaName(table.name)}Insert>;
export type ${formatSchemaName(table.name)}Update = Static<typeof ${formatSchemaName(table.name)}Update>;
export type ${formatSchemaName(table.name)}Filter = Static<typeof ${formatSchemaName(table.name)}Filter>;`
      )
      .join("\n")}
`;

  // Combine all parts
  return `// This file is generated by surql-gen. Do not edit it manually. \n
//created at ${new Date().toLocaleString()} by @necmttn

${imports}

${recordIdTypeHelper}
${schemaDefinitions.join("\n")}
${moduleExports}
`;
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