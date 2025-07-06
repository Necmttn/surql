import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules", "dist", ".idea", ".git", ".cache"],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    isolate: true,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    reporter: ["verbose", "json", "html"],
    outputFile: {
      json: "./test-results/results.json",
      html: "./test-results/index.html",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.{test,spec}.ts", "src/examples/**", "src/cli/**", "src/tests/**"],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": "/src",
      "@lib": "/src/lib",
      "@schema": "/src/lib/schema",
      "@examples": "/src/examples",
    },
  },
});
