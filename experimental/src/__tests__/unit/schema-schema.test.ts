import { describe, it, expect, beforeEach } from "vitest";
import { Schema } from "effect";
import { SurrealSchema } from "../../lib/schema/schema";
import { SurrealTable } from "../../lib/schema/table";
import { SurrealField } from "../../lib/schema/field";

describe("SurrealSchema Schema.Class", () => {
  describe("Factory Methods", () => {
    it("should create empty schema with validation", () => {
      const schema = SurrealSchema.create("test-schema");
      
      expect(schema.name).toBe("test-schema");
      expect(schema.version).toBe("1.0.0");
      expect(schema.tables).toEqual([]);
    });

    it("should create schema with custom version", () => {
      const schema = SurrealSchema.create("test-schema", "2.1.0");
      
      expect(schema.name).toBe("test-schema");
      expect(schema.version).toBe("2.1.0");
    });

    it("should create schema from tables", () => {
      const tables = [
        SurrealTable.create("user").addField(SurrealField.string("name")),
        SurrealTable.create("post").addField(SurrealField.string("title"))
      ];
      const schema = SurrealSchema.fromTables("blog-schema", tables, "1.2.0");
      
      expect(schema.name).toBe("blog-schema");
      expect(schema.version).toBe("1.2.0");
      expect(schema.tables).toHaveLength(2);
      expect(schema.tables[0].name).toBe("user");
      expect(schema.tables[1].name).toBe("post");
    });

    it("should reject invalid schema data", () => {
      expect(() => {
        SurrealSchema.parse({
          name: "", // Invalid: empty name
          version: "1.0.0",
          tables: []
        });
      }).toThrow();

      expect(() => {
        SurrealSchema.parse({
          name: "test",
          version: "", // Invalid: empty version
          tables: []
        });
      }).toThrow();
    });
  });

  describe("Fluent API", () => {
    it("should chain methods while maintaining validation", () => {
      const schema = SurrealSchema.create("user-system")
        .withDescription("User management system")
        .withVersion("2.0.0")
        .addTable(SurrealTable.create("user").addField(SurrealField.string("email")))
        .addTable(SurrealTable.create("role").addField(SurrealField.string("name")));

      expect(schema.name).toBe("user-system");
      expect(schema.description).toBe("User management system");
      expect(schema.version).toBe("2.0.0");
      expect(schema.tables).toHaveLength(2);
    });

    it("should add multiple tables at once", () => {
      const tables = [
        SurrealTable.create("user"),
        SurrealTable.create("post"),
        SurrealTable.create("comment")
      ];
      const schema = SurrealSchema.create("blog").addTables(...tables);
      
      expect(schema.tables).toHaveLength(3);
      expect(schema.getTableNames()).toEqual(["user", "post", "comment"]);
    });

    it("should remove tables", () => {
      const schema = SurrealSchema.create("test")
        .addTable(SurrealTable.create("user"))
        .addTable(SurrealTable.create("post"))
        .removeTable("user");
      
      expect(schema.tables).toHaveLength(1);
      expect(schema.tables[0].name).toBe("post");
    });

    it("should update tables", () => {
      const schema = SurrealSchema.create("test")
        .addTable(SurrealTable.create("user"))
        .updateTable("user", table => 
          table.withDescription("Updated user table")
            .addField(SurrealField.string("email"))
        );
      
      const userTable = schema.getTable("user");
      expect(userTable?.description).toBe("Updated user table");
      expect(userTable?.fields).toHaveLength(1);
      expect(userTable?.fields[0].name).toBe("email");
    });

    it("should replace tables", () => {
      const originalTable = SurrealTable.create("user");
      const newTable = SurrealTable.create("user")
        .withDescription("Replaced table")
        .addField(SurrealField.string("username"));

      const schema = SurrealSchema.create("test")
        .addTable(originalTable)
        .replaceTable("user", newTable);
      
      const userTable = schema.getTable("user");
      expect(userTable?.description).toBe("Replaced table");
      expect(userTable?.fields).toHaveLength(1);
    });

    it("should manage metadata", () => {
      const metadata = {
        description: "Production schema",
        author: "Development Team",
        createdAt: new Date("2024-01-01"),
        tags: ["production", "v2"]
      };

      const schema = SurrealSchema.create("app").withMetadata(metadata);
      
      expect(schema.metadata?.description).toBe("Production schema");
      expect(schema.metadata?.author).toBe("Development Team");
      expect(schema.metadata?.tags).toEqual(["production", "v2"]);
    });
  });

  describe("Index and Event Management", () => {
    it("should add and remove indexes", () => {
      const schema = SurrealSchema.create("test")
        .addIndex({
          name: "idx_user_email",
          table: "user",
          fields: ["email"],
          unique: true
        })
        .addIndex({
          name: "idx_post_title",
          table: "post", 
          fields: ["title"],
          fulltext: true
        });

      expect(schema.getIndexes()).toHaveLength(2);
      expect(schema.getIndexes()[0].name).toBe("idx_user_email");
      expect(schema.getIndexes()[0].unique).toBe(true);
      expect(schema.getIndexes()[1].fulltext).toBe(true);

      const withoutIndex = schema.removeIndex("idx_user_email");
      expect(withoutIndex.getIndexes()).toHaveLength(1);
      expect(withoutIndex.getIndexes()[0].name).toBe("idx_post_title");
    });

    it("should add and remove events", () => {
      const schema = SurrealSchema.create("test")
        .addEvent({
          name: "user_created",
          table: "user",
          when: "AFTER",
          action: "CREATE",
          then: "CREATE activity:ulid() SET user = $after.id, action = 'created', created_at = time::now()"
        })
        .addEvent({
          name: "user_updated",
          table: "user",
          when: "AFTER",
          action: "UPDATE",
          condition: "$before.email != $after.email",
          then: "CREATE audit:ulid() SET user = $after.id, change = 'email_changed'"
        });

      expect(schema.getEvents()).toHaveLength(2);
      expect(schema.getEvents()[0].name).toBe("user_created");
      expect(schema.getEvents()[1].condition).toBe("$before.email != $after.email");

      const withoutEvent = schema.removeEvent("user_created");
      expect(withoutEvent.getEvents()).toHaveLength(1);
      expect(withoutEvent.getEvents()[0].name).toBe("user_updated");
    });
  });

  describe("Helper Methods", () => {
    let schema: SurrealSchema;

    beforeEach(() => {
      schema = SurrealSchema.create("test-app", "1.5.0")
        .withDescription("Test application schema")
        .addTable(
          SurrealTable.create("user")
            .addField(SurrealField.string("username"))
            .addField(SurrealField.string("email"))
        )
        .addTable(
          SurrealTable.create("post")
            .addField(SurrealField.string("title"))
            .addField(SurrealField.record("author", "user"))
        )
        .addIndex({
          name: "idx_user_email",
          table: "user",
          fields: ["email"],
          unique: true
        });
    });

    it("should provide basic information", () => {
      expect(schema.getName()).toBe("test-app");
      expect(schema.getVersion()).toBe("1.5.0");
      expect(schema.getDescription()).toBe("Test application schema");
    });

    it("should provide table access", () => {
      expect(schema.getTables()).toHaveLength(2);
      expect(schema.getTableNames()).toEqual(["user", "post"]);
      expect(schema.hasTable("user")).toBe(true);
      expect(schema.hasTable("nonexistent")).toBe(false);
      
      const userTable = schema.getTable("user");
      expect(userTable?.name).toBe("user");
      expect(userTable?.fields).toHaveLength(2);
    });

    it("should provide statistics", () => {
      expect(schema.getTableCount()).toBe(2);
      expect(schema.getFieldCount()).toBe(4); // 2 fields per table
      expect(schema.getIndexCount()).toBe(1);
      expect(schema.getEventCount()).toBe(0);
    });
  });

  describe("Schema Validation", () => {
    it("should validate correct schema", () => {
      const schema = SurrealSchema.create("valid-schema")
        .addTable(SurrealTable.create("user").addField(SurrealField.string("name")))
        .addTable(SurrealTable.create("post").addField(SurrealField.record("author", "user")));

      const errors = schema.validateSchema();
      expect(errors).toEqual([]);
    });

    it("should detect duplicate table names", () => {
      const table1 = SurrealTable.create("user").addField(SurrealField.string("name"));
      const table2 = SurrealTable.create("user").addField(SurrealField.string("email"));
      
      const schema = SurrealSchema.create("invalid")
        .addTables(table1, table2);

      const errors = schema.validateSchema();
      expect(errors).toContain("Duplicate table names: user");
    });

    it("should detect invalid table references", () => {
      const schema = SurrealSchema.create("invalid")
        .addTable(
          SurrealTable.create("post")
            .addField(SurrealField.record("author", "user")) // references non-existent 'user' table
        );

      const errors = schema.validateSchema();
      expect(errors.some(error => 
        error.includes("references non-existent table 'user'")
      )).toBe(true);
    });

    it("should detect invalid index references", () => {
      const schema = SurrealSchema.create("invalid")
        .addTable(SurrealTable.create("user").addField(SurrealField.string("name")))
        .addIndex({
          name: "idx_nonexistent",
          table: "nonexistent", // references non-existent table
          fields: ["name"]
        });

      const errors = schema.validateSchema();
      expect(errors.some(error => 
        error.includes("Index 'idx_nonexistent' references non-existent table")
      )).toBe(true);
    });

    it("should detect invalid index field references", () => {
      const schema = SurrealSchema.create("invalid")
        .addTable(SurrealTable.create("user").addField(SurrealField.string("name")))
        .addIndex({
          name: "idx_user_email",
          table: "user",
          fields: ["email"] // references non-existent field
        });

      const errors = schema.validateSchema();
      expect(errors.some(error => 
        error.includes("references non-existent field 'email'")
      )).toBe(true);
    });
  });

  describe("Built-in Validation", () => {
    it("should validate using Schema.Class methods", () => {
      const validData = {
        name: "test-schema",
        version: "1.0.0",
        description: "Test schema",
        tables: [
          SurrealTable.create("user").addField(SurrealField.string("name"))
        ]
      };

      const schema = SurrealSchema.parse(validData);
      expect(schema.name).toBe("test-schema");
      expect(schema.tables).toHaveLength(1);
    });

    it("should provide safe parsing", () => {
      const invalidData = {
        name: "",
        version: "1.0.0",
        tables: "not_an_array" as any
      };

      const result = SurrealSchema.safeParse(invalidData);
      expect(result._tag).toBe("None");
    });

    it("should encode and decode correctly", () => {
      const schema = SurrealSchema.create("test")
        .withDescription("Test schema")
        .addTable(SurrealTable.create("user"));
      
      const encoded = SurrealSchema.encode(schema);
      expect(encoded.name).toBe("test");
      expect(encoded.description).toBe("Test schema");

      const decoded = SurrealSchema.decode(encoded);
      expect(decoded.name).toBe(schema.name);
      expect(decoded.description).toBe(schema.description);
    });
  });

  describe("SurrealQL Generation", () => {
    it("should generate complete schema SurrealQL", () => {
      const schema = SurrealSchema.create("blog", "1.0.0")
        .withDescription("Blog application schema")
        .addTable(
          SurrealTable.create("user")
            .addField(SurrealField.string("username").unique())
            .addField(SurrealField.string("email").unique())
        )
        .addTable(
          SurrealTable.create("post")
            .addField(SurrealField.string("title"))
            .addField(SurrealField.record("author", "user"))
        )
        .addIndex({
          name: "idx_user_email",
          table: "user",
          fields: ["email"],
          unique: true
        });

      const sql = schema.toSurrealQL();
      
      expect(sql).toContain("-- Schema: blog v1.0.0");
      expect(sql).toContain("-- Blog application schema");
      expect(sql).toContain("DEFINE TABLE user");
      expect(sql).toContain("DEFINE TABLE post");
      expect(sql).toContain("DEFINE FIELD username");
      expect(sql).toContain("DEFINE FIELD email");
      expect(sql).toContain("DEFINE FIELD title");
      expect(sql).toContain("DEFINE FIELD author");
      expect(sql).toContain("DEFINE INDEX idx_user_email ON user FIELDS email UNIQUE");
    });

    it("should generate schema with events", () => {
      const schema = SurrealSchema.create("app")
        .addTable(SurrealTable.create("user"))
        .addEvent({
          name: "user_audit",
          table: "user",
          when: "AFTER",
          action: "UPDATE",
          condition: "$before.email != $after.email",
          then: "CREATE audit:ulid() SET change = 'email_update'"
        });

      const sql = schema.toSurrealQL();
      
      expect(sql).toContain("DEFINE EVENT user_audit ON TABLE user WHEN AFTER UPDATE WHERE $before.email != $after.email THEN CREATE audit:ulid() SET change = 'email_update'");
    });
  });

  describe("TypeScript Generation", () => {
    it("should generate TypeScript interfaces", () => {
      const schema = SurrealSchema.create("blog")
        .addTable(
          SurrealTable.create("user")
            .addField(SurrealField.string("username"))
            .addField(SurrealField.string("email"))
            .addField(SurrealField.boolean("is_active").optional())
        )
        .addTable(
          SurrealTable.create("post")
            .addField(SurrealField.string("title"))
            .addField(SurrealField.record("author", "user"))
        );

      const ts = schema.toTypeScript();
      
      expect(ts).toContain("// Generated schema: blog v1.0.0");
      expect(ts).toContain('import { Schema } from "effect"');
      expect(ts).toContain('import type { RecordId } from "surrealdb"');
      expect(ts).toContain("export const recordId");
      expect(ts).toContain("export interface User");
      expect(ts).toContain("username: string;");
      expect(ts).toContain("email: string;");
      expect(ts).toContain("is_active: boolean | undefined;");
      expect(ts).toContain("export interface Post");
      expect(ts).toContain('author: RecordId<"user">;');
    });
  });

  describe("Effect Schema Class Generation", () => {
    it("should generate complete Effect Schema classes", () => {
      const schema = SurrealSchema.create("app")
        .withDescription("Application schema")
        .addTable(
          SurrealTable.create("user")
            .addField(SurrealField.string("username"))
            .addField(SurrealField.string("email"))
            .aiPrimaryKey("email")
        );

      const code = schema.toEffectSchemaClasses();
      
      expect(code).toContain("// Generated Effect Schema classes: app v1.0.0");
      expect(code).toContain("// Application schema");
      expect(code).toContain("export const stringRecordIdSchema");
      expect(code).toContain("export const recordIdSchema");
      expect(code).toContain("export function recordId");
      expect(code).toContain("export namespace User");
      expect(code).toContain("export const Fields");
      expect(code).toContain("export class User extends Schema.Class");
      expect(code).toContain('static readonly tableName = "user"');
      expect(code).toContain("static readonly aiHints");
      expect(code).toContain("export const SchemaMetadata");
      expect(code).toContain('name: "app"');
      expect(code).toContain('version: "1.0.0"');
    });
  });

  describe("Schema Parsing", () => {
    it("should parse basic SurrealQL schema", () => {
      const sql = `
-- Schema: blog-app v2.1.0
-- Blog application database schema

DEFINE TABLE user SCHEMAFULL COMMENT 'User accounts';
DEFINE FIELD id ON user TYPE record<user>;
DEFINE FIELD username ON user TYPE string UNIQUE;
DEFINE FIELD email ON user TYPE string UNIQUE;

DEFINE TABLE post SCHEMAFULL;
DEFINE FIELD id ON post TYPE record<post>;
DEFINE FIELD title ON post TYPE string;
DEFINE FIELD author ON post TYPE record<user>;
`;

      const schema = SurrealSchema.fromSurrealQL(sql);
      
      expect(schema.name).toBe("blog-app");
      expect(schema.version).toBe("2.1.0");
      expect(schema.description).toBe("Blog application database schema");
      expect(schema.tables).toHaveLength(2);
      expect(schema.getTable("user")?.name).toBe("user");
      expect(schema.getTable("post")?.name).toBe("post");
    });

    it("should handle parsing errors gracefully", () => {
      const invalidSql = `
-- Schema: test v1.0.0

INVALID TABLE DEFINITION;
DEFINE TABLE user SCHEMAFULL;
`;

      const schema = SurrealSchema.fromSurrealQL(invalidSql);
      
      expect(schema.name).toBe("test");
      expect(schema.version).toBe("1.0.0");
      // Should have parsed the valid table definition
      expect(schema.tables).toHaveLength(1);
      expect(schema.getTable("user")?.name).toBe("user");
    });
  });

  describe("Migration Generation", () => {
    it("should generate migration for table additions", () => {
      const oldSchema = SurrealSchema.create("app")
        .addTable(SurrealTable.create("user"));

      const newSchema = SurrealSchema.create("app")
        .addTable(SurrealTable.create("user"))
        .addTable(SurrealTable.create("post").addField(SurrealField.string("title")));

      const migration = SurrealSchema.generateMigration(oldSchema, newSchema);
      
      expect(migration.some(op => op.includes("DEFINE TABLE post"))).toBe(true);
    });

    it("should generate migration for table removals", () => {
      const oldSchema = SurrealSchema.create("app")
        .addTable(SurrealTable.create("user"))
        .addTable(SurrealTable.create("post"));

      const newSchema = SurrealSchema.create("app")
        .addTable(SurrealTable.create("user"));

      const migration = SurrealSchema.generateMigration(oldSchema, newSchema);
      
      expect(migration).toContain("DROP TABLE post;");
    });

    it("should generate migration for table modifications", () => {
      const oldSchema = SurrealSchema.create("app")
        .addTable(SurrealTable.create("user").addField(SurrealField.string("username")));

      const newSchema = SurrealSchema.create("app")
        .addTable(SurrealTable.create("user")
          .addField(SurrealField.string("username"))
          .addField(SurrealField.string("email").unique())
        );

      const migration = SurrealSchema.generateMigration(oldSchema, newSchema);
      
      expect(migration.some(op => op.includes("DEFINE FIELD email"))).toBe(true);
    });

    it("should generate migration for index changes", () => {
      const oldSchema = SurrealSchema.create("app")
        .addTable(SurrealTable.create("user"))
        .addIndex({
          name: "idx_old",
          table: "user",
          fields: ["name"]
        });

      const newSchema = SurrealSchema.create("app")
        .addTable(SurrealTable.create("user"))
        .addIndex({
          name: "idx_new",
          table: "user",
          fields: ["email"],
          unique: true
        });

      const migration = SurrealSchema.generateMigration(oldSchema, newSchema);
      
      expect(migration).toContain("DROP INDEX idx_old;");
      expect(migration.some(op => op.includes("DEFINE INDEX idx_new"))).toBe(true);
    });
  });

  describe("Schema Comparison", () => {
    it("should compare schemas and identify differences", () => {
      const schema1 = SurrealSchema.create("app")
        .addTable(SurrealTable.create("user"))
        .addTable(SurrealTable.create("post"));

      const schema2 = SurrealSchema.create("app")
        .addTable(SurrealTable.create("user").addField(SurrealField.string("email"))) // modified
        .addTable(SurrealTable.create("comment")); // added, post removed

      const comparison = SurrealSchema.compare(schema1, schema2);
      
      expect(comparison.added).toContain("table:comment");
      expect(comparison.removed).toContain("table:post");
      expect(comparison.modified).toContain("table:user");
      expect(comparison.unchanged).toEqual([]);
    });

    it("should identify unchanged tables", () => {
      const table = SurrealTable.create("user").addField(SurrealField.string("name"));
      const schema1 = SurrealSchema.create("app").addTable(table);
      const schema2 = SurrealSchema.create("app").addTable(table);

      const comparison = SurrealSchema.compare(schema1, schema2);
      
      expect(comparison.unchanged).toContain("table:user");
      expect(comparison.added).toEqual([]);
      expect(comparison.removed).toEqual([]);
      expect(comparison.modified).toEqual([]);
    });
  });

  describe("Immutability", () => {
    it("should maintain immutability when chaining methods", () => {
      const original = SurrealSchema.create("test");
      const modified = original
        .withDescription("Modified schema")
        .addTable(SurrealTable.create("user"));
      
      // Original should remain unchanged
      expect(original.description).toBeUndefined();
      expect(original.tables).toHaveLength(0);
      
      // Modified should have new values
      expect(modified.description).toBe("Modified schema");
      expect(modified.tables).toHaveLength(1);
    });

    it("should create new instances for each modification", () => {
      const schema1 = SurrealSchema.create("test");
      const schema2 = schema1.withDescription("Test schema");
      const schema3 = schema2.addTable(SurrealTable.create("user"));
      
      // Each should be a different instance
      expect(schema1).not.toBe(schema2);
      expect(schema2).not.toBe(schema3);
      expect(schema1).not.toBe(schema3);
    });
  });
});