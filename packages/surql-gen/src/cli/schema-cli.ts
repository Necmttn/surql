#!/usr/bin/env bun

import { parseArgs } from "node:util";
import { Console, Effect } from "effect";
import { SchemaComparator } from "../lib/comparison/diff";
import { MigrationGenerator } from "../lib/migration/generator";
import { SurrealField } from "../lib/schema/field";
import { SurrealIndex } from "../lib/schema/index-def";
import { SurrealSchema } from "../lib/schema/schema";
import { SurrealTable } from "../lib/schema/table";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

// CLI commands using Node.js parseArgs (built into Bun)
const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  allowPositionals: true,
  options: {
    help: { type: "boolean", short: "h" },
    version: { type: "boolean", short: "v" },
    name: { type: "string", short: "n" },
    output: { type: "string", short: "o" },
    schema: { type: "string", short: "s" },
    migration: { type: "string", short: "m" },
    history: { type: "string" },
    force: { type: "boolean" },
  },
});

const command = positionals[0];
const subcommand = positionals[1];

// Version info
const VERSION = "1.0.0";

// Help text
const HELP_TEXT = `
SurrealDB Code-First Schema Manager v${VERSION}

USAGE:
  surql-schema <command> [options]

COMMANDS:
  migrate     Automatic migration generation from schema changes
  status      Show migration status
  generate    Generate a new schema file
  help        Show this help message

MIGRATION COMMANDS:
  migrate generate <name>  Generate migration from schema changes
  migrate status           Show current migration status

OPTIONS:
  -h, --help              Show help
  -v, --version           Show version
  -n, --name <name>       Schema/project name
  -o, --output <file>     Output file
  -s, --schema <file>     Schema file (default: schema.ts)
  -m, --migration <file>  Migration output file
  --history <file>        Schema history file
  --force                 Force operation

EXAMPLES:
  surql-schema migrate generate add_user_phone
  surql-schema migrate status
  surql-schema generate -n blog-schema -o blog.surql

For more information, visit: https://github.com/necmttn/surql-schema
`;

// ===========================================
// Schema Types
// ===========================================

interface SchemaVersion {
  version: string;
  tables: any[];
  timestamp: string;
  description: string;
}

// ===========================================
// Helper Functions
// ===========================================

const loadPreviousSchema = (historyFile: string): SchemaVersion | null => {
  if (!existsSync(historyFile)) {
    return null;
  }
  try {
    const history = JSON.parse(readFileSync(historyFile, "utf-8"));
    return history.length > 0 ? history[history.length - 1] : null;
  } catch {
    return null;
  }
};

const saveSchemaVersion = (schemaVersion: SchemaVersion, historyFile: string) => {
  let history: SchemaVersion[] = [];
  if (existsSync(historyFile)) {
    try {
      history = JSON.parse(readFileSync(historyFile, "utf-8"));
    } catch {
      history = [];
    }
  }
  history.push(schemaVersion);
  writeFileSync(historyFile, JSON.stringify(history, null, 2));
};

// ===========================================
// Migration Commands
// ===========================================

const migrateGenerateCommand = async (options: typeof values) => {
  const program = Effect.gen(function* (_) {
    const migrationName = positionals[2] || "auto_generated";
    const schemaFile = options.schema || "schema.ts";
    const migrationsDir = "./migrations";
    const historyFile = join(migrationsDir, "schema-history.json");

    yield* Console.log(`🔄 Generating migration: ${migrationName}`);
    yield* Console.log(`📄 Schema file: ${schemaFile}`);

    // Create example schema to demonstrate the functionality
    const currentSchema = SurrealSchema
      .create("example", "1.1.0")
      .addTable(
        SurrealTable.create("user", [
          SurrealField.id("user"),
          SurrealField.string("username").unique(),
          SurrealField.string("email").unique(),
          SurrealField.string("phone_number").optional(), // New field for demo
        ])
      );

    const currentSchemaVersion: SchemaVersion = {
      version: currentSchema.getVersion(),
      tables: currentSchema.getTables().map(t => ({
        name: t.getName(),
        fields: t.getFields().map(f => ({
          name: f.getName(),
          type: f.getType(),
          constraints: f.getConstraints(),
          description: f.getDescription(),
        }))
      })),
      timestamp: new Date().toISOString(),
      description: "Current schema state",
    };

    const previousSchema = loadPreviousSchema(historyFile);
    
    if (!previousSchema) {
      yield* Console.log("📦 No previous schema found - generating initial migration");
      
      const migration = MigrationGenerator.generateMigration(
        SchemaComparator.compare(
          SurrealSchema.create("empty", "0.0.0"),
          currentSchema
        ),
        migrationName,
        "Initial schema setup"
      );

      const migrationFile = MigrationGenerator.generateMigrationFile(migration);
      const migrationPath = join(migrationsDir, `${Date.now()}_${migrationName}.sql`);
      
      // Ensure migrations directory exists
      if (!existsSync(migrationsDir)) {
        yield* Effect.promise(() => Bun.write(join(migrationsDir, ".gitkeep"), ""));
      }
      
      yield* Effect.promise(() => Bun.write(migrationPath, migrationFile));
      saveSchemaVersion(currentSchemaVersion, historyFile);
      
      yield* Console.log(`✅ Initial migration generated: ${migrationPath}`);
      return;
    }

    yield* Console.log(`📊 Comparing schema v${previousSchema.version} → v${currentSchemaVersion.version}`);

    const oldSchema = SurrealSchema.create("previous", previousSchema.version);
    const newSchema = currentSchema;

    const diff = SchemaComparator.compare(oldSchema, newSchema);
    
    if (!diff.hasChanges) {
      yield* Console.log("✅ No schema changes detected");
      return;
    }

    const migration = MigrationGenerator.generateMigration(
      diff,
      migrationName,
      `Migration from ${previousSchema.version} to ${currentSchemaVersion.version}`
    );

    const migrationFile = MigrationGenerator.generateMigrationFile(migration);
    const migrationPath = join(migrationsDir, `${Date.now()}_${migrationName}.sql`);
    
    yield* Effect.promise(() => Bun.write(migrationPath, migrationFile));
    saveSchemaVersion(currentSchemaVersion, historyFile);

    yield* Console.log(`✅ Migration generated: ${migrationPath}`);
    yield* Console.log(`📋 Operations: ${migration.statements.length}`);
    
    for (const statement of migration.statements) {
      yield* Console.log(`   • ${statement.description}`);
    }
  });

  await Effect.runPromise(program);
};

const migrateStatusCommand = async (options: typeof values) => {
  const program = Effect.gen(function* (_) {
    const historyFile = options.history || "./migrations/schema-history.json";
    
    yield* Console.log("📊 Migration Status");
    yield* Console.log("==================");
    
    if (!existsSync(historyFile)) {
      yield* Console.log("❌ No migration history found");
      yield* Console.log("   Run 'surql-schema migrate generate <name>' to create your first migration");
      return;
    }

    const history = JSON.parse(readFileSync(historyFile, "utf-8"));
    const latest = history[history.length - 1];
    
    yield* Console.log(`Current Version: ${latest.version}`);
    yield* Console.log(`Total Migrations: ${history.length}`);
    yield* Console.log(`Last Updated: ${latest.timestamp}`);
    yield* Console.log(`Description: ${latest.description}`);
    yield* Console.log("");
    
    yield* Console.log("Migration History:");
    for (let i = history.length - 1; i >= 0; i--) {
      const migration = history[i];
      const prefix = i === history.length - 1 ? "→ " : "  ";
      yield* Console.log(`${prefix}v${migration.version} (${migration.timestamp})`);
    }
  });

  await Effect.runPromise(program);
};

const migrateCommand = async (options: typeof values) => {
  const action = subcommand;
  
  switch (action) {
    case "generate":
      await migrateGenerateCommand(options);
      break;
    case "status":
      await migrateStatusCommand(options);
      break;
    default:
      console.log("Unknown migrate command. Use: generate or status");
      break;
  }
};

// ===========================================
// Generate Command (Existing)
// ===========================================

const generateCommand = async (options: typeof values) => {
  const program = Effect.gen(function* () {
    const name = options.name || "generated-schema";
    const output = options.output || "schema.surql";

    yield* Console.log(`🏗️  Generating schema: ${name}`);

    const userTable = SurrealTable
      .create("user", [
        SurrealField.id("user"),
        SurrealField.string("username").unique().length(50),
        SurrealField.string("email").unique().pattern("^[^@]+@[^@]+\\.[^@]+$"),
        SurrealField.boolean("is_active").default("true"),
        SurrealField.datetime("created_at").default("time::now()"),
      ])
      .withDescription("User accounts table")
      .schemafull();

    const schema = SurrealSchema
      .create(name, "1.0.0")
      .withDescription(`Generated schema for ${name}`)
      .addTable(userTable)
      .addIndex(SurrealIndex.unique("idx_user_email", "user", ["email"]))
      .addIndex(SurrealIndex.unique("idx_user_username", "user", ["username"]));

    const surrealQL = schema.toSurrealQL();

    yield* Effect.promise(() => Bun.write(output, surrealQL));

    yield* Console.log(`✅ Schema generated successfully: ${output}`);
    yield* Console.log(`   📊 Tables: ${schema.getTables().length}`);
    yield* Console.log(`   🔍 Indexes: ${schema.getIndexes().length}`);
    yield* Console.log(`   ⚡ Events: ${schema.getEvents().length}`);
    yield* Console.log(`   📝 Size: ${surrealQL.length} characters`);
  });

  await Effect.runPromise(program);
};

// ===========================================
// Main CLI Dispatcher
// ===========================================

async function main() {
  if (values.help) {
    console.log(HELP_TEXT);
    process.exit(0);
  }
  
  if (values.version) {
    console.log(`v${VERSION}`);
    process.exit(0);
  }

  switch (command) {
    case "migrate":
      await migrateCommand(values);
      break;
    case "status":
      await migrateStatusCommand(values);
      break;
    case "generate":
      await generateCommand(values);
      break;
    case undefined:
      console.log("SurrealDB Code-First Schema Manager");
      console.log("Use --help to see available commands");
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.log("Use --help to see available commands");
      process.exit(1);
  }
}

if (import.meta.main) {
  await main();
}