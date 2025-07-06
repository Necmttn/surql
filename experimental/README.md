# SurrealDB Schema Generator v2.0 - AI-Enhanced Schema.Class Architecture

A revolutionary TypeScript schema generator that converts SurrealDB schemas into **batteries-included, self-validating Effect Schema classes** with AI metadata integration.

## 🚀 Key Features

- **🔄 Database Introspection**: Pull schemas directly from live SurrealDB instances
- **🤖 AI-Enhanced Metadata**: Embed semantic information for intelligent code generation  
- **⚡ Schema.Class Architecture**: Self-validating, immutable schema objects
- **📦 Batteries-Included**: Built-in validation, serialization, migration generation
- **🔗 Effect Integration**: Full Effect Schema ecosystem compatibility
- **🛡️ Type Safety**: Compile-time AND runtime validation
- **🔄 Bidirectional Flow**: Database ↔ Schema Objects ↔ TypeScript/SurrealQL

## 🎯 Quick Start

### Installation

```bash
# Clone and setup
git clone <repo>
cd experimental
bun install

# Start Docker SurrealDB for testing
docker-compose up -d
```

### Basic Usage

```typescript
import { SurrealField, SurrealTable, SurrealSchema } from "./src/lib/schema";

// Create a field with validation
const emailField = SurrealField.string("email")
  .unique()
  .pattern("^[^@]+@[^@]+$")
  .description("User email address");

// Create a table with AI metadata
const userTable = SurrealTable.create("user")
  .withDescription("User accounts table")
  .addField(SurrealField.id("user"))
  .addField(emailField)
  .addField(SurrealField.string("username").unique())
  .addField(SurrealField.boolean("is_active").default("true"))
  .addField(SurrealField.datetime("created_at").default("time::now()"))
  .aiPrimaryKey("email")
  .aiTemporalField("created_at")
  .aiContentFields(["username", "email"])
  .aiCommonQueries(["findByEmail", "getActiveUsers"]);

// Create a complete schema
const schema = SurrealSchema.create("my-app", "1.0.0")
  .withDescription("My application schema")
  .addTable(userTable);

// Generate SurrealQL
console.log(schema.toSurrealQL());

// Generate TypeScript interfaces
console.log(schema.toTypeScript());

// Generate Effect Schema classes
console.log(schema.toEffectSchemaClasses());
```

## 📖 Core Concepts

### Schema.Class Architecture

Our v2.0 architecture uses **Effect Schema.Class** as the foundation, providing:

- **Built-in Validation**: Every schema object validates itself on creation
- **Automatic Encoding/Decoding**: Seamless serialization to/from JSON, SurrealQL
- **Immutable Operations**: Fluent API that maintains validation at every step
- **Pattern Matching**: Data.TaggedClass benefits for sophisticated workflows

### AI Metadata Integration

Embed semantic information directly in schema objects:

```typescript
const table = SurrealTable.create("user")
  .aiPrimaryKey("email")           // Primary identifier field
  .aiTemporalField("created_at")   // Timestamp field for ordering
  .aiUserField("email")            // User identification field
  .aiContentFields(["username", "bio"])  // Searchable content fields
  .aiCommonQueries([               // Common query patterns
    "find user by email",
    "get active users",
    "search by username"
  ])
  .aiRelationships({               // Table relationships
    "posts": "post via author_id",
    "profile": "profile via user_id"
  });
```

## 🔧 API Reference

### SurrealField

Self-validating field definitions with built-in constraints and metadata.

#### Factory Methods

```typescript
// Basic field types
SurrealField.string("name")
SurrealField.number("age")
SurrealField.int("count")
SurrealField.boolean("active")
SurrealField.datetime("created_at")
SurrealField.array("tags")
SurrealField.object("metadata")
SurrealField.record("author", "user")  // Foreign key reference
SurrealField.id("user")                // Primary key
SurrealField.any("flexible")
```

#### Fluent API

```typescript
const field = SurrealField.string("email")
  .unique()                           // Add UNIQUE constraint
  .required()                         // Mark as required
  .min(5)                            // Minimum length
  .max(100)                          // Maximum length
  .pattern("^[^@]+@[^@]+$")          // Regex pattern
  .default("user@example.com")       // Default value
  .description("User email address") // Field description
  .optional();                       // Make optional
```

#### Constraint Methods

```typescript
field.min(value)           // Minimum value/length
field.max(value)           // Maximum value/length
field.length(value)        // Exact length
field.pattern(regex)       // Regex validation
field.unique()             // Unique constraint
field.required()           // Required field
field.assert(condition)    // Custom assertion
field.onDelete(action)     // Foreign key behavior
```

#### Serialization

```typescript
// Generate SurrealQL field definition
field.toSurrealQL()
// "DEFINE FIELD email TYPE string UNIQUE COMMENT 'User email address';"

// Generate Effect Schema
field.toEffectSchema()
// "Schema.String.pipe(Schema.pattern(...)).annotations({description: '...'})"

// Parse from SurrealQL
SurrealField.fromSurrealQL("DEFINE FIELD name TYPE string;")

// Migration generation
SurrealField.diff(oldField, newField)
// ["ALTER FIELD name ADD UNIQUE"]
```

### SurrealTable

Self-validating table definitions with field management and AI metadata.

#### Factory Methods

```typescript
// Create tables
SurrealTable.create("user")                    // Schemafull table
SurrealTable.schemaless("logs")               // Schemaless table
SurrealTable.view("user_posts", ["title"], "published = true")  // View
```

#### Field Management

```typescript
const table = SurrealTable.create("user")
  .addField(SurrealField.string("name"))      // Add single field
  .addFields(                                 // Add multiple fields
    SurrealField.string("email"),
    SurrealField.boolean("active")
  )
  .removeField("temporary")                   // Remove field
  .updateField("email", field =>              // Update field
    field.unique().description("Primary email")
  );
```

#### Configuration

```typescript
table
  .withDescription("User accounts table")      // Table description
  .schemafullMode()                           // Set schemafull
  .schemalessMode()                           // Set schemaless
  .withPermissions({                          // Set permissions
    select: "id = $auth.id",
    update: "id = $auth.id"
  });
```

#### AI Metadata

```typescript
table
  .aiPrimaryKey("email")                      // Primary key field
  .aiTemporalField("created_at")              // Temporal ordering field
  .aiUserField("email")                       // User identification
  .aiContentFields(["name", "bio"])           // Searchable content
  .aiCommonQueries([                          // Query patterns
    "findByEmail",
    "getActiveUsers"
  ])
  .aiRelationships({                          // Table relationships
    "posts": "post via author_id"
  })
  .aiSecurityLevel("high");                   // Security classification
```

#### Code Generation

```typescript
// Generate Effect Schema class
table.toEffectSchemaClass()
/*
export namespace User {
  export const Fields = {
    id: recordId("user"),
    email: Schema.String.annotations({description: "..."})
  };
  
  export class User extends Schema.Class<User>("User")({
    ...Fields,
  }) {
    static readonly tableName = "user" as const;
    static readonly aiHints = {...};
  }
}
*/

// Generate TypeScript interface
table.toTypeScriptInterface()
/*
export interface User {
  id: RecordId<"user">;
  email: string;
  is_active?: boolean;
}
*/

// Generate SurrealQL
table.toSurrealQL()
/*
DEFINE TABLE user SCHEMAFULL COMMENT 'User accounts | @ai-hints: {...}';
DEFINE FIELD id ON user TYPE record<user>;
DEFINE FIELD email ON user TYPE string UNIQUE;
*/
```

### SurrealSchema

Complete schema registry with validation, migration support, and code generation.

#### Factory Methods

```typescript
// Create schemas
SurrealSchema.create("my-app")                          // Empty schema
SurrealSchema.create("my-app", "2.0.0")                // With version
SurrealSchema.fromTables("my-app", [table1, table2])   // From tables
```

#### Schema Management

```typescript
const schema = SurrealSchema.create("blog-app")
  .withDescription("Blog application schema")           // Schema description
  .withVersion("1.5.0")                                // Version
  .addTable(userTable)                                 // Add table
  .addTables(postTable, commentTable)                  // Add multiple
  .removeTable("old_table")                            // Remove table
  .updateTable("user", table =>                        // Update table
    table.addField(SurrealField.string("phone"))
  );
```

#### Indexes and Events

```typescript
schema
  .addIndex({                                          // Add index
    name: "idx_user_email",
    table: "user",
    fields: ["email"],
    unique: true
  })
  .addEvent({                                          // Add event
    name: "user_audit",
    table: "user", 
    when: "AFTER",
    action: "UPDATE",
    then: "CREATE audit:ulid() SET user = $after.id"
  });
```

#### Validation

```typescript
// Comprehensive schema validation
const errors = schema.validateSchema();
/*
[
  "Duplicate table names: user",
  "Table 'post' field 'author' references non-existent table 'user'",
  "Index 'idx_email' references non-existent field 'email' in table 'user'"
]
*/

// Schema statistics
schema.getTableCount()    // Number of tables
schema.getFieldCount()    // Total fields across all tables
schema.getIndexCount()    // Number of indexes
schema.getEventCount()    // Number of events
```

#### Migration Generation

```typescript
// Generate migration between schema versions
const migration = SurrealSchema.generateMigration(oldSchema, newSchema);
/*
[
  "ALTER TABLE user ADD FIELD phone TYPE string;",
  "DROP TABLE old_table;",
  "DEFINE INDEX idx_new ON user FIELDS email UNIQUE;"
]
*/

// Schema comparison
const diff = SurrealSchema.compare(schema1, schema2);
/*
{
  added: ["table:comment"],
  removed: ["table:old_post"],
  modified: ["table:user"],
  unchanged: ["table:profile"]
}
*/
```

#### Complete Code Generation

```typescript
// Generate all TypeScript interfaces
schema.toTypeScript()

// Generate complete Effect Schema classes
schema.toEffectSchemaClasses()

// Generate complete SurrealQL schema
schema.toSurrealQL()
```

## 🔄 Database Introspection

Pull schemas directly from live SurrealDB instances:

```bash
# Pull schema from database
bun bun-cli.ts pull \
  --url http://localhost:8000 \
  --namespace production \
  --database main \
  --output generated-schema.ts
```

```typescript
// Parse existing SurrealQL into schema objects
const existingSQL = `
DEFINE TABLE user SCHEMAFULL COMMENT 'Users | @ai-hints: {"primary_key": "email"}';
DEFINE FIELD email ON user TYPE string UNIQUE;
`;

const schema = SurrealSchema.fromSurrealQL(existingSQL);
console.log(schema.getTable("user")?.aiHints?.primary_key); // "email"
```

## 🤖 AI Metadata Format

AI metadata is embedded in SurrealDB COMMENT annotations using structured JSON:

```sql
COMMENT 'Table description | @ai-hints: {
  "primary_key": "email",
  "temporal_field": "created_at", 
  "user_field": "email",
  "content_fields": ["username", "bio"],
  "common_queries": ["findByEmail", "getActiveUsers"],
  "relationships": {
    "posts": "post via author_id",
    "profile": "profile via user_id"
  },
  "security_level": "high"
}'
```

This metadata drives:
- **Smart Query Generation**: Auto-generate common query methods
- **Field Validation**: Enhanced validation based on semantic roles
- **Relationship Mapping**: Automatic foreign key understanding
- **Security Policies**: Field-level security classifications

## 🧪 Testing

Comprehensive test suite with 109+ tests covering all functionality:

```bash
# Run all tests
bun test

# Run specific test suites
bun test src/__tests__/unit/schema-class-field.test.ts    # 32 tests
bun test src/__tests__/unit/schema-class-table.test.ts    # 40 tests  
bun test src/__tests__/unit/schema-class-schema.test.ts   # 37 tests

# Integration tests with Docker SurrealDB
bun test src/__tests__/integration/docker-schema-pull.test.ts
```

## 🏗️ Architecture Benefits

### Self-Validating Objects

Every schema component validates itself:

```typescript
// ✅ Valid - creates successfully
const field = SurrealField.string("email").unique();

// ❌ Invalid - throws validation error
const invalid = SurrealField.parse({
  name: "",          // Empty name not allowed
  type: "invalid"    // Invalid type
});
```

### Immutable Operations

All operations return new validated instances:

```typescript
const original = SurrealField.string("name");
const modified = original.unique().required();

// original remains unchanged
console.log(original.constraints?.unique);  // undefined
console.log(modified.constraints?.unique);  // true
```

### Built-in Serialization

No separate code generation pipeline needed:

```typescript
// Encode to JSON for storage
const json = SurrealField.encode(field);

// Decode back to validated object
const restored = SurrealField.decode(json);

// Generate SurrealQL on demand
const sql = field.toSurrealQL();
```

## 🔧 Advanced Usage

### Custom Field Types

Create reusable field patterns:

```typescript
// Email field factory
const createEmailField = (name: string) =>
  SurrealField.string(name)
    .pattern("^[^@]+@[^@]+\\.[^@]+$")
    .description("Email address")
    .unique();

// Usage
const userEmail = createEmailField("email");
const contactEmail = createEmailField("contact_email");
```

### Schema Composition

Build complex schemas from smaller parts:

```typescript
// Base user fields
const baseUserFields = [
  SurrealField.id("user"),
  SurrealField.datetime("created_at").default("time::now()"),
  SurrealField.datetime("updated_at").default("time::now()")
];

// Extended user table
const userTable = SurrealTable.create("user")
  .addFields(...baseUserFields)
  .addField(SurrealField.string("email").unique())
  .addField(SurrealField.string("username").unique());
```

### Migration Workflows

Generate and apply migrations:

```typescript
// Generate migration
const operations = SurrealSchema.generateMigration(oldSchema, newSchema);

// Apply to database
for (const operation of operations) {
  await db.query(operation);
}
```

### Validation Pipelines

Use built-in validation for data processing:

```typescript
// Validate incoming data against schema
const userData = { email: "user@example.com", username: "john" };

try {
  const validUser = UserSchema.parse(userData);
  console.log("Valid user:", validUser);
} catch (error) {
  console.error("Validation failed:", error);
}
```

## 🎯 Best Practices

### 1. Use AI Metadata Consistently

```typescript
// ✅ Good - Rich AI metadata
const table = SurrealTable.create("user")
  .aiPrimaryKey("email")
  .aiTemporalField("created_at")
  .aiContentFields(["username", "bio"]);

// ❌ Limited - Missing semantic information
const table = SurrealTable.create("user");
```

### 2. Validate Early and Often

```typescript
// ✅ Good - Validate at creation
const field = SurrealField.string("email").unique();

// ❌ Risky - Create without validation
const field = new SurrealField(untrustedData);
```

### 3. Use Fluent API for Readability

```typescript
// ✅ Good - Clear, readable chain
const field = SurrealField.string("email")
  .unique()
  .pattern("^[^@]+@[^@]+$")
  .description("User email address");

// ❌ Verbose - Multiple separate operations
let field = SurrealField.string("email");
field = field.unique();
field = field.pattern("^[^@]+@[^@]+$");
field = field.description("User email address");
```

### 4. Leverage Schema Validation

```typescript
// Always validate schemas before deployment
const errors = schema.validateSchema();
if (errors.length > 0) {
  throw new Error(`Schema validation failed: ${errors.join(", ")}`);
}
```

## 🚀 What's Next

- **Enhanced Query Builder**: AI-powered query generation from metadata
- **Schema Evolution**: Advanced migration strategies and rollback support  
- **Visual Schema Designer**: Web UI for schema creation and editing
- **Performance Optimization**: Query optimization based on AI metadata
- **Multi-Database Support**: Extend to other databases beyond SurrealDB

## 📚 Additional Resources

- [Effect Schema Documentation](https://effect.website/docs/schema/introduction)
- [SurrealDB Documentation](https://surrealdb.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**SurrealDB Schema Generator v2.0** - Transforming database schemas into intelligent, self-validating code that understands itself. 🚀