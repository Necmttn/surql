# Implementing Type-Safe SurrealQL Queries with Effect Schema

This document outlines the plan and progress for refactoring the `surql-gen`
library to use Effect Schema instead of TypeBox and implementing automatic type
inference for SurrealQL queries.

## Project Goals

1. Replace TypeBox with Effect Schema for generating type-safe schemas from
   SurrealDB tables
2. Implement a system for automatically inferring TypeScript types from
   SurrealQL queries
3. Create a developer-friendly API for building and executing type-safe
   SurrealDB queries

## Why Effect Schema?

[Effect Schema](https://effect.website/docs/schema/introduction/) offers several
advantages over TypeBox:

1. **Better Transformation Support**: Effect Schema has powerful transformation
   capabilities, allowing us to create more sophisticated type transformations.
2. **Branded Types**: Effect Schema's branded types make it easier to handle
   SurrealDB's record IDs with type safety.
3. **Rich Validation**: More expressive validation rules that can be composed
   together.
4. **First-Class Integration**: Part of the Effect ecosystem, which offers
   additional utilities for handling effects, errors, and more.

## Implementation Approach

Our approach to this refactoring and enhancement consists of several phases:

### Phase 1: Dual Schema System Support

We've implemented a dual schema system that allows users to choose between
TypeBox and Effect Schema:

```typescript
// In surql-gen.config.ts
export const config: Config = {
  // ... other config
  imports: {
    style: "esm",
    schemaSystem: "effect", // or "typebox"
    paths: {
      typebox: "@sinclair/typebox",
      effect: "@effect/schema",
    },
  },
};
```

This ensures backward compatibility while allowing users to opt-in to the new
Effect Schema implementation.

### Phase 2: SurrealQL Query Parser

We've implemented a SurrealQL query parser that can analyze queries and extract
information about:

- Tables being queried
- Fields being selected
- Nested field selections including wildcards
- Query modifiers like LIMIT

This parser forms the foundation for our type inference system.

### Phase 3: Type Inference System

The type inference system uses the query parser and a schema registry to
automatically generate appropriate TypeScript types for query results:

```typescript
// Example usage
const query = "SELECT *, author.* FROM post";
const schema = inferQueryReturnType(query, registry);

// Result is a Schema for:
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
```

### Phase 4: Query Builder API

We're designing a fluent API for building type-safe queries:

```typescript
// Conceptual design (work in progress)
const query = db
  .select("name", "email")
  .from("user")
  .where(eq("status", "active"))
  .limit(10);

// Inferred type: Array<{ name: string, email: string }>
const users = await query.exec();
```

## Implementation Status

| Component                 | Status         | Notes                                          |
| ------------------------- | -------------- | ---------------------------------------------- |
| Effect Schema Integration | ✅ Complete    | Basic implementation is done                   |
| Configuration System      | ✅ Complete    | Added schemaSystem option                      |
| Type Generation           | ✅ Complete    | Implemented `generateEffectSchemas` function   |
| SurrealQL Parser          | 🟡 In Progress | Basic implementation works, needs improvements |
| Type Inference            | 🟡 In Progress | Basic implementation works, needs improvements |
| Query Builder API         | 🔴 Not Started | Planned for next phase                         |
| Client Integration        | 🔴 Not Started | Planned for future work                        |

## Current Focus

We're currently focusing on:

1. Improving the SurrealQL parser to handle more complex queries
2. Enhancing the type inference system
3. Creating a comprehensive test suite
4. Fixing linting and other code quality issues

## How to Try It

You can experiment with the new features by:

1. Setting `schemaSystem: "effect"` in your configuration
2. Using the experimental query parsing APIs in `lib/query-parser.ts`
3. Trying the example in `examples/query-types/example.ts`

## Feedback and Contributions

This is a major enhancement to the `surql-gen` library, and we welcome feedback
and contributions. Please try the new features and let us know if you encounter
any issues or have suggestions for improvements.

## References

- [Effect Schema Documentation](https://effect.website/docs/schema/introduction/)
- [TypeBox Documentation](https://github.com/sinclairzx81/typebox)
- [SurrealDB Documentation](https://surrealdb.com/docs)
- [gql-tada](https://gql-tada.0no.co/get-started/) (our inspiration for the
  query type inference system)
