# Level 1: Basic Schema.Class Usage

This level introduces the fundamental concepts of using Schema.Class for SurrealDB schema definition. You'll learn the core building blocks and basic patterns.

## Examples in this Level

### 1. **Field Factory** (`field-factory.test.ts`)
Learn to create and validate individual fields with built-in Schema.Class features:
- Core field types (string, number, int, bool, datetime, array, object)
- Special field types (record references, ID fields)
- Basic field modifiers (optional, descriptions, defaults)
- Built-in validation and error handling

### 2. **Table Creation** (`table-creation.test.ts`) 
Master table assembly and management:
- Empty and pre-populated table creation
- Schemaless vs schemafull tables
- Fluent field management (add, remove, update, replace)
- Table metadata and permissions
- SurrealQL generation

### 3. **Schema Assembly** (`schema-assembly.test.ts`)
Understand complete schema composition:
- Schema creation and versioning
- Table, index, and event management
- Schema metadata and documentation
- Built-in validation and error detection
- Code generation (SurrealQL and TypeScript)

## Key Learning Objectives

By completing this level, you'll understand:

1. **Schema.Class Fundamentals**: How built-in validation and encoding/decoding work
2. **Type Safety**: How Effect Schema provides compile-time and runtime safety
3. **Immutability**: How functional programming patterns maintain data integrity
4. **Code Generation**: How schemas automatically generate SurrealQL and TypeScript
5. **Validation**: How to leverage built-in parsing and validation methods

## Usage Patterns

All examples follow these Schema.Class patterns:

```typescript
// 1. Create with automatic validation
const field = SurrealField.string("username")
  .optional()
  .description("User identifier");

// 2. Built-in validation methods
const validated = SurrealField.validate(fieldData);
const safe = SurrealField.safeParse(fieldData);

// 3. Immutable transformations
const newField = field.description("Updated description");

// 4. Self-serialization
const surrealql = field.toSurrealQL();
```

## Testing Approach

Each example includes comprehensive tests for:
- **Creation and Validation**: Factory method correctness
- **Immutability**: Ensuring transformations don't mutate original objects
- **Error Handling**: Validation failure scenarios
- **Code Generation**: SurrealQL output verification
- **Schema.Class Features**: Encoding, decoding, and parsing

Run tests for this level:

```bash
bun test src/examples/01-basic/
```

## Next Steps

After mastering the basics:
1. Progress to Level 2 for Schema.pipe composition patterns
2. Learn constraint reusability and advanced field creation
3. Understand how annotations enhance the development experience