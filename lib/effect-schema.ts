// Effect Schema integration for SurrealDB types
import { Schema } from "@effect/schema";
import { TableDefinition } from "./schema.ts";

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
  return Schema.string.pipe(
    Schema.pattern(/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/),
    Schema.brand(`RecordId<${tableName}>`),
  );
}

/**
 * Create a schema for a SurrealDB record with an ID
 * @param tableName The name of the table
 * @param schema The schema for the record fields
 * @returns A schema for the record with an ID field
 */
export function record<T extends string, A extends Record<string, any>>(
  tableName: T,
  schema: Schema.Schema<A>
): Schema.Schema<A & { id: RecordId<T> }> {
  return Schema.extend(
    schema,
    Schema.struct({
      id: recordId(tableName),
    })
  );
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
  isOption: boolean = false,
  reference?: { table: string; isOption: boolean }
): Schema.Schema<any> {
  let schema: Schema.Schema<any>;

  switch (type) {
    case "string":
      schema = Schema.string;
      break;
    case "number":
    case "float":
    case "decimal":
      schema = Schema.number;
      break;
    case "int":
    case "integer":
      schema = Schema.number.pipe(Schema.int());
      break;
    case "bool":
    case "boolean":
      schema = Schema.boolean;
      break;
    case "datetime":
      schema = Schema.Date;
      break;
    case "record":
      if (reference) {
        schema = recordId(reference.table);
      } else {
        schema = Schema.string.pipe(
          Schema.pattern(/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/)
        );
      }
      break;
    case "array":
      schema = Schema.array(Schema.unknown);
      break;
    case "array_record":
      if (reference) {
        schema = Schema.array(recordId(reference.table));
      } else {
        schema = Schema.array(Schema.string.pipe(
          Schema.pattern(/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/)
        ));
      }
      break;
    case "array_float":
      schema = Schema.array(Schema.number);
      break;
    case "object":
      schema = Schema.record(Schema.string, Schema.unknown);
      break;
    default:
      schema = Schema.unknown;
      break;
  }

  // Apply optional wrapper if needed
  if (isOption) {
    return Schema.optional(schema);
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
  const imports = `import { Schema } from "@effect/schema";
import { pipe } from "effect/Function";

// Type for representing a RecordId in Effect Schema
type RecordId<T extends string = string> = string & {
  readonly RecordId: unique symbol;
  readonly Table: T;
};

/**
 * Create a RecordId schema for a specific table
 */
function recordId<T extends string>(tableName: T): Schema.Schema<RecordId<T>> {
  return Schema.string.pipe(
    Schema.pattern(/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/),
    Schema.brand(\`RecordId<\${tableName}>\`),
  );
}
`;

  // Generate table schemas
  const tableSchemas = tables.map((table) => {
    const fieldDefinitions = table.fields.map((field) => {
      // Parse the type and determine if it's optional
      const { baseType, isOption, reference } = parseType(field.type);

      // Map to Effect Schema type
      const effectType = generateEffectSchemaType(baseType, field, isOption, reference);

      return `  ${field.name}: ${effectType}`;
    }).join(',\n');

    const tableDescription = table.description
      ? `\n/**\n * ${table.description}\n */`
      : '';

    const typeName = formatTypeName(table.name);
    const schemaName = formatSchemaName(table.name);

    return `${tableDescription}
export const ${schemaName} = Schema.struct({
${fieldDefinitions}
});

export type ${typeName} = Schema.Type<typeof ${schemaName}>;
`;
  }).join('\n');

  return `${imports}\n${tableSchemas}`;
}

/**
 * Generate Effect Schema type for a SurrealDB field
 */
function generateEffectSchemaType(
  baseType: string,
  field: TableDefinition["fields"][number],
  isOption: boolean,
  reference?: { table: string; isOption: boolean }
): string {
  // Basic type mapping
  let effectType: string;

  switch (baseType) {
    case "string":
      effectType = `Schema.string`;
      break;
    case "number":
    case "float":
    case "decimal":
      effectType = `Schema.number`;
      break;
    case "int":
    case "integer":
      effectType = `Schema.number.pipe(Schema.int())`;
      break;
    case "bool":
    case "boolean":
      effectType = `Schema.boolean`;
      break;
    case "datetime":
      effectType = `Schema.Date`;
      break;
    case "record":
      if (reference) {
        effectType = `recordId("${reference.table}")`;
      } else {
        effectType = `Schema.string.pipe(Schema.pattern(/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/))`;
      }
      break;
    case "array":
      effectType = `Schema.array(Schema.unknown)`;
      break;
    case "array_record":
      if (reference) {
        effectType = `Schema.array(recordId("${reference.table}"))`;
      } else {
        effectType = `Schema.array(Schema.string.pipe(Schema.pattern(/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/)))`;
      }
      break;
    case "array_float":
      effectType = `Schema.array(Schema.number)`;
      break;
    case "object":
      effectType = `Schema.record(Schema.string, Schema.unknown)`;
      break;
    default:
      effectType = `Schema.unknown`;
      break;
  }

  // Add constraints if they exist
  // TODO: Add support for min, max, pattern, etc.

  // Apply optional wrapper if needed
  if (isOption || field.optional) {
    return `Schema.optional(${effectType})`;
  }

  return effectType;
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
  return tableName + "Schema";
}

/**
 * Parse a SurrealDB type string into components
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