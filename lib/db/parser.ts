import type { ParsedFieldDefinition, SurrealDBSchemaInfo } from "./interfaces.ts";

/**
 * Parse a field definition string from SurrealDB
 * 
 * @param fieldDef - The raw field definition string from SurrealDB
 * @returns Object containing parsed field information
 */
export function parseFieldDefinition(fieldDef: string): ParsedFieldDefinition {
  // Extract the actual type from the field definition
  const typeMatch = fieldDef.match(/TYPE\s+(\S+)/i);
  if (!typeMatch) {
    console.log(`No type found in field definition: ${fieldDef}`);
    return {
      type: 'string',
      kind: 'scalar',
      optional: false
    };
  }

  // Clean the extracted type to remove trailing characters like ; or >
  let rawType = typeMatch[1];
  // Remove trailing semicolon if present
  if (rawType.endsWith(';')) {
    rawType = rawType.slice(0, -1);
  }

  console.log(`Extracted type: ${rawType} from definition: ${fieldDef}`);

  // Default values
  let type = rawType.toLowerCase();
  const kind = 'scalar';
  let isOptional = false;
  let referencedTable: string | undefined;

  // Check if the type is an option type
  if (type.startsWith('option<')) {
    isOptional = true;
    // Extract the inner type, removing the trailing '>' if present
    const innerTypeMatch = type.match(/option<(.+?)>?$/);
    const innerType = innerTypeMatch ? innerTypeMatch[1] : type.slice(7, -1);

    // Check for references type in the inner type
    if (innerType.startsWith('references<')) {
      const matchRef = innerType.match(/references<([^>]+)>/);
      referencedTable = matchRef ? matchRef[1] : undefined;
      console.log(`Found optional references field: ${innerType} -> ${referencedTable}`);
      return {
        type: 'references',
        kind: 'relation',
        optional: isOptional,
        referencedTable
      };
    }

    // Check for record type in inner type
    if (innerType.startsWith('record<')) {
      const matchRecord = innerType.match(/record<([^>]+)>/);
      referencedTable = matchRecord ? matchRecord[1] : undefined;
      console.log(`Found optional record field: ${innerType} -> ${referencedTable}`);
      return {
        type: 'record',
        kind: 'relation',
        optional: isOptional,
        referencedTable
      };
    }

    // Use the inner type for further processing
    type = innerType;
  }

  // Check for references type directly
  if (type.startsWith('references<')) {
    const matchRef = type.match(/references<([^>]+)>/);
    referencedTable = matchRef ? matchRef[1] : undefined;
    console.log(`Found references field: ${type} -> ${referencedTable}`);
    return {
      type: 'references',
      kind: 'relation',
      optional: isOptional,
      referencedTable
    };
  }

  // Check for record type directly
  if (type.startsWith('record<')) {
    const matchRecord = type.match(/record<([^>]+)>/);
    referencedTable = matchRecord ? matchRecord[1] : undefined;
    console.log(`Found record field: ${type} -> ${referencedTable}`);
    return {
      type: 'record',
      kind: 'relation',
      optional: isOptional,
      referencedTable
    };
  }

  // Simplify array types for consistency with mod.ts processing
  if (type.startsWith('array<')) {
    return {
      type: 'array',
      kind: 'array',
      optional: isOptional
    };
  }

  // Handle basic types
  if (type === 'int' || type === 'integer' || type === 'number') {
    return {
      type: 'int',
      kind: 'scalar',
      optional: isOptional
    };
  }

  if (type === 'bool' || type === 'boolean') {
    return {
      type: 'bool',
      kind: 'scalar',
      optional: isOptional
    };
  }

  if (type === 'datetime') {
    return {
      type: 'datetime',
      kind: 'scalar',
      optional: isOptional
    };
  }

  return {
    type,
    kind,
    optional: isOptional,
    referencedTable
  };
}

/**
 * Convert a raw DB info response to a normalized schema info format
 * 
 * @param raw - Raw response from SurrealDB INFO command
 * @returns Normalized schema information
 */
export function normalizeSchemaInfo(raw: unknown): SurrealDBSchemaInfo {
  if (!raw || typeof raw !== 'object') {
    return { tables: {} };
  }

  const info = raw as Record<string, unknown>;
  const result: SurrealDBSchemaInfo = {};

  // Extract all supported database objects
  const objectTypes = [
    'tables', 'functions', 'configs', 'analyzers',
    'apis', 'models', 'params', 'users', 'accesses'
  ];

  for (const type of objectTypes) {
    if (type in info) {
      // Handle tables specifically since it has a special type
      if (type === 'tables') {
        result.tables = info.tables as Record<string, string | { name: string }>;
      } else {
        // For other types, they are expected to be Record<string, string>
        result[type as keyof SurrealDBSchemaInfo] =
          info[type] as Record<string, string>;
      }
    }
  }

  // If no data was found, at least return empty tables
  if (Object.keys(result).length === 0) {
    return { tables: {} };
  }

  return result;
} 