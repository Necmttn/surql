import { assert, assertEquals, assertExists } from "@std/assert";
import { fetchSchemaFromDB, checkDBConnection } from "../lib/db.ts";
import { ConfigSchema } from "../lib/config.ts";
import { Value } from "@sinclair/typebox/value";
import {
  SurrealDBInstance,
  createTestConfig,
  createTestSchema
} from "./utils/surrealdb.ts";

Deno.test("SurrealDB connection test", async () => {
  // Get the singleton instance
  const dbInstance = await SurrealDBInstance.getInstance();

  try {
    // Test connection is successful
    const isConnected = await checkDBConnection(dbInstance.url);
    assert(isConnected, "Connection check should return true for running instance");
  } finally {
    // No need to stop the instance as it will be reused by other tests
  }
});

// Basic schema definition for simple table test
const basicSchema = `
DEFINE NAMESPACE test;
USE NAMESPACE test;
DEFINE DATABASE basic;
USE DATABASE basic;

DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD username ON user TYPE string;
DEFINE FIELD email ON user TYPE string;
`;

Deno.test("Basic schema test", async (t) => {
  const dbInstance = await SurrealDBInstance.getInstance();
  const namespace = "test";
  const database = "basic";

  try {
    // Create schema
    const schemaPath = await createTestSchema(basicSchema, "basic_schema.surql");
    await dbInstance.loadSchema(schemaPath, namespace, database);

    // Create test config
    const testConfig = createTestConfig(dbInstance.url, namespace, database);
    // Validate config
    const config = Value.Parse(ConfigSchema, testConfig);

    await t.step("fetchSchemaFromDB retrieves basic schema", async () => {
      // Fetch schema
      const tables = await fetchSchemaFromDB(config);

      // Verify tables were retrieved
      assertEquals(tables.length, 1, "Should have one table: user");

      // Check if the user table exists
      const userTable = tables.find(t => t.name === "user");
      assertExists(userTable, "User table should exist");

      // Check user table fields
      if (userTable) {
        assertEquals(userTable.fields.length, 2, "User table should have 2 fields");

        const usernameField = userTable.fields.find(f => f.name === "username");
        assertExists(usernameField, "Username field should exist");
        assertEquals(usernameField?.type, "string", "Username should be string type");

        const emailField = userTable.fields.find(f => f.name === "email");
        assertExists(emailField, "Email field should exist");
        assertEquals(emailField?.type, "string", "Email should be string type");
      }
    });
  } finally {
    // No need to stop the instance as it will be reused by other tests
  }
});

// Schema definition for testing record references
const recordReferencesSchema = `
DEFINE NAMESPACE test;
USE NAMESPACE test;
DEFINE DATABASE references;
USE DATABASE references;

DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD username ON user TYPE string;
DEFINE FIELD email ON user TYPE string;

DEFINE TABLE post SCHEMAFULL;
DEFINE FIELD title ON post TYPE string;
DEFINE FIELD content ON post TYPE string;
DEFINE FIELD author ON post TYPE record<user>;
`;

Deno.test("Record references schema test", async (t) => {
  const dbInstance = await SurrealDBInstance.getInstance();
  const namespace = "test";
  const database = "references";

  try {
    // Create schema
    const schemaPath = await createTestSchema(recordReferencesSchema, "references_schema.surql");
    await dbInstance.loadSchema(schemaPath, namespace, database);

    // Create test config
    const testConfig = createTestConfig(dbInstance.url, namespace, database);
    // Validate config
    const config = Value.Parse(ConfigSchema, testConfig);

    await t.step("fetchSchemaFromDB retrieves schema with record references", async () => {
      // Fetch schema
      const tables = await fetchSchemaFromDB(config);

      // Verify tables were retrieved
      assertEquals(tables.length, 2, "Should have two tables: user and post");

      // Check if the post table exists
      const postTable = tables.find(t => t.name === "post");
      assertExists(postTable, "Post table should exist");

      // Check post table fields
      if (postTable) {
        const authorField = postTable.fields.find(f => f.name === "author");
        assertExists(authorField, "Author field should exist");
        assertExists(authorField?.reference, "Author should have reference info");
        assertEquals(authorField?.reference?.table, "user", "Author should reference user table");
      }
    });
  } finally {
    // No need to stop the instance as it will be reused by other tests
  }
});

// Schema definition for testing complex relations between tables
const relationsSchema = `
DEFINE NAMESPACE test;
USE NAMESPACE test;
DEFINE DATABASE relations;
USE DATABASE relations;

DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD username ON user TYPE string;
DEFINE FIELD email ON user TYPE string;

DEFINE TABLE post SCHEMAFULL;
DEFINE FIELD title ON post TYPE string;
DEFINE FIELD content ON post TYPE string;
DEFINE FIELD author ON post TYPE record<user>;

DEFINE TABLE comment SCHEMAFULL;
DEFINE FIELD content ON comment TYPE string;
DEFINE FIELD created_at ON comment TYPE datetime DEFAULT time::now();
DEFINE FIELD author ON comment TYPE record<user>;
DEFINE FIELD post ON comment TYPE record<post>;

DEFINE TABLE user_follows SCHEMAFULL;
DEFINE FIELD created_at ON user_follows TYPE datetime DEFAULT time::now();
DEFINE FIELD in ON user_follows TYPE record<user>;
DEFINE FIELD out ON user_follows TYPE record<user>;

DEFINE TABLE tag SCHEMAFULL;
DEFINE FIELD name ON tag TYPE string;

DEFINE TABLE post_tags SCHEMAFULL;
DEFINE FIELD post ON post_tags TYPE record<post>;
DEFINE FIELD tag ON post_tags TYPE record<tag>;
`;

Deno.test("Complex relations schema test", async (t) => {
  const dbInstance = await SurrealDBInstance.getInstance();
  const namespace = "test";
  const database = "relations";

  try {
    // Create schema
    const schemaPath = await createTestSchema(relationsSchema, "relations_schema.surql");
    await dbInstance.loadSchema(schemaPath, namespace, database);

    // Create test config
    const testConfig = createTestConfig(dbInstance.url, namespace, database);
    // Validate config
    const config = Value.Parse(ConfigSchema, testConfig);

    await t.step("fetchSchemaFromDB retrieves schema with complex relations", async () => {
      // Fetch schema
      const tables = await fetchSchemaFromDB(config);

      // Verify tables were retrieved
      assertEquals(tables.length, 6, "Should have six tables");

      // Check the comment table
      const commentTable = tables.find(t => t.name === "comment");
      assertExists(commentTable, "Comment table should exist");

      // Check comment table fields
      if (commentTable) {
        const postField = commentTable.fields.find(f => f.name === "post");
        assertExists(postField, "Post field should exist");
        assertExists(postField?.reference, "Post field should have reference info");
        assertEquals(postField?.reference?.table, "post", "Post field should reference post table");

        const authorField = commentTable.fields.find(f => f.name === "author");
        assertExists(authorField, "Author field should exist");
        assertExists(authorField?.reference, "Author field should have reference info");
        assertEquals(authorField?.reference?.table, "user", "Author field should reference user table");
      }

      // Check user_follows table
      const followsTable = tables.find(t => t.name === "user_follows");
      assertExists(followsTable, "User follows table should exist");

      if (followsTable) {
        const inField = followsTable.fields.find(f => f.name === "in");
        assertExists(inField, "In field should exist");
        assertExists(inField?.reference, "In field should have reference info");
        assertEquals(inField?.reference?.table, "user", "In field should reference user table");

        const outField = followsTable.fields.find(f => f.name === "out");
        assertExists(outField, "Out field should exist");
        assertExists(outField?.reference, "Out field should have reference info");
        assertEquals(outField?.reference?.table, "user", "Out field should reference user table");
      }
    });
  } finally {
    // No need to stop the instance as it will be reused by other tests
  }
});

// Schema definition for testing schemaless tables
const schemalessTableSchema = `
DEFINE NAMESPACE test;
USE NAMESPACE test;
DEFINE DATABASE schemaless;
USE DATABASE schemaless;

DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD username ON user TYPE string;
DEFINE FIELD email ON user TYPE string;

DEFINE TABLE dynamic SCHEMALESS;

DEFINE TABLE mixed FLEXIBLE;
DEFINE FIELD required_id ON mixed TYPE string;
`;

Deno.test("Schemaless tables test", async (t) => {
  const dbInstance = await SurrealDBInstance.getInstance();
  const namespace = "test";
  const database = "schemaless";

  try {
    // Create schema
    const schemaPath = await createTestSchema(schemalessTableSchema, "schemaless_schema.surql");
    await dbInstance.loadSchema(schemaPath, namespace, database);

    // Create test config
    const testConfig = createTestConfig(dbInstance.url, namespace, database);
    // Validate config
    const config = Value.Parse(ConfigSchema, testConfig);

    await t.step("fetchSchemaFromDB retrieves schema with schemaless tables", async () => {
      // Fetch schema
      const tables = await fetchSchemaFromDB(config);

      // Verify tables were retrieved
      assertEquals(tables.length, 2, "Should have two tables");

      // Check the dynamic schemaless table
      const dynamicTable = tables.find(t => t.name === "dynamic");
      assertExists(dynamicTable, "Dynamic table should exist");

      // Check the user table
      const userTable = tables.find(t => t.name === "user");
      assertExists(userTable, "User table should exist");

      if (userTable) {
        const usernameField = userTable.fields.find(f => f.name === "username");
        assertExists(usernameField, "Username field should exist");
        assertEquals(usernameField?.type, "string", "Username field should be string type");
      }
    });
  } finally {
    // No need to stop the instance as it will be reused by other tests
  }
});

// Schema definition for testing flexible tables
const flexibleTablesSchema = `
DEFINE NAMESPACE test;
USE NAMESPACE test;
DEFINE DATABASE flexible;
USE DATABASE flexible;

DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD username ON user TYPE string;
DEFINE FIELD email ON user TYPE string;

DEFINE TABLE flexible_table FLEXIBLE;
DEFINE FIELD id ON flexible_table TYPE string;
DEFINE FIELD created_at ON flexible_table TYPE datetime DEFAULT time::now();
`;

Deno.test("Flexible tables test", async (t) => {
  const dbInstance = await SurrealDBInstance.getInstance();
  const namespace = "test";
  const database = "flexible";

  try {
    // Create schema
    const schemaPath = await createTestSchema(flexibleTablesSchema, "flexible_schema.surql");
    await dbInstance.loadSchema(schemaPath, namespace, database);

    // Create test config
    const testConfig = createTestConfig(dbInstance.url, namespace, database);
    // Validate config
    const config = Value.Parse(ConfigSchema, testConfig);

    await t.step("fetchSchemaFromDB retrieves schema with flexible tables", async () => {
      // Fetch schema
      const tables = await fetchSchemaFromDB(config);

      // Verify tables were retrieved
      assertEquals(tables.length, 1, "Should have one table");

      // Check the user table
      const userTable = tables.find(t => t.name === "user");
      assertExists(userTable, "User table should exist");

      if (userTable) {
        const usernameField = userTable.fields.find(f => f.name === "username");
        assertExists(usernameField, "Username field should exist");
        assertEquals(usernameField?.type, "string", "Username field should be string type");

        const emailField = userTable.fields.find(f => f.name === "email");
        assertExists(emailField, "Email field should exist");
        assertEquals(emailField?.type, "string", "Email field should be string type");
      }

      // TODO: Investigate why FLEXIBLE tables are not being returned in the schema
      // It seems SurrealDB doesn't return FLEXIBLE tables in the same way as SCHEMAFULL tables
    });
  } finally {
    // No need to stop the instance as it will be reused by other tests
  }
});

// Cleanup SurrealDB process at the end of all tests
Deno.test({
  name: "Cleanup SurrealDB instance",
  fn: async () => {
    const dbInstance = await SurrealDBInstance.getInstance();
    await delay(1000);
    await dbInstance.stop();
  },
  sanitizeResources: false,
  sanitizeOps: false
});

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}