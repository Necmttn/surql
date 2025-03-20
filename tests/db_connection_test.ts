import { assert, assertRejects } from "@std/assert";
import { fetchSchemaFromDB, checkDBConnection } from "../lib/db.ts";
import { ConfigSchema } from "../lib/config.ts";
import { Value } from "@sinclair/typebox/value";

Deno.test("SurrealDB basic checks", async (t) => {
  await t.step("checkDBConnection works with a valid URL", async () => {
    // Mock global fetch for this test
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      return {
        ok: true
      } as Response;
    };

    try {
      const isConnected = await checkDBConnection("http://localhost:8000");
      assert(isConnected, "Connection check should return true for valid URL");
    } finally {
      // Restore original fetch
      globalThis.fetch = originalFetch;
    }
  });

  await t.step("fetchSchemaFromDB handles missing URL", async () => {
    // Create a minimal config without db settings
    const badConfigData = {
      output: {
        path: "./generated",
        filename: "schema",
        extension: "ts"
      },
      imports: {
        style: "esm",
        paths: {
          typebox: "@sinclair/typebox"
        }
      }
    };
    const badConfig = Value.Parse(ConfigSchema, badConfigData);

    await assertRejects(
      () => fetchSchemaFromDB(badConfig),
      Error,
      "Database URL is required in configuration"
    );
  });
}); 