import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { AIFieldHints, AIMetadataGenerator, AITableHints } from "../../lib/schema/ai-metadata";

describe("AI Metadata", () => {
  describe("AITableHints", () => {
    it("should create table hints with basic properties", () => {
      const hints = new AITableHints({
        primary_key: "email",
        temporal_field: "created_at",
        user_field: "user_id",
      });

      expect(hints.primary_key).toBe("email");
      expect(hints.temporal_field).toBe("created_at");
      expect(hints.user_field).toBe("user_id");
    });

    it("should support content and query metadata", () => {
      const hints = new AITableHints({
        content_fields: ["title", "description", "content"],
        common_queries: ["find by title", "search content", "list by date"],
        common_filters: ["published", "status", "created_at"],
      });

      expect(hints.content_fields).toEqual(["title", "description", "content"]);
      expect(hints.common_queries).toEqual(["find by title", "search content", "list by date"]);
      expect(hints.common_filters).toEqual(["published", "status", "created_at"]);
    });

    it("should support relationship metadata", () => {
      const hintsWithArray = new AITableHints({
        relationships: ["users", "posts", "comments"],
      });

      const hintsWithObject = new AITableHints({
        relationships: {
          author: "user via author_id",
          comments: "comment via post_id",
          tags: "tag via post_tags",
        },
      });

      expect(hintsWithArray.relationships).toEqual(["users", "posts", "comments"]);
      expect(hintsWithObject.relationships).toEqual({
        author: "user via author_id",
        comments: "comment via post_id",
        tags: "tag via post_tags",
      });
    });
  });

  describe("AIFieldHints", () => {
    it("should create field hints with metadata", () => {
      const hints = new AIFieldHints({
        searchable: true,
        content: true,
        temporal: false,
        user_reference: true,
        relationship_target: "user",
      });

      expect(hints.searchable).toBe(true);
      expect(hints.content).toBe(true);
      expect(hints.temporal).toBe(false);
      expect(hints.user_reference).toBe(true);
      expect(hints.relationship_target).toBe("user");
    });

    it("should support validation and operation metadata", () => {
      const hints = new AIFieldHints({
        validation_rules: ["required", "email_format", "max_length_255"],
        common_operations: ["search", "filter", "sort"],
      });

      expect(hints.validation_rules).toEqual(["required", "email_format", "max_length_255"]);
      expect(hints.common_operations).toEqual(["search", "filter", "sort"]);
    });
  });

  describe("AIMetadataGenerator", () => {
    it("should generate table comments with AI hints", async () => {
      const program = Effect.gen(function* () {
        const generator = yield* AIMetadataGenerator;

        const hints = new AITableHints({
          primary_key: "email",
          temporal_field: "created_at",
          common_queries: ["find by email", "list recent"],
        });

        const comment = generator.generateTableComment("User accounts table", hints);

        expect(comment).toContain("User accounts table");
        expect(comment).toContain("@ai-hints:");
        expect(comment).toContain("primary_key");
        expect(comment).toContain("email");
        expect(comment).toContain("temporal_field");
        expect(comment).toContain("created_at");
        expect(comment).toContain("common_queries");
      });

      await Effect.runPromise(Effect.provide(program, AIMetadataGenerator.Default));
    });

    it("should generate field comments with AI context", async () => {
      const program = Effect.gen(function* () {
        const generator = yield* AIMetadataGenerator;

        const hints = new AIFieldHints({
          searchable: true,
          content: true,
          relationship_target: "user",
        });

        const comment = generator.generateFieldComment("User email address", hints);

        expect(comment).toContain("User email address");
        expect(comment).toContain("@ai-context:");
        expect(comment).toContain("searchable");
        expect(comment).toContain("content");
        expect(comment).toContain("relationship_target");
      });

      await Effect.runPromise(Effect.provide(program, AIMetadataGenerator.Default));
    });

    it("should generate AI discovery schema", async () => {
      const program = Effect.gen(function* () {
        const generator = yield* AIMetadataGenerator;

        const hints = new AITableHints({
          primary_key: "id",
          temporal_field: "updated_at",
          user_field: "author_id",
          content_fields: ["title", "content"],
          common_queries: ["search by title", "find by author"],
          relationships: {
            author: "user via author_id",
            comments: "comment via post_id",
          },
        });

        const discovery = generator.generateAIDiscoverySchema("post", hints);

        expect(discovery.table_name).toBe("post");
        expect(discovery.purpose).toContain("Primary entity identified by id");
        expect(discovery.common_queries).toEqual(["search by title", "find by author"]);
        expect(discovery.temporal_fields).toEqual(["updated_at"]);
        expect(discovery.user_fields).toEqual(["author_id"]);
        expect(discovery.content_fields).toEqual(["title", "content"]);
        expect(discovery.relationships).toEqual({
          author: "user via author_id",
          comments: "comment via post_id",
        });
      });

      await Effect.runPromise(Effect.provide(program, AIMetadataGenerator.Default));
    });

    it("should generate AI helper functions", async () => {
      const program = Effect.gen(function* () {
        const generator = yield* AIMetadataGenerator;

        const hints = new AITableHints({
          primary_key: "email",
          temporal_field: "last_login",
          user_field: "id",
          content_fields: ["username", "bio"],
          relationships: ["posts", "comments"],
        });

        const helperFunc = generator.generateAIHelperFunction("user", hints);

        expect(helperFunc.name).toBe("fn::ai_get_user_info");
        expect(helperFunc.body).toContain("INFO FOR TABLE user STRUCTURE");
        expect(helperFunc.body).toContain('primary_key: "email"');
        expect(helperFunc.body).toContain('temporal_field: "last_login"');
        expect(helperFunc.body).toContain('user_field: "id"');
        expect(helperFunc.body).toContain('content_fields: ["username", "bio"]');
        expect(helperFunc.comment).toContain("AI helper function for user table");
      });

      await Effect.runPromise(Effect.provide(program, AIMetadataGenerator.Default));
    });

    it("should generate universal event tracking", async () => {
      const program = Effect.gen(function* () {
        const generator = yield* AIMetadataGenerator;

        const hints = new AITableHints({
          user_field: "author_id",
          content_fields: ["title", "content"],
        });

        const event = generator.generateUniversalEventTracking("post", hints);

        expect(event.name).toBe("track_post_activity");
        expect(event.when).toBe('$event IN ["CREATE", "UPDATE", "DELETE"]');
        expect(event.body).toContain("CREATE universal_event SET");
        expect(event.body).toContain('source_type = "post"');
        expect(event.body).toContain("actor = $after.author_id ?? $before.author_id");
        expect(event.body).toContain("title: $after.title ?? $before.title");
        expect(event.body).toContain("content: $after.content ?? $before.content");
        expect(event.comment).toContain("@ai-purpose: cross-table timeline queries");
      });

      await Effect.runPromise(Effect.provide(program, AIMetadataGenerator.Default));
    });

    it("should generate query patterns documentation", async () => {
      const program = Effect.gen(function* () {
        const generator = yield* AIMetadataGenerator;

        const hints = new AITableHints({
          primary_key: "email",
          temporal_field: "created_at",
          user_field: "id",
          content_fields: ["username", "bio"],
          query_patterns: ["SELECT * FROM user WHERE role = 'admin'"],
        });

        const patterns = generator.generateQueryPatternsDocumentation("user", hints);

        expect(patterns).toContain("SELECT * FROM user WHERE email = $id");
        expect(patterns).toContain(
          "SELECT * FROM user WHERE created_at > $date ORDER BY created_at DESC"
        );
        expect(patterns).toContain("SELECT * FROM user WHERE id = $user_id");
        expect(patterns).toContain("SELECT * FROM user WHERE username, bio CONTAINS $search_term");
        expect(patterns).toContain("SELECT * FROM user WHERE role = 'admin'");
      });

      await Effect.runPromise(Effect.provide(program, AIMetadataGenerator.Default));
    });

    it("should generate complete AI schema documentation", async () => {
      const program = Effect.gen(function* () {
        const generator = yield* AIMetadataGenerator;

        const hints = new AITableHints({
          primary_key: "id",
          temporal_field: "updated_at",
          user_field: "author_id",
          content_fields: ["title", "content"],
          relationships: {
            author: "user via author_id",
          },
        });

        const docs = generator.generateAISchemaDocumentation("post", hints);

        expect(docs.table_overview.name).toBe("post");
        expect(docs.table_overview.purpose).toContain("Primary entity identified by id");
        expect(docs.table_overview.ai_accessibility).toBe("High - optimized for AI agent queries");

        expect(docs.query_guidance.primary_access).toBe("id");
        expect(docs.query_guidance.temporal_queries).toBe("updated_at");
        expect(docs.query_guidance.user_queries).toBe("author_id");
        expect(docs.query_guidance.content_search).toEqual(["title", "content"]);

        expect(docs.common_patterns).toContain("SELECT * FROM post WHERE id = $id");
        expect(docs.ai_functions.name).toBe("fn::ai_get_post_info");
        expect(docs.event_tracking.name).toBe("track_post_activity");
      });

      await Effect.runPromise(Effect.provide(program, AIMetadataGenerator.Default));
    });
  });

  describe("Immutability", () => {
    it("should maintain immutability with TaggedClass", () => {
      const original = new AITableHints({
        primary_key: "id",
        common_queries: ["find by id"],
      });

      // Creating new instance should not affect original
      const modified = new AITableHints({
        ...original,
        temporal_field: "created_at",
      });

      expect(original.temporal_field).toBeUndefined();
      expect(modified.temporal_field).toBe("created_at");
      expect(modified.primary_key).toBe("id");
    });
  });
});
