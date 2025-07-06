# Level 3: Annotations & Metadata Integration

This level demonstrates how to use Effect Schema's `.annotations()` system for rich metadata and documentation integration with our SurrealDB schema generation.

## Key Concepts

### 1. Schema Annotations
Effect Schema provides a powerful annotations system that allows you to attach metadata to schemas:

```typescript
const emailSchema = Schema.String
  .pipe(nonEmptyString, emailPattern, maxLength(255))
  .annotations({
    identifier: "EmailAddress",
    title: "Email Address", 
    description: "A valid email address for user communication",
    examples: ["user@example.com", "admin@company.org"],
    documentation: "Email addresses are used for authentication and communication"
  });
```

### 2. Documentation Generation
Annotations can be used to automatically generate:
- API documentation
- Schema descriptions
- Validation error messages
- Type definitions
- Form field metadata

### 3. Integration with SurrealDB
Our examples show how annotations can enhance SurrealDB field definitions and provide rich metadata for database schema generation.

## Learning Path

### 03-annotations/
- `schema-metadata.test.ts` - Basic annotation usage and metadata extraction
- `documentation-generation.test.ts` - Automatic documentation from annotations  
- `validation-messages.test.ts` - Custom error messages and validation feedback
- `field-integration.test.ts` - Integration between annotations and SurrealField
- `advanced-metadata.test.ts` - Complex annotation patterns and metadata inheritance

## Benefits Demonstrated

1. **Rich Documentation**: Automatic generation of comprehensive schema documentation
2. **Better DX**: IDE hints, autocomplete, and validation messages
3. **Type Safety**: Compile-time validation of annotation structure  
4. **Metadata Inheritance**: Composition preserves and extends annotations
5. **Standardization**: Consistent metadata format across the entire schema

## Real-world Applications

- Automatic API documentation generation
- Form field metadata for UI components  
- Database schema documentation
- Validation error message customization
- IDE tooling and developer experience enhancement