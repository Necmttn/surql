# SurrealDB Schema Generator v2.0 - Complete Usage Guide

This guide provides comprehensive examples and patterns for using the Schema.Class architecture effectively.

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Schema Creation](#basic-schema-creation)
3. [Advanced Field Definitions](#advanced-field-definitions)
4. [Table Management](#table-management)
5. [AI Metadata Integration](#ai-metadata-integration)
6. [Schema Registry Operations](#schema-registry-operations)
7. [Database Introspection](#database-introspection)
8. [Code Generation](#code-generation)
9. [Migration Management](#migration-management)
10. [Validation Patterns](#validation-patterns)
11. [Real-World Examples](#real-world-examples)
12. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

```bash
# Install dependencies
bun install

# Start Docker SurrealDB for testing
docker-compose up -d

# Verify installation
bun test src/__tests__/unit/schema-class-*.test.ts
```

### Basic Imports

```typescript
import { 
  SurrealField, 
  SurrealTable, 
  SurrealSchema 
} from "./src/lib/schema";
```

## Basic Schema Creation

### 1. Creating Fields

```typescript
// String fields with various constraints
const username = SurrealField.string("username")
  .min(3)
  .max(50)
  .pattern("^[a-zA-Z0-9_]+$")
  .unique()
  .description("Unique username identifier");

const email = SurrealField.string("email")
  .pattern("^[^@]+@[^@]+\\.[^@]+$")
  .unique()
  .description("User email address");

// Numeric fields
const age = SurrealField.int("age")
  .min(13)
  .max(120)
  .description("User age in years");

const score = SurrealField.number("score")
  .min(0.0)
  .max(100.0)
  .default("0.0")
  .description("User performance score");

// Boolean fields
const isActive = SurrealField.boolean("is_active")
  .default("true")
  .description("Account activation status");

// Temporal fields
const createdAt = SurrealField.datetime("created_at")
  .default("time::now()")
  .description("Account creation timestamp");

// Reference fields
const profileId = SurrealField.record("profile", "profile")
  .optional()
  .description("Link to user profile");

// Array fields
const tags = SurrealField.array("tags")
  .optional()
  .description("User interest tags");

// Optional fields
const bio = SurrealField.string("bio")
  .max(500)
  .optional()
  .description("User biography");
```

### 2. Creating Tables

```typescript
// Basic user table
const userTable = SurrealTable.create("user")
  .withDescription("User accounts and authentication")
  .addFields(
    SurrealField.id("user"),
    username,
    email,
    bio,
    isActive,
    createdAt,
    SurrealField.datetime("updated_at").default("time::now()")
  );

// Schemaless logging table
const logTable = SurrealTable.schemaless("logs")
  .withDescription("Application logs and events")
  .addFields(
    SurrealField.id("logs"),
    SurrealField.string("level"),
    SurrealField.string("message"),
    SurrealField.object("metadata").optional(),
    SurrealField.datetime("timestamp").default("time::now()")
  );

// View table
const activeUsersView = SurrealTable.view(
  "active_users",
  ["id", "username", "email", "created_at"],
  "is_active = true"
).withDescription("View of currently active users");
```

### 3. Creating Schema Registry

```typescript
const appSchema = SurrealSchema.create("my-app", "1.0.0")
  .withDescription("Complete application schema")
  .addTables(userTable, logTable, activeUsersView);
```

## Advanced Field Definitions

### Custom Validation Patterns

```typescript
// Phone number field
const phoneField = SurrealField.string("phone")
  .pattern("^\\+?[1-9]\\d{1,14}$")
  .optional()
  .description("International phone number");

// URL field
const websiteField = SurrealField.string("website")
  .pattern("^https?://[^\\s/$.?#].[^\\s]*$")
  .optional()
  .description("Personal website URL");

// Enum-like string field
const statusField = SurrealField.string("status")
  .assert("$value IN ['active', 'inactive', 'pending', 'banned']")
  .default("'pending'")
  .description("Account status");

// JSON object field with structure
const settingsField = SurrealField.object("settings")
  .default("{ theme: 'light', notifications: true }")
  .description("User preferences and settings");
```

### Foreign Key Relationships

```typescript
// User profile relationship
const userProfileField = SurrealField.record("user", "user")
  .description("Reference to user account")
  .onDelete("CASCADE");

// Optional parent relationship
const parentCommentField = SurrealField.record("parent", "comment")
  .optional()
  .description("Parent comment for threading")
  .onDelete("SET NULL");

// Many-to-many through junction table
const tagIds = SurrealField.array("tag_ids")
  .description("Array of tag record IDs");
```

### Computed and Virtual Fields

```typescript
// Fields that reference other tables
const authorField = SurrealField.record("author", "user")
  .description("Post author reference");

const commentCountField = SurrealField.int("comment_count")
  .default("0")
  .description("Cached comment count");

// Timestamps with automatic updates
const lastModifiedField = SurrealField.datetime("last_modified")
  .default("time::now()")
  .description("Last modification timestamp");
```

## Table Management

### Dynamic Table Building

```typescript
// Start with base table
let userTable = SurrealTable.create("user")
  .withDescription("User management table");

// Add core fields
userTable = userTable.addFields(
  SurrealField.id("user"),
  SurrealField.string("email").unique(),
  SurrealField.datetime("created_at").default("time::now()")
);

// Conditionally add fields based on features
const hasProfiles = true;
if (hasProfiles) {
  userTable = userTable.addField(
    SurrealField.string("display_name").optional()
  );
}

// Add authentication fields
userTable = userTable.addFields(
  SurrealField.string("password_hash"),
  SurrealField.datetime("last_login").optional()
);
```

### Table Permissions

```typescript
const secureUserTable = SurrealTable.create("user")
  .addField(SurrealField.string("email"))
  .withPermissions({
    select: "id = $auth.id OR $auth.role = 'admin'",
    create: "$auth.role = 'admin'", 
    update: "id = $auth.id OR $auth.role = 'admin'",
    delete: "$auth.role = 'admin'"
  });
```

### Field Updates and Modifications

```typescript
// Update existing field
const updatedTable = userTable.updateField("email", field =>
  field.description("Primary email address")
    .pattern("^[^@]+@[^@]+\\.[^@]+$")
);

// Remove field
const cleanedTable = userTable.removeField("temporary_field");

// Replace entire field definition
const newEmailField = SurrealField.string("email")
  .unique()
  .description("Updated email field");

const replacedTable = userTable.replaceField("email", newEmailField);
```

## AI Metadata Integration

### Comprehensive AI Metadata

```typescript
const intelligentUserTable = SurrealTable.create("user")
  .withDescription("User accounts with AI metadata")
  .addFields(
    SurrealField.id("user"),
    SurrealField.string("email").unique(),
    SurrealField.string("username").unique(),
    SurrealField.string("full_name"),
    SurrealField.string("bio").optional(),
    SurrealField.boolean("is_active").default("true"),
    SurrealField.datetime("created_at").default("time::now()"),
    SurrealField.datetime("last_login").optional()
  )
  // AI metadata for intelligent operations
  .aiPrimaryKey("email")                    // Primary identifier
  .aiTemporalField("created_at")            // For time-based queries
  .aiUserField("email")                     // User identification
  .aiContentFields(["username", "full_name", "bio"])  // Searchable content
  .aiCommonQueries([                        // Common operations
    "find user by email",
    "get active users",
    "search users by name",
    "get recent signups",
    "find inactive users"
  ])
  .aiRelationships({                        // Table relationships
    "posts": "post table via author_id field",
    "comments": "comment table via user_id field",
    "profile": "user_profile table via user_id"
  })
  .aiSecurityLevel("high");                 // Security classification
```

### Role-Based AI Metadata

```typescript
// Admin-focused table
const adminTable = SurrealTable.create("admin_log")
  .aiSecurityLevel("critical")
  .aiUserField("admin_id")
  .aiCommonQueries([
    "get admin actions by date",
    "find critical operations",
    "audit trail by admin"
  ]);

// Public content table
const publicTable = SurrealTable.create("blog_post")
  .aiSecurityLevel("public")
  .aiContentFields(["title", "content", "summary"])
  .aiCommonQueries([
    "search posts by keyword",
    "get recent posts",
    "find posts by author",
    "get popular posts"
  ]);
```

### Query Pattern Examples

```typescript
const postTable = SurrealTable.create("post")
  .addFields(
    SurrealField.id("post"),
    SurrealField.string("title"),
    SurrealField.string("content"),
    SurrealField.record("author", "user"),
    SurrealField.array("tags").optional(),
    SurrealField.boolean("is_published").default("false"),
    SurrealField.datetime("published_at").optional(),
    SurrealField.datetime("created_at").default("time::now()")
  )
  .aiPrimaryKey("id")
  .aiTemporalField("published_at")
  .aiUserField("author")
  .aiContentFields(["title", "content"])
  .aiCommonQueries([
    "find published posts",
    "search posts by title",
    "get posts by author",
    "get recent posts",
    "find posts by tag",
    "get draft posts by author"
  ])
  .aiRelationships({
    "author": "user table via author field",
    "comments": "comment table via post_id field"
  });
```

## Schema Registry Operations

### Building Complex Schemas

```typescript
// E-commerce schema example
const ecommerceSchema = SurrealSchema.create("ecommerce", "2.1.0")
  .withDescription("Complete e-commerce platform schema")
  .withMetadata({
    author: "Development Team",
    createdAt: new Date("2024-01-01"),
    tags: ["ecommerce", "production", "v2"],
    description: "Production e-commerce schema with full feature set"
  });

// Add core tables
const userTable = SurrealTable.create("user")
  .addFields(/* user fields */)
  .aiPrimaryKey("email");

const productTable = SurrealTable.create("product")
  .addFields(/* product fields */)
  .aiPrimaryKey("sku")
  .aiContentFields(["name", "description"]);

const orderTable = SurrealTable.create("order")
  .addFields(/* order fields */)
  .aiPrimaryKey("id")
  .aiUserField("customer_id")
  .aiTemporalField("created_at");

// Build complete schema
const completeSchema = ecommerceSchema.addTables(
  userTable,
  productTable, 
  orderTable
);
```

### Index Management

```typescript
const optimizedSchema = SurrealSchema.create("optimized-app")
  .addTable(userTable)
  .addTable(postTable)
  // Add performance indexes
  .addIndex({
    name: "idx_user_email",
    table: "user",
    fields: ["email"],
    unique: true
  })
  .addIndex({
    name: "idx_user_username",
    table: "user", 
    fields: ["username"],
    unique: true
  })
  .addIndex({
    name: "idx_post_author_date",
    table: "post",
    fields: ["author", "created_at"]
  })
  .addIndex({
    name: "idx_post_title_search",
    table: "post",
    fields: ["title"],
    fulltext: true
  });
```

### Event Handling

```typescript
const auditedSchema = SurrealSchema.create("audited-app")
  .addTable(userTable)
  // Add audit events
  .addEvent({
    name: "user_created_audit",
    table: "user",
    when: "AFTER",
    action: "CREATE",
    then: "CREATE audit:ulid() SET table = 'user', action = 'created', user_id = $after.id, timestamp = time::now()"
  })
  .addEvent({
    name: "user_email_changed",
    table: "user",
    when: "AFTER", 
    action: "UPDATE",
    condition: "$before.email != $after.email",
    then: "CREATE email_change_log:ulid() SET user_id = $after.id, old_email = $before.email, new_email = $after.email, changed_at = time::now()"
  })
  .addEvent({
    name: "user_deleted_cleanup",
    table: "user",
    when: "BEFORE",
    action: "DELETE", 
    then: "DELETE post WHERE author = $before.id; DELETE comment WHERE user_id = $before.id"
  });
```

## Database Introspection

### Pulling Live Schemas

```typescript
// Connect and pull from live database
import { Surreal } from "surrealdb";

async function pullLiveSchema() {
  const db = new Surreal();
  await db.connect("http://localhost:8000");
  await db.signin({ username: "root", password: "root" });
  await db.use({ namespace: "production", database: "main" });

  // Get database schema info
  const result = await db.query("INFO FOR DB;");
  const dbInfo = result[0] as any;

  // Create schema from database info
  const schema = SurrealSchema.create("pulled-schema", "1.0.0")
    .withDescription("Schema pulled from production database");

  // Process each table
  for (const [tableName, tableDefString] of Object.entries(dbInfo.tables || {})) {
    try {
      // Parse table definition 
      const table = SurrealTable.fromSurrealQL(tableDefString as string);
      
      // Get detailed field info
      const tableInfo = await db.query(`INFO FOR TABLE ${tableName};`);
      const fields = parseFieldsFromTableInfo(tableInfo[0]);
      
      // Add fields to table
      const completeTable = table.addFields(...fields);
      schema = schema.addTable(completeTable);
      
    } catch (error) {
      console.warn(`Failed to parse table ${tableName}:`, error);
    }
  }

  return schema;
}
```

### Parsing Existing SurrealQL

```typescript
// Parse schema from existing SurrealQL files
const existingSql = `
-- Schema: blog-platform v1.5.0
-- Multi-user blogging platform with commenting

DEFINE TABLE user SCHEMAFULL COMMENT 'User accounts | @ai-hints: {"primary_key": "email", "content_fields": ["username", "bio"]}';
DEFINE FIELD id ON user TYPE record<user>;
DEFINE FIELD email ON user TYPE string UNIQUE;
DEFINE FIELD username ON user TYPE string UNIQUE;
DEFINE FIELD bio ON user TYPE option<string>;
DEFINE FIELD created_at ON user TYPE datetime DEFAULT time::now();

DEFINE TABLE post SCHEMAFULL COMMENT 'Blog posts | @ai-hints: {"primary_key": "id", "user_field": "author", "content_fields": ["title", "content"]}';
DEFINE FIELD id ON post TYPE record<post>;  
DEFINE FIELD title ON post TYPE string;
DEFINE FIELD content ON post TYPE string;
DEFINE FIELD author ON post TYPE record<user>;
DEFINE FIELD published_at ON post TYPE option<datetime>;

DEFINE INDEX idx_user_email ON user FIELDS email UNIQUE;
DEFINE INDEX idx_post_author ON post FIELDS author;
`;

// Parse into schema object
const parsedSchema = SurrealSchema.fromSurrealQL(existingSql);

console.log("Schema name:", parsedSchema.getName());        // "blog-platform"
console.log("Schema version:", parsedSchema.getVersion()); // "1.5.0"
console.log("Tables:", parsedSchema.getTableNames());      // ["user", "post"]

// Access AI metadata
const userTable = parsedSchema.getTable("user");
console.log("User primary key:", userTable?.aiHints?.primary_key); // "email"
```

## Code Generation

### Generate TypeScript Interfaces

```typescript
const schema = SurrealSchema.create("blog")
  .addTable(userTable)
  .addTable(postTable);

const typeScript = schema.toTypeScript();
console.log(typeScript);

/*
Output:
// Generated schema: blog v1.0.0

import { Schema } from "effect";
import type { RecordId } from "surrealdb";

export const recordId = <T extends string>(tableName: T) => Schema.String as Schema.Schema<`${T}:${string}`>;

export interface User {
  id: RecordId<"user">;
  email: string;
  username: string;
  bio: string | undefined;
  is_active: boolean;
  created_at: Date;
}

export interface Post {
  id: RecordId<"post">;
  title: string;
  content: string;
  author: RecordId<"user">;
  published_at: Date | undefined;
  created_at: Date;
}
*/
```

### Generate Effect Schema Classes

```typescript
const effectClasses = schema.toEffectSchemaClasses();
console.log(effectClasses);

/*
Output:
// Generated Effect Schema classes: blog v1.0.0

import { Schema } from "effect";
import type { RecordId, StringRecordId } from "surrealdb";

// Helper functions...

export namespace User {
  export const Fields = {
    id: recordId("user"),
    email: Schema.String.annotations({description: "User email address"}),
    username: Schema.String.annotations({description: "Unique username"}),
    bio: Schema.optional(Schema.String.annotations({description: "User bio"})),
    is_active: Schema.Boolean.annotations({surrealDefault: "true"}),
    created_at: Schema.DateFromSelf.annotations({surrealDefault: "time::now()"})
  };

  export class User extends Schema.Class<User>("User")({
    ...Fields,
  }) {
    static readonly tableName = "user" as const;
    static readonly aiHints = {
      primary_key: "email",
      content_fields: ["username", "bio"]
    } as const;
    
    static validate = Schema.decodeUnknownSync(this);
    static parse = Schema.decodeUnknownSync(this);
  }

  export type Type = Schema.Schema.Type<typeof User>;
  // ... more generated code
}

export namespace Post {
  // Similar structure for Post table
}
*/
```

### Generate Complete SurrealQL

```typescript
const surrealql = schema.toSurrealQL();
console.log(surrealql);

/*
Output:
-- Schema: blog v1.0.0

DEFINE TABLE user SCHEMAFULL COMMENT 'User accounts | @ai-hints: {"primary_key":"email","content_fields":["username","bio"]}';
DEFINE FIELD id ON user TYPE record<user>;
DEFINE FIELD email ON user TYPE string UNIQUE COMMENT 'User email address';
DEFINE FIELD username ON user TYPE string UNIQUE COMMENT 'Unique username';
DEFINE FIELD bio ON user TYPE option<string> COMMENT 'User biography';
DEFINE FIELD is_active ON user TYPE bool DEFAULT true;
DEFINE FIELD created_at ON user TYPE datetime DEFAULT time::now();

DEFINE TABLE post SCHEMAFULL COMMENT 'Blog posts | @ai-hints: {"primary_key":"id","user_field":"author","content_fields":["title","content"]}';
DEFINE FIELD id ON post TYPE record<post>;
DEFINE FIELD title ON post TYPE string COMMENT 'Post title';
DEFINE FIELD content ON post TYPE string COMMENT 'Post content';
DEFINE FIELD author ON post TYPE record<user> COMMENT 'Post author';
DEFINE FIELD published_at ON post TYPE option<datetime>;
DEFINE FIELD created_at ON post TYPE datetime DEFAULT time::now();
*/
```

## 🔄 Automatic Migration Generation

**NEW**: Zero-downtime, automatic migration generation from TypeScript schema changes!

### 🚀 CLI-Based Migration Workflow

The migration system now uses the CLI for automatic generation from schema definitions:

```bash
# Generate migration from schema changes
surql-schema migrate generate add_user_analytics

# Show migration status and history
surql-schema migrate status

# Apply pending migrations (coming soon)
surql-schema migrate apply
```

### ✅ Key Benefits

- **🎯 Zero Index Rebuilds** - Only creates/modifies what actually changed
- **🔄 Automatic Rollback Generation** - Every migration is reversible  
- **📊 Type-Safe Schema Definitions** - Single source of truth in TypeScript
- **⚡ Incremental Changes Only** - Compares previous vs current schema
- **🛡️ Production-Ready Safety** - Transaction wrapping and dependency management

### 📋 Migration Generation Example

```typescript
// Define your schema in TypeScript
const userTable = SurrealTable.create("user", [
  SurrealField.id("user"),
  SurrealField.string("email").unique(),
  SurrealField.string("username").unique(),
  // Add new field for migration demo
  SurrealField.string("phone_number").optional()
    .withDescription("User phone number for notifications"),
]);

const currentSchema = SurrealSchema.create("my-app", "1.1.0")
  .addTable(userTable);
```

Run the CLI command:

```bash
$ surql-schema migrate generate add_user_phone

🔄 Generating migration: add_user_phone
📊 Comparing schema v1.0.0 → v1.1.0
✅ Migration generated: migrations/1234567890_add_user_phone.sql
📋 Operations: 1
   • Add field phone_number to user
```

Generated migration (automatic):

```sql
-- Migration: add_user_phone
-- Version: 1.1.0
-- Created: 2025-01-06T12:00:00.000Z

-- UP
BEGIN TRANSACTION;

-- Add field phone_number to user
DEFINE FIELD phone_number ON user TYPE string COMMENT 'User phone number for notifications';

COMMIT TRANSACTION;

-- DOWN
BEGIN TRANSACTION;

-- Rollback: Add field phone_number to user
REMOVE FIELD phone_number ON user;

COMMIT TRANSACTION;
```

### 📊 Migration Status Tracking

```bash
$ surql-schema migrate status

📊 Migration Status
==================
Current Version: 1.2.0
Total Migrations: 5
Last Updated: 2025-01-06T12:00:00.000Z
Description: Added user analytics and notification features

Migration History:
→ v1.2.0 (2025-01-06T12:00:00.000Z)
  v1.1.0 (2025-01-05T15:30:00.000Z)
  v1.0.0 (2025-01-01T10:00:00.000Z)
```

### 🛡️ Production Safety Features

- **Dependency Management**: Ensures migrations execute in correct order
- **Breaking Change Detection**: Warns about potentially destructive operations
- **Transaction Wrapping**: All operations are atomic
- **Rollback Support**: Every migration includes automatic rollback SQL
- **Schema History**: Complete audit trail of all changes

### 🎯 Migration Workflow

1. **Define Schema in TypeScript** - Update your schema definitions
2. **Generate Migration** - `surql-schema migrate generate <name>`
3. **Review Generated Files** - Check migrations directory
4. **Apply to Database** - `surql-schema migrate apply` (coming soon)

### 🔄 Traditional Migration Methods (Still Available)

For advanced use cases, you can still use the programmatic migration API:

#### Version Comparison

```typescript
// Version 1.0 schema
const v1Schema = SurrealSchema.create("app", "1.0.0")
  .addTable(
    SurrealTable.create("user")
      .addField(SurrealField.string("email"))
      .addField(SurrealField.string("username"))
  );

// Version 2.0 schema with changes
const v2Schema = SurrealSchema.create("app", "2.0.0")
  .addTable(
    SurrealTable.create("user")
      .addField(SurrealField.string("email").unique())  // Added unique constraint
      .addField(SurrealField.string("username"))
      .addField(SurrealField.string("phone").optional()) // Added new field
  )
  .addTable(
    SurrealTable.create("profile")  // Added new table
      .addField(SurrealField.id("profile"))
      .addField(SurrealField.record("user", "user"))
  );

// Generate migration using comparison engine
const diff = SchemaComparator.compare(v1Schema, v2Schema);
const migration = MigrationGenerator.generateMigration(diff, "add_phone_and_profile");
```

#### Advanced Migration Application

```typescript
async function applyMigration(
  db: Surreal, 
  migration: Migration, 
  dryRun: boolean = true
) {
  console.log(`Applying migration (${dryRun ? 'DRY RUN' : 'LIVE'}):`);
  
  for (const statement of migration.statements) {
    console.log(`  ${statement.description}`);
    console.log(`    ${statement.upSql}`);
    
    if (!dryRun) {
      try {
        await db.query(statement.upSql);
        console.log(`    ✅ Success`);
      } catch (error) {
        console.error(`    ❌ Failed: ${error}`);
        throw error;
      }
    }
  }
}

// Usage with sophisticated migration object
await applyMigration(db, migration, true);  // Dry run first
await applyMigration(db, migration, false); // Apply for real
```

#### Rollback Support

```typescript
// Automatic rollback generation
const rollbackMigration = MigrationGenerator.generateMigration(
  SchemaComparator.compare(v2Schema, v1Schema), 
  "rollback_phone_and_profile"
);

console.log("Rollback operations:", rollbackMigration.statements.map(s => s.description));
/*
Output:
[
  "Drop table profile",
  "Remove field phone from user", 
  "Drop index idx_unique_email from user"
]
*/
```

## Validation Patterns

### Schema Validation

```typescript
// Comprehensive schema validation
const schema = SurrealSchema.create("validation-test")
  .addTable(
    SurrealTable.create("user")
      .addField(SurrealField.record("profile", "profile")) // References non-existent table
  )
  .addTable(
    SurrealTable.create("duplicate_name") // Will be duplicated
  )
  .addTable(
    SurrealTable.create("duplicate_name") // Duplicate table name
  )
  .addIndex({
    name: "idx_bad_table",
    table: "nonexistent_table", // References non-existent table
    fields: ["some_field"]
  })
  .addIndex({
    name: "idx_bad_field",
    table: "user",
    fields: ["nonexistent_field"] // References non-existent field
  });

const errors = schema.validateSchema();
console.log("Validation errors:", errors);

/*
Output:
[
  "Duplicate table names: duplicate_name",
  "Table 'user' field 'profile' references non-existent table 'profile'",
  "Index 'idx_bad_table' references non-existent table 'nonexistent_table'",
  "Index 'idx_bad_field' references non-existent field 'nonexistent_field' in table 'user'"
]
*/
```

### Field Validation

```typescript
// Field-level validation
try {
  // ✅ Valid field
  const validField = SurrealField.string("email")
    .pattern("^[^@]+@[^@]+$")
    .unique()
    .description("User email");
    
  console.log("Valid field created:", validField.name);
} catch (error) {
  console.error("Field validation failed:", error);
}

try {
  // ❌ Invalid field - empty name
  const invalidField = SurrealField.parse({
    name: "",
    type: "string",
    isOptional: false,
    isId: false
  });
} catch (error) {
  console.error("Expected validation error:", error.message);
}
```

### Runtime Data Validation

```typescript
// Use generated schemas for runtime validation
import { User } from "./generated-schema";

function validateUserData(userData: unknown): User.Type {
  try {
    // This will validate the data against the User schema
    return User.parse(userData);
  } catch (error) {
    console.error("User data validation failed:", error);
    throw new Error("Invalid user data provided");
  }
}

// Usage
const validUser = validateUserData({
  id: "user:123",
  email: "john@example.com",
  username: "john_doe",
  is_active: true,
  created_at: new Date()
});

const invalidUser = validateUserData({
  email: "invalid-email", // Invalid email format
  // missing required fields
});
```

## Real-World Examples

### Blog Platform Schema

```typescript
const blogSchema = SurrealSchema.create("blog-platform", "2.0.0")
  .withDescription("Multi-author blog platform with comments and moderation")
  .withMetadata({
    author: "Blog Platform Team",
    createdAt: new Date(),
    tags: ["blog", "cms", "production"]
  });

// User management
const userTable = SurrealTable.create("user")
  .withDescription("User accounts and authentication")
  .addFields(
    SurrealField.id("user"),
    SurrealField.string("email").unique().description("Login email"),
    SurrealField.string("username").unique().min(3).max(30),
    SurrealField.string("display_name").max(100),
    SurrealField.string("bio").max(500).optional(),
    SurrealField.string("avatar_url").optional(),
    SurrealField.string("role").default("'author'").assert("$value IN ['admin', 'editor', 'author', 'reader']"),
    SurrealField.boolean("is_active").default("true"),
    SurrealField.datetime("email_verified_at").optional(),
    SurrealField.datetime("created_at").default("time::now()"),
    SurrealField.datetime("updated_at").default("time::now()"),
    SurrealField.datetime("last_login").optional()
  )
  .aiPrimaryKey("email")
  .aiTemporalField("created_at")
  .aiUserField("email")
  .aiContentFields(["username", "display_name", "bio"])
  .aiCommonQueries([
    "find user by email",
    "find user by username", 
    "get active users",
    "get users by role",
    "search users by name"
  ]);

// Blog posts
const postTable = SurrealTable.create("post")
  .withDescription("Blog posts and articles")
  .addFields(
    SurrealField.id("post"),
    SurrealField.string("title").min(1).max(200),
    SurrealField.string("slug").unique().pattern("^[a-z0-9-]+$"),
    SurrealField.string("content"),
    SurrealField.string("excerpt").max(500).optional(),
    SurrealField.record("author", "user"),
    SurrealField.string("status").default("'draft'").assert("$value IN ['draft', 'published', 'archived']"),
    SurrealField.array("tags").optional(),
    SurrealField.string("featured_image").optional(),
    SurrealField.boolean("allow_comments").default("true"),
    SurrealField.int("view_count").default("0"),
    SurrealField.datetime("published_at").optional(),
    SurrealField.datetime("created_at").default("time::now()"),
    SurrealField.datetime("updated_at").default("time::now()")
  )
  .aiPrimaryKey("id")
  .aiTemporalField("published_at")
  .aiUserField("author")
  .aiContentFields(["title", "content", "excerpt"])
  .aiCommonQueries([
    "find published posts",
    "find posts by author",
    "search posts by title",
    "get recent posts",
    "find posts by tag",
    "get draft posts"
  ])
  .aiRelationships({
    "author": "user table via author field",
    "comments": "comment table via post_id field"
  });

// Comments system
const commentTable = SurrealTable.create("comment")
  .withDescription("User comments on blog posts")
  .addFields(
    SurrealField.id("comment"),
    SurrealField.record("post", "post"),
    SurrealField.record("author", "user"),
    SurrealField.record("parent", "comment").optional(),
    SurrealField.string("content").min(1).max(2000),
    SurrealField.string("status").default("'pending'").assert("$value IN ['pending', 'approved', 'rejected', 'spam']"),
    SurrealField.string("author_ip").optional(),
    SurrealField.datetime("created_at").default("time::now()"),
    SurrealField.datetime("updated_at").default("time::now()")
  )
  .aiPrimaryKey("id")
  .aiTemporalField("created_at")
  .aiUserField("author")
  .aiContentFields(["content"])
  .aiCommonQueries([
    "get comments for post",
    "get comments by user",
    "get pending comments",
    "find comment thread"
  ]);

// Complete blog schema
const completeBlogSchema = blogSchema
  .addTables(userTable, postTable, commentTable)
  .addIndex({
    name: "idx_user_email",
    table: "user",
    fields: ["email"],
    unique: true
  })
  .addIndex({
    name: "idx_post_slug",
    table: "post", 
    fields: ["slug"],
    unique: true
  })
  .addIndex({
    name: "idx_post_author_status",
    table: "post",
    fields: ["author", "status"]
  })
  .addIndex({
    name: "idx_comment_post_status",
    table: "comment",
    fields: ["post", "status"]
  })
  .addEvent({
    name: "update_post_timestamp",
    table: "post",
    when: "BEFORE",
    action: "UPDATE",
    then: "UPDATE $after SET updated_at = time::now()"
  })
  .addEvent({
    name: "moderate_new_comments",
    table: "comment",
    when: "AFTER",
    action: "CREATE",
    then: "CREATE moderation_queue:ulid() SET comment_id = $after.id, created_at = time::now()"
  });
```

### E-commerce Schema

```typescript
const ecommerceSchema = SurrealSchema.create("ecommerce", "3.1.0")
  .withDescription("Complete e-commerce platform schema");

// Product catalog
const productTable = SurrealTable.create("product")
  .addFields(
    SurrealField.id("product"),
    SurrealField.string("sku").unique(),
    SurrealField.string("name").min(1).max(200),
    SurrealField.string("description"),
    SurrealField.number("price").min(0),
    SurrealField.number("compare_price").min(0).optional(),
    SurrealField.int("inventory_quantity").min(0).default("0"),
    SurrealField.boolean("track_inventory").default("true"),
    SurrealField.array("images").optional(),
    SurrealField.array("categories").optional(),
    SurrealField.object("attributes").optional(),
    SurrealField.boolean("is_active").default("true"),
    SurrealField.datetime("created_at").default("time::now()")
  )
  .aiPrimaryKey("sku")
  .aiContentFields(["name", "description"])
  .aiCommonQueries([
    "search products by name",
    "find products by category",
    "get featured products",
    "check inventory levels"
  ]);

// Shopping cart
const cartTable = SurrealTable.create("cart")
  .addFields(
    SurrealField.id("cart"),
    SurrealField.record("user", "user").optional(),
    SurrealField.string("session_id").optional(),
    SurrealField.array("items"), // Array of cart item objects
    SurrealField.datetime("created_at").default("time::now()"),
    SurrealField.datetime("updated_at").default("time::now()"),
    SurrealField.datetime("expires_at")
  )
  .aiUserField("user")
  .aiCommonQueries([
    "get cart by user",
    "get cart by session",
    "cleanup expired carts"
  ]);

// Orders
const orderTable = SurrealTable.create("order")
  .addFields(
    SurrealField.id("order"),
    SurrealField.string("order_number").unique(),
    SurrealField.record("customer", "user"),
    SurrealField.array("items"),
    SurrealField.object("shipping_address"),
    SurrealField.object("billing_address"),
    SurrealField.number("subtotal").min(0),
    SurrealField.number("tax_amount").min(0),
    SurrealField.number("shipping_amount").min(0),
    SurrealField.number("total_amount").min(0),
    SurrealField.string("status").default("'pending'"),
    SurrealField.string("payment_status").default("'pending'"),
    SurrealField.datetime("created_at").default("time::now()"),
    SurrealField.datetime("shipped_at").optional()
  )
  .aiPrimaryKey("order_number")
  .aiUserField("customer")
  .aiTemporalField("created_at")
  .aiCommonQueries([
    "get orders by customer",
    "find order by number",
    "get pending orders",
    "get recent orders"
  ]);
```

## Troubleshooting

### Common Issues

#### 1. Validation Errors

```typescript
// Problem: Field validation fails
try {
  const field = SurrealField.string("email").pattern("invalid[regex");
} catch (error) {
  // Solution: Check regex syntax
  console.error("Invalid regex pattern:", error);
  const fixedField = SurrealField.string("email").pattern("^[^@]+@[^@]+$");
}
```

#### 2. Schema Conflicts

```typescript
// Problem: Duplicate table names
const schema = SurrealSchema.create("app")
  .addTable(SurrealTable.create("user"))
  .addTable(SurrealTable.create("user")); // Duplicate!

const errors = schema.validateSchema();
// Solution: Check for duplicates before adding
if (errors.length > 0) {
  console.error("Schema validation errors:", errors);
}
```

#### 3. Reference Errors

```typescript
// Problem: Field references non-existent table
const userTable = SurrealTable.create("user")
  .addField(SurrealField.record("profile", "profile")); // 'profile' table doesn't exist

// Solution: Ensure referenced tables exist
const profileTable = SurrealTable.create("profile");
const schema = SurrealSchema.create("app")
  .addTable(profileTable)  // Add referenced table first
  .addTable(userTable);
```

### Debugging Tips

#### 1. Enable Detailed Validation

```typescript
// Use safeParse for non-throwing validation
const result = SurrealField.safeParse({
  name: "invalid_name",
  type: "invalid_type"
});

if (result._tag === "None") {
  console.log("Validation failed - check your field definition");
} else {
  console.log("Field created successfully:", result.value);
}
```

#### 2. Inspect Generated Code

```typescript
// Check generated SurrealQL before applying
const sql = schema.toSurrealQL();
console.log("Generated SurrealQL:", sql);

// Validate SQL syntax before sending to database
```

#### 3. Test Schema Incrementally

```typescript
// Build schema step by step and validate at each step
let schema = SurrealSchema.create("test");

// Add tables one by one
schema = schema.addTable(userTable);
console.log("After adding user table:", schema.validateSchema());

schema = schema.addTable(postTable);
console.log("After adding post table:", schema.validateSchema());
```

### Performance Considerations

#### 1. Large Schemas

```typescript
// For schemas with many tables, validate selectively
const largeSchema = SurrealSchema.create("large-app");

// Add tables in batches
const batch1 = [table1, table2, table3];
const batch2 = [table4, table5, table6];

let schema = largeSchema.addTables(...batch1);
console.log("Batch 1 validation:", schema.validateSchema());

schema = schema.addTables(...batch2);
console.log("Final validation:", schema.validateSchema());
```

#### 2. Memory Usage

```typescript
// For memory-intensive operations, use streaming approaches
function processLargeSchema(tables: SurrealTable[]) {
  let schema = SurrealSchema.create("streaming");
  
  for (const table of tables) {
    schema = schema.addTable(table);
    
    // Validate incrementally to catch issues early
    const errors = schema.validateSchema();
    if (errors.length > 0) {
      throw new Error(`Validation failed at table ${table.name}: ${errors.join(", ")}`);
    }
  }
  
  return schema;
}
```

---

This comprehensive usage guide covers all aspects of the Schema.Class architecture. For additional examples and advanced patterns, refer to the test files in `src/__tests__/unit/` which contain over 100 real-world usage examples.