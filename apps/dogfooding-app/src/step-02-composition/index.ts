/**
 * Step 2: Schema.pipe Composition Patterns
 *
 * This demonstrates how to use Effect Schema's .pipe() for reusable constraints
 * and composable validation logic.
 */

import { Schema } from "effect";
import { SurrealTable, SurrealField } from "@necmttn/surql-schema";

console.log("🔧 Step 2: Schema.pipe Composition Patterns");
console.log(
  "🎯 Goal: Create reusable validation constraints with Schema.pipe\n",
);

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
  Schema.brand("Email"),
);

/**
 * Username validation (alphanumeric + underscore, 3-20 chars)
 */
const Username = Schema.String.pipe(
  Schema.pattern(/^[a-zA-Z0-9_]{3,20}$/, {
    title: "Username",
    description: "3-20 characters, alphanumeric and underscore only",
  }),
  Schema.brand("Username"),
);

/**
 * Strong password requirements
 */
const StrongPassword = Schema.String.pipe(
  Schema.minLength(8, {
    title: "Minimum Length",
    description: "Password must be at least 8 characters",
  }),
  Schema.pattern(/(?=.*[a-z])/, {
    description: "Must contain lowercase letter",
  }),
  Schema.pattern(/(?=.*[A-Z])/, {
    description: "Must contain uppercase letter",
  }),
  Schema.pattern(/(?=.*\d)/, { description: "Must contain number" }),
  Schema.pattern(/(?=.*[@$!%*?&])/, {
    description: "Must contain special character",
  }),
  Schema.brand("StrongPassword"),
);

/**
 * Slug validation for URLs (lowercase, alphanumeric, hyphens)
 */
const Slug = Schema.String.pipe(
  Schema.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    title: "Slug",
    description: "URL-friendly identifier (lowercase, alphanumeric, hyphens)",
  }),
  Schema.brand("Slug"),
);

/**
 * Phone number validation (US format)
 */
const PhoneNumber = Schema.String.pipe(
  Schema.pattern(
    /^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
    {
      title: "Phone Number",
      description: "US phone number format",
    },
  ),
  Schema.brand("PhoneNumber"),
);

/**
 * URL validation
 */
const Url = Schema.String.pipe(
  Schema.pattern(/^https?:\/\/[^\s/$.?#].[^\s]*$/, {
    title: "URL",
    description: "Valid HTTP or HTTPS URL",
  }),
  Schema.brand("Url"),
);

/**
 * Positive integer constraint
 */
const PositiveInt = Schema.Number.pipe(
  Schema.int({ title: "Integer", description: "Must be a whole number" }),
  Schema.positive({ title: "Positive", description: "Must be greater than 0" }),
  Schema.brand("PositiveInt"),
);

/**
 * Score validation (0-100)
 */
const Score = Schema.Number.pipe(
  Schema.int(),
  Schema.between(0, 100, {
    title: "Score",
    description: "Score between 0 and 100",
  }),
  Schema.brand("Score"),
);

console.log("✅ Created reusable constraints:");
console.log("   • Email - branded email validation");
console.log("   • Username - alphanumeric + underscore, 3-20 chars");
console.log("   • StrongPassword - comprehensive password rules");
console.log("   • Slug - URL-friendly identifiers");
console.log("   • PhoneNumber - US phone format");
console.log("   • Url - HTTP/HTTPS validation");
console.log("   • PositiveInt - positive integer constraint");
console.log("   • Score - 0-100 range validation\n");

// ========================================
// 2. Compose Advanced Field Definitions
// ========================================

console.log("2️⃣  Composing advanced field definitions...\n");

/**
 * User table with composed validation schemas
 */
const userTable = SurrealTable.create("user", [
  SurrealField.id("user"),

  // Use pre-composed Email schema
  SurrealField.fromSchema("email", Email)
    .unique()
    .withDescription("User email address with validation"),

  // Use Username schema
  SurrealField.fromSchema("username", Username)
    .unique()
    .withDescription("Unique username identifier"),

  // Regular fields with custom constraints
  SurrealField.string("first_name").withDescription("User first name"),

  SurrealField.string("last_name").withDescription("User last name"),

  // Optional fields with validation
  SurrealField.fromSchema(
    "phone",
    Schema.optional(PhoneNumber),
  ).withDescription("User phone number (optional)"),

  SurrealField.fromSchema("website", Schema.optional(Url)).withDescription(
    "User website URL (optional)",
  ),

  // Derived full name field (computed)
  SurrealField.string("full_name").withDescription("Computed full name field"),

  // Metadata fields
  SurrealField.boolean("is_active")
    .default("true")
    .withDescription("User account status"),

  SurrealField.datetime("created_at")
    .default("time::now()")
    .withDescription("Account creation timestamp"),

  SurrealField.datetime("last_login")
    .optional()
    .withDescription("Last login timestamp"),
]).withDescription("User accounts with comprehensive validation");

/**
 * Project table with slug-based identification
 */
const projectTable = SurrealTable.create("project", [
  SurrealField.id("project"),

  SurrealField.string("name").withDescription("Project display name"),

  // URL-friendly identifier
  SurrealField.fromSchema("slug", Slug)
    .unique()
    .withDescription("URL-friendly project identifier"),

  SurrealField.string("description")
    .optional()
    .withDescription("Project description"),

  SurrealField.record("owner", "user").withDescription("Project owner"),

  SurrealField.enum("status", ["planning", "active", "completed", "archived"])
    .default("'planning'")
    .withDescription("Project status"),

  // Project metrics with validation
  SurrealField.fromSchema("priority_score", Score)
    .default("50")
    .withDescription("Priority score (0-100)"),

  SurrealField.fromSchema("team_size", PositiveInt)
    .default("1")
    .withDescription("Number of team members"),

  SurrealField.datetime("created_at")
    .default("time::now()")
    .withDescription("Project creation timestamp"),

  SurrealField.datetime("deadline")
    .optional()
    .withDescription("Project deadline"),
]).withDescription("Projects with URL-friendly slugs and metrics");

/**
 * Advanced user profile table
 */
const userProfileTable = SurrealTable.create("user_profile", [
  SurrealField.id("user_profile"),

  SurrealField.record("user", "user")
    .unique()
    .withDescription("Associated user account"),

  // Profile information with validation
  SurrealField.string("bio")
    .optional()
    .withDescription("User biography"),

  SurrealField.string("job_title")
    .optional()
    .withDescription("Current job title"),

  SurrealField.string("company").optional().withDescription("Current company"),

  SurrealField.string("location").optional().withDescription("User location"),

  // Social links with URL validation
  SurrealField.fromSchema("github_url", Schema.optional(Url)).withDescription(
    "GitHub profile URL",
  ),

  SurrealField.fromSchema("linkedin_url", Schema.optional(Url)).withDescription(
    "LinkedIn profile URL",
  ),

  SurrealField.fromSchema("twitter_url", Schema.optional(Url)).withDescription(
    "Twitter profile URL",
  ),

  // Skills and experience
  SurrealField.array("skills", "string")
    .default("[]")
    .withDescription("List of user skills"),

  SurrealField.fromSchema(
    "years_experience",
    Schema.optional(PositiveInt),
  ).withDescription("Years of professional experience"),

  // Privacy settings
  SurrealField.boolean("profile_public")
    .default("true")
    .withDescription("Whether profile is publicly visible"),

  SurrealField.boolean("show_email")
    .default("false")
    .withDescription("Whether to show email publicly"),

  SurrealField.datetime("updated_at")
    .default("time::now()")
    .withDescription("Profile last update timestamp"),
]).withDescription(
  "Extended user profiles with social links and privacy controls",
);

console.log("✅ Created advanced table schemas:");
console.log(
  "   • user - with Email, Username, PhoneNumber, and Url validation",
);
console.log("   • project - with Slug identifiers and Score metrics");
console.log(
  "   • user_profile - with comprehensive validation and social links\n",
);

// ========================================
// 3. Test Schema Validation
// ========================================

console.log("3️⃣  Testing schema validation...\n");

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
  console.log(
    `   ❌ Expected error for invalid email: ${error.message.split("\n")[0]}`,
  );
}

// Test username validation
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
  console.log(
    `   ❌ Expected error for short username: ${error.message.split("\n")[0]}`,
  );
}

// Test strong password validation
console.log("\n🔐 Testing StrongPassword validation:");
try {
  const validPassword = Schema.decodeSync(StrongPassword)("MyStrong123!");
  console.log(`   ✅ Valid password accepted`);
} catch (error) {
  console.log(`   ❌ Error: ${error}`);
}

try {
  const weakPassword = Schema.decodeSync(StrongPassword)("weak");
  console.log(`   ✅ Should not reach here`);
} catch (error) {
  console.log(
    `   ❌ Expected error for weak password: ${error.message.split("\n")[0]}`,
  );
}

// Test slug validation
console.log("\n🔗 Testing Slug validation:");
try {
  const validSlug = Schema.decodeSync(Slug)("my-awesome-project");
  console.log(`   ✅ Valid: ${validSlug}`);
} catch (error) {
  console.log(`   ❌ Error: ${error}`);
}

try {
  const invalidSlug = Schema.decodeSync(Slug)("My Project!"); // Spaces and special chars
  console.log(`   ✅ Should not reach here`);
} catch (error) {
  console.log(
    `   ❌ Expected error for invalid slug: ${error.message.split("\n")[0]}`,
  );
}

console.log();

// ========================================
// 4. Generate Schemas and SQL
// ========================================

console.log("4️⃣  Generating schemas and SQL...\n");

const schema = {
  tables: [userTable, projectTable, userProfileTable],
};

console.log("📋 Schema Summary:");
console.log(`   • Tables: ${schema.tables.length}`);
console.log(
  `   • Total Fields: ${schema.tables.reduce((acc, table) => acc + table.fields.length, 0)}`,
);

// Generate SurrealQL
console.log("\n🗄️  Generated SurrealQL:");
console.log("=" + "=".repeat(50));
schema.tables.forEach((table) => {
  console.log(table.toSurrealQL());
  console.log();
});

// Generate TypeScript interfaces
console.log("🔧 Generated TypeScript Interfaces:");
console.log("=" + "=".repeat(50));
schema.tables.forEach((table) => {
  console.log(table.toTypeScriptInterface());
  console.log();
});

// ========================================
// 5. Demonstrate Composition Benefits
// ========================================

console.log("5️⃣  Demonstrating composition benefits...\n");

console.log("🎯 Key Benefits of Schema.pipe Composition:");
console.log("   ✅ Reusable: Define validation logic once, use everywhere");
console.log("   ✅ Composable: Chain multiple constraints together");
console.log(
  "   ✅ Type-safe: Branded types prevent mixing incompatible values",
);
console.log("   ✅ Descriptive: Rich error messages with context");
console.log(
  "   ✅ Testable: Validation logic can be unit tested independently",
);

console.log("\n🔍 Example Composition Chain:");
console.log("   Schema.String");
console.log("   .pipe(Schema.pattern(...))      // Format validation");
console.log("   .pipe(Schema.brand('Email'))    // Type branding");
console.log("   → Result: Branded Email type with validation");

console.log("\n📊 Validation Constraint Reuse:");
console.log("   • Email: Used in user.email");
console.log("   • Username: Used in user.username");
console.log("   • Url: Used in website, github_url, linkedin_url, twitter_url");
console.log("   • PositiveInt: Used in team_size, years_experience");
console.log("   • Score: Used in priority_score");

console.log("\n✨ This approach enables:");
console.log("   • Consistent validation across your application");
console.log("   • Easy maintenance of validation rules");
console.log("   • Clear separation of concerns");
console.log("   • Better type safety with branded types");
console.log("   • Rich error messages for better UX");

console.log("\n🎉 Step 2 Complete!");
console.log(
  "📝 Next: Step 3 will explore .annotations() for rich metadata and documentation",
);
