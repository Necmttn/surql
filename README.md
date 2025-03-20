# surql-gen

Generate TypeBox schemas from SurrealQL schema definitions.

## Usage

You can use the tool directly without installation using `deno run`:

```bash
# From JSR (Deno's package registry)
deno run -A jsr:@necmttn/surql-gen process -i schema.surql -o types.ts
```

### Quick Start

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
surql-gen - Generate TypeBox schemas from SurrealQL

USAGE:
  surql-gen [command] [options]

Commands:
  process       Process a SurrealQL file and generate TypeBox schemas
  db            Generate TypeBox schemas from SurrealDB instance
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
    paths: {
      typebox: "@sinclair/typebox",
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

### JSON Configuration

Alternatively, you can use a JSON configuration file named `surql-gen.json`:

```json
{
  "output": {
    "path": "./generated",
    "filename": "schema",
    "extension": "ts"
  },
  "imports": {
    "style": "esm",
    "paths": {
      "typebox": "@sinclair/typebox"
    }
  },
  "db": {
    "url": "http://localhost:8000",
    "username": "root",
    "password": "root",
    "namespace": "my_namespace",
    "database": "my_database"
  }
}
```

## Features

- Generate TypeBox schemas from SurrealQL schema definitions
- Support for all SurrealQL data types
- Handles relations between tables
- Configurable import styles (ESM, CommonJS, Deno)
- Customizable output paths and filenames
- Fetch schema directly from running SurrealDB instance

## Fetching Schema from SurrealDB

Instead of defining your schema in a .surql file, you can connect directly to a
running SurrealDB instance and generate TypeBox schemas from the existing
database schema.

```bash
# Using command line (explicit URL)
surql-gen db -d http://localhost:8000 -o types.ts

# Using URL from config file
surql-gen db -o types.ts

# With authentication and namespace/database specification
surql-gen db -d http://localhost:8000 -u root -p root -n my_namespace --database my_database

# Using configuration file with a custom config path
surql-gen db -c custom-config.json
```

The tool will:

1. Connect to the SurrealDB instance
2. Authenticate using the provided credentials
3. Execute an `INFO FOR DB` query to retrieve schema information
4. Generate TypeBox schemas based on the retrieved schema
5. Write the output to the specified file

This is particularly useful when:

- You have an existing database with schema already defined
- You want to keep your TypeScript types in sync with the actual database schema
- You're working with a database that's maintained by another team

## Examples

### Basic Example

Input: `schema.surql`

```sql
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD username ON user TYPE string;
DEFINE FIELD email ON user TYPE string;

DEFINE TABLE post SCHEMAFULL;
DEFINE FIELD title ON post TYPE string;
DEFINE FIELD content ON post TYPE string;
DEFINE FIELD author ON post TYPE record<user>;
```

Output: `types.ts`

```typescript
import { type Static, Type } from "@sinclair/typebox";
import type { RecordId } from "surrealdb";

// Type for representing a RecordId in TypeBox
const RecordIdType = <T extends string>(table: T) => Type.Unsafe<RecordId<T>>();

// Type declaration for User
export const UserType = Type.Object({
  id: RecordIdType("user"),
  username: Type.String(),
  email: Type.String(),
}, {
  $id: "user",
});

// Type declaration for Post
export const PostType = Type.Object({
  id: RecordIdType("post"),
  title: Type.String(),
  content: Type.String(),
  author: RecordIdType("user"),
}, {
  $id: "post",
});

const Module = Type.Module({
  user: UserType,
  post: PostType,
});

const User = Module.Import("user");
export type User = Static<typeof User>;
const Post = Module.Import("post");
export type Post = Static<typeof Post>;
```

## Schema Type Handling

### Reference Fields

Both file-based schema extraction and database schema extraction handle
reference fields:

- `references<table_name>` fields are properly converted to array types with the
  referenced table's type
- `record<table_name>` fields are handled as direct references
- `option<record<table_name>>` fields are handled as optional references

Example in SurrealQL:

```sql
DEFINE FIELD messages ON telegram_user TYPE references<telegram_message>;
DEFINE FIELD creator_id ON telegram_thread TYPE option<record<telegram_user>> REFERENCE;
```

Generated TypeScript:

```typescript
export const TelegramUserType = Type.Object({
  // ...
  messages: Type.Array(RecordIdType("telegram_message")),
  // ...
});

export const TelegramThreadType = Type.Object({
  // ...
  creator_id: Type.Optional(RecordIdType("telegram_user")),
  // ...
});
```

## Troubleshooting

### Differences Between File and DB Schema Generation

If you notice differences between schemas generated from a SurrealQL file and
schemas generated directly from a database connection, ensure:

1. Your SurrealQL file has been fully applied to the database
2. You're using a recent version of surql-gen that correctly handles references
   types
3. The database namespace and database name match the ones used when applying
   the schema

Common issues include:

#### References Fields Not Typed Correctly

In older versions, `references<table_name>` fields might be incorrectly handled
when fetching schema from a database. Make sure you're using surql-gen version
0.3.0 or later which includes fixes for references field handling.

Example of correct output for references fields:

```typescript
// In schema types
messages: Type.Array(RecordIdType('telegram_message')),
```

#### Schema File Path Confusion

By default, both approaches use the path specified in your config file:

```typescript
// In surql-gen.config.ts
export const config: Config = {
  output: {
    path: "./generated", // Directory path
    filename: "schema", // Base filename (without extension)
    extension: "ts", // File extension
  },
  // ...
};
```

To use a different output path for a specific command, use the `-o/--output`
flag:

```bash
deno run -A mod.ts db -o ./my-custom-path.ts
deno run -A mod.ts process -i schema.surql -o ./another-path.ts
```

## License

MIT License. See [LICENSE](./LICENSE) for details.

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
