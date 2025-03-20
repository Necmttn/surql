import type { Config } from "@necmttn/surql-gen";

/**
 * surql-gen configuration
 * 
 * This TypeScript configuration file provides type checking and autocompletion
 * for surql-gen configuration options.
 */
export const config: Config = {
  "output": {
    "path": "./generated",
    "filename": "schema",
    "extension": "ts"
  },
  "imports": {
    "style": "esm",
    "paths": {
      "typebox": "@sinclair/typebox"
    }
  },
  "db": {
    "url": "http://localhost:8000",
    "username": "root",
    "password": "root",
    "namespace": "test",
    "database": "telegram"
  }
};

// Configuration explanation:
// - output: Controls where and how the generated files are created
//   - path: The output directory
//   - filename: The base filename (without extension)
//   - extension: The file extension (ts, js, or d.ts)
//
// - imports: Controls how imports are generated
//   - style: The module style (esm, commonjs, or deno)
//   - paths: Custom import paths for dependencies
//
// - db: Database connection settings (optional)
//   - url: SurrealDB endpoint URL
//   - username: Username for authentication
//   - password: Password for authentication
//   - namespace: Namespace to use
//   - database: Database to use

export default config;
