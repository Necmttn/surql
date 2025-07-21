/**
 * Automatic Migration Generation CLI
 * 
 * This script demonstrates the enhanced workflow:
 * 1. Modify schema-definitions.ts
 * 2. Run this script to auto-generate migrations
 * 3. Apply migrations incrementally
 * 
 * No more manual migration writing!
 */

import { Effect, Console } from "effect";
import { generateMigrationFromSchema, showSchemaDiff, MigrationGenerator } from "../lib/migration-generator";
import { currentSchemaVersion } from "../schema-definitions";

// ===========================================
// CLI Interface
// ===========================================

const showUsage = Effect.gen(function* (_) {
  yield* Console.log("🚀 Automatic Migration Generator");
  yield* Console.log("================================");
  yield* Console.log("");
  yield* Console.log("Usage:");
  yield* Console.log("  bun auto-migrate.ts generate [name]  - Generate migration from schema changes");
  yield* Console.log("  bun auto-migrate.ts diff             - Show schema diff without generating");
  yield* Console.log("  bun auto-migrate.ts status           - Show current schema status");
  yield* Console.log("  bun auto-migrate.ts workflow         - Run full development workflow");
  yield* Console.log("");
  yield* Console.log("Examples:");
  yield* Console.log("  bun auto-migrate.ts generate add_analytics");
  yield* Console.log("  bun auto-migrate.ts generate user_social_fields");
  yield* Console.log("  bun auto-migrate.ts workflow");
});

const showSchemaStatus = Effect.gen(function* (_) {
  yield* Console.log("📊 Current Schema Status");
  yield* Console.log("========================");
  yield* Console.log(`Version: ${currentSchemaVersion.version}`);
  yield* Console.log(`Tables: ${currentSchemaVersion.tables.length}`);
  yield* Console.log(`Description: ${currentSchemaVersion.description}`);
  yield* Console.log(`Updated: ${currentSchemaVersion.timestamp.toISOString()}`);
  yield* Console.log("");
  
  yield* Console.log("Tables:");
  for (const table of currentSchemaVersion.tables) {
    const fieldCount = table.getFields().length;
    const uniqueFields = table.getFields().filter(f => f.getConstraints()?.unique).length;
    yield* Console.log(`  • ${table.getName()} (${fieldCount} fields, ${uniqueFields} unique)`);
  }
});

/**
 * Full development workflow example
 */
const developmentWorkflow = Effect.gen(function* (_) {
  yield* Console.log("🔄 Development Workflow Example");
  yield* Console.log("===============================");
  yield* Console.log("");
  
  yield* Console.log("📝 Step 1: Schema definitions modified in schema-definitions.ts");
  yield* Console.log("   • Added social_links field to user table");
  yield* Console.log("   • Added analytics table");
  yield* Console.log("   • Added search_log table");
  yield* Console.log("");
  
  yield* Console.log("🔍 Step 2: Show what will change");
  yield* showSchemaDiff;
  yield* Console.log("");
  
  yield* Console.log("⚡ Step 3: Generate migration automatically");
  yield* generateMigrationFromSchema;
  yield* Console.log("");
  
  yield* Console.log("✅ Workflow complete!");
  yield* Console.log("");
  yield* Console.log("Next steps:");
  yield* Console.log("  1. Review generated migration in src/migrations/");
  yield* Console.log("  2. Run: npm run db:apply");
  yield* Console.log("  3. Test the changes");
  yield* Console.log("  4. Commit the migration files");
});

/**
 * Example: Adding a new table to demonstrate auto-generation
 */
const exampleAddTable = Effect.gen(function* (_) {
  yield* Console.log("📝 Example: Adding Newsletter Table");
  yield* Console.log("==================================");
  yield* Console.log("");
  yield* Console.log("This would be done by adding to schema-definitions.ts:");
  yield* Console.log("");
  yield* Console.log("export const newsletterTable = SurrealTable.create('newsletter', [");
  yield* Console.log("  SurrealField.id('newsletter'),");
  yield* Console.log("  SurrealField.string('email').unique(),");
  yield* Console.log("  SurrealField.boolean('is_active').default('true'),");
  yield* Console.log("  SurrealField.datetime('subscribed_at').default('time::now()'),");
  yield* Console.log("]);");
  yield* Console.log("");
  yield* Console.log("Then run: bun auto-migrate.ts generate add_newsletter");
  yield* Console.log("");
  yield* Console.log("Generated migration would include:");
  yield* Console.log("  • CREATE TABLE newsletter SCHEMAFULL;");
  yield* Console.log("  • DEFINE FIELD email ON newsletter TYPE string;");
  yield* Console.log("  • DEFINE INDEX idx_unique_email ON newsletter FIELDS email UNIQUE;");
  yield* Console.log("  • All other fields and constraints");
});

/**
 * Example: Modifying existing fields
 */
const exampleModifyField = Effect.gen(function* (_) {
  yield* Console.log("🔧 Example: Modifying Existing Fields");
  yield* Console.log("====================================");
  yield* Console.log("");
  yield* Console.log("To add a field to user table, modify schema-definitions.ts:");
  yield* Console.log("");
  yield* Console.log("// Add to userTable fields array:");
  yield* Console.log("SurrealField.string('phone_number')");
  yield* Console.log("  .optional()");
  yield* Console.log("  .withDescription('User phone number'),");
  yield* Console.log("");
  yield* Console.log("Then run: bun auto-migrate.ts generate add_user_phone");
  yield* Console.log("");
  yield* Console.log("Generated migration would include:");
  yield* Console.log("  • DEFINE FIELD phone_number ON user TYPE string COMMENT 'User phone number';");
  yield* Console.log("");
  yield* Console.log("⚠️  Existing indexes (idx_user_email, etc.) remain untouched!");
});

// ===========================================
// Main CLI Handler
// ===========================================

const main = Effect.gen(function* (_) {
  const command = process.argv[2];
  
  switch (command) {
    case "generate":
      yield* generateMigrationFromSchema;
      break;
      
    case "diff":
      yield* showSchemaDiff;
      break;
      
    case "status":
      yield* showSchemaStatus;
      break;
      
    case "workflow":
      yield* developmentWorkflow;
      break;
      
    case "example-add-table":
      yield* exampleAddTable;
      break;
      
    case "example-modify":
      yield* exampleModifyField;
      break;
      
    default:
      yield* showUsage;
      break;
  }
});

// ===========================================
// Enhanced Workflow Documentation
// ===========================================

const documentWorkflow = Effect.gen(function* (_) {
  yield* Console.log("📚 Enhanced Schema Workflow");
  yield* Console.log("===========================");
  yield* Console.log("");
  yield* Console.log("🎯 The Problem:");
  yield* Console.log("  ❌ Manual migration writing is error-prone");
  yield* Console.log("  ❌ Hard to track what changed between versions");
  yield* Console.log("  ❌ Rebuilding indexes unnecessarily");
  yield* Console.log("  ❌ Inconsistent migration quality");
  yield* Console.log("");
  yield* Console.log("✅ The Solution:");
  yield* Console.log("  1. Define schemas in TypeScript (schema-definitions.ts)");
  yield* Console.log("  2. Tool compares current vs previous schema");
  yield* Console.log("  3. Automatically generates optimized migrations");
  yield* Console.log("  4. Only creates/modifies what actually changed");
  yield* Console.log("  5. Preserves existing indexes and data");
  yield* Console.log("");
  yield* Console.log("🔄 Workflow:");
  yield* Console.log("  1. git pull origin main");
  yield* Console.log("  2. Modify schema-definitions.ts");
  yield* Console.log("  3. bun auto-migrate.ts generate my_feature");
  yield* Console.log("  4. Review generated migration");
  yield* Console.log("  5. npm run db:apply");
  yield* Console.log("  6. Test changes");
  yield* Console.log("  7. git add . && git commit");
  yield* Console.log("");
  yield* Console.log("🚀 Benefits:");
  yield* Console.log("  ✅ Zero index rebuilds for new fields");
  yield* Console.log("  ✅ Type-safe schema definitions");
  yield* Console.log("  ✅ Automatic rollback generation");
  yield* Console.log("  ✅ Clear change tracking");
  yield* Console.log("  ✅ Team collaboration friendly");
});

// Run CLI
if (import.meta.main) {
  Effect.runPromise(
    main.pipe(
      Effect.provide(MigrationGenerator.Default)
    )
  ).catch(console.error);
}