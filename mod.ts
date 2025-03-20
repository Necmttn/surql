/**
 * @necmttn/surql-gen - TypeBox schema generator for SurrealDB
 * 
 * This is the main module that exports all public functionality.
 */

// Export types from config module for use in consumer applications
export type { Config, DbConfig, OutputConfig, ImportsConfig } from "./lib/config.ts";

// Export core functionality
export {
  parseSurQL,
  parseType,
  formatTypeName,
  formatSchemaName,
  generateTypeBoxSchemas,
  validateReferences
} from "./lib/schema.ts";

// Export command handlers
export {
  handleCommand,
  processFile,
  processDB,
  initConfig,
  migrateConfig
} from "./lib/commands.ts";

// This is the entry point when the module is run directly
if (import.meta.main) {
  const args = Deno.args;
  const { handleCommand } = await import("./lib/commands.ts");
  const { loadConfig, CONFIG_FILENAME_JSON, CONFIG_FILENAME_TS } = await import("./lib/config.ts");
  const { exists } = await import("@std/fs");

  // If no args are provided, look for config files in the current directory
  if (args.length === 0) {
    const { log, spinner } = await import("@clack/prompts");
    const chalk = await import("chalk");
    const { processDB } = await import("./lib/commands.ts");

    const configSpinner = spinner();
    configSpinner.start("Checking for configuration files");

    const hasTypeScriptConfig = await exists(CONFIG_FILENAME_TS);
    const hasJsonConfig = await exists(CONFIG_FILENAME_JSON);

    if (hasTypeScriptConfig || hasJsonConfig) {
      const config = await loadConfig();
      const configType = hasTypeScriptConfig ? "TypeScript" : "JSON";
      configSpinner.message(`Found ${chalk.default.green(configType)} configuration`);

      if (config.db?.url) {
        configSpinner.message(`Using database URL: ${chalk.default.cyan(config.db.url)}`);
        configSpinner.stop(`Running with ${chalk.default.green(configType)} configuration`);
        await processDB(); // Call processDB with no arguments to use the config values
      } else {
        configSpinner.stop(chalk.default.yellow("Configuration found but missing database URL"));
        log.error("Config found but no database URL specified.");
        log.info("Please provide an input file or database URL.");
        Deno.exit(1);
      }
    } else {
      configSpinner.stop(chalk.default.red("No configuration files found"));
      log.info("Run 'deno run -A mod.ts --help' for usage information.");
      Deno.exit(1);
    }
  } else {
    await handleCommand(args);
  }
}
