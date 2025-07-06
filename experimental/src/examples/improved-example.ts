import { Effect } from "effect";
import { SchemaComparator } from "../lib/comparison/diff.ts";
import { MigrationGenerator } from "../lib/migration/generator.ts";
import { SurrealEvent } from "../lib/schema/event.ts";
import { SurrealField } from "../lib/schema/field.ts";
import { SurrealIndex } from "../lib/schema/index-def.ts";
import { SurrealSchema } from "../lib/schema/schema.ts";
import { SurrealTable } from "../lib/schema/table.ts";

// Define User table using improved Data.taggedClass-based classes
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

// Define indexes using improved classes
const userEmailIndex = SurrealIndex.unique("idx_user_email", "user", ["email"]);
const userUsernameIndex = SurrealIndex.unique("idx_user_username", "user", ["username"]);
const postSlugIndex = SurrealIndex.unique("idx_post_slug", "post", ["slug"]);
const postAuthorIndex = SurrealIndex.create("idx_post_author", "post", ["author"]);

// Define events using improved classes
const updateUserPostsCount = SurrealEvent.onCreate(
  "update_user_posts_count",
  "post",
  `
    UPDATE $after.author SET posts_count += 1
  `
).description("Increment user's posts count when a post is created");

// Create the initial schema using improved registry
const initialSchema = SurrealSchema.create("blog_schema_improved", "1.0.0")
  .description("Improved blog application schema with Data.taggedClass benefits")
  .author("SurrealDB Code-First Improved Example")
  .addTables(userTable, postTable)
  .addIndexes(userEmailIndex, userUsernameIndex, postSlugIndex, postAuthorIndex)
  .addEvents(updateUserPostsCount);

// Example: Schema evolution
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

// Demonstration of improved benefits
export const demonstrateImprovedBenefits = Effect.gen(function* (_) {
  console.log("=== Improved Data.taggedClass Schema System ===\n");

  // 1. Automatic tagging verification
  console.log("1. Automatic Tagging:");
  console.log(`User table _tag: ${userTable._tag}`);
  console.log(`User table definition _tag: ${userTable.definition._tag}`);
  console.log(`User email field _tag: ${userTable.getField("email")?._tag}`);
  console.log(`User email field definition _tag: ${userTable.getField("email")?.definition._tag}`);
  console.log(`Schema registry _tag: ${initialSchema._tag}`);
  console.log(`Schema registry definition _tag: ${initialSchema.registry._tag}`);
  console.log();

  // 2. Structural equality in action
  console.log("2. Structural Equality:");

  // Create identical schemas
  const schema1 = SurrealSchema.create("test", "1.0.0").addTable(userTable);

  const schema2 = SurrealSchema.create("test", "1.0.0").addTable(userTable);

  const schema3 = SurrealSchema.create("test", "1.1.0") // Different version
    .addTable(userTable);

  console.log("schema1 equals schema2 (identical):", schema1.equals(schema2));
  console.log("schema1 equals schema3 (different version):", schema1.equals(schema3));
  console.log();

  // 3. Immutability demonstration
  console.log("3. Immutability Verification:");

  const originalTable = SurrealTable.create("test_table", [SurrealField.string("name").length(50)]);

  const modifiedTable = originalTable
    .addField(SurrealField.string("email").unique())
    .description("Modified table with email field");

  console.log("Original table field count:", originalTable.getFields().length);
  console.log("Modified table field count:", modifiedTable.getFields().length);
  console.log("Original table has description:", !!originalTable.getDescription());
  console.log("Modified table has description:", !!modifiedTable.getDescription());
  console.log("Original table unchanged (immutable):", originalTable.getFields().length === 1);
  console.log();

  // 4. Schema comparison with improved equality
  console.log("4. Enhanced Schema Comparison:");

  const diff = SchemaComparator.compare(initialSchema, evolvedSchema);
  console.log(`Changes detected: ${diff.hasChanges}`);
  console.log(`Field changes: ${diff.fieldDiffs.length}`);

  if (diff.hasChanges) {
    for (const fieldDiff of diff.fieldDiffs) {
      console.log(`  - ${fieldDiff.operation} field ${fieldDiff.tableName}.${fieldDiff.fieldName}`);
    }
  }
  console.log();

  // 5. Migration generation
  console.log("5. Migration Generation:");

  if (diff.hasChanges) {
    const migration = MigrationGenerator.generateMigration(
      diff,
      "add_post_media_fields_improved",
      "Add featured image and categories to posts (improved version)"
    );

    console.log(`Migration: ${migration.name}`);
    console.log(`Statements: ${migration.statements.length}`);
    console.log(`Version: ${migration.version}`);
    console.log("First statement:", migration.statements[0]?.description);
  }
  console.log();

  // 6. Type safety and pattern matching
  console.log("6. Pattern Matching with Tags:");

  const analyzeSchemaElement = (element: any): string => {
    switch (element._tag) {
      case "SurrealTable":
        return `Table: ${element.definition.name} (${element.definition.fields.length} fields)`;
      case "SurrealField":
        return `Field: ${element.definition.name} (${element.definition.type})`;
      case "SurrealIndex":
        return `Index: ${element.definition.name} (${element.definition.type ?? "STANDARD"})`;
      case "SurrealEvent":
        return `Event: ${element.definition.name} (${element.definition.type})`;
      case "SurrealSchema":
        return `Schema: ${element.registry.name} v${element.registry.version}`;
      default:
        return `Unknown element type: ${element._tag ?? "no tag"}`;
    }
  };

  console.log("User table:", analyzeSchemaElement(userTable));
  console.log("Email field:", analyzeSchemaElement(userTable.getField("email")));
  console.log("Email index:", analyzeSchemaElement(userEmailIndex));
  console.log("Update event:", analyzeSchemaElement(updateUserPostsCount));
  console.log("Initial schema:", analyzeSchemaElement(initialSchema));
  console.log();

  // 7. Performance characteristics
  console.log("7. Performance Benefits:");
  console.log("✅ Automatic structural hashing for O(1) equality checks");
  console.log("✅ Optimized memory layout with shared immutable data");
  console.log("✅ Efficient cloning through structural sharing");
  console.log("✅ Built-in serialization support");
  console.log("✅ Pattern matching optimization");
  console.log();

  // 8. Generate final outputs
  console.log("8. Generated Schema Output:");
  console.log("SurrealQL schema length:", initialSchema.toSurrealQL().length, "characters");
  console.log("TypeScript types length:", initialSchema.toTypeScript().length, "characters");
  console.log();

  // 9. Validation
  console.log("9. Schema Validation:");
  try {
    yield* _(initialSchema.validate());
    console.log("✅ Initial schema validation passed");
  } catch (error) {
    console.log("❌ Initial schema validation failed:", error);
  }

  try {
    yield* _(evolvedSchema.validate());
    console.log("✅ Evolved schema validation passed");
  } catch (error) {
    console.log("❌ Evolved schema validation failed:", error);
  }
  console.log();

  console.log("=== Summary ===");
  console.log("The improved Data.taggedClass implementation provides:");
  console.log("• Automatic tagging for all schema elements");
  console.log("• Built-in structural equality for reliable comparisons");
  console.log("• Guaranteed immutability for safe concurrent operations");
  console.log("• Enhanced pattern matching capabilities");
  console.log("• Better performance through optimized data structures");
  console.log("• Seamless integration with Effect ecosystem");
});

// Export improved classes and schema
export {
  userTable as improvedUserTable,
  postTable as improvedPostTable,
  initialSchema as improvedInitialSchema,
  evolvedSchema as improvedEvolvedSchema,
};

// Run the demonstration if this file is executed directly
if (import.meta.main) {
  Effect.runSync(demonstrateImprovedBenefits);
}
