/**
 * IntelliSense Test File
 *
 * Open this file in your IDE and hover over the imports and methods
 * to verify TypeScript intellisense is working properly.
 */

// biome-ignore assist/source/organizeImports: <explanation>
import {
  SurrealField,
  SurrealTable,
  SurrealSchema,
} from "@necmttn/surql-schema";

// Test 1: Hover over SurrealField - should show class documentation
const field = SurrealField.string("test");

// Test 2: Hover over .string() - should show method signature and JSDoc
const stringField = SurrealField.string("name");

// Test 3: Hover over .withDescription() - should show method documentation
const describedField = stringField.withDescription("A test field");

// Test 4: Hover over .unique() - should show unique constraint documentation
const uniqueField = stringField.unique();

// Test 5: Method chaining should show intellisense at each step
const fullField = SurrealField.string("email")
  .unique() // <- hover here
  .withDescription("Email") // <- hover here
  .default("''"); // <- hover here

// Test 6: Table creation should show autocomplete for field methods
const table = SurrealTable.create("test", [
  SurrealField.string("name"), // <- hover over SurrealField
  SurrealField.number("age"), // <- hover over .number
  SurrealField.boolean("active"), // <- hover over .boolean
]);

// Test 7: Schema assembly
const schema = SurrealSchema.create("test", "1.0.0") // <- hover over .create
  .addTable(table); // <- hover over .addTable

console.log("IntelliSense test file loaded successfully!");
console.log(
  "Check your IDE's hover tooltips and autocomplete on the code above.",
);

// Export for testing
export {
  field,
  stringField,
  describedField,
  uniqueField,
  fullField,
  table,
  schema,
};
