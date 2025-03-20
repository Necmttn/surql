import { assertEquals, assertExists } from "@std/assert";
import { exists } from "@std/fs";
import { validateReferences, parseSurQL } from "../mod.ts";

// Mock @clack/prompts before importing files that use it
// This will prevent any stdin/stdout operations that cause memory leaks
const mockSpinner = {
  start: () => mockSpinner,
  stop: () => mockSpinner,
  message: () => mockSpinner,
};

// Mock the entire module
import { processFile } from "../lib/commands.ts";

// Sample SurrealQL schema for testing
const SAMPLE_SCHEMA = `
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD username ON user TYPE string;
DEFINE FIELD email ON user TYPE string;

DEFINE TABLE post SCHEMAFULL;
DEFINE FIELD title ON post TYPE string;
DEFINE FIELD content ON post TYPE string;
DEFINE FIELD author ON post TYPE record<user>;
`;

Deno.test("parseSurQL correctly parses schema", () => {
  const tables = parseSurQL(SAMPLE_SCHEMA);

  // Check we have two tables
  assertEquals(tables.length, 2);

  // Check first table
  assertEquals(tables[0].name, "user");
  assertEquals(tables[0].fields.length, 2);
  assertEquals(tables[0].fields[0].name, "username");
  assertEquals(tables[0].fields[0].type, "string");

  // Check second table
  assertEquals(tables[1].name, "post");
  assertEquals(tables[1].fields.length, 3);
  assertEquals(tables[1].fields[2].name, "author");

  // Check references
  assertExists(tables[1].fields[2].reference);
  assertEquals(tables[1].fields[2].reference?.table, "user");
});

Deno.test("validateReferences handles missing references", () => {
  const tables = parseSurQL(`
    DEFINE TABLE user SCHEMAFULL;
    DEFINE FIELD username ON user TYPE string;
    
    DEFINE TABLE post SCHEMAFULL;
    DEFINE FIELD author ON post TYPE record<non_existent_table>;
  `);

  const validatedTables = validateReferences(tables);

  // Check reference to non-existent table is removed
  assertEquals(validatedTables[1].fields[0].reference, undefined);
});