import { assertEquals } from "@std/assert";
import { exportSchemaFromDB, applySchemaToDatabase } from "../lib/db.ts";
import { parseSurQL, generateTypeBoxSchemas } from "../lib/schema.ts";
import { SurrealDBInstance } from "./utils/surrealdb.ts";
import { loadConfig } from "../lib/config.ts";
import { delay } from "@std/async";
import { join } from "@std/path";

Deno.test("Schema Format Compatibility Tests", async (t) => {
  const dbInstance = await SurrealDBInstance.getInstance();
  const config = await loadConfig();

  // Create test fixtures with different schema formats
  const schemaAnySchemaless = `
DEFINE TABLE user TYPE ANY SCHEMALESS PERMISSIONS NONE;
DEFINE FIELD username ON user TYPE string;
DEFINE FIELD email ON user TYPE string;
DEFINE FIELD age ON user TYPE int;
`;

  const schemaNormalSchemafull = `
DEFINE TABLE user TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;
DEFINE FIELD username ON user TYPE string;
DEFINE FIELD email ON user TYPE string;
DEFINE FIELD age ON user TYPE int;
`;

  const schemaWithOverwrite = `
DEFINE TABLE OVERWRITE user TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;
DEFINE FIELD OVERWRITE username ON user TYPE string;
DEFINE FIELD OVERWRITE email ON user TYPE string;
DEFINE FIELD OVERWRITE age ON user TYPE int;
`;

  // Create test fixture files
  const fixturesDir = join(Deno.cwd(), "tests", "fixtures");
  const fileAnySchemaless = join(fixturesDir, "schema_any_schemaless.surql");
  const fileNormalSchemafull = join(fixturesDir, "schema_normal_schemafull.surql");
  const fileWithOverwrite = join(fixturesDir, "schema_with_overwrite.surql");

  await Deno.mkdir(fixturesDir, { recursive: true });
  await Deno.writeTextFile(fileAnySchemaless, schemaAnySchemaless);
  await Deno.writeTextFile(fileNormalSchemafull, schemaNormalSchemafull);
  await Deno.writeTextFile(fileWithOverwrite, schemaWithOverwrite);

  // Setup database for testing
  await dbInstance.createDatabase("test", "schema_format_test");
  config.db = {
    url: dbInstance.url,
    namespace: "test",
    database: "schema_format_test",
    username: "root",
    password: "root",
  };

  await t.step("should parse different schema formats consistently", () => {
    // Parse each schema variant
    const tableDefsAnySchemaless = parseSurQL(schemaAnySchemaless);
    const tableDefsNormalSchemafull = parseSurQL(schemaNormalSchemafull);
    const tableDefsWithOverwrite = parseSurQL(schemaWithOverwrite);

    // All should have the same number of tables
    assertEquals(tableDefsAnySchemaless.length, 1, "Should parse one table from ANY SCHEMALESS");
    assertEquals(tableDefsNormalSchemafull.length, 1, "Should parse one table from NORMAL SCHEMAFULL");
    assertEquals(tableDefsWithOverwrite.length, 1, "Should parse one table with OVERWRITE");

    // All should have the same fields
    assertEquals(tableDefsAnySchemaless[0].fields.length, 3, "Should parse 3 fields from ANY SCHEMALESS");
    assertEquals(tableDefsNormalSchemafull[0].fields.length, 3, "Should parse 3 fields from NORMAL SCHEMAFULL");
    assertEquals(tableDefsWithOverwrite[0].fields.length, 3, "Should parse 3 fields from schema with OVERWRITE");

    // Field details should match
    const compareFields = (
      a: Array<{ name: string, type: string, optional: boolean }>,
      b: Array<{ name: string, type: string, optional: boolean }>
    ) => {
      assertEquals(
        a.map(f => ({ name: f.name, type: f.type })),
        b.map(f => ({ name: f.name, type: f.type })),
        "Field details should match regardless of schema format"
      );
    };

    compareFields(tableDefsAnySchemaless[0].fields, tableDefsNormalSchemafull[0].fields);
    compareFields(tableDefsAnySchemaless[0].fields, tableDefsWithOverwrite[0].fields);
  });

  await t.step("should generate consistent TypeBox schemas from different schema formats", () => {
    // Parse each schema variant
    const tableDefsAnySchemaless = parseSurQL(schemaAnySchemaless);
    const tableDefsNormalSchemafull = parseSurQL(schemaNormalSchemafull);
    const tableDefsWithOverwrite = parseSurQL(schemaWithOverwrite);

    // Generate TypeBox schemas
    const typeboxAnySchemaless = generateTypeBoxSchemas(tableDefsAnySchemaless);
    const typeboxNormalSchemafull = generateTypeBoxSchemas(tableDefsNormalSchemafull);
    const typeboxWithOverwrite = generateTypeBoxSchemas(tableDefsWithOverwrite);

    // Content should be identical regardless of the schema format
    assertEquals(
      typeboxAnySchemaless,
      typeboxNormalSchemafull,
      "TypeBox output should be identical regardless of TYPE ANY/NORMAL or SCHEMALESS/SCHEMAFULL"
    );
    assertEquals(
      typeboxAnySchemaless,
      typeboxWithOverwrite,
      "TypeBox output should be identical regardless of OVERWRITE keyword"
    );
  });


  await t.step("should handle OVERWRITE flag in exportSchemaFromDB", async () => {
    // Apply a base schema
    await dbInstance.loadSchema(fileNormalSchemafull, "test", "schema_format_test");
    await delay(500);

    // Export with OVERWRITE flag true
    const exportedWithOverwrite = await exportSchemaFromDB(config, true);

    // Check that the OVERWRITE keyword is added
    assertEquals(
      exportedWithOverwrite.includes("DEFINE TABLE OVERWRITE user"),
      true,
      "Export with OVERWRITE flag should include OVERWRITE keyword"
    );

    // Export with OVERWRITE flag false
    const exportedWithoutOverwrite = await exportSchemaFromDB(config, false);

    // Check that the OVERWRITE keyword is not added
    assertEquals(
      exportedWithoutOverwrite.includes("DEFINE TABLE OVERWRITE user"),
      false,
      "Export without OVERWRITE flag should not include OVERWRITE keyword"
    );
  });
}); 