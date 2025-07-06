import { Effect } from "effect";
import { SchemaComparator } from "../lib/comparison/diff.ts";
import { MigrationGenerator } from "../lib/migration/generator.ts";
import { createQueryBuilder } from "../lib/query-builder/builder.ts";
import { SurrealEvent } from "../lib/schema/event.ts";
import { SurrealField } from "../lib/schema/field.ts";
import { SurrealIndex } from "../lib/schema/index-def.ts";
import { SurrealSchema } from "../lib/schema/schema.ts";
import { SurrealTable } from "../lib/schema/table.ts";

// Define User table
const userTable = SurrealTable.create("user", [
  SurrealField.id("user"),
  SurrealField.string("username").unique().length(50).description("Unique username for the user"),
  SurrealField.string("email")
    .unique()
    .pattern("^[^@]+@[^@]+\\.[^@]+$")
    .description("User's email address"),
  SurrealField.string("full_name").optional().length(100).description("User's full name"),
  SurrealField.datetime("created_at")
    .default("time::now()")
    .description("When the user account was created"),
  SurrealField.datetime("updated_at")
    .default("time::now()")
    .description("When the user account was last updated"),
  SurrealField.boolean("is_active")
    .default("true")
    .description("Whether the user account is active"),
  SurrealField.int("posts_count").default("0").min(0).description("Number of posts by this user"),
])
  .description("User accounts table")
  .schemafull();

// Define Post table
const postTable = SurrealTable.create("post", [
  SurrealField.id("post"),
  SurrealField.string("title").length(200).description("Post title"),
  SurrealField.string("content").description("Post content"),
  SurrealField.string("slug").unique().pattern("^[a-z0-9-]+$").description("URL-friendly slug"),
  SurrealField.record("author", "user").description("Author of the post"),
  SurrealField.datetime("created_at")
    .default("time::now()")
    .description("When the post was created"),
  SurrealField.datetime("updated_at")
    .default("time::now()")
    .description("When the post was last updated"),
  SurrealField.datetime("published_at").optional().description("When the post was published"),
  SurrealField.boolean("is_published")
    .default("false")
    .description("Whether the post is published"),
  SurrealField.array("tags", SurrealField.string("tag").getSchema())
    .default("[]")
    .description("Post tags"),
  SurrealField.int("views_count").default("0").min(0).description("Number of views"),
  SurrealField.int("comments_count").default("0").min(0).description("Number of comments"),
])
  .description("Blog posts table")
  .schemafull();

// Define Comment table
const commentTable = SurrealTable.create("comment", [
  SurrealField.id("comment"),
  SurrealField.string("content").length(1000).description("Comment content"),
  SurrealField.record("author", "user").description("Author of the comment"),
  SurrealField.record("post", "post").description("Post this comment belongs to"),
  SurrealField.record("parent", "comment")
    .optional()
    .description("Parent comment for nested replies"),
  SurrealField.datetime("created_at")
    .default("time::now()")
    .description("When the comment was created"),
  SurrealField.datetime("updated_at")
    .default("time::now()")
    .description("When the comment was last updated"),
  SurrealField.boolean("is_deleted")
    .default("false")
    .description("Whether the comment is soft deleted"),
  SurrealField.int("replies_count")
    .default("0")
    .min(0)
    .description("Number of replies to this comment"),
])
  .description("Comments table with nested reply support")
  .schemafull();

// Define indexes
const userEmailIndex = SurrealIndex.unique("idx_user_email", "user", ["email"]);
const userUsernameIndex = SurrealIndex.unique("idx_user_username", "user", ["username"]);
const postSlugIndex = SurrealIndex.unique("idx_post_slug", "post", ["slug"]);
const postAuthorIndex = SurrealIndex.create("idx_post_author", "post", ["author"]);
const postPublishedIndex = SurrealIndex.create("idx_post_published", "post", [
  "is_published",
  "published_at",
]);
const commentPostIndex = SurrealIndex.create("idx_comment_post", "comment", ["post"]);
const commentAuthorIndex = SurrealIndex.create("idx_comment_author", "comment", ["author"]);

// Define events
const updateUserPostsCount = SurrealEvent.onCreate(
  "update_user_posts_count",
  "post",
  `
    UPDATE $after.author SET posts_count += 1
  `
).description("Increment user's posts count when a post is created");

const updatePostCommentsCount = SurrealEvent.onCreate(
  "update_post_comments_count",
  "comment",
  `
    UPDATE $after.post SET comments_count += 1
  `
).description("Increment post's comments count when a comment is created");

const updateCommentRepliesCount = SurrealEvent.onCreate(
  "update_comment_replies_count",
  "comment",
  `
    UPDATE $after.parent SET replies_count += 1 WHERE $after.parent IS NOT NONE
  `
)
  .condition("$after.parent IS NOT NONE")
  .description("Increment parent comment's replies count when a reply is created");

// Create the initial schema
const initialSchema = SurrealSchema.create("blog_schema", "1.0.0")
  .description("Blog application schema with users, posts, and comments")
  .author("SurrealDB Code-First Example")
  .addTables(userTable, postTable, commentTable)
  .addIndexes(
    userEmailIndex,
    userUsernameIndex,
    postSlugIndex,
    postAuthorIndex,
    postPublishedIndex,
    commentPostIndex,
    commentAuthorIndex
  )
  .addEvents(updateUserPostsCount, updatePostCommentsCount, updateCommentRepliesCount);

// Example: Schema evolution - adding a new field to posts
const evolvedPostTable = postTable
  .addField(
    SurrealField.string("featured_image_url").optional().description("URL of the featured image")
  )
  .addField(
    SurrealField.array("categories", SurrealField.string("category").getSchema())
      .default("[]")
      .description("Post categories")
  );

const evolvedSchema = initialSchema.removeTable("post").addTable(evolvedPostTable).version("1.1.0");

// Example: Create query builders
const userQueryBuilder = createQueryBuilder(userTable);
const postQueryBuilder = createQueryBuilder(postTable);
const commentQueryBuilder = createQueryBuilder(commentTable);

// Example usage function
export const exampleUsage = Effect.gen(function* (_) {
  console.log("=== SurrealDB Code-First Schema Example ===\n");

  // 1. Generate initial schema
  console.log("1. Initial Schema (SurrealQL):");
  console.log(initialSchema.toSurrealQL());
  console.log(`\n${"=".repeat(50)}\n`);

  // 2. Compare schemas and generate migration
  console.log("2. Schema Evolution:");
  const diff = SchemaComparator.compare(initialSchema, evolvedSchema);
  console.log(`Changes detected: ${diff.hasChanges}`);

  if (diff.hasChanges) {
    const migration = MigrationGenerator.generateMigration(
      diff,
      "add_post_media_fields",
      "Add featured image and categories to posts"
    );

    console.log("Migration generated:");
    console.log(MigrationGenerator.generateMigrationFile(migration));
  }
  console.log(`\n${"=".repeat(50)}\n`);

  // 3. Type-safe query examples
  console.log("3. Type-Safe Query Examples:");

  // Select users
  const selectUsersQuery = userQueryBuilder
    .select()
    .where("is_active = $active", { active: true })
    .orderBy("created_at", "DESC")
    .limit(10)
    .build();

  console.log("Select active users:");
  console.log(`Query: ${selectUsersQuery.query}`);
  console.log("Params:", selectUsersQuery.params);
  console.log();

  // Insert a new post
  const insertPostQuery = postQueryBuilder
    .insert()
    .values({
      title: "My First Post",
      content: "This is the content of my first post.",
      slug: "my-first-post",
      author: "user:john" as any,
      tags: ["tutorial", "getting-started"],
      is_published: true,
      published_at: new Date(),
    })
    .build();

  console.log("Insert new post:");
  console.log(`Query: ${insertPostQuery.query}`);
  console.log("Params:", insertPostQuery.params);
  console.log();

  // Update post views
  const updatePostQuery = postQueryBuilder
    .update()
    .set("views_count", 42)
    .set("updated_at", new Date())
    .where("slug = $slug", { slug: "my-first-post" })
    .build();

  console.log("Update post views:");
  console.log(`Query: ${updatePostQuery.query}`);
  console.log("Params:", updatePostQuery.params);
  console.log();

  // Delete spam comments
  const deleteCommentsQuery = commentQueryBuilder
    .delete()
    .where("content CONTAINS $spam AND is_deleted = $deleted", {
      spam: "spam",
      deleted: false,
    })
    .build();

  console.log("Delete spam comments:");
  console.log(`Query: ${deleteCommentsQuery.query}`);
  console.log("Params:", deleteCommentsQuery.params);
  console.log(`\n${"=".repeat(50)}\n`);

  // 4. Schema validation
  console.log("4. Schema Validation:");
  try {
    yield* _(initialSchema.validate());
    console.log("✅ Initial schema is valid");
  } catch (error) {
    console.log("❌ Initial schema validation failed:", error);
  }

  try {
    yield* _(evolvedSchema.validate());
    console.log("✅ Evolved schema is valid");
  } catch (error) {
    console.log("❌ Evolved schema validation failed:", error);
  }

  console.log(`\n${"=".repeat(50)}\n`);

  // 5. TypeScript type generation
  console.log("5. Generated TypeScript Types:");
  console.log(initialSchema.toTypeScript());
});

// Export schema and builders for use in other files
export {
  initialSchema,
  evolvedSchema,
  userTable,
  postTable,
  commentTable,
  userQueryBuilder,
  postQueryBuilder,
  commentQueryBuilder,
};

// Run the example if this file is executed directly
if (import.meta.main) {
  Effect.runSync(exampleUsage);
}
