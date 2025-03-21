/**
 * Interface definitions for SurrealDB schema information
 */

/**
 * Schema information retrieved from SurrealDB info endpoints
 */
export interface SurrealDBSchemaInfo {
  tables?: Record<string, string | { name: string }>;
  databases?: Record<string, string>;
  functions?: Record<string, string>;
  configs?: Record<string, string>;
  analyzers?: Record<string, string>;
  apis?: Record<string, string>;
  models?: Record<string, string>;
  params?: Record<string, string>;
  users?: Record<string, string>;
  accesses?: Record<string, string>;
}

/**
 * Object representation of a field in SurrealDB schema
 */
export interface SurrealFieldInfo {
  name: string;
  type: string;
  kind: string;
  optional: boolean;
  value?: unknown;
}

/**
 * Schema information for a table from SurrealDB
 */
export interface SurrealTableSchemaInfo {
  fields: Record<string, SurrealFieldInfo | string>;
  indexes?: Record<string, string>;
  events?: Record<string, string>;
  scopes?: Record<string, string>;
  lives?: Record<string, string>;
  params?: Record<string, string>;
  tables?: Record<string, string>;
  accesses?: Record<string, string>;
}

/**
 * Result of field definition parsing
 */
export interface ParsedFieldDefinition {
  type: string;
  kind: string;
  optional: boolean;
  referencedTable?: string;
} 