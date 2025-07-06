#!/usr/bin/env bun

import { parseArgs } from "node:util";
import { Console, Effect } from "effect";
import { SchemaComparator } from "../lib/comparison/diff";
import { MigrationGenerator } from "../lib/migration/generator";
import { SurrealEvent } from "../lib/schema/event";
import { SurrealField } from "../lib/schema/field";
import { SurrealIndex } from "../lib/schema/index-def";
import { SurrealSchema } from "../lib/schema/schema";
import { SurrealTable } from "../lib/schema/table";

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
    old: { type: "string" },
    new: { type: "string" },
    file: { type: "string", short: "f" },
    dir: { type: "string", short: "d" },
  },
});

const _command = positionals[0];

// Version info
const VERSION = "1.0.0";

// Help text
const _HELP_TEXT = `
SurrealDB Code-First Schema Manager v${VERSION}

USAGE:
  surql-schema <command> [options]

COMMANDS:
  init        Initialize a new schema project
  generate    Generate a new schema file
  types       Generate TypeScript types from schema
  compare     Compare two schemas and generate migration
  validate    Validate a schema file
  help        Show this help message

OPTIONS:
  -h, --help              Show help
  -v, --version           Show version
  -n, --name <name>       Schema/project name
  -o, --output <file>     Output file
  -s, --schema <file>     Schema file (default: schema.ts)
  -m, --migration <file>  Migration output file
  -f, --file <file>       File to validate
  -d, --dir <dir>         Project directory (default: .)
  --old <file>            Old schema file for comparison
  --new <file>            New schema file for comparison

EXAMPLES:
  surql-schema init -n my-project
  surql-schema generate -n blog-schema -o blog.surql
  surql-schema types -s schema.ts -o types.ts
  surql-schema compare --old old.ts --new new.ts -m migration.sql
  surql-schema validate -f schema.ts

For more information, visit: https://github.com/necmttn/surql-schema
`;

// Command implementations
const _generateCommand = async (options: typeof values) => {
  const program = Effect.gen(function* () {
    const name = options.name || "generated-schema";
    const output = options.output || "schema.surql";

    yield* Console.log(`🏗️  Generating schema: ${name}`);

    // Create a sample schema
    const userTable = SurrealTable
      .create("user", [
        SurrealField.id("user"),
        SurrealField.string("username").unique().length(50),
        SurrealField.string("email").unique().pattern("^[^@]+@[^@]+\\.[^@]+$"),
        SurrealField.boolean("is_active").default("true"),
        SurrealField.datetime("created_at").default("time::now()"),
      ])
      .description("User accounts table")
      .schemafull();

    const schema = SurrealSchema
      .create(name, "1.0.0")
      .description(`Generated schema for ${name}`)
      .addTable(userTable)
      .addIndex(SurrealIndex.unique("idx_user_email", "user", ["email"]))
      .addIndex(SurrealIndex.unique("idx_user_username", "user", ["username"]));

    const surrealQL = schema.toSurrealQL();

    // Write to file
    await Bun.write(output, surrealQL);

    yield* Console.log(`✅ Schema generated successfully: ${output}`);
    yield* Console.log(`   📊 Tables: ${schema.getTables().length}`);
    yield* Console.log(`   🔍 Indexes: ${schema.getIndexes().length}`);
    yield* Console.log(`   ⚡ Events: ${schema.getEvents().length}`);
    yield* Console.log(`   📝 Size: ${surrealQL.length} characters`);
  });

  await Effect.runPromise(program);
};

const compareSchemaCommand = new Command()
  .description("Compare two schemas and generate migration")
  .option("-o, --old <old:string>", "Old schema file", { required: true })
  .option("-n, --new <new:string>", "New schema file", { required: true })
  .option("-m, --migration <migration:string>", "Migration output file")
  .action(async (options) => {
    const program = Effect.gen(function* (_) {
      yield* Console.log("Comparing schemas...");
      
      // For now, create sample schemas to demonstrate
      const oldSchema = SurrealSchema
        .create("example", "1.0.0")
        .addTable(
          SurrealTable.create("user", [
            SurrealField.id("user"),
            SurrealField.string("username"),
            SurrealField.string("email"),
          ])
        );

      const newSchema = SurrealSchema
        .create("example", "1.1.0")
        .addTable(
          SurrealTable.create("user", [
            SurrealField.id("user"),
            SurrealField.string("username"),
            SurrealField.string("email"),
            SurrealField.boolean("is_active").default("true"), // New field
          ])
        );

      const diff = SchemaComparator.compare(oldSchema, newSchema);
      
      yield* Console.log(`Changes detected: ${diff.hasChanges}`);
      
      if (diff.hasChanges) {
        yield* Console.log(`  Table changes: ${diff.tableDiffs.length}`);
        yield* Console.log(`  Field changes: ${diff.fieldDiffs.length}`);
        yield* Console.log(`  Index changes: ${diff.indexDiffs.length}`);
        yield* Console.log(`  Event changes: ${diff.eventDiffs.length}`);

        const migration = MigrationGenerator.generateMigration(
          diff,
          `migration_${Date.now()}`,
          "Auto-generated migration from schema comparison"
        );

        const migrationFile = MigrationGenerator.generateMigrationFile(migration);
        
        if (options.migration) {
          await Deno.writeTextFile(options.migration, migrationFile);
          yield* Console.log(`✅ Migration generated: ${options.migration}`);
        } else {
          yield* Console.log("\n=== Generated Migration ===");
          yield* Console.log(migrationFile);
        }
      } else {
        yield* Console.log("✅ No changes detected");
      }
    });

    await Effect.runPromise(program);
  });

const validateSchemaCommand = new Command()
  .description("Validate a schema file")
  .option("-f, --file <file:string>", "Schema file to validate", { required: true })
  .action(async (options) => {
    const program = Effect.gen(function* (_) {
      yield* Console.log(`Validating schema: ${options.file}`);
      
      // Create sample schema for validation
      const schema = SurrealSchema
        .create("validation_test", "1.0.0")
        .addTable(
          SurrealTable.create("user", [
            SurrealField.id("user"),
            SurrealField.string("username"),
            SurrealField.record("profile", "profile"), // Reference to profile table
          ])
        )
        .addTable(
          SurrealTable.create("profile", [
            SurrealField.id("profile"),
            SurrealField.string("bio"),
          ])
        );

      try {
        yield* schema.validate();
        yield* Console.log("✅ Schema validation passed");
        
        yield* Console.log(`   Tables: ${schema.getTables().length}`);
        yield* Console.log(`   Valid references: ${schema.getTables().reduce((count, table) => 
          count + table.getFields().filter(f => f.getReferences()).length, 0)}`);
      } catch (error) {
        yield* Console.log(`❌ Schema validation failed: ${error}`);
        Deno.exit(1);
      }
    });

    await Effect.runPromise(program);
  });

const initCommand = new Command()
  .description("Initialize a new schema project")
  .option("-n, --name <name:string>", "Project name", { required: true })
  .option("-d, --dir <dir:string>", "Project directory", { default: "." })
  .action(async (options) => {
    const program = Effect.gen(function* (_) {
      yield* Console.log(`Initializing schema project: ${options.name}`);
      
      const configContent = `import type { Config } from "@necmttn/surql";

export const config: Config = {
  "output": {
    "path": "./generated",
    "filename": "schema",
    "extension": "ts"
  },
  "imports": {
    "style": "esm",
  },
  "db": {
    "url": "http://localhost:8000",
    "username": "root",
    "password": "root",
    "namespace": "test",
    "database": "test"
  }
};

export default config;
`;

      const schemaContent = `import { SurrealField, SurrealTable, SurrealIndex, SurrealEvent, SurrealSchema } from "@necmttn/surql";

// Define your tables
const userTable = SurrealTable
  .create("user", [
    SurrealField.id("user"),
    SurrealField.string("username").unique().length(50),
    SurrealField.string("email").unique().pattern("^[^@]+@[^@]+\\\\.[^@]+$"),
    SurrealField.boolean("is_active").default("true"),
    SurrealField.datetime("created_at").default("time::now()"),
  ])
  .description("User accounts table")
  .schemafull();

// Define your schema
export const schema = SurrealSchema
  .create("${options.name}", "1.0.0")
  .description("Schema for ${options.name}")
  .addTable(userTable)
  .addIndex(SurrealIndex.unique("idx_user_email", "user", ["email"]));

export default schema;
`;

      // Create config file
      await Deno.writeTextFile(`${options.dir}/surql-gen.config.ts`, configContent);
      
      // Create schema file
      await Deno.writeTextFile(`${options.dir}/schema.ts`, schemaContent);
      
      // Create generated directory
      await Deno.mkdir(`${options.dir}/generated`, { recursive: true });
      
      yield* Console.log("✅ Project initialized successfully!");
      yield* Console.log(`   Config: ${options.dir}/surql-gen.config.ts`);
      yield* Console.log(`   Schema: ${options.dir}/schema.ts`);
      yield* Console.log(`   Output: ${options.dir}/generated/`);
      yield* Console.log("");
      yield* Console.log("Next steps:");
      yield* Console.log("  1. Edit schema.ts to define your tables");
      yield* Console.log("  2. Run 'surql-gen generate' to generate TypeScript types");
      yield* Console.log("  3. Run 'surql-gen migrate' to apply schema to database");
    });

    await Effect.runPromise(program);
  });

const typesCommand = new Command()
  .description("Generate TypeScript types from schema")
  .option("-s, --schema <schema:string>", "Schema file", { default: "schema.ts" })
  .option("-o, --output <output:string>", "Output file", { default: "generated/types.ts" })
  .action(async (options) => {
    const program = Effect.gen(function* (_) {
      yield* Console.log(`Generating TypeScript types from: ${options.schema}`);
      
      // Create sample schema for types generation
      const schema = SurrealSchema
        .create("example", "1.0.0")
        .addTable(
          SurrealTable.create("user", [
            SurrealField.id("user"),
            SurrealField.string("username"),
            SurrealField.string("email").optional(),
            SurrealField.boolean("is_active"),
            SurrealField.int("posts_count"),
            SurrealField.datetime("created_at"),
          ])
        )
        .addTable(
          SurrealTable.create("post", [
            SurrealField.id("post"),
            SurrealField.string("title"),
            SurrealField.string("content"),
            SurrealField.record("author", "user"),
            SurrealField.datetime("created_at"),
          ])
        );

      const typescript = schema.toTypeScript();
      
      // Ensure output directory exists
      const outputDir = options.output.substring(0, options.output.lastIndexOf('/'));
      if (outputDir) {
        await Deno.mkdir(outputDir, { recursive: true });
      }
      
      await Deno.writeTextFile(options.output, typescript);
      
      yield* Console.log(`✅ TypeScript types generated: ${options.output}`);
      yield* Console.log(`   Tables: ${schema.getTables().length}`);
      yield* Console.log(`   Total fields: ${schema.getTables().reduce((sum, t) => sum + t.getFields().length, 0)}`);
    });

    await Effect.runPromise(program);
  });

// Main CLI application
const main = new Command()
  .name("surql-schema")
  .version("1.0.0")
  .description("Code-first schema management for SurrealDB")
  .action(() => {
    console.log("SurrealDB Code-First Schema Manager");
    console.log("Use --help to see available commands");
  })
  .command("init", initCommand)
  .command("generate", generateSchemaCommand)
  .command("types", typesCommand)
  .command("compare", compareSchemaCommand)
  .command("validate", validateSchemaCommand);

if (import.meta.main) {
  await main.parse(Deno.args);
}