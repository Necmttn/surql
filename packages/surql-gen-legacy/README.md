# @necmttn/surql

Generate type-safe schemas from SurrealQL definitions, with support for automatic query type inference.

## Installation

### Using npm/pnpm (Node.js)

```bash
pnpm add @necmttn/surql
```

### Using JSR (Deno)

The library is available on the JavaScript Registry (JSR) for Deno:

```typescript
import { generateSchemas } from "jsr:@necmttn/surql";
```

## Command Line Usage (JSR)

```bash
# Export schema from a SurrealDB instance to a file
deno run -A jsr:@necmttn/surql export-schema --overwrite --db-url http://localhost:8000

# Generate TypeScript models from a SurrealDB instance
deno run -A jsr:@necmttn/surql db --db-url http://localhost:8000

# Process a schema file
deno run -A jsr:@necmttn/surql process -i schema.overwrite.surql -o schema.ts

# With version specification
deno run -A jsr:@necmttn/surql@1.0.0 export-schema --db-url http://localhost:8000
```

## Generated Schema Examples

### From SurrealQL to TypeScript

The library transforms SurrealQL definitions like this:

```sql
DEFINE TABLE OVERWRITE message TYPE NORMAL SCHEMAFULL;
DEFINE FIELD OVERWRITE content ON message TYPE string;
DEFINE FIELD OVERWRITE chat ON message TYPE record<chat> REFERENCE ON DELETE CASCADE;
DEFINE FIELD OVERWRITE createdAt ON message TYPE datetime DEFAULT time::now();
```

Into type-safe Effect Model classes:

```typescript
export class Message extends Model.Class<Message>("Message")({
  id: Model.Generated(recordId("message")),
  content: Schema.String,
  chat: Schema.Union(recordId("chat"), Schema.suspend((): Schema.Schema<Chat> => Chat)),
  createdAt: Schema.DateFromSelf.annotations({ surrealDefault: 'time::now()' })
}) {
  static readonly tableName = "message" as const;
}
```

## Using Generated Models

```typescript
import { Message } from "./generated/schema";
import { recordId } from "@necmttn/surql";

// Create a new message with type checking
const message = new Message({
  content: "Hello world",
  chat: recordId("chat")("chat:abc123"),
  createdAt: new Date()
});

// Perform database operations
const result = await db.create(message);
```

## Configuration

Create a `surql-gen.config.ts` file:

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
    schemaSystem: "effect",
  },
  db: {
    url: "http://localhost:8000",
    namespace: "test",
    database: "test",
  },
};

export default config;
```

## Automation with CLI

For automated schema export and model generation, add to your build scripts:

```json
"scripts": {
  "generate:schema": "deno run -A jsr:@necmttn/surql export-schema --overwrite --db-url http://localhost:8000 && deno run -A jsr:@necmttn/surql db --db-url http://localhost:8000"
}
```

## License

MIT
