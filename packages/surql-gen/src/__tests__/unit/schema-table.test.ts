import { describe, it, expect } from "vitest";
import { Schema } from "effect";
import { SurrealTable } from "../../lib/schema/table";
import { SurrealField } from "../../lib/schema/field";

describe("SurrealTable Schema.Class", () => {
  describe("Factory Methods", () => {
    it("should create basic table with validation", () => {
      const table = SurrealTable.create("user");
      
      expect(table.name).toBe("user");
      expect(table.fields).toEqual([]);
      expect(table.schemafull).toBe(true);
    });

    it("should create table with fields", () => {
      const fields = [
        SurrealField.string("username"),
        SurrealField.string("email").unique()
      ];
      const table = SurrealTable.create("user", fields);
      
      expect(table.name).toBe("user");
      expect(table.fields).toHaveLength(2);
      expect(table.fields[0].name).toBe("username");
      expect(table.fields[1].name).toBe("email");
    });

    it("should create schemaless table", () => {
      const table = SurrealTable.schemaless("logs");
      
      expect(table.name).toBe("logs");
      expect(table.schemafull).toBe(false);
    });

    it("should create view table", () => {
      const table = SurrealTable.view("user_posts", ["title", "content"], "is_published = true");
      
      expect(table.name).toBe("user_posts");
      expect(table.isView()).toBe(true);
      expect(table.view?.fields).toEqual(["title", "content"]);
      expect(table.view?.condition).toBe("is_published = true");
    });

    it("should reject invalid table data", () => {
      expect(() => {
        SurrealTable.parse({
          name: "", // Invalid: empty name
          fields: [],
          schemafull: true
        });
      }).toThrow();

      expect(() => {
        SurrealTable.parse({
          name: "test",
          fields: "invalid" as any, // Invalid: not an array
          schemafull: true
        });
      }).toThrow();
    });
  });

  describe("Fluent API", () => {
    it("should chain methods while maintaining validation", () => {
      const table = SurrealTable.create("user")
        .withDescription("User accounts table")
        .addField(SurrealField.string("username").unique())
        .addField(SurrealField.string("email").unique())
        .aiPrimaryKey("email")
        .aiTemporalField("created_at")
        .aiContentFields(["username", "bio"]);

      expect(table.name).toBe("user");
      expect(table.description).toBe("User accounts table");
      expect(table.fields).toHaveLength(2);
      expect(table.aiHints?.primary_key).toBe("email");
      expect(table.aiHints?.temporal_field).toBe("created_at");
      expect(table.aiHints?.content_fields).toEqual(["username", "bio"]);
    });

    it("should add multiple fields at once", () => {
      const fields = [
        SurrealField.string("name"),
        SurrealField.number("age"),
        SurrealField.boolean("active")
      ];
      const table = SurrealTable.create("person").addFields(...fields);
      
      expect(table.fields).toHaveLength(3);
      expect(table.fields.map(f => f.name)).toEqual(["name", "age", "active"]);
    });

    it("should remove fields", () => {
      const table = SurrealTable.create("user")
        .addField(SurrealField.string("username"))
        .addField(SurrealField.string("email"))
        .removeField("username");
      
      expect(table.fields).toHaveLength(1);
      expect(table.fields[0].name).toBe("email");
    });

    it("should update fields", () => {
      const table = SurrealTable.create("user")
        .addField(SurrealField.string("email"))
        .updateField("email", field => field.unique().description("User email"));
      
      expect(table.fields[0].constraints?.unique).toBe(true);
      expect(table.fields[0].getDescription()).toBe("User email");
    });

    it("should set permissions", () => {
      const table = SurrealTable.create("user")
        .withPermissions({
          select: "id = $auth.id",
          update: "id = $auth.id"
        });
      
      expect(table.permissions?.select).toBe("id = $auth.id");
      expect(table.permissions?.update).toBe("id = $auth.id");
    });

    it("should toggle schema mode", () => {
      const schemafull = SurrealTable.schemaless("test").schemafullMode();
      const schemaless = SurrealTable.create("test").schemalessMode();
      
      expect(schemafull.schemafull).toBe(true);
      expect(schemaless.schemafull).toBe(false);
    });
  });

  describe("AI Metadata", () => {
    it("should set AI hints individually", () => {
      const table = SurrealTable.create("user")
        .aiPrimaryKey("email")
        .aiTemporalField("created_at")
        .aiUserField("email")
        .aiContentFields(["username", "bio"])
        .aiCommonQueries(["findByEmail", "getActiveUsers"])
        .aiRelationships({ "posts": "post via author_id" })
        .aiSecurityLevel("high");

      expect(table.aiHints?.primary_key).toBe("email");
      expect(table.aiHints?.temporal_field).toBe("created_at");
      expect(table.aiHints?.user_field).toBe("email");
      expect(table.aiHints?.content_fields).toEqual(["username", "bio"]);
      expect(table.aiHints?.common_queries).toEqual(["findByEmail", "getActiveUsers"]);
      expect(table.aiHints?.relationships).toEqual({ "posts": "post via author_id" });
      expect(table.aiHints?.security_level).toBe("high");
    });

    it("should merge AI hints when chaining", () => {
      const table = SurrealTable.create("user")
        .aiPrimaryKey("id")
        .aiTemporalField("created_at");
      
      const extended = table.aiContentFields(["name", "email"]);
      
      expect(extended.aiHints?.primary_key).toBe("id");
      expect(extended.aiHints?.temporal_field).toBe("created_at");
      expect(extended.aiHints?.content_fields).toEqual(["name", "email"]);
    });
  });

  describe("Helper Methods", () => {
    it("should provide field access methods", () => {
      const table = SurrealTable.create("user")
        .addField(SurrealField.string("username"))
        .addField(SurrealField.string("email").unique());

      expect(table.getName()).toBe("user");
      expect(table.getFields()).toHaveLength(2);
      expect(table.hasField("username")).toBe(true);
      expect(table.hasField("password")).toBe(false);
      
      const emailField = table.getField("email");
      expect(emailField?.name).toBe("email");
      expect(emailField?.constraints?.unique).toBe(true);
    });

    it("should identify table types", () => {
      const normalTable = SurrealTable.create("user");
      const viewTable = SurrealTable.view("user_view", ["name", "email"]);
      const schemalessTable = SurrealTable.schemaless("logs");

      expect(normalTable.isSchemaFull()).toBe(true);
      expect(normalTable.isView()).toBe(false);
      
      expect(viewTable.isView()).toBe(true);
      expect(viewTable.getView()?.fields).toEqual(["name", "email"]);
      
      expect(schemalessTable.isSchemaFull()).toBe(false);
    });
  });

  describe("Built-in Validation", () => {
    it("should validate using Schema.Class methods", () => {
      const validData = {
        name: "user",
        fields: [
          SurrealField.string("username"),
          SurrealField.string("email")
        ],
        schemafull: true,
        description: "User accounts"
      };

      const table = SurrealTable.parse(validData);
      expect(table.name).toBe("user");
      expect(table.fields).toHaveLength(2);
    });

    it("should provide safe parsing", () => {
      const invalidData = {
        name: "",
        fields: "not_an_array" as any,
        schemafull: "not_boolean" as any
      };

      const result = SurrealTable.safeParse(invalidData);
      expect(result._tag).toBe("None"); // Effect Option.None for invalid data
    });

    it("should encode and decode correctly", () => {
      const table = SurrealTable.create("user")
        .withDescription("User table")
        .addField(SurrealField.string("email").unique());
      
      // Encode to plain object
      const encoded = SurrealTable.encode(table);
      expect(encoded.name).toBe("user");
      expect(encoded.description).toBe("User table");

      // Decode back to SurrealTable
      const decoded = SurrealTable.decode(encoded);
      expect(decoded.name).toBe(table.name);
      expect(decoded.description).toBe(table.description);
    });
  });

  describe("SurrealQL Generation", () => {
    it("should generate basic table SurrealQL", () => {
      const table = SurrealTable.create("user");
      const sql = table.toSurrealQL();
      
      expect(sql).toContain("DEFINE TABLE user SCHEMAFULL");
      expect(sql).toMatch(/;$/);
    });

    it("should generate schemaless table", () => {
      const table = SurrealTable.schemaless("logs");
      const sql = table.toSurrealQL();
      
      expect(sql).toContain("DEFINE TABLE logs SCHEMALESS");
    });

    it("should generate table with description", () => {
      const table = SurrealTable.create("user").withDescription("User accounts table");
      const sql = table.toSurrealQL();
      
      expect(sql).toContain("COMMENT 'User accounts table'");
    });

    it("should generate table with AI hints", () => {
      const table = SurrealTable.create("user")
        .aiPrimaryKey("email")
        .aiContentFields(["username", "bio"]);
      const sql = table.toSurrealQL();
      
      expect(sql).toContain("@ai-hints:");
      expect(sql).toContain("primary_key");
      expect(sql).toContain("content_fields");
    });

    it("should generate table with description and AI hints", () => {
      const table = SurrealTable.create("user")
        .withDescription("User accounts")
        .aiPrimaryKey("email");
      const sql = table.toSurrealQL();
      
      expect(sql).toContain("COMMENT 'User accounts | @ai-hints:");
    });

    it("should generate table with permissions", () => {
      const table = SurrealTable.create("user")
        .withPermissions({
          select: "id = $auth.id",
          create: "true"
        });
      const sql = table.toSurrealQL();
      
      expect(sql).toContain("PERMISSIONS FOR select WHERE id = $auth.id");
      expect(sql).toContain("PERMISSIONS FOR create WHERE true");
    });

    it("should generate table with fields", () => {
      const table = SurrealTable.create("user")
        .addField(SurrealField.string("username").unique())
        .addField(SurrealField.string("email"));
      const sql = table.toSurrealQL();
      
      expect(sql).toContain("DEFINE FIELD username");
      expect(sql).toContain("DEFINE FIELD email");
      expect(sql).toContain("ON user");
    });

    it("should generate view table", () => {
      const table = SurrealTable.view("user_view", ["name", "email"], "active = true");
      const sql = table.toSurrealQL();
      
      expect(sql).toContain("DEFINE TABLE user_view AS SELECT name, email FROM user_view WHERE active = true");
    });
  });

  describe("SurrealQL Parsing", () => {
    it("should parse basic SurrealQL table definition", () => {
      const sql = "DEFINE TABLE user SCHEMAFULL COMMENT 'User accounts';";
      const table = SurrealTable.fromSurrealQL(sql);
      
      expect(table.name).toBe("user");
      expect(table.schemafull).toBe(true);
      expect(table.description).toBe("User accounts");
    });

    it("should parse schemaless table", () => {
      const sql = "DEFINE TABLE logs SCHEMALESS;";
      const table = SurrealTable.fromSurrealQL(sql);
      
      expect(table.name).toBe("logs");
      expect(table.schemafull).toBe(false);
    });

    it("should parse table with AI hints", () => {
      const sql = 'DEFINE TABLE user SCHEMAFULL COMMENT \'User table | @ai-hints: {"primary_key": "email", "content_fields": ["username"]}\';';
      const table = SurrealTable.fromSurrealQL(sql);
      
      expect(table.name).toBe("user");
      expect(table.description).toBe("User table");
      expect(table.aiHints?.primary_key).toBe("email");
      expect(table.aiHints?.content_fields).toEqual(["username"]);
    });

    it("should throw on invalid SurrealQL", () => {
      expect(() => {
        SurrealTable.fromSurrealQL("INVALID SQL");
      }).toThrow("Invalid SurrealQL table definition");
    });
  });

  describe("Migration Generation", () => {
    it("should detect table name changes", () => {
      const oldTable = SurrealTable.create("old_name");
      const newTable = SurrealTable.create("new_name");
      
      const diff = SurrealTable.diff(oldTable, newTable);
      expect(diff).toContain("ALTER TABLE old_name RENAME TO new_name");
    });

    it("should detect schema mode changes", () => {
      const oldTable = SurrealTable.schemaless("test");
      const newTable = SurrealTable.create("test"); // schemafull
      
      const diff = SurrealTable.diff(oldTable, newTable);
      expect(diff).toContain("ALTER TABLE test SCHEMAFULL");
    });

    it("should detect field additions", () => {
      const oldTable = SurrealTable.create("user");
      const newTable = SurrealTable.create("user")
        .addField(SurrealField.string("email"));
      
      const diff = SurrealTable.diff(oldTable, newTable);
      expect(diff.some(op => op.includes("DEFINE FIELD email"))).toBe(true);
    });

    it("should detect field removals", () => {
      const oldTable = SurrealTable.create("user")
        .addField(SurrealField.string("email"));
      const newTable = SurrealTable.create("user");
      
      const diff = SurrealTable.diff(oldTable, newTable);
      expect(diff).toContain("REMOVE FIELD email ON user");
    });

    it("should detect field modifications", () => {
      const oldTable = SurrealTable.create("user")
        .addField(SurrealField.string("email"));
      const newTable = SurrealTable.create("user")
        .addField(SurrealField.string("email").unique());
      
      const diff = SurrealTable.diff(oldTable, newTable);
      expect(diff.some(op => op.includes("ADD UNIQUE"))).toBe(true);
    });
  });

  describe("Code Generation", () => {
    it("should generate Effect Schema class", () => {
      const table = SurrealTable.create("user")
        .addField(SurrealField.string("username"))
        .addField(SurrealField.string("email").unique())
        .aiPrimaryKey("email")
        .aiCommonQueries(["find user by email", "get active users"]);

      const code = table.toEffectSchemaClass();
      
      expect(code).toContain("export namespace User");
      expect(code).toContain("export const Fields");
      expect(code).toContain("username: Schema.String");
      expect(code).toContain("email: Schema.String");
      expect(code).toContain("export class User extends Schema.Class");
      expect(code).toContain('static readonly tableName = "user"');
      expect(code).toContain("static readonly aiHints");
      expect(code).toContain("primary_key");
      expect(code).toContain("// AI-generated query methods");
    });

    it("should generate TypeScript interface", () => {
      const table = SurrealTable.create("user")
        .addField(SurrealField.string("username"))
        .addField(SurrealField.number("age"))
        .addField(SurrealField.boolean("active").optional())
        .addField(SurrealField.record("profile", "profile"));

      const code = table.toTypeScriptInterface();
      
      expect(code).toContain("export interface User");
      expect(code).toContain("username: string;");
      expect(code).toContain("age: number;");
      expect(code).toContain("active: boolean | undefined;");
      expect(code).toContain('profile: RecordId<"profile">;');
    });

    it("should handle different field types in TypeScript", () => {
      const table = SurrealTable.create("test")
        .addField(SurrealField.datetime("created_at"))
        .addField(SurrealField.array("tags"))
        .addField(SurrealField.object("metadata"))
        .addField(SurrealField.any("flexible"));

      const code = table.toTypeScriptInterface();
      
      expect(code).toContain("created_at: Date;");
      expect(code).toContain("tags: unknown[];");
      expect(code).toContain("metadata: unknown;");
      expect(code).toContain("flexible: unknown;");
    });
  });

  describe("Immutability", () => {
    it("should maintain immutability when chaining methods", () => {
      const original = SurrealTable.create("test");
      const modified = original
        .withDescription("Modified table")
        .addField(SurrealField.string("name"));
      
      // Original should remain unchanged
      expect(original.description).toBeUndefined();
      expect(original.fields).toHaveLength(0);
      
      // Modified should have new values
      expect(modified.description).toBe("Modified table");
      expect(modified.fields).toHaveLength(1);
    });

    it("should create new instances for each modification", () => {
      const table1 = SurrealTable.create("test");
      const table2 = table1.withDescription("Test table");
      const table3 = table2.addField(SurrealField.string("name"));
      
      // Each should be a different instance
      expect(table1).not.toBe(table2);
      expect(table2).not.toBe(table3);
      expect(table1).not.toBe(table3);
    });
  });
});