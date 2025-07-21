/**
 * Schema Migration Workflow
 * 
 * This demonstrates the proper way to handle schema changes:
 * ✅ Generate migrations for only what changed
 * ✅ Apply incremental changes without rebuilding indexes
 * ✅ Track migration history
 * ✅ Iterate safely in development
 */

import { Effect, Console } from "effect";
import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

// Migration tracking
interface Migration {
  id: string;
  name: string;
  timestamp: Date;
  applied: boolean;
  sql: string;
  rollback?: string;
}

class SchemaManager extends Effect.Service<SchemaManager>()("SchemaManager", {
  effect: Effect.gen(function* (_) {
    const migrationsDir = "./src/migrations";
    const migrationHistoryFile = "./src/migrations/history.json";

    // Ensure migrations directory exists
    if (!existsSync(migrationsDir)) {
      mkdirSync(migrationsDir, { recursive: true });
    }

    // Load migration history
    const loadMigrationHistory = (): Migration[] => {
      if (!existsSync(migrationHistoryFile)) {
        return [];
      }
      try {
        return JSON.parse(readFileSync(migrationHistoryFile, "utf-8"));
      } catch {
        return [];
      }
    };

    // Save migration history
    const saveMigrationHistory = (migrations: Migration[]) => {
      writeFileSync(migrationHistoryFile, JSON.stringify(migrations, null, 2));
    };

    /**
     * Generate schema from current database state
     * This is our "baseline" for comparison
     */
    const exportCurrentSchema = Effect.fn("schema.exportCurrent")(function* () {
      yield* Console.log("📤 Exporting current database schema...");
      
      try {
        // Use surql-gen CLI to export current schema
        const result = execSync(
          "npx @necmttn/surql-schema export-schema --output ./src/migrations/current-schema.surql",
          { encoding: "utf-8", cwd: process.cwd() }
        );
        
        yield* Console.log("✅ Current schema exported to migrations/current-schema.surql");
        return result;
      } catch (error) {
        yield* Effect.fail(new Error(`Failed to export schema: ${error}`));
      }
    });

    /**
     * Compare schema files and generate migration
     * This only creates changes for what actually changed
     */
    const generateMigration = Effect.fn("schema.generateMigration")(function* (
      name: string,
      targetSchemaFile: string
    ) {
      yield* Console.log(`🔄 Generating migration: ${name}`);

      const currentSchemaFile = "./src/migrations/current-schema.surql";
      
      if (!existsSync(currentSchemaFile)) {
        yield* Console.log("⚠️  No current schema found, exporting from database...");
        yield* exportCurrentSchema();
      }

      try {
        // Use surql-gen CLI to compare schemas and generate migration
        const migrationId = `${Date.now()}_${name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
        const migrationFile = `./src/migrations/${migrationId}.surql`;
        
        const result = execSync(
          `npx @necmttn/surql-schema diff --from ${currentSchemaFile} --to ${targetSchemaFile} --output ${migrationFile}`,
          { encoding: "utf-8", cwd: process.cwd() }
        );

        // Check if migration file was created and has content
        if (existsSync(migrationFile)) {
          const migrationContent = readFileSync(migrationFile, "utf-8").trim();
          
          if (migrationContent.length === 0 || migrationContent === "-- No changes detected") {
            yield* Console.log("✅ No schema changes detected - no migration needed");
            return null;
          }

          // Add migration to history
          const migration: Migration = {
            id: migrationId,
            name,
            timestamp: new Date(),
            applied: false,
            sql: migrationContent,
          };

          const history = loadMigrationHistory();
          history.push(migration);
          saveMigrationHistory(history);

          yield* Console.log(`✅ Migration generated: ${migrationFile}`);
          yield* Console.log("📋 Migration contains:");
          yield* Console.log(migrationContent);
          
          return migration;
        } else {
          yield* Console.log("✅ No changes detected - no migration needed");
          return null;
        }
      } catch (error) {
        yield* Effect.fail(new Error(`Failed to generate migration: ${error}`));
      }
    });

    /**
     * Apply pending migrations
     * This only runs the changes, not the entire schema
     */
    const applyMigrations = Effect.fn("schema.applyMigrations")(function* () {
      const history = loadMigrationHistory();
      const pendingMigrations = history.filter(m => !m.applied);

      if (pendingMigrations.length === 0) {
        yield* Console.log("✅ No pending migrations to apply");
        return;
      }

      yield* Console.log(`📦 Applying ${pendingMigrations.length} pending migration(s)...`);

      for (const migration of pendingMigrations) {
        yield* Console.log(`🔄 Applying migration: ${migration.name} (${migration.id})`);
        
        try {
          // Apply the migration to the database
          const result = execSync(
            `npx @necmttn/surql-schema exec --file ./src/migrations/${migration.id}.surql`,
            { encoding: "utf-8", cwd: process.cwd() }
          );

          // Mark as applied
          migration.applied = true;
          
          yield* Console.log(`✅ Applied migration: ${migration.name}`);
        } catch (error) {
          yield* Effect.fail(new Error(`Failed to apply migration ${migration.id}: ${error}`));
        }
      }

      // Save updated history
      saveMigrationHistory(history);
      yield* Console.log("✅ All migrations applied successfully");
      
      // Update current schema baseline
      yield* exportCurrentSchema();
    });

    /**
     * Rollback last migration
     */
    const rollbackLastMigration = Effect.fn("schema.rollbackLast")(function* () {
      const history = loadMigrationHistory();
      const lastApplied = history.filter(m => m.applied).pop();

      if (!lastApplied) {
        yield* Console.log("❌ No migrations to rollback");
        return;
      }

      if (!lastApplied.rollback) {
        yield* Effect.fail(new Error(`Migration ${lastApplied.id} has no rollback script`));
      }

      yield* Console.log(`🔄 Rolling back migration: ${lastApplied.name}`);

      try {
        // Create temporary rollback file
        const rollbackFile = `./src/migrations/rollback_${lastApplied.id}.surql`;
        writeFileSync(rollbackFile, lastApplied.rollback!);

        // Apply rollback
        execSync(
          `npx @necmttn/surql-schema exec --file ${rollbackFile}`,
          { encoding: "utf-8", cwd: process.cwd() }
        );

        // Mark as not applied
        lastApplied.applied = false;
        saveMigrationHistory(history);

        yield* Console.log(`✅ Rolled back migration: ${lastApplied.name}`);
        
        // Update current schema baseline
        yield* exportCurrentSchema();
      } catch (error) {
        yield* Effect.fail(new Error(`Failed to rollback migration: ${error}`));
      }
    });

    /**
     * Show migration status
     */
    const showStatus = Effect.fn("schema.status")(function* () {
      const history = loadMigrationHistory();
      
      yield* Console.log("📊 Migration Status:");
      yield* Console.log("==================");
      
      if (history.length === 0) {
        yield* Console.log("No migrations found");
        return;
      }

      for (const migration of history) {
        const status = migration.applied ? "✅ Applied" : "⏳ Pending";
        const timestamp = migration.timestamp.toISOString().split('T')[0];
        yield* Console.log(`${status} | ${timestamp} | ${migration.name} (${migration.id})`);
      }

      const applied = history.filter(m => m.applied).length;
      const pending = history.filter(m => !m.applied).length;
      
      yield* Console.log("==================");
      yield* Console.log(`Applied: ${applied}, Pending: ${pending}, Total: ${history.length}`);
    });

    /**
     * Development workflow: iterate schema changes safely
     */
    const iterate = Effect.fn("schema.iterate")(function* (
      name: string,
      schemaChanges: string
    ) {
      yield* Console.log(`🔄 Starting schema iteration: ${name}`);
      
      // 1. Write changes to a temporary schema file
      const tempSchemaFile = `./src/migrations/temp_${name.replace(/[^a-z0-9]/gi, "_")}.surql`;
      writeFileSync(tempSchemaFile, schemaChanges);
      
      // 2. Generate migration from changes
      const migration = yield* generateMigration(name, tempSchemaFile);
      
      if (!migration) {
        yield* Console.log("✅ No changes detected - schema is up to date");
        return;
      }
      
      // 3. Apply the migration immediately (development mode)
      yield* applyMigrations();
      
      yield* Console.log(`✅ Schema iteration complete: ${name}`);
    });

    return {
      exportCurrentSchema,
      generateMigration,
      applyMigrations,
      rollbackLastMigration,
      showStatus,
      iterate,
    };
  }),
}) {}

// ===========================================
// Example Usage Scripts
// ===========================================

/**
 * Add a new column without rebuilding indexes
 */
export const addColumnExample = Effect.gen(function* (_) {
  const schemaManager = yield* SchemaManager;
  
  // New schema change: add social_media_links to user table
  const schemaChange = `
-- Add social media links to user (incremental change)
DEFINE FIELD social_media_links ON user TYPE object DEFAULT {};
DEFINE FIELD last_active ON user TYPE datetime DEFAULT time::now();
`;

  yield* schemaManager.iterate("add_user_social_fields", schemaChange);
});

/**
 * Add a new index (will only create the new index)
 */
export const addIndexExample = Effect.gen(function* (_) {
  const schemaManager = yield* SchemaManager;
  
  const schemaChange = `
-- Add new search index without affecting existing indexes
DEFINE INDEX idx_post_content_search ON post FIELDS content SEARCH ANALYZER simple BM25 HIGHLIGHTS;
DEFINE INDEX idx_user_last_active ON user FIELDS last_active;
`;

  yield* schemaManager.iterate("add_search_indexes", schemaChange);
});

/**
 * Development workflow example
 */
export const developmentWorkflow = Effect.gen(function* (_) {
  const schemaManager = yield* SchemaManager;
  
  yield* Console.log("🚀 Starting development workflow...");
  
  // Show current migration status
  yield* schemaManager.showStatus();
  
  // Apply any pending migrations
  yield* schemaManager.applyMigrations();
  
  // Make a schema change
  yield* addColumnExample;
  
  // Show updated status
  yield* schemaManager.showStatus();
});

/**
 * Production deployment workflow
 */
export const productionDeploy = Effect.gen(function* (_) {
  const schemaManager = yield* SchemaManager;
  
  yield* Console.log("🚀 Production deployment workflow...");
  
  // 1. Show what will be applied
  yield* schemaManager.showStatus();
  
  // 2. Apply migrations (only the changes)
  yield* schemaManager.applyMigrations();
  
  yield* Console.log("✅ Production deployment complete");
});

// ===========================================
// CLI Interface
// ===========================================

if (import.meta.main) {
  const command = process.argv[2];
  
  const program = Effect.gen(function* (_) {
    switch (command) {
      case "status":
        yield* SchemaManager.pipe(Effect.flatMap(sm => sm.showStatus()));
        break;
      case "apply":
        yield* SchemaManager.pipe(Effect.flatMap(sm => sm.applyMigrations()));
        break;
      case "rollback":
        yield* SchemaManager.pipe(Effect.flatMap(sm => sm.rollbackLastMigration()));
        break;
      case "export":
        yield* SchemaManager.pipe(Effect.flatMap(sm => sm.exportCurrentSchema()));
        break;
      case "dev":
        yield* developmentWorkflow;
        break;
      case "deploy":
        yield* productionDeploy;
        break;
      case "add-column":
        yield* addColumnExample;
        break;
      case "add-index":
        yield* addIndexExample;
        break;
      default:
        yield* Console.log("Usage:");
        yield* Console.log("  bun schema-workflow.ts status     - Show migration status");
        yield* Console.log("  bun schema-workflow.ts apply      - Apply pending migrations");
        yield* Console.log("  bun schema-workflow.ts rollback   - Rollback last migration");
        yield* Console.log("  bun schema-workflow.ts export     - Export current schema");
        yield* Console.log("  bun schema-workflow.ts dev        - Development workflow");
        yield* Console.log("  bun schema-workflow.ts deploy     - Production deployment");
        yield* Console.log("  bun schema-workflow.ts add-column - Example: add column");
        yield* Console.log("  bun schema-workflow.ts add-index  - Example: add index");
    }
  });

  Effect.runPromise(program).catch(console.error);
}