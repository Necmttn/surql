import type { Config } from "./lib/config.ts";

/**
 * surql-gen configuration
 * 
 * This TypeScript configuration file provides type checking and autocompletion
 * for surql-gen configuration options.
 */
export const config: Config = {
  output: {
    path: "./generated",
    filename: "schema",
    extension: "ts"
  },
  imports: {
    style: "esm",
    paths: {
      typebox: "@sinclair/typebox"
    }
  },
  db: {
    url: "http://localhost:8000",
    username: "root",
    password: "root",
    namespace: "test",
    database: "telegram"
  }
};

export default config; 