/**
 * Utility functions for working with SurrealDB
 */

/**
 * Ensure a string definition ends with a semicolon
 * 
 * @param definition - The SQL definition string to check
 * @returns The definition with a trailing semicolon added if needed
 */
export function ensureSemicolon(definition: string): string {
  // Trim trailing whitespace
  const trimmed = definition.trim();
  // Add semicolon if it doesn't already end with one
  return trimmed.endsWith(';') ? trimmed : `${trimmed};`;
}

/**
 * Converts a string to snake_case
 * 
 * @param input - The string to convert
 * @returns The snake_case version of the input
 */
export function toSnakeCase(input: string): string {
  return input
    .replace(/([a-z])([A-Z])/g, '$1_$2') // Convert camelCase to snake_case
    .replace(/[\s-]+/g, '_') // Replace spaces and hyphens with underscores
    .toLowerCase();
}

/**
 * Filter system tables that should be excluded from schema processing
 * 
 * @param tableName - The table name to check
 * @returns True if the table should be included, false if it should be skipped
 */
export function isUserTable(tableName: string): boolean {
  // Skip tables that start with underscore or sdb_ prefix (system tables)
  return !tableName.startsWith('_') && !tableName.startsWith('sdb_');
} 