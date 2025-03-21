import { assertStringIncludes } from "@std/assert";
import { processFile } from "../lib/commands.ts";
import { ensureDir } from "@std/fs";

Deno.test("Schema generation commands", async (t) => {
  const testDir = "./test_output";

  // Setup
  await t.step("setup", async () => {
    await ensureDir(testDir);
    const schemaContent = `
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD email ON user TYPE string;
DEFINE FIELD age ON user TYPE int;
DEFINE FIELD roles ON user TYPE array<string>;
DEFINE FIELD created_at ON user TYPE datetime;
`;
    const schemaFile = `${testDir}/test_schema.surql`;
    await Deno.writeTextFile(schemaFile, schemaContent);
  });

  // Test Effect Schema generation
  await t.step("generates Effect Schema by default", async () => {
    const outputFile = `${testDir}/schema.ts`;
    await processFile(`${testDir}/test_schema.surql`, outputFile, undefined, { noExit: true, isTest: true });

    const generatedContent = await Deno.readTextFile(outputFile);
    assertStringIncludes(generatedContent, "import { Schema } from");
    assertStringIncludes(generatedContent, "Schema.Struct({");
    assertStringIncludes(generatedContent, "Schema.Array(Schema.String)");
  });

  // Cleanup
  // await t.step("cleanup", async () => {
  //   try {
  //     await Deno.remove(testDir, { recursive: true });
  //   } catch (error) {
  //     console.error("Error cleaning up test files:", error);
  //   }
  // });
}); 