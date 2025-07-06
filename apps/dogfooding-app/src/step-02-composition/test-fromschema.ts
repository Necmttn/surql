/**
 * Test fromSchema method specifically
 */

import { Schema } from "effect";
import { SurrealField } from "@necmttn/surql-schema";

console.log("🔧 Testing SurrealField.fromSchema method...\n");

// Create a simple branded schema
const Email = Schema.String.pipe(
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    title: "Email",
    description: "Must be a valid email address",
  }),
  Schema.brand("Email")
);

console.log("📧 Created Email schema with brand and validation");

// Test if fromSchema method exists
console.log("🔍 Testing fromSchema method availability:");
console.log(`   SurrealField.fromSchema exists: ${typeof SurrealField.fromSchema === 'function'}`);

if (typeof SurrealField.fromSchema === 'function') {
  try {
    const emailField = SurrealField.fromSchema("email", Email);
    console.log("✅ fromSchema method works!");
    console.log(`   Field name: ${emailField.getName()}`);
    console.log(`   Field type: ${emailField.getType()}`);
    console.log(`   Field description: ${emailField.getDescription()}`);
    
    // Test SurrealQL generation
    console.log("\n🗄️  Generated SurrealQL:");
    console.log(emailField.toSurrealQL("user"));
    
  } catch (error) {
    console.log("❌ Error using fromSchema:");
    console.log(error);
  }
} else {
  console.log("❌ fromSchema method not found");
}

// Test other basic methods still work
console.log("\n🧪 Testing basic field creation:");
try {
  const basicField = SurrealField.string("name");
  console.log("✅ Basic field creation works");
  console.log(`   Basic field name: ${basicField.getName()}`);
  console.log(`   Basic field type: ${basicField.getType()}`);
} catch (error) {
  console.log("❌ Error with basic field creation:");
  console.log(error);
}