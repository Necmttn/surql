import { Type, type Static } from "@sinclair/typebox";
import { exists } from "@std/fs";
import { join } from "@std/path";

/**
 * Database connection configuration schema
 */
export const DbConfigSchema = Type.Object({
  url: Type.Optional(Type.String()),
  username: Type.Optional(Type.String()),
  password: Type.Optional(Type.String()),
  namespace: Type.Optional(Type.String()),
  database: Type.Optional(Type.String())
}, {
  additionalProperties: false
});

/**
 * Output file configuration schema
 */
export const OutputConfigSchema = Type.Object({
  path: Type.String({ default: "./generated" }),
  filename: Type.String({ default: "schema" }),
  extension: Type.Union([
    Type.Literal("ts"),
    Type.Literal("js"),
    Type.Literal("d.ts")
  ], { default: "ts" })
}, {
  additionalProperties: false
});

/**
 * Schema system options
 */
export const SchemaSystemSchema = Type.Union([
  Type.Literal("typebox"),
  Type.Literal("effect")
], { default: "typebox" });

/**
 * Imports configuration schema
 */
export const ImportsConfigSchema = Type.Object({
  style: Type.Union([
    Type.Literal("esm"),
    Type.Literal("commonjs"),
    Type.Literal("deno")
  ], { default: "esm" }),
  schemaSystem: SchemaSystemSchema,
  paths: Type.Object({
    typebox: Type.String({ default: "@sinclair/typebox" }),
    effect: Type.Optional(Type.String({ default: "@effect/schema" }))
  }, {
    default: { typebox: "@sinclair/typebox", effect: "@effect/schema" },
    additionalProperties: false
  })
}, {
  additionalProperties: false
});

/**
 * Schema for surql-gen.json configuration file
 */
export const ConfigSchema = Type.Object({
  output: OutputConfigSchema,
  imports: ImportsConfigSchema,
  db: Type.Optional(DbConfigSchema)
}, {
  additionalProperties: false
});

/**
 * Default configuration
 */
export const DEFAULT_CONFIG = {
  output: {
    path: "./generated",
    filename: "schema",
    extension: "ts"
  },
  imports: {
    style: "esm",
    schemaSystem: "typebox",
    paths: {
      typebox: "@sinclair/typebox",
      effect: "@effect/schema"
    }
  }
};

/**
 * Export types from the schemas
 */
export type DbConfig = Static<typeof DbConfigSchema>;
export type OutputConfig = Static<typeof OutputConfigSchema>;
export type SchemaSystem = Static<typeof SchemaSystemSchema>;
export type ImportsConfig = Static<typeof ImportsConfigSchema>;
export type Config = Static<typeof ConfigSchema>;

/**
 * Loaded configuration
 */
let config: Config | null = null;

/**
 * Default configuration filename options
 */
export const CONFIG_FILENAME_JSON = "surql-gen.json";
export const CONFIG_FILENAME_TS = "surql-gen.config.ts";

/**
 * Load configuration from file or use default
 * 
 * @param configPath - Optional path to config file
 * @returns The loaded configuration
 */
export async function loadConfig(configPath?: string): Promise<Config> {
  if (config) return config;

  // If a specific path is provided, try to load from that
  if (configPath) {
    config = await loadConfigFromFile(configPath);
    return config;
  }

  // Otherwise, try TypeScript config first, then fallback to JSON
  if (await exists(CONFIG_FILENAME_TS)) {
    config = await loadTypeScriptConfig(CONFIG_FILENAME_TS);
  } else if (await exists(CONFIG_FILENAME_JSON)) {
    config = await loadConfigFromFile(CONFIG_FILENAME_JSON);
  } else {
    // Use default config
    config = DEFAULT_CONFIG as Config;
  }

  return config;
}

/**
 * Load configuration from a JSON file
 * 
 * @param configPath - Path to the JSON config file
 * @returns The loaded configuration
 */
export async function loadConfigFromFile(configPath: string): Promise<Config> {
  try {
    const fileContent = await Deno.readTextFile(configPath);
    const parsed = JSON.parse(fileContent);
    // In TypeBox we would use Validator to check, but here we just ensure it has the shape
    return { ...DEFAULT_CONFIG, ...parsed } as Config;
  } catch (error) {
    console.error(`Error loading config from ${configPath}: ${error instanceof Error ? error.message : String(error)}`);
    return DEFAULT_CONFIG as Config;
  }
}

/**
 * Load configuration from a TypeScript file
 * 
 * @param configPath - Path to the TypeScript config file
 * @returns The loaded configuration
 */
async function loadTypeScriptConfig(configPath: string): Promise<Config> {
  try {
    let moduleConfig: Record<string, unknown> | null = null;

    try {
      // First try importing from absolute path
      const absolutePath = `file://${Deno.cwd()}/${configPath}`;
      const module = await import(absolutePath);
      moduleConfig = module.default || module.config;
    } catch (importError) {
      try {
        // If that fails, try importing relative to the current directory
        const module = await import(`./${configPath}`);
        moduleConfig = module.default || module.config;
      } catch (relativeImportError) {
        // If both attempts fail, try importing directly (for JSR usage)
        const module = await import(configPath);
        moduleConfig = module.default || module.config;
      }
    }

    if (!moduleConfig) {
      throw new Error(`Could not load config from ${configPath}`);
    }

    return { ...DEFAULT_CONFIG, ...moduleConfig } as Config;
  } catch (error) {
    console.error(`Error loading TypeScript config from ${configPath}: ${error instanceof Error ? error.message : String(error)}`);
    return DEFAULT_CONFIG as Config;
  }
}

/**
 * Save configuration to file
 * 
 * @param configData - Configuration to save
 * @param configPath - Optional path to save config file
 */
export async function saveConfig(configData: Partial<Config>, configPath?: string): Promise<void> {
  const currentConfig = await loadConfig();
  const newConfig = { ...currentConfig, ...configData };
  const path = configPath || CONFIG_FILENAME_JSON;

  try {
    await Deno.writeTextFile(path, JSON.stringify(newConfig, null, 2));
    config = newConfig;
  } catch (error) {
    throw new Error(`Failed to save config: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get the full output path based on configuration
 * 
 * @param config - The configuration
 * @returns The full output path including filename and extension
 */
export function getOutputPath(config: Config): string {
  return join(config.output.path, `${config.output.filename}.${config.output.extension}`);
}

/**
 * Generate import statements based on configuration
 * 
 * @param config - The configuration
 * @returns The import statements as a string
 */
export function generateImports(config: Config): string {
  const { style, paths, schemaSystem } = config.imports;

  if (schemaSystem === "effect") {
    const effectPath = paths.effect || "@effect/schema";

    if (style === "esm") {
      return `import { Schema } from "${effectPath}";\nimport { pipe } from "effect/Function";\nimport type { RecordId } from "surrealdb";`;
    }
    if (style === "commonjs") {
      return `const { Schema } = require("${effectPath}");\nconst { pipe } = require("effect/Function");\nconst { RecordId } = require("surrealdb");`;
    }
    if (style === "deno") {
      return `import { Schema } from "${effectPath}";\nimport { pipe } from "effect/Function";\nimport type { RecordId } from "surrealdb";`;
    }

    // Default to ESM
    return `import { Schema } from "${effectPath}";\nimport { pipe } from "effect/Function";\nimport type { RecordId } from "surrealdb";`;
  }

  // Default to TypeBox
  const typeboxPath = paths.typebox || "@sinclair/typebox";

  if (style === "esm") {
    return `import { Type, type Static } from "${typeboxPath}";\nimport type { RecordId } from "surrealdb";`;
  }
  if (style === "commonjs") {
    return `const { Type } = require("${typeboxPath}");\nconst { RecordId } = require("surrealdb");`;
  }
  if (style === "deno") {
    return `import { Type, type Static } from "${typeboxPath}";\nimport type { RecordId } from "surrealdb";`;
  }

  // Default to ESM
  return `import { Type, type Static } from "${typeboxPath}";\nimport type { RecordId } from "surrealdb";`;
} 