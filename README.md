# surql-gen

Generate type-safe schemas from SurrealQL definitions, with support for
automatic query type inference.

## Features

- Generate schema definitions from SurrealQL schema definitions
  - [TypeBox](https://github.com/sinclairzx81/typebox) schemas (legacy)
  - [Effect Schema](https://effect.website/docs/schema/introduction/)
    (recommended)
- **NEW**: Infer TypeScript types from SurrealQL queries
- Support for various SurrealDB data types, including references, arrays, and
  records
- Generate TypeScript type definitions from SurrealDB schemas
- Support for recursive schemas (self-referencing tables)
- Preserve default values and field comments in generated types

## What's New: Effect Schema & Query Type Inference

We're migrating from TypeBox to Effect Schema, which offers several advantages:

- **Stronger Type Safety**: Better handling of branded types for record IDs
- **Rich Transformations**: Powerful transformation capabilities for complex
  data conversions
- **Improved Validation**: More expressive validation rules with composable
  filters
- **Type Inference for Queries**: Automatically infer return types from
  SurrealQL queries

### Query Type Inference Example

```typescript
import { Schema } from "@effect/schema";
import { inferQueryReturnType, SchemaRegistry } from "@necmttn/surql-gen";

// Create a schema registry from your database tables
const registry = new SchemaRegistry(tables);

// Infer the return type from a SurrealQL query
const query = "SELECT *, author.* FROM post WHERE id = $id";
const schema = inferQueryReturnType(query, registry);

// Schema is now an Effect Schema representing:
// Array<{
//   id: RecordId<"post">,
//   title: string,
//   content: string,
//   author: {
//     id: RecordId<"user">,
//     name: string,
//     // ... other user fields
//   }
// }>

// You can use this for runtime validation or static type inference
type QueryResult = Schema.Type<typeof schema>;
```

## Usage

You can use the tool directly without installation using `deno run`:

```bash
deno run -A https://deno.land/x/surql_gen/mod.ts process -i schema.surql
```

Or you can install it globally:

```bash
deno install -A -n surql-gen https://deno.land/x/surql_gen/mod.ts
```

Then use it like this:

```bash
surql-gen process -i schema.surql
```

## Examples

### Generating Effect Schema (Recommended)

To generate Effect Schema instead of TypeBox, set the `schemaSystem` option to
`"effect"` in your configuration:

```typescript
// surql-gen.config.ts
export const config = {
  // ... other config
  imports: {
    style: "esm",
    schemaSystem: "effect", // Use Effect Schema instead of TypeBox
    paths: {
      typebox: "@sinclair/typebox",
      effect: "@effect/schema",
    },
  },
};
```

The tool will then generate Effect Schema definitions:

```typescript
// Type for representing a RecordId in Effect Schema
type RecordId<T extends string = string> = string & {
  readonly RecordId: unique symbol;
  readonly Table: T;
};

// Type declaration for User
export const UserSchema = Schema.struct({
  username: Schema.string,
  email: Schema.string,
  created_at: Schema.Date,
});

// Type export
export type User = Schema.Type<typeof UserSchema>;
```

### Basic Schema (Legacy TypeBox)

Given a SurrealQL schema like this:

```sql
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD username ON user TYPE string;
DEFINE FIELD email ON user TYPE string;
DEFINE FIELD created_at ON user TYPE datetime DEFAULT time::now();
```

The tool will generate a TypeBox schema like this:

```typescript
// Type declaration for User
export const UserType = Type.Object({
  username: Type.String(),
  email: Type.String(),
  created_at: Type.Date({ default: time::now() })
}, {
  $id: 'user'
});

// Type export
export type User = Static<typeof User>;
```

### Schema with References

If your schema includes relationships between tables:

```sql
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD username ON user TYPE string;

DEFINE TABLE post SCHEMAFULL;
DEFINE FIELD title ON post TYPE string;
DEFINE FIELD author ON post TYPE record<user> COMMENT "The author of the post";
```

The tool will generate proper types with references (shown in Effect Schema):

```typescript
// Type declaration for User
export const UserSchema = Schema.struct({
  username: Schema.string,
});

// Type declaration for Post
export const PostSchema = Schema.struct({
  title: Schema.string,
  author: recordId("user").pipe(Schema.description("The author of the post")),
});

// Type exports
export type User = Schema.Type<typeof UserSchema>;
export type Post = Schema.Type<typeof PostSchema>;
```

## Quick Start

```bash
# Initialize a TypeScript config file (recommended)
deno run -A jsr:@necmttn/surql-gen init

# Initialize a JSON config file if preferred
deno run -A jsr:@necmttn/surql-gen init --json

# Generate schemas from a SurrealQL file
deno run -A jsr:@necmttn/surql-gen process -i schema.surql -o types.ts

# Generate schemas directly from a SurrealDB instance
deno run -A jsr:@necmttn/surql-gen db -d http://localhost:8000 -o types.ts

# Run with config file that has a db.url defined in it
deno run -A jsr:@necmttn/surql-gen db

# Generate schemas with authentication and specific namespace/database
deno run -A jsr:@necmttn/surql-gen db -d http://localhost:8000 -u root -p root -n my_namespace --database my_database

# Run with a config file (auto-detects surql-gen.config.ts or surql-gen.json in current directory)
deno run -A jsr:@necmttn/surql-gen
```

### Command Line Options

```
surql-gen - Generate type-safe schemas from SurrealQL

USAGE:
  surql-gen [command] [options]

Commands:
  process       Process a SurrealQL file and generate schemas
  db            Generate schemas from SurrealDB instance
  init          Initialize a new config file
  migrate       Migrate from JSON config to TypeScript config
  help [cmd]    Display help for [cmd]

Options:
  -h, --help     Display help
  -V, --version  Display version

Examples:
  surql-gen init                               Initialize a new TypeScript config file
  surql-gen init --json                        Initialize a new JSON config file
  surql-gen migrate                            Migrate from JSON config to TypeScript config
  surql-gen process -i schema.surql -o types.ts  Process a SurrealQL file
  surql-gen db -d http://localhost:8000 -o types.ts  Generate schema from database
  surql-gen db -n my_namespace --database my_database  Generate schema with namespace and database name
  surql-gen db -u root -p root                 Generate schema with authentication
  surql-gen db                                 Generate schema using URL from config file
  surql-gen process -i schema.surql -c custom-config.ts  Use custom config file
```

### DB Command Options

The `db` command has several options to control the database connection:

```
Options:
  -d, --db-url <url>       SurrealDB URL to fetch schema from (overrides config)
  -u, --username <user>    Username for authentication (overrides config)
  -p, --password <pass>    Password for authentication (overrides config)
  -n, --namespace <ns>     Namespace to use (overrides config)
  --database <db>          Database to use (overrides config)
  -o, --output <file>      Output TypeScript file (default: based on config)
  -c, --config <file>      Path to config file
```

Any options provided via command line will override those in the config file.

## Configuration

You can configure surql-gen using either a TypeScript or JSON configuration
file.

### TypeScript Configuration (Recommended)

Create a `surql-gen.config.ts` file in your project:

```typescript
import type { Config } from "jsr:@necmttn/surql-gen/lib/config.ts";

export const config: Config = {
  output: {
    path: "./generated",
    filename: "schema",
    extension: "ts",
  },
  imports: {
    style: "esm",
    schemaSystem: "effect", // Use "effect" for Effect Schema, "typebox" for TypeBox
    paths: {
      typebox: "@sinclair/typebox",
      effect: "@effect/schema",
    },
  },
  db: {
    url: "http://localhost:8000",
    username: "root",
    password: "root",
    namespace: "my_namespace",
    database: "my_database",
  },
};

export default config;
```

Using TypeScript for configuration provides:

- Type checking for configuration options
- IntelliSense/autocompletion in compatible editors
- Ability to use comments and documentation

### Note About TypeBox Support

TypeBox support is considered legacy and will be deprecated in future versions.
We recommend migrating to Effect Schema which offers better type safety and more
advanced features, including query type inference.

## Query Type Inference (Experimental)

This feature is currently in development and available for testing. It allows
you to infer TypeScript types directly from SurrealQL queries:

```typescript
import { inferQueryReturnType, SchemaRegistry } from "@necmttn/surql-gen";

// Create a registry with your table definitions
const registry = new SchemaRegistry(tables);

// Example queries
const query1 = "SELECT * FROM user";
const query2 = "SELECT name, email FROM user";
const query3 = "SELECT *, author.* FROM post";
const query4 = "SELECT * FROM user LIMIT 1"; // Returns single object, not array

// Infer types from queries
const schema1 = inferQueryReturnType(query1, registry);
const schema2 = inferQueryReturnType(query2, registry);
const schema3 = inferQueryReturnType(query3, registry);
const schema4 = inferQueryReturnType(query4, registry);

// Use the schemas for type inference and runtime validation
type Query1Result = Schema.Type<typeof schema1>; // Array<User>
type Query2Result = Schema.Type<typeof schema2>; // Array<{ name: string, email: string }>
type Query3Result = Schema.Type<typeof schema3>; // Array<Post with nested author>
type Query4Result = Schema.Type<typeof schema4>; // User (not Array)
```

## Installation with npm

To install with npm, run:

```bash
npm install @necmttn/surql-gen
```

Then import and use:

```typescript
import { generateEffectSchemas, parseSurQL } from "@necmttn/surql-gen";

// Parse SurrealQL schema
const tables = parseSurQL(schemaContent);

// Generate Effect Schema
const schemas = generateEffectSchemas(tables);
```

## Project Status

The project is actively under development. Key focus areas:

1. Completing the Effect Schema integration
2. Enhancing the query type inference system
3. Creating a query builder API with static type safety

See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for details on current progress and
roadmap.

## License

MIT

## Migrating from JSON to TypeScript Configuration

If you're already using a JSON configuration file and want to migrate to
TypeScript for better type checking and editor support, you can use the
`migrate` command:

```bash
# Migrate from surql-gen.json to surql-gen.config.ts
deno run -A jsr:@necmttn/surql-gen migrate

# Migrate from a custom JSON config file
deno run -A jsr:@necmttn/surql-gen migrate --json-config custom-config.json
```

This will create a new TypeScript configuration file based on your existing JSON
configuration.

## Schema Export and Apply

In addition to generating TypeBox schemas, surql-gen also provides functionality
to export and apply SurrealDB schemas.

### Exporting Schema Definitions

You can export the schema definitions from a database using the `export-schema`
command:

```bash
deno run -A mod.ts export-schema --db-url http://localhost:8000 --namespace test --database mydb
```

By default, this will generate a file called `schema.surql` in the current
directory, containing all the `DEFINE TABLE` and `DEFINE FIELD` statements from
the database.

#### Options

- `--db-url`: SurrealDB URL (e.g., http://localhost:8000)
- `--namespace`: SurrealDB namespace
- `--database`: SurrealDB database name
- `--username`: SurrealDB username
- `--password`: SurrealDB password
- `--output`: Output file path (default: schema.surql)
- `--overwrite`: Add OVERWRITE keyword to all definitions (default: false)
- `--config`: Path to configuration file

### Applying Schema Definitions

You can apply schema definitions to a database using the `apply-schema` command:

```bash
deno run -A mod.ts apply-schema schema.surql --db-url http://localhost:8000 --namespace test --database mydb
```

This will execute all the schema definitions in the specified file against the
target database.

#### Options

- `--db-url`: SurrealDB URL (e.g., http://localhost:8000)
- `--namespace`: SurrealDB namespace
- `--database`: SurrealDB database name
- `--username`: SurrealDB username
- `--password`: SurrealDB password
- `--config`: Path to configuration file

### Use Cases

1. **Development Workflow**: Export schema from development environment, apply
   to production
2. **Schema Versioning**: Keep schema definitions in version control
3. **Migration**: Apply schema changes across environments
4. **Backup**: Export schema-only definitions as a lightweight backup

## Project Structure

The codebase is organized into modular components for improved maintainability:

```
surql-gen/
├── lib/                # Core library code
│   ├── db/             # SurrealDB interaction
│   │   ├── interfaces.ts  # Type definitions
│   │   ├── parser.ts     # Schema parsing logic
│   │   ├── connection.ts # Database connection utilities
│   │   ├── extract.ts    # Schema extraction functionality
│   │   ├── export.ts     # Schema export to file
│   │   ├── import.ts     # Schema import and application
│   │   ├── utils.ts      # Utility functions
│   │   └── index.ts      # Public module exports
│   ├── config.ts      # Configuration handling
│   ├── schema.ts      # Schema processing and TypeBox generation
│   └── commands.ts    # CLI command implementations
├── tests/             # Test files
│   ├── db/            # Tests for DB functionality
│   ├── fixtures/      # Test fixtures
│   ├── mocks/         # Mock data and functions
│   └── utils/         # Testing utilities
├── examples/          # Example schema definitions
├── generated/         # Output directory for generated code
└── scripts/           # Utility scripts
```

Each module in the `lib/db/` directory has a specific responsibility:

- `interfaces.ts`: Type definitions for SurrealDB objects
- `parser.ts`: Functions for parsing schema definitions and field types
- `connection.ts`: Database connection handling
- `extract.ts`: Functions to extract schema from a SurrealDB instance
- `export.ts`: Schema export functionality
- `import.ts`: Schema import and application
- `utils.ts`: Common utility functions
- `index.ts`: Re-exports all public functionality
