# SurrealQL Query Parser and Type Inference System

This document outlines the design for implementing a SurrealQL query parser and
type inference system that will enable automatic type generation from SurrealQL
queries.

## Goals

1. Parse SurrealQL SELECT queries to extract information about tables and fields
   being queried
2. Generate Effect Schema types based on the query structure
3. Provide type-safe query execution with proper return types
4. Support complex queries with joins, nested selects, and field projections
5. Create a system similar to gql-tada but for SurrealQL

## Architecture

The system will consist of the following components:

1. **SurrealQL Parser**: A parser for SurrealQL queries that extracts structural
   information
2. **Schema Registry**: A registry of table schemas and their relationships
3. **Type Inference Engine**: A system that infers return types based on queries
   and schema information
4. **Query Builder**: A type-safe API for building queries programmatically
5. **Runtime Client**: Integration with SurrealDB client libraries

### SurrealQL Parser

The parser will focus primarily on SELECT queries, with special attention to:

- Table selections (`FROM` clause)
- Field projections (SELECT columns vs. SELECT *)
- Joins and nested property access (`*.owner.*`)
- Conditions and filters (`WHERE` clause)
- Return type modifiers (LIMIT, GROUP BY, etc.)

```typescript
interface ParsedQuery {
  type: "SELECT" | "CREATE" | "UPDATE" | "DELETE";
  tables: TableReference[];
  fields: FieldSelection[];
  joins: JoinReference[];
  conditions: Condition[];
  returnModifiers: ReturnModifier[];
}

interface TableReference {
  name: string;
  alias?: string;
}

interface FieldSelection {
  table?: string; // Table alias or name
  field: string | "*";
  nested?: NestedFieldSelection[];
}

interface JoinReference {
  fromTable: string;
  toTable: string;
  throughField: string;
}

interface NestedFieldSelection {
  field: string | "*";
  nested?: NestedFieldSelection[];
}
```

### Schema Registry

The Schema Registry will store and manage the schemas for all tables in the
database:

```typescript
interface SchemaRegistry {
  getTableSchema(tableName: string): TableSchema;
  registerTableSchema(tableName: string, schema: TableSchema): void;
  resolveFieldPath(tableName: string, path: string[]): FieldSchema;
  getRelationships(tableName: string): Relationship[];
}

interface TableSchema {
  name: string;
  schema: Schema.Schema<any>;
  fields: Record<string, FieldSchema>;
}

interface FieldSchema {
  name: string;
  schema: Schema.Schema<any>;
  isReference: boolean;
  referencedTable?: string;
}

interface Relationship {
  fromTable: string;
  toTable: string;
  throughField: string;
  type: "one-to-one" | "one-to-many" | "many-to-many";
}
```

### Type Inference Engine

The Type Inference Engine will combine the parsed query and schema information
to generate a return type:

```typescript
interface TypeInferenceEngine {
  inferReturnType(
    query: ParsedQuery,
    registry: SchemaRegistry,
  ): Schema.Schema<any>;
  inferReturnTypeFromString(
    queryString: string,
    registry: SchemaRegistry,
  ): Schema.Schema<any>;
}
```

The inference process will:

1. Identify all tables involved in the query
2. Determine which fields are selected from each table
3. Handle special cases like * selection (all fields)
4. Process nested selections and joins
5. Apply return modifiers (array vs. single object for LIMIT 1, etc.)

### Query Builder

The Query Builder will provide a fluent API for building type-safe queries:

```typescript
// Example API design
const query = db
  .select("*")
  .from("user")
  .where(eq("status", "active"))
  .limit(10);

// Type: Array<User>
const users = await query.exec();

const query2 = db
  .select("name, posts.*.title")
  .from("user")
  .where(eq("id", userId));

// Type: Array<{ name: string, posts: Array<{ title: string }> }>
const userData = await query2.exec();
```

## Implementation Plan

### Phase 1: Simple Query Parsing

1. Implement a basic parser for SELECT queries
2. Support table selection and simple field projections
3. Generate Effect Schema types for basic queries

### Phase 2: Advanced Query Features

1. Add support for joins and nested field access
2. Implement handling for query conditions and modifiers
3. Support complex field projections

### Phase 3: Type Inference

1. Implement the Type Inference Engine
2. Connect the parser with the Schema Registry
3. Generate accurate return types based on queries

### Phase 4: Query Builder

1. Implement a fluent API for building queries
2. Ensure type safety throughout the query building process
3. Connect the Query Builder with the Type Inference Engine

### Phase 5: Client Integration

1. Integrate with SurrealDB client libraries
2. Provide a seamless experience for query execution
3. Ensure proper typing of query results

## Example: Handling Nested Queries

Consider the following SurrealQL query:

```sql
SELECT *, owner.* FROM chat WHERE id = 'chat:123'
```

This query selects all fields from the 'chat' table, as well as all fields from
the related 'owner' table.

The parser would extract:

```typescript
{
  type: 'SELECT',
  tables: [{ name: 'chat' }],
  fields: [
    { field: '*' },
    { field: 'owner', nested: [{ field: '*' }] }
  ],
  conditions: [{ field: 'id', operator: '=', value: 'chat:123' }],
  returnModifiers: []
}
```

The Type Inference Engine would then:

1. Look up the schema for 'chat' in the registry
2. Identify that 'owner' is a reference to another table
3. Look up the schema for the owner's table
4. Create a combined schema for the return type

The resulting type would be:

```typescript
Schema.struct({
  // All fields from chat
  id: RecordIdSchema,
  content: Schema.string,
  created_at: Schema.Date,
  // ... other chat fields

  // All fields from owner, nested under owner property
  owner: Schema.struct({
    id: RecordIdSchema,
    name: Schema.string,
    email: Schema.string,
    // ... other owner fields
  }),
});
```

## Challenges and Considerations

1. **Parser Complexity**: SurrealQL is a rich language with many features. We
   need to balance completeness with practical implementation.

2. **Schema Discovery**: The system needs to know the schemas of all tables to
   infer return types correctly.

3. **Performance Concerns**: Parsing and type inference should be efficient to
   avoid runtime overhead.

4. **Query Flexibility**: SurrealQL allows for highly dynamic queries. We need
   to handle cases where type cannot be fully determined statically.

5. **Edge Cases**: Handling complex SurrealQL features like subqueries,
   expressions, and functions.

## Next Steps

1. Implement a basic parser for SELECT queries
2. Create the Schema Registry structure
3. Develop the core Type Inference Engine
4. Build a prototype of the Query Builder
5. Test with simple queries and gradually add support for more complex features
