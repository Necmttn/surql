import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { afterEach, beforeEach } from "vitest";

// Test utilities and setup
export const TEST_MIGRATIONS_DIR = "./test-migrations";
export const TEST_GENERATED_DIR = "./test-generated";

// Clean up test directories before and after tests
beforeEach(async () => {
  await cleanupTestDirectories();
});

afterEach(async () => {
  await cleanupTestDirectories();
});

async function cleanupTestDirectories() {
  const dirs = [TEST_MIGRATIONS_DIR, TEST_GENERATED_DIR];

  for (const dir of dirs) {
    if (existsSync(dir)) {
      await rm(dir, { recursive: true, force: true });
    }
  }
}

// Test helper functions
export function expectSurrealQLContains(sql: string, ...patterns: string[]) {
  for (const pattern of patterns) {
    if (!sql.includes(pattern)) {
      throw new Error(
        `Expected SurrealQL to contain "${pattern}" but it didn't.\nActual SQL:\n${sql}`
      );
    }
  }
}

export function expectSurrealQLNotContains(sql: string, ...patterns: string[]) {
  for (const pattern of patterns) {
    if (sql.includes(pattern)) {
      throw new Error(
        `Expected SurrealQL to NOT contain "${pattern}" but it did.\nActual SQL:\n${sql}`
      );
    }
  }
}

export function createTestSchema() {
  // Helper to create consistent test schemas
  return {
    name: "test_schema",
    version: "1.0.0",
    description: "Test schema for unit tests",
  };
}

export function createTestTable(name = "test_table") {
  // Helper to create consistent test tables
  return {
    name,
    description: `Test table: ${name}`,
  };
}

export function createTestField(name = "test_field", type = "string") {
  // Helper to create consistent test fields
  return {
    name,
    type,
    description: `Test field: ${name}`,
  };
}
