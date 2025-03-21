/**
 * SurrealDB integration module - provides functionality for interacting with SurrealDB
 * 
 * This module exports various functions and interfaces for:
 * - Connecting to a SurrealDB instance
 * - Fetching schema information
 * - Exporting schema as SurrealQL
 * - Applying schema to a database
 */

// Re-export all interfaces
export * from "./interfaces.ts";

// Export functions from parser module
export {
  normalizeSchemaInfo,
  parseFieldDefinition
} from "./parser.ts";

// Export connection functionality
export {
  checkDBConnection,
  createDBConnection
} from "./connection.ts";

// Export schema extraction functionality
export {
  fetchSchemaFromDB,
  parseSchemaFromInfoResponses
} from "./extract.ts";

// Export schema export functionality
export {
  exportSchemaFromDB,
  type ExportSchemaOptions
} from "./export.ts";

// Export schema import functionality
export {
  applySchemaToDatabase
} from "./import.ts";

// Export utility functions
export {
  ensureSemicolon,
  toSnakeCase,
  isUserTable
} from "./utils.ts"; 