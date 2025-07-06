# Level 2: Schema.pipe Composition

This level focuses on Effect Schema's native `.pipe()` pattern for building reusable, composable constraints. You'll learn to create shared validation logic that can be used across different field types.

## Examples in this Level

### 1. **Reusable Constraints** (`reusable-constraints.test.ts`)
Master the Schema.pipe pattern for constraint composition:
- Basic constraint composition with `.pipe()`
- Pre-built field schemas (email, username, password, URL)
- Constraint reusability across different schemas
- Custom constraint helpers and enum patterns
- Error message composition and chaining

### 2. **Field Presets** (`field-presets.test.ts`)
Learn to create enhanced field factory methods using composed constraints:
- Preset email, username, and password fields
- Composable field builders with multiple constraints
- Field preset factory functions
- Complex compositions (social media, financial, geolocation)
- Validation integration and workflow patterns

### 3. **Advanced Constraint Composition** (`constraint-composition.test.ts`)
Explore sophisticated composition patterns:
- Multi-layered constraint composition
- Conditional and cross-field validation
- Schema transformation pipelines
- Normalization and data processing
- Performance optimization through constraint reuse

## Key Learning Objectives

By completing this level, you'll understand:

1. **Schema.pipe Pattern**: How to use Effect Schema's native composition
2. **Constraint Reusability**: Building a library of shared validation logic
3. **Composition Benefits**: Why composition beats inheritance for constraints
4. **Performance**: How constraint reuse improves validation speed
5. **DX Improvement**: Better developer experience through composable APIs

## Core Patterns Demonstrated

### Schema.pipe Composition
```typescript
// Reusable constraint schemas
export const emailSchema = Schema.String
  .annotations({ message: () => "Email must be a string" })
  .pipe(
    nonEmptyString,
    emailPattern,
    maxLength(255)
  )
  .annotations({
    identifier: "EmailAddress",
    title: "Email Address",
    description: "A valid email address for user communication"
  });

// Usage in field creation
const userEmail = SurrealField.string("email")
  .withSchema(emailSchema)  // Future enhancement
  .unique();
```

### Constraint Libraries
```typescript
// Build reusable constraint library
const constraints = {
  email: emailSchema,
  username: usernameSchema, 
  password: passwordSchema,
  slug: slugSchema,
  currency: currencySchema
};

// Use across different contexts
const userFields = [
  SurrealField.string("email").withConstraints(constraints.email),
  SurrealField.string("username").withConstraints(constraints.username)
];
```

### Composition vs Repetition
```typescript
// ❌ Repetitive approach
const email1 = SurrealField.string("email1")
  .pattern("^[^@]+@[^@]+\\.[^@]+$")
  .min(5)
  .max(255);

const email2 = SurrealField.string("email2")
  .pattern("^[^@]+@[^@]+\\.[^@]+$")
  .min(5)
  .max(255);

// ✅ Reusable approach
const email1 = createEmailField("email1");
const email2 = createEmailField("email2");
```

## Testing Strategy

Each example includes tests for:
- **Constraint Composition**: Verifying pipe operations work correctly
- **Reusability**: Same constraints across different field types
- **Error Propagation**: How composed errors flow through the pipeline
- **Performance**: Constraint reuse vs repetition benchmarks
- **Integration**: How constraints integrate with SurrealField

Run tests for this level:

```bash
bun test src/examples/02-composition/
```

## Next Steps

After mastering composition:
1. Progress to Level 3 for comprehensive annotation usage
2. Learn how to enhance schemas with metadata and documentation
3. Understand form generation and API documentation patterns