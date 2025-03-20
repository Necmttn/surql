import { ensureDir, exists } from "@std/fs";
import { dirname } from "@std/path";

import { Command } from "commander";
import { intro, log, spinner } from "@clack/prompts";
import chalk from "chalk";

import { loadConfig, getOutputPath, generateImports, CONFIG_FILENAME_JSON, CONFIG_FILENAME_TS, type Config, type DbConfig } from "./config.ts";
import { parseSurQL, generateTypeBoxSchemas, validateReferences } from "./schema.ts";
import { fetchSchemaFromDB, checkDBConnection } from "./db.ts";

// Expose the loadConfigFromFile function from config.ts
import { loadConfigFromFile } from "./config.ts";

/**
 * Process a SurrealQL file and generate TypeBox schemas
 *
 * @param inputFile - Path to the input SurrealQL file
 * @param outputFile - Path to the output TypeScript file
 * @param configPath - Optional path to the configuration file
 */
export async function processFile(inputFile: string, outputFile?: string, configPath?: string): Promise<void> {
  // Load configuration
  const config = await loadConfig(configPath);

  try {
    const loadingSpinner = spinner();
    loadingSpinner.start(`Processing file ${chalk.cyan(inputFile)}`);

    // Read input file
    const content = await Deno.readTextFile(inputFile);

    // Parse SurrealQL to get table definitions
    let tables = parseSurQL(content);
    loadingSpinner.message(`Parsed ${chalk.green(tables.length)} tables from SurrealQL`);

    // Validate and fix references to non-existent tables
    tables = validateReferences(tables);

    // Generate schemas with proper recursive type handling and imports
    const imports = generateImports(config);
    const typeboxSchemas = generateTypeBoxSchemas(tables);

    // Combine custom imports with schema output
    const output = typeboxSchemas.replace(
      "import { Type, type Static } from \"@sinclair/typebox\";\nimport type { RecordId } from \"surrealdb\";",
      imports
    );

    // Determine output path
    const targetFile = outputFile || getOutputPath(config);
    loadingSpinner.message(`Writing output to ${chalk.cyan(targetFile)}`);

    // Ensure output directory exists
    await ensureDir(dirname(targetFile));

    // Write output file
    await Deno.writeTextFile(targetFile, output);
    loadingSpinner.stop(`Generated schemas written to ${chalk.green(targetFile)}`);

  } catch (error) {
    log.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    Deno.exit(1);
  }
}

/**
 * Generate TypeBox schemas from SurrealDB instance
 * 
 * @param dbOptions - Database connection options from command line
 * @param outputFile - Path to the output TypeScript file
 * @param configPath - Optional path to the configuration file
 */
export async function processDB(dbOptions?: Partial<DbConfig>, outputFile?: string, configPath?: string): Promise<void> {
  // Load configuration
  const config = await loadConfig(configPath);

  // Ensure db config exists
  config.db = config.db || {};

  // Override config with command line options if provided
  if (dbOptions) {
    if (dbOptions.url) {
      config.db.url = dbOptions.url;
    }
    if (dbOptions.username) {
      config.db.username = dbOptions.username;
    }
    if (dbOptions.password) {
      config.db.password = dbOptions.password;
    }
    if (dbOptions.namespace) {
      config.db.namespace = dbOptions.namespace;
    }
    if (dbOptions.database) {
      config.db.database = dbOptions.database;
    }
  }

  if (!config.db?.url) {
    log.error("Database URL is required either in configuration or via --db-url option");
    Deno.exit(1);
  }

  try {
    const dbSpinner = spinner();
    dbSpinner.start(`Connecting to SurrealDB at ${chalk.cyan(config.db.url)}`);

    // Log additional connection details if provided
    const connectionDetails = [];
    if (config.db.namespace) connectionDetails.push(`namespace: ${chalk.cyan(config.db.namespace)}`);
    if (config.db.database) connectionDetails.push(`database: ${chalk.cyan(config.db.database)}`);
    if (config.db.username) connectionDetails.push(`user: ${chalk.cyan(config.db.username)}`);
    if (connectionDetails.length > 0) {
      dbSpinner.message(`Connection details: ${connectionDetails.join(', ')}`);
    }

    // Check database connection
    const isConnected = await checkDBConnection(config.db.url);
    if (!isConnected) {
      dbSpinner.stop(`Failed to connect to SurrealDB at ${chalk.red(config.db.url)}`);
      log.error("Database connection failed");
      Deno.exit(1);
    }

    // Fetch schema from database
    dbSpinner.message("Fetching schema from database...");
    const tables = await fetchSchemaFromDB(config);

    if (tables.length === 0) {
      dbSpinner.stop(chalk.yellow("No tables found in database schema"));
      log.error("No tables found in database schema");
      Deno.exit(1);
    }

    dbSpinner.message(`Found ${chalk.green(tables.length)} tables in database`);

    // Generate schemas with proper recursive type handling and imports
    const imports = generateImports(config);
    const typeboxSchemas = generateTypeBoxSchemas(tables);

    // Combine custom imports with schema output
    const output = typeboxSchemas.replace(
      "import { Type, type Static } from \"@sinclair/typebox\";\nimport type { RecordId } from \"surrealdb\";",
      imports
    );

    // Determine output path
    const targetFile = outputFile || getOutputPath(config);
    dbSpinner.message(`Writing output to ${chalk.cyan(targetFile)}`);

    // Ensure output directory exists
    await ensureDir(dirname(targetFile));

    // Write output file
    await Deno.writeTextFile(targetFile, output);
    dbSpinner.stop(`Generated schemas from database written to ${chalk.green(targetFile)}`);

  } catch (error) {
    log.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    Deno.exit(1);
  }
}

/**
 * Initialize a new configuration file
 *
 * @param configPath - Optional path to create the configuration file at
 * @param useTypeScript - Whether to create a TypeScript config file
 */
export async function initConfig(configPath?: string, useTypeScript = true): Promise<void> {
  try {
    const initSpinner = spinner();
    initSpinner.start("Creating configuration file");

    // Load default configuration
    const config = await loadConfig();

    // Write configuration file
    if (useTypeScript) {
      const targetPath = configPath || CONFIG_FILENAME_TS;
      const tsConfig = `import type { Config } from "@necmttn/surql-gen";

/**
 * surql-gen configuration
 * 
 * This TypeScript configuration file provides type checking and autocompletion
 * for surql-gen configuration options.
 */
export const config: Config = ${JSON.stringify(config, null, 2)};
export default config;
`;
      await Deno.writeTextFile(targetPath, tsConfig);
      initSpinner.stop(`Created ${chalk.green("TypeScript")} configuration file at ${chalk.cyan(targetPath)}`);
    } else {
      const targetPath = configPath || CONFIG_FILENAME_JSON;
      await Deno.writeTextFile(targetPath, JSON.stringify(config, null, 2));
      initSpinner.stop(`Created ${chalk.green("JSON")} configuration file at ${chalk.cyan(targetPath)}`);
    }
  } catch (error) {
    log.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    Deno.exit(1);
  }
}

/**
 * Migrate from JSON configuration to TypeScript configuration
 * 
 * @param jsonConfigPath - Path to the JSON config file (default: surql-gen.json)
 * @param tsConfigPath - Path to the TypeScript config file to create (default: surql-gen.config.ts)
 */
export async function migrateConfig(jsonConfigPath?: string, tsConfigPath?: string): Promise<void> {
  try {
    const jsonPath = jsonConfigPath || CONFIG_FILENAME_JSON;
    const tsPath = tsConfigPath || CONFIG_FILENAME_TS;

    const migrateSpinner = spinner();
    migrateSpinner.start(`Migrating from ${chalk.cyan(jsonPath)} to ${chalk.green(tsPath)}`);

    // Check if JSON config exists
    if (!await exists(jsonPath)) {
      migrateSpinner.stop(chalk.red("Migration failed"));
      log.error(`JSON configuration file ${chalk.cyan(jsonPath)} not found.`);
      Deno.exit(1);
    }

    // Check if TS config already exists
    if (await exists(tsPath)) {
      migrateSpinner.stop(chalk.red("Migration failed"));
      log.error(`TypeScript configuration file ${chalk.cyan(tsPath)} already exists.`);
      log.error("Please delete it first or specify a different output path.");
      Deno.exit(1);
    }

    // Load the JSON config
    const config = await loadConfigFromFile(jsonPath);

    // Create the TypeScript config
    const tsConfig = `import type { Config } from "./lib/config.ts";

/**
 * surql-gen configuration
 * 
 * This TypeScript configuration file provides type checking and autocompletion
 * for surql-gen configuration options.
 * 
 * Migrated from ${jsonPath}
 */
export const config: Config = ${JSON.stringify(config, null, 2)};

export default config;
`;

    // Write the TypeScript config
    await Deno.writeTextFile(tsPath, tsConfig);
    migrateSpinner.stop(`Migrated configuration from ${chalk.cyan(jsonPath)} to ${chalk.green(tsPath)}`);
    log.success("You can now use the TypeScript configuration file for better type checking and editor support.");
    log.info("To use it, simply run 'deno run -A mod.ts' without arguments.");

  } catch (error) {
    log.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    Deno.exit(1);
  }
}

/**
 * Main CLI handler function
 * 
 * @param args - Command line arguments
 */
export async function handleCommand(args: string[]): Promise<void> {
  const program = new Command();

  program
    .name("surql-gen")
    .description("Generate TypeBox schemas from SurrealQL")
    .version("1.0.0") // Replace with actual version
    .configureHelp({
      sortSubcommands: true,
      sortOptions: true
    });

  program
    .command("process")
    .description("Process a SurrealQL file and generate TypeBox schemas")
    .requiredOption("-i, --input <file>", "Input SurrealQL file to process")
    .option("-o, --output <file>", "Output TypeScript file (default: based on config)")
    .option("-c, --config <file>", "Path to config file")
    .action(async (options) => {
      await processFile(options.input, options.output, options.config);
    });

  program
    .command("db")
    .description("Generate TypeBox schemas from SurrealDB instance")
    .option("-d, --db-url <url>", "SurrealDB URL to fetch schema from (overrides config)")
    .option("-u, --username <user>", "Username for authentication (overrides config)")
    .option("-p, --password <pass>", "Password for authentication (overrides config)")
    .option("-n, --namespace <ns>", "Namespace to use (overrides config)")
    .option("--database <db>", "Database to use (overrides config)")
    .option("-o, --output <file>", "Output TypeScript file (default: based on config)")
    .option("-c, --config <file>", "Path to config file")
    .action(async (options) => {
      const dbOptions: Partial<DbConfig> = {
        url: options.dbUrl,
        username: options.username,
        password: options.password,
        namespace: options.namespace,
        database: options.database
      };
      await processDB(dbOptions, options.output, options.config);
    });

  program
    .command("init")
    .description("Initialize a new config file")
    .option("-c, --config <file>", "Path to create the configuration file at")
    .option("--json", "Use JSON for config file instead of TypeScript")
    .action(async (options) => {
      const useTypeScript = !options.json;
      await initConfig(options.config, useTypeScript);
    });

  program
    .command("migrate")
    .description("Migrate from JSON config to TypeScript config")
    .option("--json-config <file>", "Path to the JSON config file (default: surql-gen.json)")
    .option("--ts-config <file>", "Path to the TypeScript config file to create (default: surql-gen.config.ts)")
    .action(async (options) => {
      await migrateConfig(options.jsonConfig, options.tsConfig);
    });

  // Add examples to help
  program.addHelpText('after', `
Examples:
  surql-gen init                               Initialize a new TypeScript config file
  surql-gen init --json                        Initialize a new JSON config file
  surql-gen migrate                            Migrate from JSON config to TypeScript config
  surql-gen process -i schema.surql -o types.ts  Process a SurrealQL file
  surql-gen db -d http://localhost:8000 -o types.ts  Generate schema from database
  surql-gen db -n my_namespace --database my_database  Generate schema with namespace and database name
  surql-gen db -u root -p root                 Generate schema with authentication
  surql-gen db                                 Generate schema using URL from config file
  surql-gen process -i schema.surql -c custom-config.ts  Use custom config file
  `);

  try {
    // If no command provided, show help
    if (args.length === 0) {
      program.help();
      return;
    }

    await program.parseAsync(["deno", "surql-gen", ...args]);
  } catch (error) {
    log.error(`Command error: ${error instanceof Error ? error.message : String(error)}`);
    program.help();
  }
} 