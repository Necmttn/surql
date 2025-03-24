# @necmttn/surql

Generate type-safe schemas from SurrealQL definitions, with support for
automatic query type inference.

## Examples

### Effect Schema Class

```typescript
// Generated schema using Effect Schema Class
import { Schema } from "effect";

// Create a schema registry from your database tables
const registry = new SchemaRegistry(tables);

// Using the generated schemas
const user = new User({
  id: "user:123",
  name: "John Doe",
  email: "john@example.com",
});

// Schema classes with table information
export class User extends Schema.Class<User>("User")({
  id: recordId("user").annotations({
    description: "Unique identifier",
  }),
  name: Schema.String,
  email: Schema.String,
  created_at: Schema.Date,
}) {
  static readonly tableName = "user" as const;
}
```

### Query Type Inference

```typescript
import { Schema } from "effect";
import { inferQueryReturnType, SchemaRegistry } from "@necmttn/surql";

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

### Schema with References

If your schema includes relationships between tables:

```sql
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD username ON user TYPE string;

DEFINE TABLE post SCHEMAFULL;
DEFINE FIELD title ON post TYPE string;
DEFINE FIELD author ON post TYPE record<user> COMMENT "The author of the post";
```

The tool will generate proper types with references using Effect Schema Class:

```typescript
export class User extends Schema.Class<User>("User")({
  id: recordId("user").annotations({
    description: "Unique identifier",
  }),
  username: Schema.String,
}) {
  static readonly tableName = "user" as const;
}

export class Post extends Schema.Class<Post>("Post")({
  id: recordId("post").annotations({
    description: "Unique identifier",
  }),
  title: Schema.String,
  author: recordId("user").annotations({
    description: "The author of the post",
  }),
}) {
  static readonly tableName = "post" as const;
}
```

## Features

- Generate schema definitions from SurrealQL schema definitions using Effect
  Schema Class
- Infer TypeScript types from SurrealQL queries
- Support for various SurrealDB data types, including references, arrays, and
  records
- Generate TypeScript type definitions from SurrealDB schemas
- Support for recursive schemas (self-referencing tables)
- Preserve default values and field comments in generated types

## Quick Start

```bash
# Initialize a TypeScript config file (recommended)
deno run -A jsr:@necmttn/surql init

# Initialize a JSON config file if preferred
deno run -A jsr:@necmttn/surql init --json

# Generate schemas from a SurrealQL file
deno run -A jsr:@necmttn/surql process -i schema.surql -o types.ts

# Generate schemas directly from a SurrealDB instance
deno run -A jsr:@necmttn/surql db -d http://localhost:8000 -o types.ts

# Run with config file that has a db.url defined in it
deno run -A jsr:@necmttn/surql db

# Generate schemas with authentication and specific namespace/database
deno run -A jsr:@necmttn/surql db -d http://localhost:8000 -u root -p root -n my_namespace --database my_database

# Run with a config file (auto-detects surql-gen.config.ts or surql-gen.json in current directory)
deno run -A jsr:@necmttn/surql
```

## Installation with npm

To install with npm, run:

```bash
npm install @necmttn/surql
```

Then import and use:

```typescript
import { generateEffectSchemas, parseSurQL } from "@necmttn/surql";

// Parse SurrealQL schema
const tables = parseSurQL(schemaContent);

// Generate Effect Schema
const schemas = generateEffectSchemas(tables);
```

## Command Line Options

```
@necmttn/surql - Generate type-safe schemas from SurrealQL

USAGE:
  surql [command] [options]

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
  surql init                               Initialize a new TypeScript config file
  surql init --json                        Initialize a new JSON config file
  surql migrate                            Migrate from JSON config to TypeScript config
  surql process -i schema.surql -o types.ts  Process a SurrealQL file
  surql db -d http://localhost:8000 -o types.ts  Generate schema from database
  surql db -n my_namespace --database my_database  Generate schema with namespace and database name
  surql db -u root -p root                 Generate schema with authentication
  surql db                                 Generate schema using URL from config file
  surql process -i schema.surql -c custom-config.ts  Use custom config file
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

You can configure @necmttn/surql using either a TypeScript or JSON configuration
file.

### TypeScript Configuration (Recommended)

Create a `surql.config.ts` file in your project:

```typescript
import type { Config } from "@necmttn/surql/lib/config.ts";

export const config: Config = {
  output: {
    path: "./generated",
    filename: "schema",
    extension: "ts",
  },
  imports: {
    style: "esm",
    schemaSystem: "effect", // Using Effect Schema as the default schema system
    paths: {
      effect: "effect",
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

## Schema Export and Apply

@necmttn/surql also provides functionality to export and apply SurrealDB
schemas.

### Exporting Schema Definitions

You can export the schema definitions from a database using the `export-schema`
command:

```bash
deno run -A @necmttn/surql export-schema --db-url http://localhost:8000 --namespace test --database mydb
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
deno run -A @necmttn/surql apply-schema schema.surql --db-url http://localhost:8000 --namespace test --database mydb
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

## Project Status

The project is actively under development. Key focus areas:

1. Enhancing the Effect Schema Class integration
2. Improving the query type inference system
3. Creating a query builder API with static type safety

## License

MIT
