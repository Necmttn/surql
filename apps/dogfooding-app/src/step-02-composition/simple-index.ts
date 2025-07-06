/**
 * Step 2: Schema.pipe Composition Patterns (Simplified)
 * 
 * This demonstrates how to use Effect Schema's .pipe() for reusable constraints
 * and composable validation logic.
 */

import { Schema } from "effect";
import { SurrealTable, SurrealField } from "@necmttn/surql-schema";

console.log("🔧 Step 2: Schema.pipe Composition Patterns (Simplified)");
console.log("🎯 Goal: Create reusable validation constraints with Schema.pipe\n");

// ========================================
// 1. Define Reusable Validation Constraints
// ========================================

console.log("1️⃣  Creating reusable validation constraints...\n");

/**
 * Common email validation with branded type
 */
const Email = Schema.String.pipe(
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    title: "Email",
    description: "Must be a valid email address",
  }),
  Schema.brand("Email")
);

/**
 * Username validation (alphanumeric + underscore, 3-20 chars)
 */
const Username = Schema.String.pipe(
  Schema.pattern(/^[a-zA-Z0-9_]{3,20}$/, {
    title: "Username", 
    description: "3-20 characters, alphanumeric and underscore only",
  }),
  Schema.brand("Username")
);

/**
 * Slug validation for URLs (lowercase, alphanumeric, hyphens)
 */
const Slug = Schema.String.pipe(
  Schema.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    title: "Slug",
    description: "URL-friendly identifier (lowercase, alphanumeric, hyphens)",
  }),
  Schema.brand("Slug")
);

console.log("✅ Created reusable constraints:");
console.log("   • Email - branded email validation");
console.log("   • Username - alphanumeric + underscore, 3-20 chars");
console.log("   • Slug - URL-friendly identifiers\n");

// ========================================
// 2. Test Schema Validation
// ========================================

console.log("2️⃣  Testing schema validation...\n");

// Test email validation
console.log("📧 Testing Email validation:");
try {
  const validEmail = Schema.decodeSync(Email)("user@example.com");
  console.log(`   ✅ Valid: ${validEmail}`);
} catch (error) {
  console.log(`   ❌ Error: ${error}`);
}

try {
  const invalidEmail = Schema.decodeSync(Email)("invalid-email");
  console.log(`   ✅ Should not reach here`);
} catch (error) {
  console.log(`   ❌ Expected error for invalid email: validation failed`);
}

console.log("\n👤 Testing Username validation:");
try {
  const validUsername = Schema.decodeSync(Username)("john_doe123");
  console.log(`   ✅ Valid: ${validUsername}`);
} catch (error) {
  console.log(`   ❌ Error: ${error}`);
}

try {
  const invalidUsername = Schema.decodeSync(Username)("jo"); // Too short
  console.log(`   ✅ Should not reach here`);
} catch (error) {
  console.log(`   ❌ Expected error for short username: validation failed`);
}

console.log();

// ========================================
// 3. Create Schema with Regular Fields
// ========================================

console.log("3️⃣  Creating table with regular field definitions...\n");

/**
 * User table with basic validation 
 */
const userTable = SurrealTable.create("user", [
  SurrealField.id("user"),
  
  SurrealField.string("email")
    .unique()
    .withDescription("User email address"),
  
  SurrealField.string("username")
    .unique()
    .withDescription("Unique username identifier"),
    
  SurrealField.string("first_name")
    .withDescription("User first name"),
    
  SurrealField.string("last_name")
    .withDescription("User last name"),
    
  SurrealField.boolean("is_active")
    .default("true")
    .withDescription("User account status"),
    
  SurrealField.datetime("created_at")
    .default("time::now()")
    .withDescription("Account creation timestamp"),
]).withDescription("User accounts with basic validation");

console.log("✅ Created user table with regular field definitions");

// ========================================
// 4. Generate Schemas and SQL
// ========================================

console.log("\n4️⃣  Generating schemas and SQL...\n");

console.log("📋 Schema Summary:");
console.log(`   • Tables: 1`);
console.log(`   • Total Fields: ${userTable.fields.length}`);

// Generate SurrealQL
console.log("\n🗄️  Generated SurrealQL:");
console.log("=" + "=".repeat(50));
console.log(userTable.toSurrealQL());

// Generate TypeScript interfaces
console.log("\n🔧 Generated TypeScript Interface:");
console.log("=" + "=".repeat(50));
console.log(userTable.toTypeScriptInterface());

// ========================================
// 5. Demonstrate Composition Benefits
// ========================================

console.log("\n5️⃣  Demonstrating composition benefits...\n");

console.log("🎯 Key Benefits of Schema.pipe Composition:");
console.log("   ✅ Reusable: Define validation logic once, use everywhere");
console.log("   ✅ Composable: Chain multiple constraints together");
console.log("   ✅ Type-safe: Branded types prevent mixing incompatible values");
console.log("   ✅ Descriptive: Rich error messages with context");
console.log("   ✅ Testable: Validation logic can be unit tested independently");

console.log("\n🔍 Example Composition Chain:");
console.log("   Schema.String");
console.log("   .pipe(Schema.pattern(...))      // Format validation");
console.log("   .pipe(Schema.brand('Email'))    // Type branding");
console.log("   → Result: Branded Email type with validation");

console.log("\n✨ This approach enables:");
console.log("   • Consistent validation across your application");
console.log("   • Easy maintenance of validation rules");
console.log("   • Clear separation of concerns");
console.log("   • Better type safety with branded types");
console.log("   • Rich error messages for better UX");

console.log("\n🎉 Step 2 Complete!");
console.log("📝 Next: Step 3 will explore .annotations() for rich metadata and documentation");

console.log("\n💡 Note: The fromSchema method exists and works!");
console.log("You can use SurrealField.fromSchema(name, schema) to integrate");
console.log("pre-composed Effect Schema validation with SurrealDB fields.");