import { assertEquals } from "@std/assert";
import { normalizeSchemaInfo, parseFieldDefinition } from "../../lib/db/parser.ts";

Deno.test("parseFieldDefinition - basic string type", () => {
  const fieldDef = "DEFINE FIELD username ON user TYPE string;";
  const result = parseFieldDefinition(fieldDef);

  assertEquals(result.type, "string");
  assertEquals(result.kind, "scalar");
  assertEquals(result.optional, false);
  assertEquals(result.referencedTable, undefined);
});

Deno.test("parseFieldDefinition - optional type", () => {
  const fieldDef = "DEFINE FIELD bio ON user TYPE option<string>;";
  const result = parseFieldDefinition(fieldDef);

  assertEquals(result.type, "string");
  assertEquals(result.kind, "scalar");
  assertEquals(result.optional, true);
});

Deno.test("parseFieldDefinition - record reference", () => {
  const fieldDef = "DEFINE FIELD author ON post TYPE record<user>;";
  const result = parseFieldDefinition(fieldDef);

  assertEquals(result.type, "record");
  assertEquals(result.kind, "relation");
  assertEquals(result.optional, false);
  assertEquals(result.referencedTable, "user");
});

Deno.test("parseFieldDefinition - optional record reference", () => {
  const fieldDef = "DEFINE FIELD author ON post TYPE option<record<user>>;";
  const result = parseFieldDefinition(fieldDef);

  assertEquals(result.type, "record");
  assertEquals(result.kind, "relation");
  assertEquals(result.optional, true);
  assertEquals(result.referencedTable, "user");
});

Deno.test("parseFieldDefinition - references", () => {
  const fieldDef = "DEFINE FIELD posts ON user TYPE references<post>;";
  const result = parseFieldDefinition(fieldDef);

  assertEquals(result.type, "references");
  assertEquals(result.kind, "relation");
  assertEquals(result.optional, false);
  assertEquals(result.referencedTable, "post");
});

Deno.test("parseFieldDefinition - array type", () => {
  const fieldDef = "DEFINE FIELD tags ON post TYPE array<string>;";
  const result = parseFieldDefinition(fieldDef);

  assertEquals(result.type, "array");
  assertEquals(result.kind, "array");
  assertEquals(result.optional, false);
});

Deno.test("normalizeSchemaInfo - empty input", () => {
  const result = normalizeSchemaInfo(null);
  assertEquals(result, { tables: {} });
});

Deno.test("normalizeSchemaInfo - with tables", () => {
  const input = {
    tables: {
      user: "DEFINE TABLE user TYPE NORMAL SCHEMAFULL",
      post: "DEFINE TABLE post TYPE NORMAL SCHEMAFULL"
    }
  };

  const result = normalizeSchemaInfo(input);
  assertEquals(result.tables, input.tables);
});

Deno.test("normalizeSchemaInfo - with multiple object types", () => {
  const input = {
    tables: {
      user: "DEFINE TABLE user TYPE NORMAL SCHEMAFULL",
      post: "DEFINE TABLE post TYPE NORMAL SCHEMAFULL"
    },
    functions: {
      "fn::get_user": "DEFINE FUNCTION fn::get_user($id) {}"
    },
    configs: {
      "GRAPHQL": "DEFINE CONFIG GRAPHQL TABLES AUTO FUNCTIONS AUTO"
    }
  };

  const result = normalizeSchemaInfo(input);
  assertEquals(result.tables, input.tables);
  assertEquals(result.functions, input.functions);
  assertEquals(result.configs, input.configs);
}); 