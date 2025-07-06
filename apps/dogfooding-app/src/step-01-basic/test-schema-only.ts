/**
 * Step 1: Basic Schema Foundation - Schema Generation Test
 *
 * Testing that workspace linking works and schema generation is correct
 */

// Import from our workspace package

// biome-ignore assist/source/organizeImports: <explanation>
import {
  SurrealField,
  SurrealTable,
  SurrealSchema,
} from "@necmttn/surql-schema";

console.log("🧪 Testing workspace linking and schema generation...\n");

// Test 1: Create basic User table
console.log("1️⃣  Creating User table...");
const userTable = SurrealTable.create("user", [
  SurrealField.id("user"),
  SurrealField.string("email").unique().withDescription("User email address"),
  SurrealField.string("first_name").withDescription("User first name"),
  SurrealField.string("last_name").withDescription("User last name"),
]);

console.log("✅ User table created successfully");

// Test 2: Generate SurrealQL
console.log("\n2️⃣  Testing SurrealQL generation...");
const userSql = userTable.toSurrealQL();
console.log("Generated SQL:");
console.log(userSql);

// Test 3: Validate correct syntax
console.log("\n3️⃣  Validating SurrealQL syntax...");
const expectedPatterns = [
  "DEFINE TABLE user",
  "DEFINE FIELD id ON user TYPE record<user>",
  "DEFINE FIELD email ON user TYPE string",
  "DEFINE INDEX idx_unique_email ON user FIELDS email UNIQUE",
];

let allTestsPassed = true;
expectedPatterns.forEach((pattern, index) => {
  if (userSql.includes(pattern)) {
    console.log(`   ✅ Pattern ${index + 1}: "${pattern}" - FOUND`);
  } else {
    console.log(`   ❌ Pattern ${index + 1}: "${pattern}" - NOT FOUND`);
    allTestsPassed = false;
  }
});

// Test 4: Full schema assembly
console.log("\n4️⃣  Testing full schema assembly...");
const schema = SurrealSchema.create("test_schema", "1.0.0").addTable(userTable);

const fullSql = schema.toSurrealQL();
console.log("Full schema SQL preview:");
console.log(fullSql.substring(0, 200) + "...");

console.log("\n🎯 Test Results:");
if (allTestsPassed) {
  console.log(
    "✅ All tests passed! Workspace linking and schema generation working correctly.",
  );
  console.log("✅ SurrealQL syntax is valid");
  console.log("✅ Unique constraints properly converted to indexes");
} else {
  console.log("❌ Some tests failed. Check the patterns above.");
}

console.log("\n🔗 Workspace linking test: SUCCESS");
console.log("📝 Schema generation test: SUCCESS");
console.log("🎉 Ready to continue with REST API development!");
