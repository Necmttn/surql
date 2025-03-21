import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import {
  createSelectType,
  createInsertType,
  createUpdateType,
  createFilterType,
} from "../lib/typebox.ts";

// Simple test to verify that helper types are created correctly
Deno.test("helper types have correct structure", () => {
  // Create a schema with all field types
  const schema = Type.Object({
    id: Type.String(),
    name: Type.String(),
    age: Type.Number(),
    isActive: Type.Boolean(),
    defaultField: Type.String({ default: "default value" }),
    createdAt: Type.Date()
  }, { $id: "test" });

  // Create all helper types
  const select = createSelectType(schema);
  const insert = createInsertType(schema);
  const update = createUpdateType(schema);
  const filter = createFilterType(schema);

  // Verify all types have proper structure
  assertEquals(select.$id, "test_Select");
  assertEquals(insert.$id, "test_Insert");
  assertEquals(update.$id, "test_Update");
  assertEquals(filter.$id, "test_Filter");

  // Verify the field properties exist
  assertEquals(!!select.properties, true);
  assertEquals(!!insert.properties, true);
  assertEquals(!!update.properties, true);
  assertEquals(!!filter.properties, true);

  // Check specific fields in insert and update
  assertEquals(Object.keys(insert.properties).includes("id"), false);
  assertEquals(Object.keys(update.properties).includes("id"), false);

  // Check that defaultField is in the insert schema
  assertEquals(Object.keys(insert.properties).includes("defaultField"), true);
}); 