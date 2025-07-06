import { describe, it, expect, beforeEach } from "vitest";
import { SurrealField } from "../../lib/schema/field";
import { SurrealTable } from "../../lib/schema/table";
import { SurrealSchema } from "../../lib/schema/schema";
import { SurrealIndex } from "../../lib/schema/index-def";
import { SurrealEvent } from "../../lib/schema/event";

/**
 * Level 1: Basic Schema Assembly Patterns
 * 
 * This test demonstrates how to compose complete schemas from tables,
 * indexes, and events using our Schema.Class architecture. This is
 * the foundation for building full database schemas.
 */
describe("Level 1: Basic Schema Assembly", () => {
  describe("Schema Creation", () => {
    it("should create empty schema", () => {
      const schema = SurrealSchema.create("blog-app");
      
      expect(schema.name).toBe("blog-app");
      expect(schema.version).toBe("1.0.0"); // Default version
      expect(schema.tables).toEqual([]);
      expect(schema.getTables()).toHaveLength(0);
    });

    it("should create schema with custom version", () => {
      const schema = SurrealSchema.create("blog-app", "2.1.0");
      
      expect(schema.name).toBe("blog-app");
      expect(schema.version).toBe("2.1.0");
    });

    it("should create schema from existing tables", () => {
      const userTable = SurrealTable.create("user")
        .addField(SurrealField.id("user"))
        .addField(SurrealField.string("username"));
      
      const postTable = SurrealTable.create("post")
        .addField(SurrealField.id("post"))
        .addField(SurrealField.string("title"));
      
      const schema = SurrealSchema.fromTables("blog", [userTable, postTable], "1.5.0");
      
      expect(schema.name).toBe("blog");
      expect(schema.version).toBe("1.5.0");
      expect(schema.tables).toHaveLength(2);
      expect(schema.tables.map(t => t.name)).toEqual(["user", "post"]);
    });
  });

  describe("Table Management", () => {
    it("should add single table", () => {
      const userTable = SurrealTable.create("user")
        .addField(SurrealField.string("username"));
      
      const schema = SurrealSchema.create("app")
        .addTable(userTable);
      
      expect(schema.tables).toHaveLength(1);
      expect(schema.hasTable("user")).toBe(true);
    });

    it("should add multiple tables", () => {
      const userTable = SurrealTable.create("user");
      const postTable = SurrealTable.create("post");
      const commentTable = SurrealTable.create("comment");
      
      const schema = SurrealSchema.create("blog")
        .addTables(userTable, postTable, commentTable);
      
      expect(schema.tables).toHaveLength(3);
      expect(schema.tables.map(t => t.name)).toEqual(["user", "post", "comment"]);
    });

    it("should remove tables", () => {
      const schema = SurrealSchema.create("app")
        .addTable(SurrealTable.create("user"))
        .addTable(SurrealTable.create("temp_data"))
        .removeTable("temp_data");
      
      expect(schema.tables).toHaveLength(1);
      expect(schema.hasTable("user")).toBe(true);
      expect(schema.hasTable("temp_data")).toBe(false);
    });

    it("should update existing tables", () => {
      const schema = SurrealSchema.create("app")
        .addTable(SurrealTable.create("user"))
        .updateTable("user", table => 
          table.withDescription("User accounts")
            .addField(SurrealField.string("email"))
        );
      
      const userTable = schema.getTable("user");
      expect(userTable?.description).toBe("User accounts");
      expect(userTable?.hasField("email")).toBe(true);
    });

    it("should replace tables", () => {
      const oldTable = SurrealTable.create("user");
      const newTable = SurrealTable.create("user")
        .withDescription("Improved user table")
        .addField(SurrealField.string("username"));
      
      const schema = SurrealSchema.create("app")
        .addTable(oldTable)
        .replaceTable("user", newTable);
      
      const userTable = schema.getTable("user");
      expect(userTable?.description).toBe("Improved user table");
      expect(userTable?.hasField("username")).toBe(true);
    });
  });

  describe("Index Management", () => {
    it("should add indexes to schema", () => {
      const emailIndex = {
        name: "idx_user_email",
        table: "user",
        fields: ["email"],
        unique: true
      };
      
      const schema = SurrealSchema.create("app")
        .addTable(SurrealTable.create("user"))
        .addIndex(emailIndex);
      
      expect(schema.getIndexes()).toHaveLength(1);
      expect(schema.getIndexes()[0].name).toBe("idx_user_email");
      expect(schema.getIndexes()[0].unique).toBe(true);
    });

    it("should remove indexes", () => {
      const schema = SurrealSchema.create("app")
        .addIndex({ name: "idx_temp", table: "user", fields: ["temp"] })
        .addIndex({ name: "idx_email", table: "user", fields: ["email"] })
        .removeIndex("idx_temp");
      
      expect(schema.getIndexes()).toHaveLength(1);
      expect(schema.getIndexes()[0].name).toBe("idx_email");
    });
  });

  describe("Event Management", () => {
    it("should add events to schema", () => {
      const userCreatedEvent = {
        name: "user_created",
        table: "user",
        when: "AFTER" as const,
        action: "CREATE" as const,
        then: "UPDATE stats SET user_count += 1"
      };
      
      const schema = SurrealSchema.create("app")
        .addTable(SurrealTable.create("user"))
        .addEvent(userCreatedEvent);
      
      expect(schema.getEvents()).toHaveLength(1);
      expect(schema.getEvents()[0].name).toBe("user_created");
      expect(schema.getEvents()[0].action).toBe("CREATE");
    });

    it("should remove events", () => {
      const schema = SurrealSchema.create("app")
        .addEvent({ 
          name: "temp_event", 
          table: "user", 
          when: "AFTER", 
          action: "CREATE", 
          then: "/* temp */" 
        })
        .addEvent({ 
          name: "user_audit", 
          table: "user", 
          when: "AFTER", 
          action: "UPDATE", 
          then: "CREATE audit:ulid() SET table = 'user'" 
        })
        .removeEvent("temp_event");
      
      expect(schema.getEvents()).toHaveLength(1);
      expect(schema.getEvents()[0].name).toBe("user_audit");
    });
  });

  describe("Schema Metadata", () => {
    it("should set schema description", () => {
      const schema = SurrealSchema.create("blog")
        .withDescription("Blog application database schema");
      
      expect(schema.description).toBe("Blog application database schema");
    });

    it("should update schema version", () => {
      const schema = SurrealSchema.create("app")
        .withVersion("2.0.0");
      
      expect(schema.version).toBe("2.0.0");
    });

    it("should manage custom metadata", () => {
      const metadata = {
        description: "Production schema",
        author: "Development Team",
        createdAt: new Date("2024-01-01"),
        tags: ["production", "v2"]
      };
      
      const schema = SurrealSchema.create("app")
        .withMetadata(metadata);
      
      expect(schema.metadata?.description).toBe("Production schema");
      expect(schema.metadata?.author).toBe("Development Team");
      expect(schema.metadata?.tags).toEqual(["production", "v2"]);
    });
  });

  describe("Helper Methods", () => {
    let blogSchema: SurrealSchema;
    
    beforeEach(() => {
      blogSchema = SurrealSchema.create("blog", "1.0.0")
        .withDescription("Blog application schema")
        .addTable(
          SurrealTable.create("user")
            .addField(SurrealField.id("user"))
            .addField(SurrealField.string("username"))
            .addField(SurrealField.string("email"))
        )
        .addTable(
          SurrealTable.create("post")
            .addField(SurrealField.id("post"))
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
      expect(blogSchema.getName()).toBe("blog");
      expect(blogSchema.getVersion()).toBe("1.0.0");
      expect(blogSchema.getDescription()).toBe("Blog application schema");
    });

    it("should provide table access", () => {
      expect(blogSchema.getTables()).toHaveLength(2);
      expect(blogSchema.tables.map(t => t.name)).toEqual(["user", "post"]);
      expect(blogSchema.hasTable("user")).toBe(true);
      expect(blogSchema.hasTable("nonexistent")).toBe(false);
      
      const userTable = blogSchema.getTable("user");
      expect(userTable?.name).toBe("user");
      expect(userTable?.fields).toHaveLength(3);
    });

    it("should provide statistics", () => {
      expect(blogSchema.getTableCount()).toBe(2);
      expect(blogSchema.getFieldCount()).toBe(6); // 3 fields per table
      expect(blogSchema.getIndexCount()).toBe(1);
      expect(blogSchema.getEventCount()).toBe(0);
    });
  });

  describe("Schema Validation", () => {
    it("should validate correct schema", () => {
      const schema = SurrealSchema.create("valid-schema")
        .addTable(
          SurrealTable.create("user")
            .addField(SurrealField.string("name"))
        )
        .addTable(
          SurrealTable.create("post")
            .addField(SurrealField.record("author", "user"))
        );

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
  });

  describe("Built-in Schema.Class Features", () => {
    it("should maintain immutability", () => {
      const originalSchema = SurrealSchema.create("test");
      const modifiedSchema = originalSchema
        .withDescription("Modified schema")
        .addTable(SurrealTable.create("user"));
      
      // Original should remain unchanged
      expect(originalSchema.description).toBeUndefined();
      expect(originalSchema.tables).toHaveLength(0);
      
      // Modified should have new values
      expect(modifiedSchema.description).toBe("Modified schema");
      expect(modifiedSchema.tables).toHaveLength(1);
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

  describe("Code Generation", () => {
    it("should generate complete SurrealQL", () => {
      const schema = SurrealSchema.create("blog", "1.0.0")
        .withDescription("Blog application schema")
        .addTable(
          SurrealTable.create("user")
            .addField(SurrealField.string("username").unique())
            .addField(SurrealField.string("email").unique())
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
      expect(sql).toContain("DEFINE FIELD username");
      expect(sql).toContain("DEFINE FIELD email");
      expect(sql).toContain("DEFINE INDEX idx_user_email ON user FIELDS email UNIQUE");
    });

    it("should generate TypeScript interfaces", () => {
      const schema = SurrealSchema.create("blog")
        .addTable(
          SurrealTable.create("user")
            .addField(SurrealField.string("username"))
            .addField(SurrealField.string("email"))
            .addField(SurrealField.boolean("is_active").optional())
        );

      const ts = schema.toTypeScript();
      
      expect(ts).toContain("// Generated schema: blog v1.0.0");
      expect(ts).toContain('import { Schema } from "effect"');
      expect(ts).toContain("export interface User");
      expect(ts).toContain("username: string;");
      expect(ts).toContain("email: string;");
      expect(ts).toContain("is_active: boolean | undefined;");
    });
  });
});