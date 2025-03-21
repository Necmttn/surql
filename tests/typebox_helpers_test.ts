import { assertEquals } from "@std/assert";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import {
  createSelectType,
  createInsertType,
  createUpdateType,
  createFilterType,
} from "../lib/typebox.ts";

Deno.test("createSelectType creates a type with all fields as optional booleans", () => {
  const userSchema = Type.Object({
    id: Type.String(),
    username: Type.String(),
    email: Type.String(),
    age: Type.Number(),
    isActive: Type.Boolean()
  }, { $id: "user" });

  const userSelectType = createSelectType(userSchema);

  // Check structure
  assertEquals(userSelectType.$id, "user_Select");
  assertEquals(userSelectType.description, "Selection type for user");

  // Check that required array is empty or undefined (all fields optional)
  assertEquals(userSelectType.required === undefined || userSelectType.required.length === 0, true);

  // Check all fields are booleans
  for (const key of Object.keys(userSchema.properties)) {
    assertEquals(userSelectType.properties[key].type, "boolean");
  }
});

Deno.test("createInsertType removes id field", () => {
  const userSchema = Type.Object({
    id: Type.String(),
    username: Type.String(),
    email: Type.String(),
  }, { $id: "user" });

  const userInsertType = createInsertType(userSchema);

  // Check structure
  assertEquals(userInsertType.$id, "user_Insert");
  assertEquals(userInsertType.description, "Insert type for user");

  // Verify id is removed
  assertEquals(Object.keys(userInsertType.properties).includes("id"), false);

  // Verify other fields are kept
  assertEquals(Object.keys(userInsertType.properties).includes("username"), true);
  assertEquals(Object.keys(userInsertType.properties).includes("email"), true);

  // Check that username and email are required
  assertEquals(Array.isArray(userInsertType.required), true);
  assertEquals(userInsertType?.required?.includes("username"), true);
  assertEquals(userInsertType?.required?.includes("email"), true);
});

Deno.test("createInsertType makes fields with default values optional", () => {
  const userSchema = Type.Object({
    id: Type.String(),
    username: Type.String(),
    email: Type.String(),
    role: Type.String({ default: "user" }),
    createdAt: Type.String({ default: "new Date().toISOString()" })
  }, { $id: "user" });

  const userInsertType = createInsertType(userSchema);

  // Fields with default values should be optional
  assertEquals(Array.isArray(userInsertType.required), true);
  assertEquals(userInsertType.required?.includes("role"), false, "role should be optional");
  assertEquals(userInsertType.required?.includes("createdAt"), false, "createdAt should be optional");

  // Fields without default values should remain required
  assertEquals(userInsertType.required?.includes("username"), true, "username should be required");
  assertEquals(userInsertType.required?.includes("email"), true, "email should be required");
});

Deno.test("createUpdateType removes id and makes all fields optional", () => {
  const userSchema = Type.Object({
    id: Type.String(),
    username: Type.String(),
    email: Type.String(),
    role: Type.String(),
  }, { $id: "user" });

  const userUpdateType = createUpdateType(userSchema);

  // Check structure
  assertEquals(userUpdateType.$id, "user_Update");
  assertEquals(userUpdateType.description, "Update type for user");

  // Verify id is removed
  assertEquals(Object.keys(userUpdateType.properties).includes("id"), false);

  // Verify all fields are optional (required array is empty or undefined)
  assertEquals(userUpdateType.required === undefined || userUpdateType.required.length === 0, true);
});

Deno.test("createFilterType creates appropriate filter conditions for different types", () => {
  const userSchema = Type.Object({
    id: Type.String(),
    username: Type.String(),
    age: Type.Number(),
    isActive: Type.Boolean(),
    createdAt: Type.Date(),
  }, { $id: "user" });

  const userFilterType = createFilterType(userSchema);

  // Check structure
  assertEquals(userFilterType.$id, "user_Filter");
  assertEquals(userFilterType.description, "Filter type for user");

  // All filter fields should be optional
  assertEquals(userFilterType.required === undefined || userFilterType.required.length === 0, true);

  // Validate with some test data
  const validFilter = {
    username: { contains: "john" },
    age: { gt: 18, lte: 65 },
    isActive: true
  };

  // This should pass validation
  const result = Value.Check(userFilterType, validFilter);
  assertEquals(result, true);
});

// Add a test for preserving metadata like descriptions and default values
Deno.test("schemas preserve metadata like description and default values", () => {
  const userSchema = Type.Object({
    id: Type.String(),
    username: Type.String({ description: "User's login name" }),
    email: Type.String({ description: "Primary email for notifications" }),
    role: Type.String({ default: "user", description: "User role" }),
    createdAt: Type.String({ default: "new Date().toISOString()", description: "Creation timestamp" })
  }, {
    $id: "user",
    description: "User account information"
  });

  // Test that insert type preserves descriptions and defaults
  const userInsertType = createInsertType(userSchema);

  // Check descriptions are preserved
  assertEquals(userInsertType.properties.username.description, "User's login name");
  assertEquals(userInsertType.properties.role.description, "User role");

  // Check defaults are preserved
  assertEquals(userInsertType.properties.role.default, "user");
  assertEquals(userInsertType.properties.createdAt.default, "new Date().toISOString()");

  // Check table description is preserved in type metadata
  assertEquals(userInsertType.description, "Insert type for user");
}); 