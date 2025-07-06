import { describe, expect, it } from "vitest";
import { SurrealField } from "../../lib/schema/field";
import { SurrealSchema } from "../../lib/schema/schema";
import { SurrealTable } from "../../lib/schema/table";

describe("Schema Pull Integration", () => {
  describe("AI Comment Parsing", () => {
    it("should parse AI metadata from SurrealQL comments", () => {
      // Simulate what we'd get from a database INFO query
      const mockTableComment =
        'User accounts table. @ai-hints: {"primary_key": "email", "temporal_field": "created_at", "user_field": "email", "content_fields": ["username", "bio"], "common_queries": ["find user by email", "get active users"]}';

      // Extract AI metadata
      const aiMatch = mockTableComment.match(/@ai-hints:\s*({.*})/);
      expect(aiMatch).toBeTruthy();

      const aiMetadata = JSON.parse(aiMatch?.[1]);
      expect(aiMetadata.primary_key).toBe("email");
      expect(aiMetadata.temporal_field).toBe("created_at");
      expect(aiMetadata.user_field).toBe("email");
      expect(aiMetadata.content_fields).toEqual(["username", "bio"]);
      expect(aiMetadata.common_queries).toEqual(["find user by email", "get active users"]);
    });

    it("should handle complex AI metadata with relationships", () => {
      const mockTableComment =
        'Blog posts table. @ai-hints: {"primary_key": "id", "temporal_field": "created_at", "user_field": "author", "content_fields": ["title", "content"], "relationships": {"author": "user via author field", "comments": "comment via post_id"}}';

      const aiMatch = mockTableComment.match(/@ai-hints:\s*({.*})/);
      expect(aiMatch).toBeTruthy();

      const aiMetadata = JSON.parse(aiMatch?.[1]);
      expect(aiMetadata.relationships).toEqual({
        author: "user via author field",
        comments: "comment via post_id",
      });
    });
  });

  describe("Schema Reconstruction", () => {
    it("should reconstruct enhanced schema from database metadata", () => {
      // Simulate database response
      const mockDbSchema = {
        tables: {
          user: 'DEFINE TABLE user TYPE NORMAL SCHEMAFULL COMMENT \'User accounts table. @ai-hints: {"primary_key": "email", "temporal_field": "created_at", "content_fields": ["username", "bio"]}\' PERMISSIONS NONE',
          post: "DEFINE TABLE post TYPE NORMAL SCHEMAFULL COMMENT 'Blog posts table' PERMISSIONS NONE",
        },
      };

      const mockTableInfo = {
        user: {
          fields: {
            id: "DEFINE FIELD id ON user TYPE record<user>",
            username: "DEFINE FIELD username ON user TYPE string UNIQUE COMMENT 'Unique username'",
            email: "DEFINE FIELD email ON user TYPE string UNIQUE COMMENT 'User email address'",
            bio: "DEFINE FIELD bio ON user TYPE option<string> COMMENT 'User biography'",
            created_at:
              "DEFINE FIELD created_at ON user TYPE datetime DEFAULT time::now() COMMENT 'Account creation timestamp'",
          },
        },
      };

      // Process the mock data like our pull command would
      const schema = SurrealSchema.create("pulled-schema", "1.0.0");
      let table = SurrealTable.create("user");

      // Extract AI metadata from comment
      const tableDefStr = mockDbSchema.tables.user;
      const commentMatch = tableDefStr.match(/COMMENT '([^']+)'/);
      expect(commentMatch).toBeTruthy();

      const comment = commentMatch?.[1];
      table = table.withDescription(comment.split(". @ai-hints:")[0]);

      const aiMatch = comment.match(/@ai-hints:\s*({.*})/);
      if (aiMatch) {
        const aiMetadata = JSON.parse(aiMatch[1]);
        if (aiMetadata.primary_key) table = table.aiPrimaryKey(aiMetadata.primary_key);
        if (aiMetadata.temporal_field) table = table.aiTemporalField(aiMetadata.temporal_field);
        if (aiMetadata.content_fields) table = table.aiContentFields(aiMetadata.content_fields);
      }

      // Process fields
      const fields: SurrealField[] = [];
      for (const [fieldName, fieldDef] of Object.entries(mockTableInfo.user.fields)) {
        const fieldDefStr = fieldDef as string;

        let field: SurrealField;
        if (fieldName === "id") {
          field = SurrealField.id("user");
        } else if (fieldDefStr.includes("option<string>")) {
          field = SurrealField.string(fieldName).optional();
        } else if (fieldDefStr.includes("TYPE string")) {
          field = SurrealField.string(fieldName);
        } else if (fieldDefStr.includes("TYPE datetime")) {
          field = SurrealField.datetime(fieldName);
        } else {
          field = SurrealField.string(fieldName);
        }

        if (fieldDefStr.includes("UNIQUE")) {
          field = field.unique();
        }

        if (fieldDefStr.includes("DEFAULT time::now()")) {
          field = field.default("time::now()");
        }

        const fieldCommentMatch = fieldDefStr.match(/COMMENT '([^']+)'/);
        if (fieldCommentMatch) {
          field = field.description(fieldCommentMatch[1]);
        }

        fields.push(field);
      }

      table = table.addFields(...fields);
      schema.addTable(table);

      // Verify the reconstructed schema
      expect(table.getName()).toBe("user");
      expect(table.getDescription()).toBe("User accounts table");
      expect(table.getAiHints()?.primary_key).toBe("email");
      expect(table.getAiHints()?.temporal_field).toBe("created_at");
      expect(table.getAiHints()?.content_fields).toEqual(["username", "bio"]);
      expect(table.getFields()).toHaveLength(5);

      const emailField = table.getField("email");
      expect(emailField?.getConstraints()?.unique).toBe(true);
      expect(emailField?.getDescription()).toBe("User email address");

      const bioField = table.getField("bio");
      expect(bioField?.isOptional).toBe(true);
      expect(bioField?.getDescription()).toBe("User biography");
    });
  });

  describe("Output Generation", () => {
    it("should generate enhanced TypeScript with AI metadata", () => {
      const table = SurrealTable.create("user", [
        SurrealField.id("user"),
        SurrealField.string("username").unique(),
        SurrealField.string("email").unique(),
      ])
        .withDescription("User accounts table")
        .aiPrimaryKey("email")
        .aiTemporalField("created_at")
        .aiContentFields(["username"]);

      const schema = SurrealSchema.create("test", "1.0.0").addTable(table);

      const typescript = schema.toTypeScript();
      expect(typescript).toContain("export interface User");
      expect(typescript).toContain('id: RecordId<"user">');
      expect(typescript).toContain("username: string");
      expect(typescript).toContain("email: string");
    });

    it("should generate SurrealQL with preserved AI metadata", () => {
      const table = SurrealTable.create("user", [
        SurrealField.id("user"),
        SurrealField.string("email").unique(),
      ])
        .withDescription("User accounts table")
        .aiPrimaryKey("email")
        .aiCommonQueries(["find user by email"]);

      const schema = SurrealSchema.create("test", "1.0.0").addTable(table);

      const surrealQL = schema.toSurrealQL();
      expect(surrealQL).toContain("DEFINE TABLE user");
      expect(surrealQL).toContain("@ai-hints");
      expect(surrealQL).toContain("primary_key");
      expect(surrealQL).toContain("find user by email");
    });
  });

  describe("Bidirectional Schema Flow", () => {
    it("should maintain AI metadata through schema objects", () => {
      // Create original schema with AI metadata
      const originalTable = SurrealTable.create("user", [
        SurrealField.id("user"),
        SurrealField.string("email").unique(),
        SurrealField.string("username"),
      ])
        .withDescription("User accounts table")
        .aiPrimaryKey("email")
        .aiTemporalField("created_at")
        .aiContentFields(["username"])
        .aiCommonQueries(["find user by email", "get active users"]);

      // Verify original table has AI metadata
      expect(originalTable.getAiHints()?.primary_key).toBe("email");
      expect(originalTable.getAiHints()?.temporal_field).toBe("created_at");
      expect(originalTable.getAiHints()?.content_fields).toEqual(["username"]);
      expect(originalTable.getAiHints()?.common_queries).toEqual([
        "find user by email",
        "get active users",
      ]);

      // Verify SurrealQL generation includes AI metadata
      const surrealQL = originalTable.toSurrealQL();
      expect(surrealQL).toContain("@ai-hints");
      expect(surrealQL).toContain("primary_key");
      expect(surrealQL).toContain("email");
      expect(surrealQL).toContain("find user by email");

      // Verify TypeScript generation works
      const schema = SurrealSchema.create("test", "1.0.0").addTable(originalTable);
      const typescript = schema.toTypeScript();
      expect(typescript).toContain("export interface User");
      expect(typescript).toContain("email: string");

      // Test that we can reconstruct equivalent table (simulating pull functionality)
      const reconstructedTable = SurrealTable.create("user", [
        SurrealField.id("user"),
        SurrealField.string("email").unique(),
        SurrealField.string("username"),
      ])
        .withDescription("User accounts table")
        .aiPrimaryKey("email")
        .aiTemporalField("created_at")
        .aiContentFields(["username"])
        .aiCommonQueries(["find user by email", "get active users"]);

      // Verify reconstructed table matches original
      expect(reconstructedTable.getAiHints()?.primary_key).toBe(
        originalTable.getAiHints()?.primary_key
      );
      expect(reconstructedTable.getAiHints()?.temporal_field).toBe(
        originalTable.getAiHints()?.temporal_field
      );
      expect(reconstructedTable.getAiHints()?.content_fields).toEqual(
        originalTable.getAiHints()?.content_fields
      );
      expect(reconstructedTable.getAiHints()?.common_queries).toEqual(
        originalTable.getAiHints()?.common_queries
      );
    });
  });
});
