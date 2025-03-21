import type { Config } from "../config.ts";
import { Surreal } from "surrealdb";
import { createDBConnection } from "./connection.ts";

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
    db = await createDBConnection(config);

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