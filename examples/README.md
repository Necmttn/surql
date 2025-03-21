# surql-gen Examples

This directory contains examples of using the surql-gen library.

## TypeBox Helpers

The `typebox-helpers.ts` file demonstrates how to use the TypeBox helper
functions for creating strongly-typed database operations. These helpers are
similar to Drizzle's TypeBox functionality.

### Features

1. **Select Types**: Define which fields to select from your database
2. **Insert Types**: Strongly-typed insert operations with required fields
3. **Update Types**: Strongly-typed update operations with all fields optional
4. **Filter Types**: Complex filter conditions with operators

### How to Use

First, make sure to generate the schema types:

```bash
deno run -A mod.ts process <your-surrealdb-schema-file>
```

Then you can import and use the generated types in your application:

```typescript
import {
  TelegramChat,
  TelegramChatFilter,
  TelegramChatInsert,
  TelegramChatSelect,
  TelegramChatUpdate,
} from "../generated/schema.ts";

// Create strongly-typed functions for your database operations
async function selectChats(
  db: DbClient,
  filter: TelegramChatFilter,
  select?: TelegramChatSelect,
): Promise<TelegramChat[]> {
  const query = `
    SELECT ${select ? Object.keys(select).join(", ") : "*"}
    FROM telegram_chat
    WHERE ${buildWhere(filter)}
  `;

  return await db.query<TelegramChat[]>(query);
}

// Use with type-checking
const chats = await selectChats(
  db,
  {
    member_count: { gt: 5 },
    type: "group",
    title: { contains: "Test" },
  },
  {
    // Only select these fields
    title: true,
    username: true,
    member_count: true,
  },
);
```

### Available Helper Types

For each table `TableName` in your schema:

1. `TableNameSelect`: For specifying which fields to include in the result
2. `TableNameInsert`: For inserting new records with required fields
3. `TableNameUpdate`: For updating records with optional fields
4. `TableNameFilter`: For filtering records with various conditions

### Filter Operators

The `Filter` types support the following operators:

- `eq`: Equals
- `ne`: Not equals
- `gt`: Greater than
- `gte`: Greater than or equals
- `lt`: Less than
- `lte`: Less than or equals
- `in`: In array
- `nin`: Not in array
- `contains`: String contains
- `startsWith`: String starts with
- `endsWith`: String ends with

These operators can be combined to create complex queries:

```typescript
const users = await selectUsers(
  db,
  {
    age: { gte: 18, lt: 65 },
    active: true,
    name: { startsWith: "A" },
  },
);
```
