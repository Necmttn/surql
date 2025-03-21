#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

/**
 * CLI tool to convert SurrealDB schema formats between:
 * - NORMAL/ANY table types
 * - SCHEMAFULL/SCHEMALESS modes
 * - Add/remove OVERWRITE keyword
 */

import { parseArgs } from "@std/cli";
import { exists } from "@std/fs";
import { basename, join } from "@std/path";
import { parseSurQL } from "../lib/schema.ts";
import { loadConfig } from "../lib/config.ts";

// Parse command line arguments
const args = parseArgs(Deno.args, {
  boolean: ["help", "add-overwrite", "remove-overwrite"],
  string: ["input", "output", "table-type", "schema-mode"],
  alias: {
    h: "help",
    i: "input",
    o: "output",
    t: "table-type",
    s: "schema-mode",
    a: "add-overwrite",
    r: "remove-overwrite",
  },
  default: {
    output: "",
  },
});

// Display help message
if (args.help) {
  console.log(`
  SurrealDB Schema Format Converter

  Convert SurrealDB schema files between different formats:
  - Change table type (NORMAL/ANY)
  - Change schema mode (SCHEMAFULL/SCHEMALESS)
  - Add or remove OVERWRITE keyword

  Usage:
    ./schema_converter.ts [options]

  Options:
    -h, --help                    Show this help message
    -i, --input <file>            Input schema file (required)
    -o, --output <file>           Output schema file (defaults to input-converted.surql)
    -t, --table-type <type>       Force table type (NORMAL or ANY)
    -s, --schema-mode <mode>      Force schema mode (SCHEMAFULL or SCHEMALESS)
    -a, --add-overwrite           Add OVERWRITE keyword to all definitions
    -r, --remove-overwrite        Remove OVERWRITE keyword from all definitions

  Examples:
    ./schema_converter.ts --input schema.surql --table-type NORMAL --schema-mode SCHEMAFULL
    ./schema_converter.ts --input schema.surql --add-overwrite
    ./schema_converter.ts --input schema.surql --remove-overwrite --output schema_clean.surql
  `);
  Deno.exit(0);
}

// Check required arguments
if (!args.input) {
  console.error("Error: Input file is required. Use --input or -i option.");
  Deno.exit(1);
}

// Set output file name if not provided
if (!args.output) {
  const inputBasename = basename(args.input);
  const parts = inputBasename.split(".");
  if (parts.length > 1) {
    parts.splice(parts.length - 1, 0, "converted");
  } else {
    parts.push("converted");
  }
  args.output = join(Deno.cwd(), parts.join("."));
}

// Validate table type and schema mode
if (args["table-type"] && !["NORMAL", "ANY"].includes(args["table-type"].toUpperCase())) {
  console.error("Error: Table type must be NORMAL or ANY.");
  Deno.exit(1);
}

if (args["schema-mode"] && !["SCHEMAFULL", "SCHEMALESS"].includes(args["schema-mode"].toUpperCase())) {
  console.error("Error: Schema mode must be SCHEMAFULL or SCHEMALESS.");
  Deno.exit(1);
}

// Check that input file exists
const inputFile = args.input as string;
if (!(await exists(inputFile))) {
  console.error(`Error: Input file '${inputFile}' does not exist.`);
  Deno.exit(1);
}

// Main function to convert schema
async function convertSchema() {
  try {
    // Read input file
    const inputSchema = await Deno.readTextFile(args.input);

    // Parse the input schema to validate it
    const tables = parseSurQL(inputSchema);
    if (tables.length === 0) {
      console.error("Error: No tables found in input schema.");
      Deno.exit(1);
    }

    console.log(`Found ${tables.length} tables in input schema.`);

    // Create a mock config with db connection details
    // (we won't actually connect to a database)
    const config = await loadConfig();

    // Process the schema line by line to transform it
    const lines = inputSchema.split("\n");
    const transformedLines: string[] = [];

    for (const line of lines) {
      let transformedLine = line;

      // Handle table definitions
      if (line.trim().startsWith("DEFINE TABLE")) {
        // Process OVERWRITE keyword
        if (args["add-overwrite"] && !line.includes("OVERWRITE")) {
          transformedLine = transformedLine.replace("DEFINE TABLE", "DEFINE TABLE OVERWRITE");
        } else if (args["remove-overwrite"]) {
          transformedLine = transformedLine.replace("DEFINE TABLE OVERWRITE", "DEFINE TABLE");
        }

        // Process table type
        if (args["table-type"]) {
          const tableType = args["table-type"].toUpperCase();
          // Replace existing TYPE xxx with the new type
          if (transformedLine.includes("TYPE ")) {
            transformedLine = transformedLine.replace(/TYPE\s+\w+/i, `TYPE ${tableType}`);
          } else {
            // If no TYPE specified, add it before PERMISSIONS
            transformedLine = transformedLine.replace("PERMISSIONS", `TYPE ${tableType} PERMISSIONS`);
          }
        }

        // Process schema mode
        if (args["schema-mode"]) {
          const schemaMode = args["schema-mode"].toUpperCase();
          // Check if there's already a schema mode
          if (transformedLine.includes("SCHEMAFULL") || transformedLine.includes("SCHEMALESS")) {
            transformedLine = transformedLine
              .replace("SCHEMAFULL", schemaMode)
              .replace("SCHEMALESS", schemaMode);
          } else {
            // If no schema mode specified, add it before PERMISSIONS
            transformedLine = transformedLine.replace("PERMISSIONS", `${schemaMode} PERMISSIONS`);
          }
        }
      }

      // Handle field definitions
      if (line.trim().startsWith("DEFINE FIELD")) {
        // Process OVERWRITE keyword for fields
        if (args["add-overwrite"] && !line.includes("OVERWRITE")) {
          transformedLine = transformedLine.replace("DEFINE FIELD", "DEFINE FIELD OVERWRITE");
        } else if (args["remove-overwrite"]) {
          transformedLine = transformedLine.replace("DEFINE FIELD OVERWRITE", "DEFINE FIELD");
        }
      }

      transformedLines.push(transformedLine);
    }

    // Write the transformed schema to the output file
    await Deno.writeTextFile(args.output, transformedLines.join("\n"));

    console.log(`Successfully converted schema and saved to ${args.output}`);

  } catch (error: unknown) {
    console.error("Error converting schema:", error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}

// Run the conversion
await convertSchema(); 