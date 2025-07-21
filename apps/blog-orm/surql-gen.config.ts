import type { Config } from "@necmttn/surql-schema";

/**
 * surql-gen configuration for blog ORM app
 */
export const config: Config = {
  output: {
    path: "./src/db",
    filename: "schema",
    extension: "ts",
  },
  imports: {
    style: "esm",
    paths: {
      effect: "effect",
      surrealdb: "surrealdb",
    },
  },
  db: {
    url: "http://localhost:8000",
    username: "root",
    password: "root", 
    namespace: "blog",
    database: "blog",
  },
  // Enable enhanced ORM features
  features: {
    generateRepositories: true,
    generateQueryHelpers: true,
    generateValidationHelpers: true,
    generateRelationshipHelpers: true,
  }
};

export default config;