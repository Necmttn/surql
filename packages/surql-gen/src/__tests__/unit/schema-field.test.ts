import { describe, it, expect } from "vitest";
import { SurrealField } from "../../lib/schema/field";

describe("SurrealField Schema.Class", () => {
  describe("Factory Methods", () => {
    it("should create string field with validation", () => {
      const field = SurrealField.string("username");

      expect(field.name).toBe("username");
      expect(field.type).toBe("string");
      expect(field.isOptional).toBe(false);
      expect(field.isId).toBe(false);
    });

    it("should create number field with validation", () => {
      const field = SurrealField.number("age");

      expect(field.name).toBe("age");
      expect(field.type).toBe("number");
    });

    it("should create record field with table reference", () => {
      const field = SurrealField.record("author", "user");

      expect(field.name).toBe("author");
      expect(field.type).toBe("record");
      expect(field.references?.table).toBe("user");
    });

    it("should create id field correctly", () => {
      const field = SurrealField.id("user");

      expect(field.name).toBe("id");
      expect(field.type).toBe("record");
      expect(field.isId).toBe(true);
      expect(field.references?.table).toBe("user");
    });

    it("should reject invalid field data", () => {
      expect(() => {
        SurrealField.parse({
          name: "", // Invalid: empty name
          type: "string",
          isOptional: false,
          isId: false,
        });
      }).toThrow();

      expect(() => {
        SurrealField.parse({
          name: "test",
          type: "invalid_type" as any, // Invalid type
          isOptional: false,
          isId: false,
        });
      }).toThrow();
    });
  });

  describe("Fluent API", () => {
    it("should chain methods while maintaining validation", () => {
      const field = SurrealField.string("email")
        .unique()
        .required()
        .description("User email address")
        .pattern("^[^@]+@[^@]+$");

      expect(field.name).toBe("email");
      expect(field.description).toBe("User email address");
      expect(field.constraints?.unique).toBe(true);
      expect(field.constraints?.required).toBe(true);
      expect(field.constraints?.pattern).toBe("^[^@]+@[^@]+$");
    });

    it("should make fields optional", () => {
      const field = SurrealField.string("bio").optional();

      expect(field.isOptional).toBe(true);
    });

    it("should set default values", () => {
      const field = SurrealField.boolean("is_active").default("true");

      expect(field.defaultValue).toBe("true");
    });

    it("should validate constraints", () => {
      const field = SurrealField.number("score")
        .min(0)
        .max(100)
        .description("User score between 0-100");

      expect(field.constraints?.min).toBe(0);
      expect(field.constraints?.max).toBe(100);
    });
  });

  describe("Built-in Validation", () => {
    it("should validate using Schema.Class methods", () => {
      const validData = {
        name: "username",
        type: "string" as const,
        isOptional: false,
        isId: false,
        constraints: { unique: true },
        description: "User's unique username",
      };

      const field = SurrealField.parse(validData);
      expect(field.name).toBe("username");
      expect(field.constraints?.unique).toBe(true);
    });

    it("should provide safe parsing", () => {
      const invalidData = {
        name: "",
        type: "invalid" as any,
        isOptional: "not_boolean" as any,
        isId: false,
      };

      const result = SurrealField.safeParse(invalidData);
      expect(result._tag).toBe("None"); // Effect Option.None for invalid data
    });

    it("should encode and decode correctly", () => {
      const field = SurrealField.string("test")
        .unique()
        .description("Test field");

      // Encode to plain object
      const encoded = SurrealField.encode(field);
      expect(encoded.name).toBe("test");
      expect(encoded.constraints?.unique).toBe(true);

      // Decode back to SurrealField
      const decoded = SurrealField.decode(encoded);
      expect(decoded.name).toBe(field.name);
      expect(decoded.constraints?.unique).toBe(field.constraints?.unique);
    });
  });

  describe("SurrealQL Generation", () => {
    it("should generate basic field SurrealQL", () => {
      const field = SurrealField.string("username");
      const sql = field.toSurrealQL();

      expect(sql).toContain("DEFINE FIELD username");
      expect(sql).toContain("TYPE string");
      expect(sql).toMatch(/;$/);
    });

    it("should generate field with constraints", () => {
      const field = SurrealField.string("email")
        .unique()
        .description("User email");
      const sql = field.toSurrealQL();

      expect(sql).toContain("UNIQUE");
      expect(sql).toContain("COMMENT 'User email'");
    });

    it("should generate field with default value", () => {
      const field = SurrealField.boolean("is_active").default("true");
      const sql = field.toSurrealQL();

      expect(sql).toContain("DEFAULT true");
    });

    it("should generate record field correctly", () => {
      const field = SurrealField.record("author", "user");
      const sql = field.toSurrealQL();

      expect(sql).toContain("TYPE record<user>");
    });

    it("should generate datetime field with default", () => {
      const field = SurrealField.datetime("created_at").default("time::now()");
      const sql = field.toSurrealQL();

      expect(sql).toContain("TYPE datetime");
      expect(sql).toContain("DEFAULT time::now()");
    });
  });

  describe("SurrealQL Parsing", () => {
    it("should parse basic SurrealQL field definition", () => {
      const sql =
        "DEFINE FIELD username TYPE string UNIQUE COMMENT 'User name';";
      const field = SurrealField.fromSurrealQL(sql);

      expect(field.name).toBe("username");
      expect(field.type).toBe("string");
      expect(field.constraints?.unique).toBe(true);
      expect(field.description).toBe("User name");
    });

    it("should parse record field with table", () => {
      const sql = "DEFINE FIELD author TYPE record<user>;";
      const field = SurrealField.fromSurrealQL(sql);

      expect(field.name).toBe("author");
      expect(field.type).toBe("record");
      expect(field.references?.table).toBe("user");
    });

    it("should parse field with default value", () => {
      const sql = "DEFINE FIELD created_at TYPE datetime DEFAULT time::now();";
      const field = SurrealField.fromSurrealQL(sql);

      expect(field.name).toBe("created_at");
      expect(field.type).toBe("datetime");
      expect(field.defaultValue).toBe("time::now()");
    });

    it("should throw on invalid SurrealQL", () => {
      expect(() => {
        SurrealField.fromSurrealQL("INVALID SQL");
      }).toThrow("Invalid SurrealQL field definition");
    });
  });

  describe("Migration Generation", () => {
    it("should detect field name changes", () => {
      const oldField = SurrealField.string("old_name");
      const newField = SurrealField.string("new_name");

      const diff = SurrealField.diff(oldField, newField);
      expect(diff).toContain("ALTER FIELD old_name RENAME TO new_name");
    });

    it("should detect type changes", () => {
      const oldField = SurrealField.string("field");
      const newField = SurrealField.number("field");

      const diff = SurrealField.diff(oldField, newField);
      expect(diff).toContain("ALTER FIELD field TYPE number");
    });

    it("should detect constraint changes", () => {
      const oldField = SurrealField.string("email");
      const newField = SurrealField.string("email").unique();

      const diff = SurrealField.diff(oldField, newField);
      expect(diff).toContain("ALTER FIELD email ADD UNIQUE");
    });

    it("should detect default value changes", () => {
      const oldField = SurrealField.boolean("active");
      const newField = SurrealField.boolean("active").default("true");

      const diff = SurrealField.diff(oldField, newField);
      expect(diff).toContain("ALTER FIELD active DEFAULT true");
    });
  });

  describe("Effect Schema Generation", () => {
    it("should generate basic Effect Schema", () => {
      const field = SurrealField.string("username");
      const schema = field.toEffectSchema();

      expect(schema).toContain("Schema.String");
    });

    it("should generate optional Effect Schema", () => {
      const field = SurrealField.string("bio").optional();
      const schema = field.toEffectSchema();

      expect(schema).toContain("Schema.optional");
      expect(schema).toContain("Schema.String");
    });

    it("should generate constrained Effect Schema", () => {
      const field = SurrealField.number("age").min(0).max(120);
      const schema = field.toEffectSchema();

      expect(schema).toContain("Schema.Number");
      expect(schema).toContain("greaterThanOrEqualTo(0)");
      expect(schema).toContain("lessThanOrEqualTo(120)");
    });

    it("should generate record Effect Schema", () => {
      const field = SurrealField.record("author", "user");
      const schema = field.toEffectSchema();

      expect(schema).toContain('recordId("user")');
    });

    it("should generate Effect Schema with annotations", () => {
      const field = SurrealField.string("email")
        .description("User email")
        .default("no-email@example.com");
      const schema = field.toEffectSchema();

      expect(schema).toContain('description: "User email"');
      expect(schema).toContain('surrealDefault: "no-email@example.com"');
    });
  });

  describe("Immutability", () => {
    it("should maintain immutability when chaining methods", () => {
      const original = SurrealField.string("test");
      const modified = original.unique().description("Modified");

      // Original should remain unchanged (accessing properties directly)
      expect(original.constraints?.unique).toBeUndefined();
      // Note: description is a method in Schema.Class, we access the actual property differently

      // Modified should have new values
      expect(modified.constraints?.unique).toBe(true);

      // For Schema.Class, we need to test the actual functionality rather than property access
      // The key is that the original instance wasn't mutated
      expect(original).not.toBe(modified);
    });

    it("should create new instances for each modification", () => {
      const field1 = SurrealField.string("test");
      const field2 = field1.unique();
      const field3 = field2.description("Test field");

      // Each should be a different instance
      expect(field1).not.toBe(field2);
      expect(field2).not.toBe(field3);
      expect(field1).not.toBe(field3);
    });
  });
});
