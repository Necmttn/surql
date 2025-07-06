import { describe, it, expect, beforeEach } from "vitest";
import { SurrealField } from "../../lib/schema/field";

/**
 * Level 1: Basic Field Factory Patterns
 * 
 * This test demonstrates the fundamental field creation patterns
 * using our Schema.Class architecture. These are the building blocks
 * for all schema definitions.
 */
describe("Level 1: Basic Field Factory", () => {
  describe("Core Field Types", () => {
    it("should create string fields with validation", () => {
      const usernameField = SurrealField.string("username");
      
      expect(usernameField.name).toBe("username");
      expect(usernameField.type).toBe("string");
      expect(usernameField.isOptional).toBe(false);
      expect(usernameField.isId).toBe(false);
    });

    it("should create number fields", () => {
      const ageField = SurrealField.number("age");
      
      expect(ageField.name).toBe("age");
      expect(ageField.type).toBe("number");
      expect(ageField.isOptional).toBe(false);
    });

    it("should create integer fields", () => {
      const countField = SurrealField.int("count");
      
      expect(countField.name).toBe("count");
      expect(countField.type).toBe("int");
    });

    it("should create boolean fields", () => {
      const activeField = SurrealField.boolean("is_active");
      
      expect(activeField.name).toBe("is_active");
      expect(activeField.type).toBe("bool");
    });

    it("should create datetime fields", () => {
      const createdField = SurrealField.datetime("created_at");
      
      expect(createdField.name).toBe("created_at");
      expect(createdField.type).toBe("datetime");
    });

    it("should create array fields", () => {
      const tagsField = SurrealField.array("tags");
      
      expect(tagsField.name).toBe("tags");
      expect(tagsField.type).toBe("array");
    });

    it("should create object fields", () => {
      const metadataField = SurrealField.object("metadata");
      
      expect(metadataField.name).toBe("metadata");
      expect(metadataField.type).toBe("object");
    });
  });

  describe("Special Field Types", () => {
    it("should create record reference fields", () => {
      const authorField = SurrealField.record("author", "user");
      
      expect(authorField.name).toBe("author");
      expect(authorField.type).toBe("record");
      expect(authorField.references?.table).toBe("user");
      expect(authorField.isOptional).toBe(false);
    });

    it("should create ID fields for tables", () => {
      const idField = SurrealField.id("user");
      
      expect(idField.name).toBe("id");
      expect(idField.type).toBe("record");
      expect(idField.isId).toBe(true);
      expect(idField.references?.table).toBe("user");
    });

    it("should create any type fields", () => {
      const dynamicField = SurrealField.any("dynamic_data");
      
      expect(dynamicField.name).toBe("dynamic_data");
      expect(dynamicField.type).toBe("any");
    });
  });

  describe("Basic Field Modifiers", () => {
    it("should make fields optional", () => {
      const bioField = SurrealField.string("bio").optional();
      
      expect(bioField.name).toBe("bio");
      expect(bioField.isOptional).toBe(true);
      
      // Original field should remain unchanged (immutability)
      const originalField = SurrealField.string("bio");
      expect(originalField.isOptional).toBe(false);
    });

    it("should add descriptions to fields", () => {
      const emailField = SurrealField.string("email")
        .description("User's email address");
      
      expect(emailField.description).toBe("User's email address");
    });

    it("should set default values", () => {
      const statusField = SurrealField.string("status")
        .default("'active'");
      
      expect(statusField.defaultValue).toBe("'active'");
    });
  });

  describe("Built-in Validation", () => {
    it("should validate field creation", () => {
      // Valid field should not throw
      expect(() => {
        SurrealField.string("valid_name");
      }).not.toThrow();
    });

    it("should reject invalid field names", () => {
      // Empty name should throw
      expect(() => {
        SurrealField.parse({
          name: "",
          type: "string",
          isOptional: false,
          isId: false
        });
      }).toThrow();
    });

    it("should provide safe parsing", () => {
      const result = SurrealField.safeParse({
        name: "", // Invalid
        type: "string",
        isOptional: false,
        isId: false
      });
      
      expect(result._tag).toBe("None");
    });
  });

  describe("Schema.Class Features", () => {
    it("should encode and decode fields correctly", () => {
      const field = SurrealField.string("test").description("Test field");
      
      // Encode to plain object
      const encoded = SurrealField.encode(field);
      expect(encoded.name).toBe("test");
      expect(encoded.description).toBe("Test field");
      
      // Decode back to validated instance
      const decoded = SurrealField.decode(encoded);
      expect(decoded.name).toBe(field.name);
      expect(SurrealField.encode(decoded).description).toBe(SurrealField.encode(field).description);
    });

    it("should maintain immutability", () => {
      const originalField = SurrealField.string("username");
      const modifiedField = originalField
        .optional()
        .description("Optional username");
      
      // Original should be unchanged
      expect(originalField.isOptional).toBe(false);
      // Check via encoded object since there's a method/property name conflict
      expect(SurrealField.encode(originalField).description).toBeUndefined();
      
      // Modified should have new values
      expect(modifiedField.isOptional).toBe(true);
      expect(SurrealField.encode(modifiedField).description).toBe("Optional username");
      
      // Should be different objects
      expect(originalField).not.toBe(modifiedField);
    });
  });

  describe("SurrealQL Generation", () => {
    it("should generate basic field SurrealQL", () => {
      const usernameField = SurrealField.string("username");
      const sql = usernameField.toSurrealQL();
      
      expect(sql).toContain("DEFINE FIELD username ON");
      expect(sql).toContain("TYPE string");
    });

    it("should generate field with description", () => {
      const emailField = SurrealField.string("email")
        .description("User email address");
      
      const sql = emailField.toSurrealQL();
      expect(sql).toContain("COMMENT 'User email address'");
    });

    it("should generate field with default value", () => {
      const statusField = SurrealField.string("status")
        .default("'active'");
      
      const sql = statusField.toSurrealQL();
      expect(sql).toContain("DEFAULT 'active'");
    });
  });
});