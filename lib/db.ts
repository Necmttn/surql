// This module will handle connecting to SurrealDB and fetching schema

import type { Config } from "./config.ts";
import type { TableDefinition } from "./schema.ts";
// Direct import from surrealdb instead of dynamic import
import { Surreal } from "surrealdb";

/**
 * Schema information retrieved from SurrealDB info endpoints
 */
interface SurrealDBSchemaInfo {
  tables?: Record<string, string | { name: string }>;
  databases?: Record<string, string>;
}

/**
 * Object representation of a field in SurrealDB schema
 */
interface SurrealFieldInfo {
  name: string;
  type: string;
  kind: string;
  optional: boolean;
  value?: unknown;
}

/**
 * Schema information for a table from SurrealDB
 */
interface SurrealTableSchemaInfo {
  fields: Record<string, SurrealFieldInfo | string>;
}

/**
 * Parse a field definition string from SurrealDB
 */
function parseFieldDefinition(fieldDef: string): {
  type: string;
  kind: string;
  optional: boolean;
  referencedTable?: string;
} {
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

  const fieldType = typeMatch[1]; // This is the actual type like 'references<telegram_message>'
  console.log(`Extracted type: ${fieldType} from definition: ${fieldDef}`);

  // Default values
  let type = fieldType.toLowerCase();
  const kind = 'scalar';
  let isOptional = false;
  let referencedTable: string | undefined;

  // Check if the type is an option type
  if (type.startsWith('option<')) {
    isOptional = true;
    // Extract the inner type
    const innerType = type.slice(7, -1);

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
    console.log(`Found array field: ${type}`);
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
 */
export function normalizeSchemaInfo(raw: unknown): SurrealDBSchemaInfo {
  if (!raw || typeof raw !== 'object') {
    return { tables: {} };
  }

  const info = raw as Record<string, unknown>;

  // Handle database-level info
  if ('tables' in info) {
    // Convert any string or object tables to a consistent format
    const tables = info.tables as Record<string, string | { name: string }>;
    return { tables };
  }

  return { tables: {} };
}

/**
 * Connect to SurrealDB and retrieve schema information
 * 
 * @param config - Configuration with database connection details
 * @returns Promise that resolves to table definitions
 */
export async function fetchSchemaFromDB(config: Config): Promise<TableDefinition[]> {
  if (!config.db?.url) {
    throw new Error("Database URL is required in configuration");
  }

  console.log("Fetching schema from database:", config.db.url);
  if (config.db.namespace) {
    console.log("Using namespace:", config.db.namespace);
  }
  if (config.db.database) {
    console.log("Using database:", config.db.database);
  }

  let db: Surreal | undefined;
  try {
    // Create a new SurrealDB instance
    db = new Surreal();

    // Connect to the SurrealDB instance
    await db.connect(config.db.url);

    // Sign in with credentials if provided
    if (config.db.username && config.db.password) {
      await db.signin({
        username: config.db.username,
        password: config.db.password,
      });
    }

    // Use the specified namespace and database if provided
    if (config.db.namespace && config.db.database) {
      await db.use({
        namespace: config.db.namespace,
        database: config.db.database,
      });
    }

    // Fetch schema information using INFO command
    const infoResult = await db.query("INFO FOR DB;");
    console.log("Database INFO result:", JSON.stringify(infoResult, null, 2));

    if (!infoResult || !infoResult[0]) {
      throw new Error("Failed to retrieve schema information from SurrealDB");
    }

    const schemaInfo = normalizeSchemaInfo(infoResult[0]);
    console.log("Normalized schema info:", JSON.stringify(schemaInfo, null, 2));

    if (!schemaInfo.tables || Object.keys(schemaInfo.tables).length === 0) {
      throw new Error("No tables found in schema information");
    }

    // Convert the schema information to TableDefinition[]
    const tables: TableDefinition[] = [];

    // Safely process tables with defensive programming to handle potential null/undefined values
    for (const tableName of Object.keys(schemaInfo.tables)) {
      // Skip any table definitions that look like system tables
      if (tableName.startsWith('_') || tableName.startsWith('sdb_')) {
        continue;
      }

      const tableInfoResult = await db.query<[SurrealTableSchemaInfo]>(`INFO FOR TABLE ${tableName};`);
      console.log(`Table ${tableName} INFO result:`, JSON.stringify(tableInfoResult, null, 2));
      const tableInfo = tableInfoResult?.[0];

      if (!tableInfo || !tableInfo.fields) {
        console.warn(`Table ${tableName} has no fields, skipping`);
        continue;
      }

      const fields = [];

      // Safely process fields
      for (const fieldName of Object.keys(tableInfo.fields)) {
        // Skip array item definitions like field[*]
        if (fieldName.includes('[*]')) {
          continue;
        }

        const fieldInfo = tableInfo.fields[fieldName];

        if (!fieldInfo) {
          console.warn(`Field ${fieldName} in table ${tableName} has no data, skipping`);
          continue;
        }

        // Handle both object and string field definitions
        if (typeof fieldInfo === 'string') {
          // Parse the string definition
          console.log(`Processing field ${fieldName} with definition: ${fieldInfo}`);
          const parsed = parseFieldDefinition(fieldInfo);
          console.log(`Parsed field ${fieldName}: type=${parsed.type}, optional=${parsed.optional}, referencedTable=${parsed.referencedTable}`);

          // Use the parsed referencedTable from parseFieldDefinition
          fields.push({
            name: fieldName,
            type: parsed.type,
            optional: parsed.optional,
            reference: parsed.referencedTable ? {
              table: parsed.referencedTable,
              isOption: parsed.optional
            } : undefined
          });
        } else if (typeof fieldInfo === 'object') {
          // It's already an object with properties
          const fieldObject = fieldInfo as SurrealFieldInfo;
          const fieldType = fieldObject.type || 'string';
          const fieldKind = fieldObject.kind;
          const isOptional = fieldObject.optional === true;

          console.log(`Processing object field ${fieldName} with type: ${fieldType}`);

          // Check if it's a references field
          if (typeof fieldType === 'string' && fieldType.startsWith('references<')) {
            console.log(`Found references type for field ${fieldName}: ${fieldType}`);
            // Extract the referenced table name
            const match = fieldType.match(/references<([^>]+)>/);
            const referencedTable = match ? match[1] : undefined;

            fields.push({
              name: fieldName,
              type: 'references',
              optional: isOptional,
              reference: referencedTable ? {
                table: referencedTable,
                isOption: isOptional
              } : undefined
            });
            continue;
          }

          // Extract table name from record type
          let referencedTable: string | undefined;
          if (fieldType && typeof fieldType === 'string' && fieldType.includes('record<')) {
            const match = fieldType.match(/record<([^>]+)>/);
            referencedTable = match ? match[1] : undefined;
          }

          fields.push({
            name: fieldName,
            type: fieldType,
            optional: isOptional,
            reference: referencedTable || fieldKind === "relation" ? {
              table: referencedTable || '',
              isOption: typeof fieldType === 'string' && fieldType.startsWith("option<")
            } : undefined
          });
        } else {
          console.warn(`Field ${fieldName} in table ${tableName} has unexpected format, skipping`);
        }
      }

      tables.push({
        name: tableName,
        fields
      });
    }

    return tables;
  } catch (error) {
    console.error("Error fetching schema from SurrealDB:", error);
    throw error;
  } finally {
    // Close the connection
    if (db) {
      try {
        await db.close();
        console.log("Database connection closed");
      } catch (closeError) {
        console.warn("Error closing SurrealDB connection:", closeError);
      }
    }
  }
}

/**
 * Check if SurrealDB is available at the given URL
 * 
 * @param url - URL to check
 * @returns Promise that resolves to true if SurrealDB is available
 */
export async function checkDBConnection(url: string): Promise<boolean> {
  try {
    // Use a controller to set a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      // Simple health check - try to connect to the SurrealDB endpoint
      const response = await fetch(url, {
        method: "HEAD",
        headers: {
          "Accept": "application/json",
        },
        signal: controller.signal
      });

      return response.ok;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error("Failed to connect to SurrealDB:", error);
    return false;
  }
}

/**
 * Parse schema directly from INFO FOR DB and INFO FOR TABLE responses
 * This is primarily for testing without a live database connection
 * 
 * @param dbInfo - Database info from INFO FOR DB response
 * @param tableInfos - Map of table infos from INFO FOR TABLE responses
 * 
 * @returns Array of parsed table definitions
 */
export function parseSchemaFromInfoResponses(
  dbInfo: unknown,
  tableInfos: Record<string, unknown>
): TableDefinition[] {
  const schemaInfo = normalizeSchemaInfo(dbInfo);
  const tables: TableDefinition[] = [];

  if (!schemaInfo.tables || Object.keys(schemaInfo.tables).length === 0) {
    return tables;
  }

  // Process each table
  for (const tableName of Object.keys(schemaInfo.tables)) {
    // Skip system tables
    if (tableName.startsWith('_') || tableName.startsWith('sdb_')) {
      continue;
    }

    const tableInfo = tableInfos[tableName] as SurrealTableSchemaInfo;
    if (!tableInfo || !tableInfo.fields) {
      continue;
    }

    const fields = [];

    // Process fields
    for (const fieldName of Object.keys(tableInfo.fields)) {
      // Skip array item definitions
      if (fieldName.includes('[*]')) {
        continue;
      }

      const fieldInfo = tableInfo.fields[fieldName];
      if (!fieldInfo) {
        continue;
      }

      // Handle both object and string field definitions
      if (typeof fieldInfo === 'string') {
        // Parse the string definition
        const parsed = parseFieldDefinition(fieldInfo);

        // Use the parsed referencedTable from parseFieldDefinition
        fields.push({
          name: fieldName,
          type: parsed.type,
          optional: parsed.optional,
          reference: parsed.referencedTable ? {
            table: parsed.referencedTable,
            isOption: parsed.optional
          } : undefined
        });
      } else if (typeof fieldInfo === 'object') {
        // It's already an object with properties
        const fieldObject = fieldInfo as SurrealFieldInfo;
        const fieldType = fieldObject.type || 'string';
        const fieldKind = fieldObject.kind;
        const isOptional = fieldObject.optional === true;

        // Check if it's a references field
        if (typeof fieldType === 'string' && fieldType.startsWith('references<')) {
          // Extract the referenced table name
          const match = fieldType.match(/references<([^>]+)>/);
          const referencedTable = match ? match[1] : undefined;

          fields.push({
            name: fieldName,
            type: 'references',
            optional: isOptional,
            reference: referencedTable ? {
              table: referencedTable,
              isOption: isOptional
            } : undefined
          });
          continue;
        }

        // Extract table name from record type
        let referencedTable: string | undefined;
        if (fieldType && typeof fieldType === 'string' && fieldType.includes('record<')) {
          const match = fieldType.match(/record<([^>]+)>/);
          referencedTable = match ? match[1] : undefined;
        }

        fields.push({
          name: fieldName,
          type: fieldType,
          optional: isOptional,
          reference: referencedTable || fieldKind === "relation" ? {
            table: referencedTable || '',
            isOption: typeof fieldType === 'string' && fieldType.startsWith("option<")
          } : undefined
        });
      }
    }

    tables.push({
      name: tableName,
      fields
    });
  }

  return tables;
}

/**
 * Export schema definitions from a database
 * 
 * @param config - Configuration with database connection details
 * @param applyOverwrite - Whether to add OVERWRITE keyword to definitions
 * @returns Promise that resolves to the schema definitions as a string
 */
export async function exportSchemaFromDB(
  config: Config,
  applyOverwrite = false
): Promise<string> {
  if (!config.db || !config.db.url) {
    throw new Error("Database URL is required in configuration");
  }

  console.log("Exporting schema from database:", config.db.url);
  if (config.db.namespace) {
    console.log("Using namespace:", config.db.namespace);
  }
  if (config.db.database) {
    console.log("Using database:", config.db.database);
  }

  let db: Surreal | undefined;
  try {
    // Create a new SurrealDB instance
    db = new Surreal();

    // Connect to the SurrealDB instance
    await db.connect(config.db.url);

    // Sign in with credentials if provided
    if (config.db.username && config.db.password) {
      await db.signin({
        username: config.db.username,
        password: config.db.password,
      });
    }

    // Use the specified namespace and database if provided
    if (config.db.namespace && config.db.database) {
      await db.use({
        namespace: config.db.namespace,
        database: config.db.database,
      });
    }

    // Fetch schema information using INFO command
    const infoResult = await db.query("INFO FOR DB;");

    if (!infoResult || !infoResult[0]) {
      throw new Error("Failed to retrieve schema information from SurrealDB");
    }

    const schemaInfo = normalizeSchemaInfo(infoResult[0]);

    if (!schemaInfo.tables || Object.keys(schemaInfo.tables).length === 0) {
      throw new Error("No tables found in schema information");
    }

    // Process each table to get its schema
    const schemaLines: string[] = [
      "-- ------------------------------",
      "-- SCHEMA DEFINITIONS",
      "-- ------------------------------",
      "",
      "OPTION IMPORT;",
      ""
    ];

    // Get all table definitions first
    for (const tableName of Object.keys(schemaInfo.tables)) {
      // Skip any table definitions that look like system tables
      if (tableName.startsWith('_') || tableName.startsWith('sdb_')) {
        continue;
      }

      const overwriteKeyword = applyOverwrite ? "OVERWRITE " : "";

      // Fetch table info
      const tableInfoResult = await db.query(`INFO FOR TABLE ${tableName};`);

      if (tableInfoResult?.[0]) {
        // Add table definition
        schemaLines.push("");
        schemaLines.push("-- ------------------------------");
        schemaLines.push(`-- TABLE: ${tableName}`);
        schemaLines.push("-- ------------------------------");
        schemaLines.push("");

        // Get table type and other options
        const tableInfo = tableInfoResult[0] as Record<string, unknown>;
        let tableType = "NORMAL";
        let schemaMode = "SCHEMAFULL";
        let permissions = "NONE";

        if (tableInfo.type) {
          tableType = tableInfo.type as string;
        }
        if (tableInfo.schema) {
          schemaMode = (tableInfo.schema as string).toUpperCase();
        }
        if (tableInfo.permissions) {
          permissions = "FOR select, create, update, delete FULL";
        }

        schemaLines.push(`DEFINE TABLE ${overwriteKeyword}${tableName} TYPE ${tableType} ${schemaMode} PERMISSIONS ${permissions};`);
        schemaLines.push("");

        // Get fields
        if (tableInfo.fields && typeof tableInfo.fields === 'object') {
          const fields = tableInfo.fields as Record<string, SurrealFieldInfo | string>;

          for (const fieldName of Object.keys(fields)) {
            const field = fields[fieldName];

            if (typeof field === 'string') {
              // Simple field definition
              // Extract just the type information from the field string (the part after 'TYPE')
              const fieldDefParts = field.split(/\s+TYPE\s+/i);
              if (fieldDefParts.length > 1) {
                // Only use the type part to avoid duplication
                const fieldTypePart = fieldDefParts[1];
                schemaLines.push(`DEFINE FIELD ${overwriteKeyword}${fieldName} ON ${tableName} TYPE ${fieldTypePart};`);
              } else {
                // Fallback if we can't parse it properly
                schemaLines.push(`DEFINE FIELD ${overwriteKeyword}${fieldName} ON ${tableName} ${field};`);
              }
            } else if (typeof field === 'object') {
              // Complex field definition
              let fieldDef = `DEFINE FIELD ${overwriteKeyword}${fieldName} ON ${tableName} TYPE ${field.type}`;

              if (field.value !== undefined) {
                fieldDef += ` VALUE ${field.value}`;
              }

              if (field.optional) {
                fieldDef += " OPTIONAL";
              }

              schemaLines.push(`${fieldDef};`);
            }
          }
        }
      }
    }

    return schemaLines.join('\n');
  } finally {
    // Close the database connection if open
    if (db) {
      try {
        await db.close();
        console.log("Database connection closed");
      } catch (closeError) {
        console.error("Error closing database connection:", closeError);
      }
    }
  }
}

/**
 * Apply schema definitions to a database
 * 
 * @param config - Configuration with database connection details
 * @param schemaDefinitions - The schema definitions to apply
 */
export async function applySchemaToDatabase(
  config: Config,
  schemaDefinitions: string
): Promise<void> {
  if (!config.db || !config.db.url) {
    throw new Error("Database URL is required in configuration");
  }

  console.log("Applying schema to database:", config.db.url);
  if (config.db.namespace) {
    console.log("Using namespace:", config.db.namespace);
  }
  if (config.db.database) {
    console.log("Using database:", config.db.database);
  }

  let db: Surreal | undefined;
  try {
    // Create a new SurrealDB instance
    db = new Surreal();

    // Connect to the SurrealDB instance
    await db.connect(config.db.url);

    // Sign in with credentials if provided
    if (config.db.username && config.db.password) {
      await db.signin({
        username: config.db.username,
        password: config.db.password,
      });
    }

    // Use the specified namespace and database if provided
    if (config.db.namespace && config.db.database) {
      await db.use({
        namespace: config.db.namespace,
        database: config.db.database,
      });
    }

    // Execute the schema definitions
    await db.query(schemaDefinitions);
    console.log("Schema definitions applied successfully");
  } finally {
    // Close the database connection if open
    if (db) {
      try {
        await db.close();
        console.log("Database connection closed");
      } catch (closeError) {
        console.error("Error closing database connection:", closeError);
      }
    }
  }
} 