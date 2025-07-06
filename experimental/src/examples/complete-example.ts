import { Effect } from "effect";
import { SchemaComparator } from "../lib/comparison/diff";
import { MigrationGenerator } from "../lib/migration/generator";
import { createQueryBuilder } from "../lib/query-builder/builder";
import { SurrealEvent } from "../lib/schema/event";
import { SurrealField } from "../lib/schema/field";
import { SurrealIndex } from "../lib/schema/index-def";
import { SurrealSchema } from "../lib/schema/schema";
import { SurrealTable } from "../lib/schema/table";

// Complete demonstration of the code-first schema system
export const completeSchemaDemo = Effect.gen(function* (_) {
  console.log("🎯 Complete Code-First SurrealDB Schema System Demo");
  console.log("=".repeat(60));
  console.log();

  // 1. Define comprehensive schema
  console.log("📋 1. DEFINING COMPREHENSIVE SCHEMA");
  console.log("-".repeat(40));

  const userTable = SurrealTable.create("user", [
    SurrealField.id("user"),
    SurrealField.string("username")
      .unique()
      .length(50)
      .pattern("^[a-zA-Z0-9_]+$")
      .description("Unique alphanumeric username"),
    SurrealField.string("email")
      .unique()
      .pattern("^[^@]+@[^@]+\\.[^@]+$")
      .description("User's email address"),
    SurrealField.string("password_hash").length(128).description("Hashed password"),
    SurrealField.string("full_name").optional().length(100).description("User's full name"),
    SurrealField.string("bio").optional().length(500).description("User biography"),
    SurrealField.string("avatar_url")
      .optional()
      .pattern("^https?://.*")
      .description("Avatar image URL"),
    SurrealField.datetime("created_at")
      .default("time::now()")
      .description("Account creation timestamp"),
    SurrealField.datetime("updated_at").default("time::now()").description("Last profile update"),
    SurrealField.datetime("last_login_at").optional().description("Last login timestamp"),
    SurrealField.boolean("is_active").default("true").description("Account active status"),
    SurrealField.boolean("is_verified").default("false").description("Email verification status"),
    SurrealField.string("role")
      .default("'user'")
      .assert("$value IN ['user', 'moderator', 'admin']")
      .description("User role"),
    SurrealField.int("posts_count").default("0").min(0).description("Number of posts"),
    SurrealField.int("followers_count").default("0").min(0).description("Number of followers"),
    SurrealField.int("following_count")
      .default("0")
      .min(0)
      .description("Number of users being followed"),
  ])
    .description("User accounts with comprehensive profile data")
    .schemafull()
    .permissions({
      select: "is_active = true",
      create: "true",
      update: "id = $auth.id OR $auth.role = 'admin'",
      delete: "$auth.role = 'admin'",
    });

  const postTable = SurrealTable.create("post", [
    SurrealField.id("post"),
    SurrealField.string("title").length(200).description("Post title"),
    SurrealField.string("content").description("Post content in markdown"),
    SurrealField.string("excerpt").optional().length(300).description("Post excerpt/summary"),
    SurrealField.string("slug").unique().pattern("^[a-z0-9-]+$").description("URL-friendly slug"),
    SurrealField.record("author", "user").description("Post author"),
    SurrealField.string("status")
      .default("'draft'")
      .assert("$value IN ['draft', 'published', 'archived']")
      .description("Post status"),
    SurrealField.datetime("created_at").default("time::now()").description("Post creation time"),
    SurrealField.datetime("updated_at").default("time::now()").description("Last update time"),
    SurrealField.datetime("published_at").optional().description("Publication timestamp"),
    SurrealField.array("tags", SurrealField.string("tag").getSchema())
      .default("[]")
      .description("Post tags"),
    SurrealField.array("categories", SurrealField.string("category").getSchema())
      .default("[]")
      .description("Post categories"),
    SurrealField.string("featured_image_url")
      .optional()
      .pattern("^https?://.*")
      .description("Featured image URL"),
    SurrealField.int("views_count").default("0").min(0).description("View count"),
    SurrealField.int("likes_count").default("0").min(0).description("Like count"),
    SurrealField.int("comments_count").default("0").min(0).description("Comment count"),
    SurrealField.int("reading_time_minutes")
      .optional()
      .min(1)
      .description("Estimated reading time"),
  ])
    .description("Blog posts with rich metadata")
    .schemafull();

  const commentTable = SurrealTable.create("comment", [
    SurrealField.id("comment"),
    SurrealField.string("content").length(2000).description("Comment content"),
    SurrealField.record("author", "user").description("Comment author"),
    SurrealField.record("post", "post").description("Associated post"),
    SurrealField.record("parent", "comment").optional().description("Parent comment for threading"),
    SurrealField.datetime("created_at").default("time::now()").description("Comment creation time"),
    SurrealField.datetime("updated_at").default("time::now()").description("Last update time"),
    SurrealField.boolean("is_edited").default("false").description("Whether comment was edited"),
    SurrealField.boolean("is_deleted").default("false").description("Soft delete flag"),
    SurrealField.int("likes_count").default("0").min(0).description("Comment likes"),
    SurrealField.int("replies_count").default("0").min(0).description("Direct replies count"),
    SurrealField.int("depth").default("0").min(0).max(5).description("Comment nesting depth"),
  ])
    .description("Threaded comments system")
    .schemafull();

  const followTable = SurrealTable.create("follow", [
    SurrealField.id("follow"),
    SurrealField.record("follower", "user").description("User doing the following"),
    SurrealField.record("following", "user").description("User being followed"),
    SurrealField.datetime("created_at")
      .default("time::now()")
      .description("Follow relationship creation time"),
  ])
    .description("User follow relationships")
    .schemafull();

  console.log(`✅ Created ${[userTable, postTable, commentTable, followTable].length} tables`);
  console.log();

  // 2. Define comprehensive indexes
  console.log("🔍 2. DEFINING INDEXES");
  console.log("-".repeat(40));

  const indexes = [
    // User indexes
    SurrealIndex.unique("idx_user_email", "user", ["email"]).description("Unique email constraint"),
    SurrealIndex.unique("idx_user_username", "user", ["username"]).description(
      "Unique username constraint"
    ),
    SurrealIndex.create("idx_user_role", "user", ["role"]).description("Role-based queries"),
    SurrealIndex.create("idx_user_created", "user", ["created_at"]).description(
      "User registration timeline"
    ),
    SurrealIndex.create("idx_user_active", "user", ["is_active", "last_login_at"]).description(
      "Active user queries"
    ),

    // Post indexes
    SurrealIndex.unique("idx_post_slug", "post", ["slug"]).description("Unique post slugs"),
    SurrealIndex.create("idx_post_author", "post", ["author"]).description("Posts by author"),
    SurrealIndex.create("idx_post_status", "post", ["status", "published_at"]).description(
      "Published posts queries"
    ),
    SurrealIndex.create("idx_post_tags", "post", ["tags"]).description("Tag-based post search"),
    SurrealIndex.search("idx_post_content", "post", ["title", "content", "excerpt"])
      .analyzer("simple")
      .highlights(true)
      .description("Full-text search for posts"),

    // Comment indexes
    SurrealIndex.create("idx_comment_post", "comment", ["post", "created_at"]).description(
      "Comments by post"
    ),
    SurrealIndex.create("idx_comment_author", "comment", ["author"]).description(
      "Comments by author"
    ),
    SurrealIndex.create("idx_comment_parent", "comment", ["parent"]).description(
      "Comment threading"
    ),

    // Follow indexes
    SurrealIndex.unique("idx_follow_unique", "follow", ["follower", "following"]).description(
      "Prevent duplicate follows"
    ),
    SurrealIndex.create("idx_follow_follower", "follow", ["follower"]).description(
      "User's following list"
    ),
    SurrealIndex.create("idx_follow_following", "follow", ["following"]).description(
      "User's followers list"
    ),
  ];

  console.log(`✅ Created ${indexes.length} indexes`);
  console.log();

  // 3. Define events
  console.log("⚡ 3. DEFINING DATABASE EVENTS");
  console.log("-".repeat(40));

  const events = [
    // User events
    SurrealEvent.onCreate(
      "user_created",
      "user",
      `
      UPDATE stats SET total_users += 1
    `
    ).description("Track new user registrations"),

    SurrealEvent.onUpdate(
      "user_login",
      "user",
      `
      UPDATE $after SET last_login_at = time::now()
      WHERE $before.last_login_at != $after.last_login_at
    `
    ).description("Update last login timestamp"),

    // Post events
    SurrealEvent.onCreate(
      "post_created",
      "post",
      `
      UPDATE $after.author SET posts_count += 1
    `
    ).description("Increment author's post count"),

    SurrealEvent.onUpdate(
      "post_published",
      "post",
      `
      UPDATE $after SET published_at = time::now()
      WHERE $before.status != 'published' AND $after.status = 'published'
    `
    ).description("Set publication timestamp"),

    // Comment events
    SurrealEvent.onCreate(
      "comment_created",
      "comment",
      `
      UPDATE $after.post SET comments_count += 1;
      UPDATE $after.parent SET replies_count += 1 WHERE $after.parent IS NOT NONE;
    `
    ).description("Update comment counts"),

    // Follow events
    SurrealEvent.onCreate(
      "follow_created",
      "follow",
      `
      UPDATE $after.follower SET following_count += 1;
      UPDATE $after.following SET followers_count += 1;
    `
    ).description("Update follow counts"),

    SurrealEvent.onDelete(
      "follow_deleted",
      "follow",
      `
      UPDATE $before.follower SET following_count -= 1;
      UPDATE $before.following SET followers_count -= 1;
    `
    ).description("Update follow counts on unfollow"),
  ];

  console.log(`✅ Created ${events.length} database events`);
  console.log();

  // 4. Create comprehensive schema
  console.log("🏗️  4. BUILDING SCHEMA REGISTRY");
  console.log("-".repeat(40));

  const blogSchema = SurrealSchema.create("comprehensive_blog", "1.0.0")
    .description("Comprehensive blog platform with users, posts, comments, and follows")
    .author("SurrealDB Code-First Schema System")
    .addTables(userTable, postTable, commentTable, followTable)
    .addIndexes(...indexes)
    .addEvents(...events);

  console.log(`✅ Schema created: ${blogSchema.getName()} v${blogSchema.getVersion()}`);
  console.log(`   📊 Tables: ${blogSchema.getTables().length}`);
  console.log(`   🔍 Indexes: ${blogSchema.getIndexes().length}`);
  console.log(`   ⚡ Events: ${blogSchema.getEvents().length}`);
  console.log(
    `   📝 Total fields: ${blogSchema.getTables().reduce((sum, t) => sum + t.getFields().length, 0)}`
  );
  console.log();

  // 5. Validate schema
  console.log("✅ 5. SCHEMA VALIDATION");
  console.log("-".repeat(40));

  try {
    yield* blogSchema.validate();
    console.log("✅ Schema validation passed");
    console.log("   - All table references are valid");
    console.log("   - All index targets exist");
    console.log("   - All event targets exist");
  } catch (error) {
    console.log(`❌ Schema validation failed: ${error}`);
  }
  console.log();

  // 6. Generate outputs
  console.log("📤 6. GENERATING OUTPUTS");
  console.log("-".repeat(40));

  const surrealQL = blogSchema.toSurrealQL();
  const typescript = blogSchema.toTypeScript();

  console.log(`✅ SurrealQL generated: ${surrealQL.length} characters`);
  console.log(`✅ TypeScript generated: ${typescript.length} characters`);
  console.log();

  // 7. Schema evolution example
  console.log("🔄 7. SCHEMA EVOLUTION DEMO");
  console.log("-".repeat(40));

  const evolvedUserTable = userTable
    .addField(
      SurrealField.string("timezone")
        .optional()
        .default("'UTC'")
        .description("User's timezone preference")
    )
    .addField(
      SurrealField.boolean("email_notifications")
        .default("true")
        .description("Email notification preference")
    )
    .addField(
      SurrealField.array("interests", SurrealField.string("interest").getSchema())
        .default("[]")
        .description("User interests/topics")
    );

  const evolvedPostTable = postTable
    .addField(
      SurrealField.string("meta_description")
        .optional()
        .length(160)
        .description("SEO meta description")
    )
    .addField(
      SurrealField.array("keywords", SurrealField.string("keyword").getSchema())
        .default("[]")
        .description("SEO keywords")
    );

  const evolvedSchema = blogSchema
    .removeTable("user")
    .removeTable("post")
    .addTable(evolvedUserTable)
    .addTable(evolvedPostTable)
    .version("1.1.0");

  console.log(`✅ Evolved schema: ${evolvedSchema.getVersion()}`);

  // 8. Generate migration
  console.log("🚀 8. MIGRATION GENERATION");
  console.log("-".repeat(40));

  const diff = SchemaComparator.compare(blogSchema, evolvedSchema);
  console.log(`📊 Changes detected: ${diff.hasChanges}`);
  console.log(`   📋 Table changes: ${diff.tableDiffs.length}`);
  console.log(`   🏷️  Field changes: ${diff.fieldDiffs.length}`);
  console.log(`   🔍 Index changes: ${diff.indexDiffs.length}`);
  console.log(`   ⚡ Event changes: ${diff.eventDiffs.length}`);

  if (diff.hasChanges) {
    const migration = MigrationGenerator.generateMigration(
      diff,
      "add_user_preferences_and_seo",
      "Add user preferences and SEO fields to posts"
    );

    console.log(`✅ Migration generated: ${migration.name}`);
    console.log(`   📝 Statements: ${migration.statements.length}`);
    console.log(
      `   ⚠️  Breaking changes: ${migration.statements.filter((s) => s.isBreaking).length}`
    );
    console.log(`   🎯 Version: ${migration.version}`);

    // Show first few migration statements
    console.log("   📋 Sample statements:");
    migration.statements.slice(0, 3).forEach((stmt, i) => {
      console.log(`      ${i + 1}. ${stmt.description}`);
    });
  }
  console.log();

  // 9. Query builder demo
  console.log("🔧 9. TYPE-SAFE QUERY BUILDER");
  console.log("-".repeat(40));

  const userQueryBuilder = createQueryBuilder(userTable);
  const postQueryBuilder = createQueryBuilder(postTable);
  const commentQueryBuilder = createQueryBuilder(commentTable);

  // Sample queries
  const queries = [
    {
      name: "Active users with recent activity",
      builder: userQueryBuilder
        .select()
        .where("is_active = $active AND last_login_at > $since", {
          active: true,
          since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        })
        .orderBy("last_login_at", "DESC")
        .limit(50),
    },
    {
      name: "Published posts by author",
      builder: postQueryBuilder
        .select()
        .where("author = $authorId AND status = $status", {
          authorId: "user:john",
          status: "published",
        })
        .orderBy("published_at", "DESC")
        .limit(10),
    },
    {
      name: "Top-level comments for post",
      builder: commentQueryBuilder
        .select()
        .where("post = $postId AND parent IS NONE AND is_deleted = $deleted", {
          postId: "post:123",
          deleted: false,
        })
        .orderBy("likes_count", "DESC")
        .limit(20),
    },
  ];

  queries.forEach((query, i) => {
    const { query: sql, params } = query.builder.build();
    console.log(`   ${i + 1}. ${query.name}:`);
    console.log(`      Query: ${sql}`);
    console.log(`      Params: ${Object.keys(params).length} parameter(s)`);
  });
  console.log();

  // 10. Summary
  console.log("🎉 10. SYSTEM CAPABILITIES SUMMARY");
  console.log("=".repeat(60));
  console.log("✅ Code-first schema definition with fluent API");
  console.log("✅ Automatic structural equality with Data.taggedClass");
  console.log("✅ Schema comparison and diff generation");
  console.log("✅ Automatic migration generation with dependency resolution");
  console.log("✅ Type-safe query builders with parameter binding");
  console.log("✅ Comprehensive validation and error handling");
  console.log("✅ SurrealQL and TypeScript code generation");
  console.log("✅ Database event and trigger management");
  console.log("✅ Index optimization and search capabilities");
  console.log("✅ Schema versioning and evolution tracking");
  console.log();
  console.log("🚀 Ready for production use with:");
  console.log("   • Integration with existing SurrealTyped service");
  console.log("   • CLI tools for schema management");
  console.log("   • Migration rollback capabilities");
  console.log("   • Performance monitoring and optimization");
  console.log();
  console.log("💡 This demonstrates a complete code-first approach to");
  console.log("   SurrealDB schema management with all the benefits of");
  console.log("   Effect's type system and functional programming paradigms!");
});

// Run the complete demo
if (import.meta.main) {
  Effect.runSync(completeSchemaDemo);
}
