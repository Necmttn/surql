// SurrealQL query parser and type inference
import { Schema } from "@effect/schema";
import type { TableDefinition } from "./schema.ts";
import { formatSchemaName, recordId } from "./effect-schema.ts";

/**
 * Represents a parsed SurrealQL query
 */
export interface ParsedQuery {
  type: 'SELECT' | 'CREATE' | 'UPDATE' | 'DELETE';
  tables: TableReference[];
  fields: FieldSelection[];
  joins: JoinReference[];
  conditions: Condition[];
  returnModifiers: ReturnModifier[];
  isArrayResult: boolean;
}

export interface TableReference {
  name: string;
  alias?: string;
}

export interface FieldSelection {
  table?: string;  // Table alias or name
  field: string | '*';
  nested?: NestedFieldSelection[];
}

export interface NestedFieldSelection {
  field: string | '*';
  nested?: NestedFieldSelection[];
}

export interface JoinReference {
  fromTable: string;
  toTable: string;
  throughField: string;
}

export interface Condition {
  field: string;
  operator: string;
  value: any;
}

export interface ReturnModifier {
  type: 'LIMIT' | 'GROUP' | 'ORDER';
  value: any;
}

/**
 * Registry for storing and retrieving table schemas
 */
export class SchemaRegistry {
  private schemas: Map<string, TableSchema> = new Map();

  constructor(tables?: TableDefinition[]) {
    if (tables) {
      this.registerTablesFromDefinitions(tables);
    }
  }

  /**
   * Register table schemas from TableDefinition array
   */
  registerTablesFromDefinitions(tables: TableDefinition[]): void {
    for (const table of tables) {
      this.registerTableFromDefinition(table);
    }
  }

  /**
   * Register a single table schema from TableDefinition
   */
  registerTableFromDefinition(table: TableDefinition): void {
    const fields: Record<string, FieldSchema> = {};

    for (const field of table.fields) {
      const { baseType, isOption, reference } = parseType(field.type);

      fields[field.name] = {
        name: field.name,
        type: baseType,
        optional: field.optional || isOption,
        reference: reference
      };
    }

    this.schemas.set(table.name, {
      name: table.name,
      fields
    });
  }

  /**
   * Get a table schema by name
   */
  getTableSchema(tableName: string): TableSchema | undefined {
    return this.schemas.get(tableName);
  }

  /**
   * Get field schema by table name and field path
   */
  resolveFieldPath(tableName: string, path: string[]): FieldSchema | undefined {
    let tableSchema = this.getTableSchema(tableName);
    if (!tableSchema) return undefined;

    let fieldSchema: FieldSchema | undefined;
    let currentTable = tableSchema;

    for (let i = 0; i < path.length; i++) {
      const fieldName = path[i];
      fieldSchema = currentTable.fields[fieldName];

      if (!fieldSchema) return undefined;

      // If this is a reference and not the last field in the path,
      // we need to follow the reference
      if (i < path.length - 1 && fieldSchema.reference) {
        currentTable = this.getTableSchema(fieldSchema.reference.table);
        if (!currentTable) return undefined;
      }
    }

    return fieldSchema;
  }

  /**
   * Get all relationships for a table
   */
  getRelationships(tableName: string): Relationship[] {
    const relationships: Relationship[] = [];
    const tableSchema = this.getTableSchema(tableName);

    if (!tableSchema) return relationships;

    for (const fieldName in tableSchema.fields) {
      const field = tableSchema.fields[fieldName];

      if (field.reference) {
        relationships.push({
          fromTable: tableName,
          toTable: field.reference.table,
          throughField: fieldName,
          type: field.type.startsWith('array') ? 'one-to-many' : 'one-to-one'
        });
      }
    }

    return relationships;
  }
}

export interface TableSchema {
  name: string;
  fields: Record<string, FieldSchema>;
}

export interface FieldSchema {
  name: string;
  type: string;
  optional: boolean;
  reference?: {
    table: string;
    isOption: boolean;
  };
}

export interface Relationship {
  fromTable: string;
  toTable: string;
  throughField: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

/**
 * Parse a SurrealQL query string into a structured representation
 * @param queryString The SurrealQL query to parse
 * @returns A parsed query object
 */
export function parseQuery(queryString: string): ParsedQuery {
  // Start with a basic structure
  const query: ParsedQuery = {
    type: 'SELECT',
    tables: [],
    fields: [],
    joins: [],
    conditions: [],
    returnModifiers: [],
    isArrayResult: true
  };

  // Clean up the query string
  const normalizedQuery = queryString.trim().replace(/\s+/g, ' ');

  // Basic query type detection
  if (normalizedQuery.toUpperCase().startsWith('SELECT')) {
    query.type = 'SELECT';
    parseSelectQuery(normalizedQuery, query);
  } else if (normalizedQuery.toUpperCase().startsWith('CREATE')) {
    query.type = 'CREATE';
    // TODO: Implement CREATE parsing
  } else if (normalizedQuery.toUpperCase().startsWith('UPDATE')) {
    query.type = 'UPDATE';
    // TODO: Implement UPDATE parsing
  } else if (normalizedQuery.toUpperCase().startsWith('DELETE')) {
    query.type = 'DELETE';
    // TODO: Implement DELETE parsing
  }

  return query;
}

/**
 * Parse a SELECT query
 */
function parseSelectQuery(queryString: string, query: ParsedQuery): void {
  // Basic SELECT query pattern: SELECT <fields> FROM <table> [WHERE <conditions>] [LIMIT <limit>]

  // Extract fields
  const fieldsMatch = queryString.match(/SELECT\s+(.+?)\s+FROM/i);
  if (fieldsMatch && fieldsMatch[1]) {
    const fieldsList = fieldsMatch[1].split(',').map(f => f.trim());

    for (const field of fieldsList) {
      if (field === '*') {
        // All fields
        query.fields.push({ field: '*' });
      } else if (field.includes('.*.')) {
        // Nested fields with wildcard like user.*.posts
        const parts = field.split('.');
        let current = { field: parts[0] };
        let currentNested = current;

        for (let i = 1; i < parts.length; i++) {
          if (parts[i] === '*') {
            // Skip the wildcard, it's implicit in the nesting
            continue;
          }

          const nestedField: NestedFieldSelection = { field: parts[i] };

          if (!currentNested.nested) {
            currentNested.nested = [];
          }

          currentNested.nested.push(nestedField);
          currentNested = nestedField;
        }

        query.fields.push(current as FieldSelection);
      } else if (field.includes('.')) {
        // Simple nested field like user.name
        const parts = field.split('.');
        const tableOrField = parts[0];
        const fieldName = parts[1];

        query.fields.push({
          table: parts.length > 2 ? tableOrField : undefined,
          field: parts.length > 2 ? parts[1] : tableOrField,
          nested: parts.length > 2 ? [{ field: parts[2] }] : [{ field: fieldName }]
        });
      } else {
        // Simple field
        query.fields.push({ field });
      }
    }
  }

  // Extract table
  const tableMatch = queryString.match(/FROM\s+(\w+)/i);
  if (tableMatch && tableMatch[1]) {
    query.tables.push({ name: tableMatch[1] });
  }

  // Extract WHERE conditions
  const whereMatch = queryString.match(/WHERE\s+(.+?)(?:\s+LIMIT|\s+GROUP|\s+ORDER|$)/i);
  if (whereMatch && whereMatch[1]) {
    const conditionStr = whereMatch[1];

    // Simple condition parsing - this is very basic and would need to be expanded
    const conditionMatch = conditionStr.match(/(\w+)\s*([=<>!]+)\s*(['"].*?['"]|\w+)/);
    if (conditionMatch) {
      query.conditions.push({
        field: conditionMatch[1],
        operator: conditionMatch[2],
        value: conditionMatch[3].replace(/^['"]|['"]$/g, '') // Remove quotes if present
      });
    }
  }

  // Extract LIMIT
  const limitMatch = queryString.match(/LIMIT\s+(\d+)/i);
  if (limitMatch && limitMatch[1]) {
    const limit = parseInt(limitMatch[1], 10);
    query.returnModifiers.push({
      type: 'LIMIT',
      value: limit
    });

    // If LIMIT 1, then result is not an array
    if (limit === 1) {
      query.isArrayResult = false;
    }
  }
}

/**
 * Infer return type from a SurrealQL query
 * @param queryString The SurrealQL query
 * @param registry The schema registry containing table definitions
 * @returns An Effect Schema schema representing the query result type
 */
export function inferQueryReturnType(
  queryString: string,
  registry: SchemaRegistry
): Schema.Schema<unknown> {
  const parsedQuery = parseQuery(queryString);
  return inferReturnTypeFromParsedQuery(parsedQuery, registry);
}

/**
 * Infer return type from a parsed query
 * @param query The parsed query
 * @param registry The schema registry
 * @returns An Effect Schema schema for the query result
 */
export function inferReturnTypeFromParsedQuery(
  query: ParsedQuery,
  registry: SchemaRegistry
): Schema.Schema<unknown> {
  if (query.type !== 'SELECT') {
    // For non-SELECT queries, return a basic success schema
    return Schema.struct({
      status: Schema.literal("OK"),
      time: Schema.string,
      result: Schema.union(
        Schema.literal(true),
        Schema.array(Schema.unknown)
      )
    });
  }

  // For SELECT queries, build a proper return type
  if (query.tables.length === 0) {
    return Schema.unknown;
  }

  const mainTable = query.tables[0].name;
  const tableSchema = registry.getTableSchema(mainTable);

  if (!tableSchema) {
    return Schema.unknown;
  }

  // Build a schema for the result
  let resultSchema: Schema.Schema<unknown>;

  if (query.fields.length === 0 || query.fields.some(f => f.field === '*')) {
    // SELECT * - include all fields from the main table
    const fieldSchemas: Record<string, Schema.Schema<unknown>> = {};

    for (const [fieldName, field] of Object.entries(tableSchema.fields)) {
      fieldSchemas[fieldName] = createSchemaForField(field, registry);
    }

    // Add nested fields from * selections with nested patterns
    for (const fieldSelection of query.fields) {
      if (fieldSelection.field !== '*' && fieldSelection.nested) {
        const fieldName = fieldSelection.field;
        const field = tableSchema.fields[fieldName];

        if (field && field.reference) {
          fieldSchemas[fieldName] = createSchemaForNestedField(
            field,
            fieldSelection.nested,
            registry
          );
        }
      }
    }

    resultSchema = Schema.struct(fieldSchemas);
  } else {
    // Specific fields selected
    const fieldSchemas: Record<string, Schema.Schema<unknown>> = {};

    for (const fieldSelection of query.fields) {
      const fieldName = fieldSelection.field;

      if (fieldName === '*') continue; // Already handled above

      const field = tableSchema.fields[fieldName];

      if (!field) continue;

      if (fieldSelection.nested) {
        fieldSchemas[fieldName] = createSchemaForNestedField(
          field,
          fieldSelection.nested,
          registry
        );
      } else {
        fieldSchemas[fieldName] = createSchemaForField(field, registry);
      }
    }

    resultSchema = Schema.struct(fieldSchemas);
  }

  // Wrap in array if result is expected to be an array
  if (query.isArrayResult) {
    return Schema.array(resultSchema);
  }

  return resultSchema;
}

/**
 * Create an Effect Schema for a field
 */
function createSchemaForField(
  field: FieldSchema,
  registry: SchemaRegistry
): Schema.Schema<unknown> {
  let schema: Schema.Schema<unknown>;

  switch (field.type) {
    case 'string':
      schema = Schema.string;
      break;
    case 'number':
    case 'float':
    case 'decimal':
      schema = Schema.number;
      break;
    case 'int':
    case 'integer':
      schema = Schema.number.pipe(Schema.int());
      break;
    case 'bool':
    case 'boolean':
      schema = Schema.boolean;
      break;
    case 'datetime':
      schema = Schema.Date;
      break;
    case 'record':
      if (field.reference) {
        schema = recordId(field.reference.table);
      } else {
        schema = Schema.string;
      }
      break;
    case 'array':
      schema = Schema.array(Schema.unknown);
      break;
    case 'array_record':
      if (field.reference) {
        schema = Schema.array(recordId(field.reference.table));
      } else {
        schema = Schema.array(Schema.string);
      }
      break;
    case 'array_float':
      schema = Schema.array(Schema.number);
      break;
    case 'object':
      schema = Schema.record(Schema.string, Schema.unknown);
      break;
    default:
      schema = Schema.unknown;
      break;
  }

  if (field.optional) {
    return Schema.optional(schema);
  }

  return schema;
}

/**
 * Create a schema for a nested field selection
 */
function createSchemaForNestedField(
  field: FieldSchema,
  nestedFields: NestedFieldSelection[],
  registry: SchemaRegistry
): Schema.Schema<unknown> {
  if (!field.reference) {
    return Schema.unknown;
  }

  const referencedTable = registry.getTableSchema(field.reference.table);
  if (!referencedTable) {
    return Schema.unknown;
  }

  // If the nested selection is *, include all fields from the referenced table
  if (nestedFields.length === 1 && nestedFields[0].field === '*') {
    const fieldSchemas: Record<string, Schema.Schema<unknown>> = {};

    for (const [fieldName, referencedField] of Object.entries(referencedTable.fields)) {
      fieldSchemas[fieldName] = createSchemaForField(referencedField, registry);
    }

    const referencedSchema = Schema.struct(fieldSchemas);

    // If this is an array reference, wrap in array
    if (field.type.startsWith('array')) {
      return Schema.array(referencedSchema);
    }

    return referencedSchema;
  }

  // Otherwise, include only the specified fields
  const fieldSchemas: Record<string, Schema.Schema<unknown>> = {};

  for (const nestedField of nestedFields) {
    const nestedFieldName = nestedField.field;
    const referencedField = referencedTable.fields[nestedFieldName];

    if (!referencedField) continue;

    if (nestedField.nested) {
      fieldSchemas[nestedFieldName] = createSchemaForNestedField(
        referencedField,
        nestedField.nested,
        registry
      );
    } else {
      fieldSchemas[nestedFieldName] = createSchemaForField(referencedField, registry);
    }
  }

  const referencedSchema = Schema.struct(fieldSchemas);

  // If this is an array reference, wrap in array
  if (field.type.startsWith('array')) {
    return Schema.array(referencedSchema);
  }

  return referencedSchema;
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