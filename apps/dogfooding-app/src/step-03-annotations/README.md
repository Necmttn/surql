# Step 3: Schema.annotations() for Rich Metadata

This step demonstrates how to use Effect Schema's `.annotations()` to add comprehensive documentation, business rules, and tooling hints to your schemas.

## 🎯 User Story

> "Our schemas work great but lack documentation. Developers don't know business rules, UI teams need display hints, and our tooling can't generate proper forms. We need rich metadata embedded in our schemas."

## 🏗️ What We Built

**Self-Documenting Schema System** using Schema.annotations():
- **Rich Documentation**: Examples, descriptions, and usage guidelines
- **Business Rules**: Workflow states, algorithms, and domain logic
- **Validation Hints**: Custom error messages and validation rules
- **Display Metadata**: UI formatting, colors, and presentation hints
- **Tooling Integration**: Hints for code generation and API documentation

## ✅ Key Features Demonstrated

### 1. Comprehensive Annotation Categories

```typescript
const AnnotatedEmail = Schema.String.pipe(
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  Schema.brand("Email")
).annotations({
  title: "Email Address",
  description: "RFC 5322 compliant email address",
  examples: ["user@example.com", "john.doe@company.co.uk"],
  documentation: "Used for user identification and notifications",
  jsonSchema: { format: "email", minLength: 5, maxLength: 254 },
  message: () => "Please enter a valid email address",
  surrealdb: { indexed: true, unique: true }
});
```

### 2. Business Logic Annotations

```typescript
const QualityScore = Schema.Number.pipe(
  Schema.int(),
  Schema.between(0, 100)
).annotations({
  businessLogic: {
    calculation: "weighted average of engagement (40%), completeness (35%), feedback (25%)",
    updateFrequency: "daily",
    impactOnRecommendations: "high"
  },
  display: {
    format: "percentage",
    colorCoding: { "0-30": "red", "31-70": "yellow", "71-100": "green" }
  }
});
```

### 3. Workflow State Annotations

```typescript
SurrealField.enum("status", ["draft", "review", "published", "archived"])
  .annotations({
    workflow: {
      transitions: {
        "draft": ["review", "archived"],
        "review": ["draft", "published", "archived"],
        "published": ["archived"],
        "archived": ["draft"]
      },
      permissions: {
        "draft": "author",
        "review": "editor", 
        "published": "editor",
        "archived": "admin"
      }
    }
  })
```

### 4. Security and Validation Annotations

```typescript
const SecureUrl = Schema.String.pipe(
  Schema.pattern(/^https?:\/\//)
).annotations({
  security: {
    allowedProtocols: ["http", "https"],
    blockedDomains: ["malicious.com"],
    validateDomain: true
  },
  validation: {
    maxLength: 2048,
    allowPrivateIPs: false
  }
});
```

## 📁 Files Overview

| File | Purpose |
|------|---------| 
| `index.ts` | Comprehensive annotations examples with real-world blog system |
| `README.md` | Documentation and learning guide |

## 🚀 Running the Examples

```bash
# Run Step 3 annotations examples
pnpm step:03

# Shows annotation creation, extraction, and documentation generation
```

## 📊 Annotation Categories Library

This step demonstrates a comprehensive annotation system:

### Documentation Annotations
- **title**: Human-readable field name
- **description**: Detailed field explanation
- **examples**: Valid example values
- **documentation**: Usage guidelines and context

### Validation Annotations
- **jsonSchema**: JSON Schema validation rules
- **message()**: Custom error message functions
- **validation**: Additional validation rules and constraints

### Business Logic Annotations
- **workflow**: State transitions and permissions
- **algorithm**: Calculation methods and factors
- **businessLogic**: Domain-specific rules and logic

### Display Annotations
- **display**: UI formatting and presentation hints
- **colorCoding**: Color schemes for different value ranges
- **badges**: Status indicators and styling

### Security Annotations
- **security**: Security validation and restrictions
- **audit**: Tracking and immutability rules
- **permissions**: Access control specifications

### Database Annotations
- **surrealdb**: Database-specific hints and optimizations
- **relationship**: Foreign key and association metadata
- **processing**: Data transformation and enrichment

## 🎓 Key Learnings

### 1. **Self-Documenting Schemas**
- Embed comprehensive documentation directly in schema definitions
- Generate API docs and developer guides from annotations
- Maintain documentation alongside code for consistency

### 2. **Business Rules as Code**
- Capture domain knowledge in schema annotations
- Enable automated validation of business rules
- Provide context for future developers

### 3. **Tooling Integration**
```typescript
// Form generators can use these annotations
field.annotations({
  display: { format: "currency", placeholder: "$0.00" },
  validation: { minValue: 0, maxValue: 1000000 }
});

// API generators can use these annotations  
field.annotations({
  openapi: { example: "user@example.com" },
  documentation: "Primary contact email for notifications"
});
```

### 4. **Rich Error Messages**
```typescript
Schema.String.annotations({
  message: () => "Username must be 3-20 characters using letters, numbers, or underscores"
});
```

## 📈 Real-World Applications

### Form Generation
```typescript
// Annotations drive form field generation
{
  type: "email",
  label: field.annotations.title,
  placeholder: field.annotations.examples[0],
  validation: field.annotations.validation,
  helpText: field.annotations.description
}
```

### API Documentation
```typescript
// OpenAPI spec generation from annotations
{
  type: "string",
  format: field.annotations.jsonSchema.format,
  example: field.annotations.examples[0],
  description: field.annotations.documentation
}
```

### Database Optimization
```typescript
// Index creation from annotations
if (field.annotations.surrealdb?.indexed) {
  generateIndex(field.name, field.annotations.surrealdb.indexType);
}
```

## ✅ Success Metrics

✅ **Rich metadata**: Created comprehensive annotation categories  
✅ **Business rules**: Embedded workflow and algorithm logic  
✅ **Documentation**: Generated API docs from schema annotations  
✅ **Validation hints**: Custom error messages and validation rules  
✅ **Tooling ready**: Annotations support form/API generation  

## 🔜 Next Steps

Step 3 established rich metadata patterns. Next steps will explore:

- **Step 4**: Advanced patterns like migrations and versioning
- **Step 5**: Real-world application scenarios and deployment

## 💡 Real-World Impact

This pattern enables:
- **Automated tooling** based on schema metadata
- **Self-documenting APIs** with rich examples and descriptions  
- **Consistent business rules** across frontend and backend
- **Better developer experience** with contextual help and validation
- **Maintainable systems** with embedded domain knowledge

The annotations approach transforms schemas from simple type definitions into comprehensive documentation and tooling platforms!