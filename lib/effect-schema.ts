// Effect Schema integration for SurrealDB types
import { Schema } from "effect";
import type { TableDefinition } from "./schema.ts";

// Brand for RecordId type
type RecordId<T extends string = string> = string & {
  readonly RecordId: unique symbol;
  readonly Table: T;
};

/**
 * Create a RecordId schema for a specific table
 * @param tableName The name of the table
 * @returns A branded string schema for SurrealDB record IDs
 */
export function recordId<T extends string>(tableName: T): Schema.Schema<RecordId<T>> {
  return Schema.String.pipe(
    Schema.pattern(/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/),
    Schema.brand(`RecordId<${tableName}>`),
  ) as unknown as Schema.Schema<RecordId<T>>;
}

/**
 * Create a schema for a SurrealDB record with an ID
 * @param tableName The name of the table
 * @param schema The schema for the record fields
 * @returns A schema for the record with an ID field
 */
export function record<T extends string, A extends Record<string, unknown>>(
  tableName: T,
  schema: Schema.Schema<A>
): Schema.Schema<A & { id: RecordId<T> }> {
  return Schema.Struct({
    id: recordId(tableName),
  }) as unknown as Schema.Schema<A & { id: RecordId<T> }>;
}

/**
 * Maps SurrealDB types to Effect Schema types
 * @param type The SurrealDB type
 * @param isOption Whether the type is optional
 * @param reference Optional reference information
 * @returns An Effect Schema schema for the type
 */
export function mapSurrealTypeToEffectSchema(
  type: string,
  isOption = false,
  reference?: { table: string; isOption: boolean }
): Schema.Schema<unknown> {
  let schema: Schema.Schema<unknown>;

  switch (type) {
    case "string":
      schema = Schema.String as unknown as Schema.Schema<unknown>;
      break;
    case "number":
    case "float":
    case "decimal":
      schema = Schema.Number as unknown as Schema.Schema<unknown>;
      break;
    case "int":
    case "integer":
      schema = Schema.Number.pipe(Schema.int()) as unknown as Schema.Schema<unknown>;
      break;
    case "bool":
    case "boolean":
      schema = Schema.Boolean as unknown as Schema.Schema<unknown>;
      break;
    case "datetime":
      schema = Schema.Date as unknown as Schema.Schema<unknown>;
      break;
    case "record":
      if (reference) {
        schema = recordId(reference.table) as unknown as Schema.Schema<unknown>;
      } else {
        schema = Schema.String.pipe(
          Schema.pattern(/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/)
        ) as unknown as Schema.Schema<unknown>;
      }
      break;
    case "array":
      schema = Schema.Array(Schema.Unknown) as unknown as Schema.Schema<unknown>;
      break;
    case "array_record":
      if (reference) {
        schema = Schema.Array(recordId(reference.table)) as unknown as Schema.Schema<unknown>;
      } else {
        schema = Schema.Array(Schema.String.pipe(
          Schema.pattern(/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/)
        )) as unknown as Schema.Schema<unknown>;
      }
      break;
    case "array_float":
      schema = Schema.Array(Schema.Number) as unknown as Schema.Schema<unknown>;
      break;
    case "array_string":
      schema = Schema.Array(Schema.String) as unknown as Schema.Schema<unknown>;
      break;
    case "object":
      schema = Schema.Record({ key: Schema.String, value: Schema.Unknown }) as unknown as Schema.Schema<unknown>;
      break;
    default:
      schema = Schema.Unknown;
      break;
  }

  // Apply optional wrapper if needed
  if (isOption) {
    return Schema.optional(schema) as unknown as Schema.Schema<unknown>;
  }

  return schema;
}

/**
 * Generate Effect Schema schemas from SurrealDB table definitions
 * @param tables Array of table definitions
 * @returns String containing generated Effect Schema schemas
 */
export function generateEffectSchemas(tables: TableDefinition[]): string {
  // Prepare imports
  const imports = `import { Schema } from "effect";

// Type for representing a RecordId in Effect Schema
type RecordId<T extends string = string> = string & {
  readonly RecordId: unique symbol;
  readonly Table: T;
};

/**
 * Create a RecordId schema for a specific table
 */
function recordId<T extends string>(tableName: T): Schema.Schema<RecordId<T>> {
  return Schema.String.pipe(
    Schema.pattern(/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/),
    Schema.brand(\`RecordId<\${tableName}>\`),
  ) as unknown as Schema.Schema<RecordId<T>>;
}
`;

  // Generate table schemas
  const tableSchemas = tables.map((table) => {
    const { name, fields, description } = table;
    const typeName = formatTypeName(name);
    const schemaName = formatSchemaName(name);
    const needsRecursive = name === "telegram_message";

    // Check if table already has an 'id' field
    const hasIdField = fields.some(field => field.name === 'id');

    // Create a list of field definitions, adding default 'id' field if needed
    let fieldDefinitions = [];

    // Add default 'id' field if not explicitly defined
    if (!hasIdField) {
      fieldDefinitions.push(`  id: recordId("${name}").annotations({
    description: "Unique identifier"
  })`);
    }

    // Add all other field definitions
    fieldDefinitions = fieldDefinitions.concat(fields.map(field => {
      let effectType: string;
      const annotations: string[] = [];

      // Add description if available
      if (field.description) {
        const escapedDescription = field.description
          .replace(/\\'/g, "'")
          .replace(/'/g, "\\'");
        annotations.push(`description: '${escapedDescription}'`);
      }

      // Add default value if available
      if (field.defaultValue) {
        let formattedDefaultValue = field.defaultValue;

        // Handle SurrealDB function calls (like time::now())
        if (formattedDefaultValue.includes('::')) {
          // For datetime fields with SurrealDB functions, we'll add it as a separate annotation
          if (field.type.toLowerCase() === 'datetime') {
            annotations.push(`surrealDefault: '${formattedDefaultValue}'`);
          } else {
            formattedDefaultValue = `'${formattedDefaultValue}'`;
            annotations.push(`default: ${formattedDefaultValue}`);
          }
        } else {
          // If it's a simple string with quotes, keep as is
          // If it's a boolean or number, keep as is
          // If it's a string that's not already quoted, add quotes
          if (!formattedDefaultValue.startsWith("'") &&
            !formattedDefaultValue.startsWith('"') &&
            formattedDefaultValue !== 'true' &&
            formattedDefaultValue !== 'false' &&
            !/^-?\d+(\.\d+)?$/.test(formattedDefaultValue) &&
            !formattedDefaultValue.startsWith('[') &&
            !formattedDefaultValue.startsWith('{')) {
            formattedDefaultValue = `'${formattedDefaultValue}'`;
          }

          annotations.push(`default: ${formattedDefaultValue}`);
        }
      }

      // Build annotations string
      const annotationsStr = annotations.length > 0 ? `.annotations({ ${annotations.join(', ')} })` : '';

      switch (field.type.toLowerCase()) {
        case "int":
        case "number":
          effectType = `Schema.Number.pipe(Schema.int())${annotationsStr}`;
          break;
        case "float":
          effectType = `Schema.Number${annotationsStr}`;
          break;
        case "bool":
          effectType = `Schema.Boolean${annotationsStr}`;
          break;
        case "datetime":
          // For datetime fields, we'll use Date.now() as the default if there's a surrealDefault annotation
          if (field.defaultValue?.includes('::')) {
            effectType = `Schema.Date${annotationsStr}`;
          } else {
            effectType = `Schema.Date${annotationsStr}`;
          }
          break;
        case "array":
          effectType = `Schema.Array(Schema.String)${annotationsStr}`;
          break;
        case "array_float":
          effectType = `Schema.Array(Schema.Number)${annotationsStr}`;
          break;
        case "array_record":
          if (field.reference) {
            effectType = `Schema.Array(recordId("${field.reference.table}"))${annotationsStr}`;
          } else {
            effectType = `Schema.Array(Schema.String.pipe(Schema.pattern(/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/)))${annotationsStr}`;
          }
          break;
        case "object":
          effectType = `Schema.Record(Schema.String, Schema.Unknown)${annotationsStr}`;
          break;
        case "record":
          if (field.reference) {
            // Special case for self-reference in reply_to_message_id
            if (field.name === "reply_to_message_id" && field.reference.table === "telegram_message") {
              effectType = "This";
            } else {
              effectType = `recordId("${field.reference.table}")${annotationsStr}`;
            }
          } else {
            effectType = `Schema.String.pipe(Schema.pattern(/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/))${annotationsStr}`;
          }
          break;
        case "references":
          if (field.reference) {
            effectType = `Schema.Array(recordId("${field.reference.table}"))${annotationsStr}`;
          } else {
            effectType = `Schema.Array(Schema.String)${annotationsStr}`;
          }
          break;
        default:
          effectType = `Schema.String${annotationsStr}`;
          break;
      }

      // Make optional if needed
      if (field.type.toLowerCase() !== "datetime" && field.optional) {
        effectType = `Schema.optional(${effectType})`;
      }

      return `  ${field.name}: ${effectType}`;
    }));

    const tableDescription = description
      ? `\n/**\n * ${description.replace(/'/g, "\\'")}\n */`
      : '';

    return `${tableDescription}
export const ${schemaName} = Schema.Struct({
${fieldDefinitions.join(",\n")}
});

export type ${typeName} = Schema.Schema.Type<typeof ${schemaName}>;
`;
  }).join('\n');

  return `${imports}\n${tableSchemas}`;
}

/**
 * Format a table name as a type name
 * @param tableName The name of the table
 * @returns The formatted type name
 */
export function formatTypeName(tableName: string): string {
  return tableName.charAt(0).toUpperCase() + tableName.slice(1);
}

/**
 * Format a table name as a schema name
 * @param tableName The name of the table
 * @returns The formatted schema name
 */
export function formatSchemaName(tableName: string): string {
  return `${tableName}Schema`;
}

/**
 * Parse a SurrealDB type string into components
 * @param type The type string from SurrealDB schema
 * @returns Object containing baseType, isOption flag, and optional reference information
 */
export function parseType(type: string): {
  baseType: string;
  isOption: boolean;
  reference?: { table: string; isOption: boolean };
  constraints?: string[];
} {
  let isOption = false;
  let baseType = type;
  let reference: { table: string; isOption: boolean } | undefined;
  let constraints: string[] = [];

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
    } else if (innerType === "string") {
      baseType = "array_string";
    } else {
      baseType = "array";
    }
  }

  // Extract constraints from the type string
  const constraintMatch = baseType.match(/\((.+)\)$/);
  if (constraintMatch) {
    // Remove the constraints from the base type
    baseType = baseType.replace(/\((.+)\)$/, '');

    // Parse the constraints
    const constraintStr = constraintMatch[1];
    constraints = constraintStr.split(',').map(c => c.trim());
  }

  return { baseType, isOption, reference, constraints };
} 