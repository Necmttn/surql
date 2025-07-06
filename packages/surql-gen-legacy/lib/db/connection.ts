import type { Config } from "../config.ts";
import { Surreal } from "surrealdb";

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
 * Create and initialize a SurrealDB connection
 * 
 * @param config - Database connection configuration
 * @returns Promise resolving to connected SurrealDB instance
 */
export async function createDBConnection(config: Config): Promise<Surreal> {
  if (!config.db?.url) {
    throw new Error("Database URL is required in configuration");
  }

  console.log("Connecting to database:", config.db.url);
  if (config.db.namespace) {
    console.log("Using namespace:", config.db.namespace);
  }
  if (config.db.database) {
    console.log("Using database:", config.db.database);
  }

  const db = new Surreal();

  try {
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

    return db;
  } catch (error) {
    // Ensure the connection is closed if we encounter an error
    try {
      await db.close();
    } catch (closeError) {
      console.warn("Error closing database connection:", closeError);
    }

    throw error;
  }
} 