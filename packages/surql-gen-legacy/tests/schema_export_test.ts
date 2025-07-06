import { assertEquals, assertExists } from "@std/assert";
import { exists } from "@std/fs";
import { SurrealDBInstance, createTestSchema } from "./utils/surrealdb.ts";
import { exportSchemaFromDB, applySchemaToDatabase } from "../lib/db.ts";
import { loadConfig } from "../lib/config.ts";
import { delay } from "@std/async";
import { join } from "@std/path";

// Mock @clack/prompts to prevent stdout operations
const mockSpinner = {
  start: () => mockSpinner,
  stop: () => mockSpinner,
  message: () => mockSpinner,
};

globalThis.console.log = () => { }; // Silence console logs

Deno.test("Schema Export and Apply Integration Tests", async (t) => {
  const dbInstance = await SurrealDBInstance.getInstance();
  const config = await loadConfig();
  const basicSchema = `
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD username ON user TYPE string;
DEFINE FIELD email ON user TYPE string;
DEFINE FIELD age ON user TYPE int;
DEFINE FIELD active ON user TYPE bool DEFAULT true;

DEFINE TABLE post SCHEMAFULL;
DEFINE FIELD title ON post TYPE string;
DEFINE FIELD content ON post TYPE string;
DEFINE FIELD author ON post TYPE record<user>;
DEFINE FIELD created_at ON post TYPE datetime DEFAULT time::now();
DEFINE FIELD tags ON post TYPE array;
`;

  // Create the test database
  await dbInstance.createDatabase("test", "schema_export_test");

  // Create basic schema file
  const basicSchemaPath = await createTestSchema(basicSchema, "schema_export_basic.surql");

  // Initialize paths for exported schemas
  const exportedSchemaPath = join(Deno.cwd(), "tests", "fixtures", "exported_schema.surql");
  const overwriteSchemaPath = join(Deno.cwd(), "tests", "fixtures", "exported_schema_overwrite.surql");

  // Load the configuration
  config.db = {
    url: dbInstance.url,
    namespace: "test",
    database: "schema_export_test",
    username: "root",
    password: "root",
  };

  // Clean up any existing exported schema files
  try {
    await Deno.remove(exportedSchemaPath);
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
  }

  try {
    await Deno.remove(overwriteSchemaPath);
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
  }

  // Reset database with basic schema
  await dbInstance.loadSchema(basicSchemaPath, "test", "schema_export_test");
  // Give time for schema to be fully processed
  await delay(500);

  await t.step("should export schema definitions correctly", async () => {
    // Export schema without OVERWRITE
    const schemaContent = await exportSchemaFromDB(config, false);

    // Write to file for inspection and further tests
    await Deno.writeTextFile(exportedSchemaPath, schemaContent);

    // Verify file exists
    const fileExists = await exists(exportedSchemaPath);
    assertEquals(fileExists, true, "Exported schema file should exist");

    // Check content contains expected definitions
    assertExists(schemaContent.match(/DEFINE TABLE user/), "Should include user table definition");
    assertExists(schemaContent.match(/DEFINE FIELD username ON user/), "Should include username field definition");
    assertExists(schemaContent.match(/DEFINE FIELD author ON post/), "Should include author field definition");

    // Verify no OVERWRITE keywords
    assertEquals(schemaContent.includes("OVERWRITE"), false, "Should not include OVERWRITE keyword");
  });

  await t.step("should export schema with OVERWRITE keyword when specified", async () => {
    // Export schema with OVERWRITE
    const schemaContent = await exportSchemaFromDB(config, true);

    // Write to file for inspection and further tests
    await Deno.writeTextFile(overwriteSchemaPath, schemaContent);

    // Verify file exists
    const fileExists = await exists(overwriteSchemaPath);
    assertEquals(fileExists, true, "Exported schema with OVERWRITE file should exist");

    // Verify OVERWRITE keywords are included
    assertExists(schemaContent.match(/DEFINE TABLE OVERWRITE user/), "Should include OVERWRITE for table definition");
    assertExists(schemaContent.match(/DEFINE FIELD OVERWRITE username ON user/), "Should include OVERWRITE for field definition");
  });

  await t.step("should be able to apply exported schema to database", async () => {
    // First modify the database schema
    const modifiedSchema = `
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD username ON user TYPE string;
DEFINE FIELD email ON user TYPE string;
DEFINE FIELD modified_field ON user TYPE bool;
`;
    // Create a temporary file for the modified schema
    const modifiedSchemaPath = await createTestSchema(modifiedSchema, "schema_export_modified.surql");

    // Load the modified schema
    await dbInstance.loadSchema(modifiedSchemaPath, "test", "schema_export_test");

    await delay(500);

    // Use the schema with OVERWRITE to apply back to the database
    if (!await exists(overwriteSchemaPath)) {
      // If the second test hasn't run yet, export the schema now with OVERWRITE
      const schemaContent = await exportSchemaFromDB(config, true);
      await Deno.writeTextFile(overwriteSchemaPath, schemaContent);
    }

    const exportedSchema = await Deno.readTextFile(overwriteSchemaPath);

    // Apply the schema with OVERWRITE
    await applySchemaToDatabase(config, exportedSchema);

    // Give time for schema to be fully applied
    await delay(500);

    // Export the schema again to verify it matches the applied schema
    const newSchemaContent = await exportSchemaFromDB(config, false);

    // Verify that the post table is back (it wasn't in the modified schema)
    assertExists(newSchemaContent.match(/DEFINE TABLE post/), "Post table should be restored");

    // Verify that all original fields are back
    assertExists(newSchemaContent.match(/DEFINE FIELD age ON user/), "Age field should be restored");
    assertExists(newSchemaContent.match(/DEFINE FIELD active ON user/), "Active field should be restored");
  });
}); 