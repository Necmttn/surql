#!/usr/bin/env bun

import { writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { Console, Effect } from "effect";
import { Surreal } from "surrealdb";
import { SchemaComparator } from "./src/lib/comparison/diff";
import { MigrationGenerator } from "./src/lib/migration/generator";
import { MigrationJournalService } from "./src/lib/migration/journal";
import { SurrealEvent } from "./src/lib/schema/event";
import { SurrealField } from "./src/lib/schema/field";
import { SurrealIndex } from "./src/lib/schema/index-def";
import { SurrealSchema } from "./src/lib/schema/schema";
import { SurrealTable } from "./src/lib/schema/table";

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
    url: { type: "string", short: "u" },
    namespace: { type: "string" },
    database: { type: "string" },
    username: { type: "string" },
    password: { type: "string" },
  },
});

const command = positionals[0];

// Version info
const VERSION = "1.0.0";

// Help text
const HELP_TEXT = `
🎯 SurrealDB Code-First Schema Manager v${VERSION}

USAGE:
  bun bun-cli.ts <command> [options]

COMMANDS:
  init        Initialize a new schema project
  generate    Generate a new schema file
  types       Generate TypeScript types from schema
  compare     Compare two schemas and generate migration
  migrate     Generate and track migration with journal
  validate    Validate a schema file
  pull        Pull schema from remote SurrealDB and construct with AI metadata
  demo        Run complete demonstration
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
  -u, --url <url>         SurrealDB URL for pull command
  --namespace <ns>        SurrealDB namespace
  --database <db>         SurrealDB database
  --username <user>       SurrealDB username
  --password <pass>       SurrealDB password

EXAMPLES:
  bun bun-cli.ts init -n my-project
  bun bun-cli.ts generate -n blog-schema -o blog.surql
  bun bun-cli.ts types -s schema.ts -o types.ts
  bun bun-cli.ts compare --old old.ts --new new.ts -m migration.sql
  bun bun-cli.ts validate -f schema.ts
  bun bun-cli.ts pull -u http://localhost:8000 --namespace test --database test
  bun bun-cli.ts demo

For more information, visit: https://github.com/necmttn/surql-schema
`;

// Command implementations
const initCommand = async (options: typeof values) => {
  const program = Effect.gen(function* () {
    const name = options.name || "my-schema";
    const dir = options.dir || ".";

    yield* Console.log(`🚀 Initializing schema project: ${name}`);

    const packageContent = `{
  "name": "${name}",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "effect": "^3.10.0",
    "surrealdb": "^1.0.0"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.6.0"
  },
  "scripts": {
    "dev": "bun schema.ts",
    "build": "bun build schema.ts --outdir dist",
    "types": "bun generate-types.ts"
  }
}`;

    const schemaContent = `import {
  SurrealField,
  SurrealTable,
  SurrealIndex,
  SurrealEvent,
  SurrealSchema
} from "@necmttn/surql-schema";

// Define your tables
const userTable = SurrealTable
  .create("user")
  .addField(SurrealField.id("user"))
  .addField(SurrealField.string("username").unique().max(50))
  .addField(SurrealField.string("email").unique().pattern("^[^@]+@[^@]+\\\\.[^@]+$"))
  .addField(SurrealField.boolean("is_active").default("true"))
  .addField(SurrealField.datetime("created_at").default("time::now()"))
  .withDescription("User accounts table")
  .schemafullMode();

// Define your schema
export const schema = SurrealSchema
  .create("${name}", "1.0.0")
  .withDescription("Schema for ${name}")
  .addTable(userTable)
  .addIndex(SurrealIndex.unique("idx_user_email", "user", ["email"]));

// Generate and output schema
const surrealQL = schema.toSurrealQL();
const typescript = schema.toTypeScript();

console.log("📋 Generated SurrealQL:");
console.log(surrealQL);
console.log("\\n🎯 Generated TypeScript:");
console.log(typescript);

export default schema;
`;

    // Create package.json
    yield* Effect.promise(() => writeFile(`${dir}/package.json`, packageContent));

    // Create schema file
    yield* Effect.promise(() => writeFile(`${dir}/schema.ts`, schemaContent));

    // Create generated directory and gitkeep file
    yield* Effect.promise(() =>
      writeFile(`${dir}/generated/.gitkeep`, "# Generated files go here\n")
    );

    yield* Console.log("✅ Project initialized successfully!");
    yield* Console.log(`   📦 Package: ${dir}/package.json`);
    yield* Console.log(`   🏗️  Schema: ${dir}/schema.ts`);
    yield* Console.log(`   📁 Output: ${dir}/generated/`);
    yield* Console.log("");
    yield* Console.log("📋 Next steps:");
    yield* Console.log(`  1. cd ${dir}`);
    yield* Console.log("  2. bun install");
    yield* Console.log("  3. Edit schema.ts to define your tables");
    yield* Console.log("  4. bun dev to see your schema");
  });

  await Effect.runPromise(program);
};

const generateCommand = async (options: typeof values) => {
  const program = Effect.gen(function* () {
    const name = options.name || "generated-schema";
    const output = options.output || "schema.surql";

    yield* Console.log(`🏗️  Generating schema: ${name}`);

    // Create a comprehensive schema
    const userTable = SurrealTable.create("user")
      .addField(SurrealField.id("user"))
      .addField(SurrealField.string("username").unique().max(50))
      .addField(SurrealField.string("email").unique().pattern("^[^@]+@[^@]+\\.[^@]+$"))
      .addField(SurrealField.boolean("is_active").default("true"))
      .addField(SurrealField.datetime("created_at").default("time::now()"))
      .withDescription("User accounts table")
      .schemafullMode();

    const postTable = SurrealTable.create("post")
      .addField(SurrealField.id("post"))
      .addField(SurrealField.string("title").max(200))
      .addField(SurrealField.string("content"))
      .addField(SurrealField.record("author", "user"))
      .addField(SurrealField.datetime("created_at").default("time::now()"))
      .addField(SurrealField.boolean("is_published").default("false"))
      .withDescription("Blog posts table")
      .schemafullMode();

    const schema = SurrealSchema.create(name, "1.0.0")
      .withDescription(`Generated schema for ${name}`)
      .addTables(userTable, postTable)
      .addIndex(SurrealIndex.unique("idx_user_email", "user", ["email"]))
      .addIndex(SurrealIndex.unique("idx_user_username", "user", ["username"]))
      .addIndex(SurrealIndex.create("idx_post_author", "post", ["author"]))
      .addEvent(SurrealEvent.onCreate("user_created", "user", "UPDATE stats SET user_count += 1"))
      .addEvent(SurrealEvent.onCreate("post_created", "post", "UPDATE $after.author SET posts_count += 1"));

    const surrealQL = schema.toSurrealQL();

    // Write to file
    yield* Effect.promise(() => writeFile(output, surrealQL));

    yield* Console.log(`✅ Schema generated successfully: ${output}`);
    yield* Console.log(`   📊 Tables: ${schema.getTables().length}`);
    yield* Console.log(`   🔍 Indexes: ${schema.getIndexes().length}`);
    yield* Console.log(`   ⚡ Events: ${schema.getEvents().length}`);
    yield* Console.log(`   📝 Size: ${surrealQL.length} characters`);
  });

  await Effect.runPromise(program);
};

const typesCommand = async (options: typeof values) => {
  const program = Effect.gen(function* () {
    const schemaFile = options.schema || "schema.ts";
    const output = options.output || "generated/types.ts";

    yield* Console.log(`🎯 Generating TypeScript types from: ${schemaFile}`);

    // Create sample schema for types generation
    const schema = SurrealSchema.create("example", "1.0.0")
      .addTable(
        SurrealTable.create("user")
          .addField(SurrealField.id("user"))
          .addField(SurrealField.string("username"))
          .addField(SurrealField.string("email").optional())
          .addField(SurrealField.boolean("is_active"))
          .addField(SurrealField.int("posts_count"))
          .addField(SurrealField.datetime("created_at"))
      )
      .addTable(
        SurrealTable.create("post")
          .addField(SurrealField.id("post"))
          .addField(SurrealField.string("title"))
          .addField(SurrealField.string("content"))
          .addField(SurrealField.record("author", "user"))
          .addField(SurrealField.datetime("created_at"))
      );

    const typescript = schema.toTypeScript();

    // Ensure output directory exists
    const outputDir = output.substring(0, output.lastIndexOf("/"));
    if (outputDir) {
      yield* Effect.promise(() => writeFile(`${outputDir}/.gitkeep`, ""));
    }

    yield* Effect.promise(() => writeFile(output, typescript));

    yield* Console.log(`✅ TypeScript types generated: ${output}`);
    yield* Console.log(`   📊 Tables: ${schema.getTables().length}`);
    yield* Console.log(
      `   🏷️  Total fields: ${schema.getTables().reduce((sum, t) => sum + t.getFields().length, 0)}`
    );
    yield* Console.log(`   📝 Size: ${typescript.length} characters`);
  });

  await Effect.runPromise(program);
};

const compareCommand = async (options: typeof values) => {
  const program = Effect.gen(function* () {
    yield* Console.log("🔍 Comparing schemas...");

    // Create sample schemas to demonstrate
    const oldSchema = SurrealSchema.create("example", "1.0.0").addTable(
      SurrealTable.create("user")
        .addField(SurrealField.id("user"))
        .addField(SurrealField.string("username"))
        .addField(SurrealField.string("email"))
    );

    const newSchema = SurrealSchema.create("example", "1.1.0").addTable(
      SurrealTable.create("user")
        .addField(SurrealField.id("user"))
        .addField(SurrealField.string("username"))
        .addField(SurrealField.string("email"))
        .addField(SurrealField.boolean("is_active").default("true")) // New field
        .addField(SurrealField.datetime("last_login").optional()) // Another new field
    );

    const diff = SchemaComparator.compare(oldSchema, newSchema);

    yield* Console.log(`📊 Changes detected: ${diff.hasChanges}`);

    if (diff.hasChanges) {
      yield* Console.log(`   📋 Table changes: ${diff.tableDiffs.length}`);
      yield* Console.log(`   🏷️  Field changes: ${diff.fieldDiffs.length}`);
      yield* Console.log(`   🔍 Index changes: ${diff.indexDiffs.length}`);
      yield* Console.log(`   ⚡ Event changes: ${diff.eventDiffs.length}`);

      const migration = MigrationGenerator.generateMigration(
        diff,
        `migration_${Date.now()}`,
        "Auto-generated migration from schema comparison"
      );

      const migrationFile = MigrationGenerator.generateMigrationFile(migration);

      if (options.migration) {
        yield* Effect.promise(() => writeFile(options.migration, migrationFile));
        yield* Console.log(`✅ Migration generated: ${options.migration}`);
      } else {
        yield* Console.log("\n📋 Generated Migration:");
        yield* Console.log("=".repeat(50));
        yield* Console.log(migrationFile);
      }
    } else {
      yield* Console.log("✅ No changes detected");
    }
  });

  await Effect.runPromise(program);
};

const validateCommand = async (options: typeof values) => {
  const program = Effect.gen(function* () {
    const file = options.file || "schema.ts";
    yield* Console.log(`✅ Validating schema: ${file}`);

    // Create sample schema for validation
    const schema = SurrealSchema.create("validation_test", "1.0.0")
      .addTable(
        SurrealTable.create("user")
          .addField(SurrealField.id("user"))
          .addField(SurrealField.string("username"))
          .addField(SurrealField.record("profile", "profile")) // Reference to profile table
      )
      .addTable(
        SurrealTable.create("profile")
          .addField(SurrealField.id("profile"))
          .addField(SurrealField.string("bio"))
      );

    const errors = schema.validateSchema();
    if (errors.length === 0) {
      yield* Console.log("✅ Schema validation passed");

      yield* Console.log(`   📊 Tables: ${schema.getTables().length}`);
      yield* Console.log(
        `   🔗 Total fields: ${schema.getFieldCount()}`
      );
    } else {
      yield* Console.log(`❌ Schema validation failed: ${errors.join(", ")}`);
      process.exit(1);
    }
  });

  await Effect.runPromise(program);
};

const pullCommand = async (options: typeof values) => {
  const program = Effect.gen(function* () {
    const dbUrl = options.url || "http://localhost:8000";
    const namespace = options.namespace || "test";
    const database = options.database || "test";
    const username = options.username;
    const password = options.password;
    const output = options.output || "pulled-schema.ts";

    yield* Console.log("🔄 Pulling schema from SurrealDB...");
    yield* Console.log(`   🌐 URL: ${dbUrl}`);
    yield* Console.log(`   📁 Namespace: ${namespace}`);
    yield* Console.log(`   💾 Database: ${database}`);

    try {
      // Use SurrealDB connection

      const db = new Surreal();
      yield* Console.log("🔌 Connecting to database...");

      // Connect to the database
      yield* Effect.promise(() => db.connect(dbUrl));

      if (username && password) {
        yield* Effect.promise(() => db.signin({ username, password }));
      }

      yield* Effect.promise(() => db.use({ namespace, database }));

      // Get database info
      yield* Console.log("📊 Fetching schema information...");
      const infoResult = yield* Effect.promise(() => db.query("INFO FOR DB;"));

      if (!infoResult || !infoResult[0]) {
        throw new Error("Failed to retrieve schema information");
      }

      const schemaInfo = infoResult[0] as any;
      yield* Console.log(
        `✅ Found schema with ${Object.keys(schemaInfo.tables || {}).length} tables`
      );

      // Parse tables and create our improved schema
      let schema = SurrealSchema.create("pulled-schema", "1.0.0").withDescription(
        `Schema pulled from ${dbUrl}/${namespace}/${database}`
      );

      for (const [tableName, tableDefString] of Object.entries(schemaInfo.tables || {})) {
        yield* Console.log(`🔍 Processing table: ${tableName}`);

        // Get detailed table info
        const tableInfoResult = yield* Effect.promise(() =>
          db.query(`INFO FOR TABLE ${tableName};`)
        );

        if (tableInfoResult?.[0]) {
          const tableInfo = tableInfoResult[0] as any;

          // Create table with extracted metadata
          let table = SurrealTable.create(tableName);

          // Extract description from COMMENT if available
          const tableDefStr = tableDefString as string;
          const commentMatch = tableDefStr.match(/COMMENT '([^']+)'/);
          if (commentMatch) {
            const comment = commentMatch[1];
            table = table.withDescription(comment);

            // Check if comment contains AI metadata
            if (comment.includes("@ai-hints")) {
              yield* Console.log(`   🤖 Found AI metadata in ${tableName}`);
              // Parse AI metadata from comments
              try {
                const aiMatch = comment.match(/@ai-hints:\s*({[^}]*})/);
                if (aiMatch) {
                  const aiData = JSON.parse(aiMatch[1]);
                  if (aiData.primary_key) table = table.aiPrimaryKey(aiData.primary_key);
                  if (aiData.temporal_field) table = table.aiTemporalField(aiData.temporal_field);
                  if (aiData.user_field) table = table.aiUserField(aiData.user_field);
                  if (aiData.content_fields) table = table.aiContentFields(aiData.content_fields);
                  if (aiData.common_queries) table = table.aiCommonQueries(aiData.common_queries);
                }
              } catch (e) {
                yield* Console.log(`   ⚠️  Failed to parse AI metadata for ${tableName}: ${e}`);
              }
            }
          }

          // Process fields
          const fields: SurrealField[] = [];
          for (const [fieldName, fieldInfo] of Object.entries(tableInfo.fields || {})) {
            let field: SurrealField;

            if (typeof fieldInfo === "string") {
              // Parse field definition string
              const fieldDefStr = fieldInfo as string;

              // Extract type
              const typeMatch = fieldDefStr.match(/TYPE\s+([^,\s]+)/);
              const fieldType = typeMatch ? typeMatch[1] : "string";

              // Check for optional
              const isOptional = fieldType.startsWith("option<");
              const baseType = isOptional ? fieldType.replace(/^option<|>$/g, "") : fieldType;

              // Create field based on type
              if (baseType.startsWith("record<")) {
                const recordTable = baseType.replace(/^record<|>$/g, "");
                field =
                  fieldName === "id"
                    ? SurrealField.id(recordTable)
                    : SurrealField.record(fieldName, recordTable);
              } else {
                switch (baseType) {
                  case "string":
                    field = SurrealField.string(fieldName);
                    break;
                  case "int":
                    field = SurrealField.int(fieldName);
                    break;
                  case "number":
                  case "float":
                    field = SurrealField.number(fieldName);
                    break;
                  case "bool":
                  case "boolean":
                    field = SurrealField.boolean(fieldName);
                    break;
                  case "datetime":
                    field = SurrealField.datetime(fieldName);
                    break;
                  default:
                    field = SurrealField.string(fieldName);
                }
              }

              if (isOptional && fieldName !== "id") {
                field = field.optional();
              }

              // Extract description from COMMENT
              const fieldCommentMatch = fieldDefStr.match(/COMMENT '([^']+)'/);
              if (fieldCommentMatch) {
                field = field.description(fieldCommentMatch[1]);
              }

              // Extract default value
              const defaultMatch = fieldDefStr.match(/DEFAULT\s+([^,\s]+)/);
              if (defaultMatch) {
                field = field.default(defaultMatch[1]);
              }

              // Check for UNIQUE
              if (fieldDefStr.includes("UNIQUE")) {
                field = field.unique();
              }

              fields.push(field);
            }
          }

          // Add fields to table
          for (const field of fields) {
            table = table.addField(field);
          }

          // Detect schemaless/schemafull
          if (tableDefStr.includes("SCHEMALESS")) {
            table = table.schemalessMode();
          } else {
            table = table.schemafullMode();
          }

          schema = schema.addTable(table);
          yield* Console.log(`   ✅ Processed ${tableName} with ${fields.length} fields`);
        }
      }

      // Generate TypeScript output with our enhanced schema
      const typescript = schema.toTypeScript();
      const surrealQL = schema.toSurrealQL();

      // Write enhanced schema file
      const enhancedOutput = `// Generated from SurrealDB at ${dbUrl}/${namespace}/${database}
// Timestamp: ${new Date().toISOString()}
// Enhanced with AI metadata support

${typescript}

// SurrealQL Schema:
/*
${surrealQL}
*/

export default schema;
`;

      yield* Effect.promise(() => writeFile(output, enhancedOutput));

      yield* Console.log("✅ Schema successfully pulled and enhanced!");
      yield* Console.log(`   📊 Tables processed: ${schema.getTables().length}`);
      yield* Console.log(`   📝 Output file: ${output}`);
      yield* Console.log("   🤖 AI metadata: Detected and preserved from comments");
      yield* Console.log("   🎯 Enhanced with: TypeScript types + SurrealQL definitions");

      // Close database connection
      yield* Effect.promise(() => db.close());
    } catch (error) {
      yield* Console.log(`❌ Error pulling schema: ${error}`);
      process.exit(1);
    }
  });

  await Effect.runPromise(program);
};

const migrateCommand = async (options: typeof values) => {
  const program = Effect.gen(function* () {
    const description = options.name || "schema_update";
    const author = options.file || "system";

    yield* Console.log("📋 Creating migration with journal tracking...");

    // Initialize journal service
    const journalService = yield* MigrationJournalService;
    yield* journalService.ensureDirectoryStructure;

    // Load existing journal
    const journal = yield* journalService.loadJournal;
    yield* Console.log(`📚 Loaded journal with ${journal.entries.length} migrations`);

    // Create sample schema evolution for demonstration
    const oldSchema = SurrealSchema.create("demo", "1.0.0").addTable(
      SurrealTable.create("user")
        .addField(SurrealField.id("user"))
        .addField(SurrealField.string("username"))
        .addField(SurrealField.string("email"))
    );

    const newSchema = SurrealSchema.create("demo", "1.1.0").addTable(
      SurrealTable.create("user")
        .addField(SurrealField.id("user"))
        .addField(SurrealField.string("username"))
        .addField(SurrealField.string("email"))
        .addField(SurrealField.boolean("is_active").default("true"))
        .addField(SurrealField.datetime("last_login").optional())
        .aiPrimaryKey("email")
        .aiTemporalField("last_login")
        .aiCommonQueries(["find active users", "get user by email", "list recent logins"])
    );

    // Generate diff and migration
    const diff = SchemaComparator.compare(oldSchema, newSchema);

    if (!diff.hasChanges) {
      yield* Console.log("✅ No changes detected - no migration needed");
      return;
    }

    yield* Console.log("📊 Changes detected:");
    yield* Console.log(`   📋 Table changes: ${diff.tableDiffs.length}`);
    yield* Console.log(`   🏷️  Field changes: ${diff.fieldDiffs.length}`);
    yield* Console.log(`   🔍 Index changes: ${diff.indexDiffs.length}`);
    yield* Console.log(`   ⚡ Event changes: ${diff.eventDiffs.length}`);

    // Generate migration tag and content
    const tag = journalService.generateMigrationTag(description);
    const migration = MigrationGenerator.generateMigration(
      diff,
      tag,
      `Migration: ${description} - Add user activity tracking with AI metadata`
    );

    // Create snapshot
    const snapshot = journalService.createSnapshot(
      newSchema.getTables().reduce(
        (acc, table) => {
          acc[table.name] = {
            name: table.name,
            definition: table,
            fields: table.fields.map((f) => f),
            ai_hints: table.aiHints,
          };
          return acc;
        },
        {} as Record<string, any>
      ),
      newSchema.getIndexes().reduce(
        (acc, index) => {
          acc[index.name] = index;
          return acc;
        },
        {} as Record<string, any>
      ),
      newSchema.getEvents().reduce(
        (acc, event) => {
          acc[event.name] = event;
          return acc;
        },
        {} as Record<string, any>
      )
    );

    // Generate SQL content
    const upSql = migration.statements
      .map((stmt) => `-- ${stmt.description}\n${stmt.sql}`)
      .join("\n\n");

    const downSql = migration.statements
      .slice()
      .reverse()
      .map(
        (stmt) =>
          `-- Rollback: ${stmt.description}\n${stmt.rollbackSql || `-- Manual rollback required for: ${stmt.description}`}`
      )
      .join("\n\n");

    // Create migration files
    yield* journalService.createMigrationFiles(tag, upSql, downSql, snapshot);

    // Update journal
    const updatedJournal = journalService.addMigration(journal, tag, description, author);
    yield* journalService.saveJournal(updatedJournal);

    yield* Console.log("✅ Migration created successfully!");
    yield* Console.log(`   📁 Tag: ${tag}`);
    yield* Console.log(`   📝 Description: ${description}`);
    yield* Console.log(`   👤 Author: ${author}`);
    yield* Console.log(`   📊 Journal entries: ${updatedJournal.entries.length}`);
    yield* Console.log("   🎯 AI metadata: Included in table definitions");
  });

  await Effect.runPromise(Effect.provide(program, MigrationJournalService.Default));
};

const demoCommand = async () => {
  // Run the complete demo from the examples
  const { completeSchemaDemo } = await import("./src/examples/complete-example");
  await Effect.runPromise(completeSchemaDemo);
};

// Main CLI handler
const main = async () => {
  if (values.help || command === "help") {
    console.log(HELP_TEXT);
    return;
  }

  if (values.version) {
    console.log(`v${VERSION}`);
    return;
  }

  switch (command) {
    case "init":
      await initCommand(values);
      break;
    case "generate":
      await generateCommand(values);
      break;
    case "types":
      await typesCommand(values);
      break;
    case "compare":
      await compareCommand(values);
      break;
    case "migrate":
      await migrateCommand(values);
      break;
    case "validate":
      await validateCommand(values);
      break;
    case "pull":
      await pullCommand(values);
      break;
    case "demo":
      await demoCommand();
      break;
    default:
      console.log("🎯 SurrealDB Code-First Schema Manager");
      console.log("Use --help to see available commands");
      break;
  }
};

// Run the CLI
if (import.meta.main) {
  await main();
}
