# TypeBox to Effect Schema Migration Mapping

This document provides a mapping of TypeBox types and functions to their Effect
Schema equivalents, to assist in the migration process.

## Basic Types

| TypeBox            | Effect Schema                      | Notes          |
| ------------------ | ---------------------------------- | -------------- |
| `Type.String()`    | `Schema.string`                    | String type    |
| `Type.Number()`    | `Schema.number`                    | Number type    |
| `Type.Integer()`   | `Schema.number.pipe(Schema.int())` | Integer type   |
| `Type.Boolean()`   | `Schema.boolean`                   | Boolean type   |
| `Type.Null()`      | `Schema.null`                      | Null type      |
| `Type.Undefined()` | `Schema.undefined`                 | Undefined type |
| `Type.Any()`       | `Schema.any`                       | Any type       |
| `Type.Unknown()`   | `Schema.unknown`                   | Unknown type   |
| `Type.Date()`      | `Schema.Date`                      | Date type      |

## Object and Array Types

| TypeBox                               | Effect Schema                           | Notes       |
| ------------------------------------- | --------------------------------------- | ----------- |
| `Type.Object({...})`                  | `Schema.struct({...})`                  | Object type |
| `Type.Array(schema)`                  | `Schema.array(schema)`                  | Array type  |
| `Type.Tuple([...])`                   | `Schema.tuple(...)`                     | Tuple type  |
| `Type.Record(keySchema, valueSchema)` | `Schema.record(keySchema, valueSchema)` | Record type |

## Modifiers

| TypeBox                 | Effect Schema             | Notes                   |
| ----------------------- | ------------------------- | ----------------------- |
| `Type.Optional(schema)` | `Schema.optional(schema)` | Optional type           |
| `Type.Readonly(schema)` | `Schema.readonly(schema)` | Readonly type           |
| `Type.Union([...])`     | `Schema.union(...)`       | Union type              |
| `Type.Intersect([...])` | `Schema.extend(a, b)`     | Intersection/extension  |
| `Type.Literal(value)`   | `Schema.literal(value)`   | Literal type            |
| `type Static<T>`        | `Schema.Type<T>`          | Extract TypeScript type |

## Constraints/Filters

| TypeBox                         | Effect Schema                                                      | Notes             |
| ------------------------------- | ------------------------------------------------------------------ | ----------------- |
| `Type.String({ minLength: n })` | `Schema.string.pipe(Schema.minLength(n))`                          | String min length |
| `Type.String({ maxLength: n })` | `Schema.string.pipe(Schema.maxLength(n))`                          | String max length |
| `Type.String({ pattern: p })`   | `Schema.string.pipe(Schema.pattern(p))`                            | String pattern    |
| `Type.Number({ minimum: n })`   | `Schema.number.pipe(Schema.greaterThanOrEqualTo(n))`               | Number minimum    |
| `Type.Number({ maximum: n })`   | `Schema.number.pipe(Schema.lessThanOrEqualTo(n))`                  | Number maximum    |
| `Type.Integer({ minimum: n })`  | `Schema.number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(n))` | Integer minimum   |

## Transformations

TypeBox has limited transformation capabilities, while Effect Schema has robust
transformation support:

| Concept | Effect Schema                              | Notes                   |
| ------- | ------------------------------------------ | ----------------------- |
| N/A     | `Schema.transform(schema, decode, encode)` | Transform between types |
| N/A     | `Schema.parse(schema)(value)`              | Parse/validate a value  |
| N/A     | `Schema.encode(schema)(value)`             | Encode a value          |

## Custom Types

For SurrealDB-specific types like RecordId, we'll need to create custom
transformations:

```typescript
// TypeBox version
const RecordIdSchema = Type.String({
  pattern: "^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$",
});

// Effect Schema version
const RecordIdSchema = Schema.string.pipe(
  Schema.pattern(/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/),
  Schema.brand("RecordId"),
);

// Usage with transformation
const RecordIdSchemaWithTransform = Schema.transform(
  Schema.string,
  RecordIdSchema,
  // decode function (string -> RecordId)
  (s) => {
    if (!/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/.test(s)) {
      return Schema.parseError(`Invalid RecordId format: ${s}`);
    }
    return s as RecordId;
  },
  // encode function (RecordId -> string)
  (r) => r,
);
```

## Implementation Strategy

1. First, implement basic type conversions
2. Add support for constraints and validations
3. Implement custom types specific to SurrealDB
4. Add transformation capabilities for advanced use cases
5. Create query parsing and type inference utilities

The migration will be done incrementally, keeping TypeBox support while adding
Effect Schema support in parallel.
