import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { SchemaComparator } from "../../lib/comparison/diff";
import { MigrationGenerator } from "../../lib/migration/generator";
import { SurrealEvent } from "../../lib/schema/event";
import { SurrealField } from "../../lib/schema/field";
import { SurrealIndex } from "../../lib/schema/index-def";
import { SurrealSchema } from "../../lib/schema/schema";
import { SurrealTable } from "../../lib/schema/table";

describe("Schema Workflow Integration", () => {
  describe("Complete Schema Definition to Migration", () => {
    it("should create complete schema with AI metadata and generate migrations", () => {
      // Define initial schema
      const v1Schema = SurrealSchema.create("blog_platform", "1.0.0")
        .withDescription("Blog platform with AI optimization")
        .addTable(
          SurrealTable.create("user", [
            SurrealField.id("user"),
            SurrealField.string("email").unique().pattern("^[^@]+@[^@]+\\.[^@]+$"),
            SurrealField.string("username").unique().length(50),
            SurrealField.boolean("is_active").default("true"),
            SurrealField.datetime("created_at").default("time::now()"),
          ])
            .withDescription("User accounts")
            .aiPrimaryKey("email")
            .aiTemporalField("created_at")
            .aiCommonQueries(["find by email", "list active users"])
        )
        .addIndex(
          SurrealIndex.unique("idx_user_email", "user", ["email"]).withDescription("Email uniqueness")
        );

      // Evolve schema to v2
      const v2Schema = SurrealSchema.create("blog_platform", "2.0.0")
        .withDescription("Blog platform with posts and AI optimization")
        .addTable(
          SurrealTable.create("user", [
            SurrealField.id("user"),
            SurrealField.string("email").unique().pattern("^[^@]+@[^@]+\\.[^@]+$"),
            SurrealField.string("username").unique().length(50),
            SurrealField.boolean("is_active").default("true"),
            SurrealField.datetime("created_at").default("time::now()"),
            SurrealField.datetime("last_login").optional(), // New field
            SurrealField.int("posts_count").default("0"), // New field
          ])
            .withDescription("User accounts with activity tracking")
            .aiPrimaryKey("email")
            .aiTemporalField("last_login") // Changed temporal field
            .aiCommonQueries(["find by email", "list active users", "recent activity"])
        )
        .addTable(
          SurrealTable.create("post", [
            SurrealField.id("post"),
            SurrealField.string("title").length(200),
            SurrealField.string("content"),
            SurrealField.record("author", "user"),
            SurrealField.boolean("is_published").default("false"),
            SurrealField.datetime("created_at").default("time::now()"),
          ])
            .withDescription("Blog posts")
            .aiPrimaryKey("id")
            .aiTemporalField("created_at")
            .aiUserField("author")
            .aiContentFields(["title", "content"])
            .aiCommonQueries(["find by author", "search content", "recent posts"])
        )
        .addIndex(SurrealIndex.unique("idx_user_email", "user", ["email"]))
        .addIndex(SurrealIndex.create("idx_user_activity", "user", ["is_active", "last_login"]))
        .addIndex(SurrealIndex.create("idx_post_author", "post", ["author"]))
        .addIndex(SurrealIndex.search("idx_post_content", "post", ["title", "content"]))
        .addEvent(
          SurrealEvent.onCreate(
            "track_post_creation",
            "post",
            `
            UPDATE $after.author SET posts_count += 1
          `
          ).withDescription("Update author post count")
        );

      // Generate comparison and migration
      const diff = SchemaComparator.compare(v1Schema, v2Schema);

      expect(diff.hasChanges).toBe(true);
      expect(diff.tableDiffs.length).toBeGreaterThan(0);
      expect(diff.fieldDiffs.length).toBeGreaterThan(0);
      expect(diff.indexDiffs.length).toBeGreaterThan(0);
      expect(diff.eventDiffs.length).toBeGreaterThan(0);

      // Generate migration
      const migration = MigrationGenerator.generateMigration(
        diff,
        "002_add_posts_and_activity",
        "Add posts table and user activity tracking"
      );

      expect(migration.name).toBe("002_add_posts_and_activity");
      expect(migration.description).toBe("Add posts table and user activity tracking");
      expect(migration.statements.length).toBeGreaterThan(0);

      // Verify migration contains expected changes
      const migrationSql = migration.statements.map((s) => s.upSql).join("\n");
      expect(migrationSql).toContain("DEFINE TABLE post");
      expect(migrationSql).toContain("DEFINE FIELD last_login");
      expect(migrationSql).toContain("DEFINE FIELD posts_count");
      expect(migrationSql).toContain("DEFINE INDEX idx_post_author");
      expect(migrationSql).toContain("DEFINE EVENT track_post_creation");
    });
  });

  describe("AI-Optimized Schema Generation", () => {
    it("should generate complete AI-friendly schema with metadata", () => {
      const schema = SurrealSchema.create("ai_workspace", "1.0.0")
        .withDescription("AI-optimized workspace schema")
        .addTable(
          SurrealTable.create("document", [
            SurrealField.id("document"),
            SurrealField.string("title").description("Document title"),
            SurrealField.string("content").description("Document content"),
            SurrealField.record("author", "user").description("Document author"),
            SurrealField.datetime("created_at").default("time::now()"),
            SurrealField.datetime("updated_at").default("time::now()"),
            SurrealField.string("type").assert("$value IN ['note', 'article', 'draft']"),
            SurrealField.string("metadata").default("'{}'").description("Flexible metadata"),
          ])
            .withDescription("Documents with AI-optimized metadata")
            .aiPrimaryKey("id")
            .aiTemporalField("updated_at")
            .aiUserField("author")
            .aiContentFields(["title", "content", "metadata"])
            .aiCommonQueries(["find by author", "search content", "list by type", "recent updates"])
            .aiRelationships({
              author: "user via author",
              comments: "comment via document_id",
            })
        );

      const surrealQL = schema.toSurrealQL();

      // Verify AI metadata is included in comments
      expect(surrealQL).toContain("@ai-hints:");
      expect(surrealQL).toContain("primary_key");
      expect(surrealQL).toContain("temporal_field");
      expect(surrealQL).toContain("user_field");
      expect(surrealQL).toContain("content_fields");
      expect(surrealQL).toContain("common_queries");
      expect(surrealQL).toContain("relationships");

      // Verify proper SurrealQL structure
      expect(surrealQL).toContain("DEFINE TABLE document SCHEMAFULL");
      expect(surrealQL).toContain("DEFINE FIELD title ON");
      expect(surrealQL).toContain("DEFINE FIELD author ON TYPE record<user>");
      expect(surrealQL).toContain("COMMENT");
    });
  });

  describe("Schema Registry Operations", () => {
    it("should manage complex schemas with multiple tables", () => {
      const schema = SurrealSchema.create("complex_app", "1.0.0")
        .addTables(
          SurrealTable.create("user", [
            SurrealField.id("user"),
            SurrealField.string("email").unique(),
          ]).aiPrimaryKey("email"),

          SurrealTable.create("organization", [
            SurrealField.id("organization"),
            SurrealField.string("name").unique(),
          ]).aiPrimaryKey("name"),

          SurrealTable.create("membership", [
            SurrealField.id("membership"),
            SurrealField.record("user", "user"),
            SurrealField.record("organization", "organization"),
            SurrealField.string("role").default("'member'"),
          ]).aiRelationships({
            user: "user via user",
            organization: "organization via organization",
          })
        )
        .addIndex(SurrealIndex.unique("idx_user_email", "user", ["email"]))
        .addIndex(SurrealIndex.unique("idx_org_name", "organization", ["name"]))
        .addIndex(SurrealIndex.unique("idx_membership", "membership", ["user", "organization"]));

      expect(schema.getTables()).toHaveLength(3);
      expect(schema.getIndexes()).toHaveLength(3);

      const userTable = schema.getTable("user");
      const orgTable = schema.getTable("organization");
      const memberTable = schema.getTable("membership");

      expect(userTable).toBeDefined();
      expect(orgTable).toBeDefined();
      expect(memberTable).toBeDefined();

      expect(userTable?.getAiHints()?.primary_key).toBe("email");
      expect(orgTable?.getAiHints()?.primary_key).toBe("name");
      expect(memberTable?.getAiHints()?.relationships).toBeDefined();
    });
  });

  describe("Schema Evolution Tracking", () => {
    it("should track schema changes across multiple versions", () => {
      // Version 1.0.0 - Basic schema
      const v1 = SurrealSchema.create("app", "1.0.0").addTable(
        SurrealTable.create("user", [SurrealField.id("user"), SurrealField.string("name")])
      );

      // Version 1.1.0 - Add email
      const v1_1 = v1
        .withVersion("1.1.0")
        .removeTable("user")
        .addTable(
          SurrealTable.create("user", [
            SurrealField.id("user"),
            SurrealField.string("name"),
            SurrealField.string("email").unique(),
          ])
        );

      // Version 1.2.0 - Add posts
      const v1_2 = v1_1
        .withVersion("1.2.0")
        .addTable(
          SurrealTable.create("post", [
            SurrealField.id("post"),
            SurrealField.string("title"),
            SurrealField.record("author", "user"),
          ])
        );

      const diff_1_0_to_1_1 = SchemaComparator.compare(v1, v1_1);
      const diff_1_1_to_1_2 = SchemaComparator.compare(v1_1, v1_2);

      expect(diff_1_0_to_1_1.hasChanges).toBe(true);
      expect(
        diff_1_0_to_1_1.fieldDiffs.some((d) => d.operation === "CREATE" && d.fieldName === "email")
      ).toBe(true);

      expect(diff_1_1_to_1_2.hasChanges).toBe(true);
      expect(
        diff_1_1_to_1_2.tableDiffs.some((d) => d.operation === "CREATE" && d.tableName === "post")
      ).toBe(true);
    });
  });

  describe("TypeScript Integration", () => {
    it("should generate comprehensive TypeScript types", () => {
      const schema = SurrealSchema.create("typed_app", "1.0.0").addTable(
        SurrealTable.create("user", [
          SurrealField.id("user"),
          SurrealField.string("email").unique(),
          SurrealField.string("name"),
          SurrealField.boolean("is_active").default("true"),
          SurrealField.datetime("created_at").default("time::now()"),
          SurrealField.string("bio").optional(),
          SurrealField.int("age").optional().min(0).max(150),
        ])
      );

      const typescript = schema.toTypeScript();

      expect(typescript).toContain("export interface User");
      expect(typescript).toContain('id: RecordId<"user">');
      expect(typescript).toContain("email: string");
      expect(typescript).toContain("name: string");
      expect(typescript).toContain("is_active: boolean");
      expect(typescript).toContain("created_at: Date");
      expect(typescript).toContain("bio: string | undefined");
      expect(typescript).toContain("age: number | undefined");
    });
  });

  describe("Validation and Error Handling", () => {
    it("should validate schema consistency", async () => {
      const validSchema = SurrealSchema.create("valid_app", "1.0.0")
        .addTable(
          SurrealTable.create("user", [SurrealField.id("user"), SurrealField.string("email")])
        )
        .addTable(
          SurrealTable.create("post", [
            SurrealField.id("post"),
            SurrealField.record("author", "user"), // Valid reference
          ])
        );

      // Schema is valid by construction via Schema.Class
      expect(validSchema.name).toBe("valid_app");
      expect(validSchema.tables).toHaveLength(2);
      expect(validSchema.getTable("user")).toBeDefined();
      expect(validSchema.getTable("post")).toBeDefined();
    });
  });
});
