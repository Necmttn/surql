# Step 2: Schema.pipe Composition Patterns

This step demonstrates how to use Effect Schema's `.pipe()` for creating reusable validation constraints and composable schemas.

## 🎯 User Story

> "Our validation rules are getting duplicated across different models. We need email validation in users, projects, and profiles. We want to define these constraints once and reuse them everywhere while maintaining type safety."

## 🏗️ What We Built

**Reusable Validation System** using Schema.pipe composition:
- **Branded Types**: Email, Username, StrongPassword with validation
- **Composable Constraints**: Chain multiple validation rules together
- **Type Safety**: Prevent mixing incompatible values at compile time
- **Rich Error Messages**: Descriptive validation feedback
- **Schema Integration**: Use composed schemas directly in SurrealField

## ✅ Key Features Demonstrated

### 1. Reusable Constraint Definitions

```typescript
// Define once, use everywhere
const Email = Schema.String.pipe(
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    title: "Email",
    description: "Must be a valid email address",
  }),
  Schema.brand("Email")
);

const StrongPassword = Schema.String.pipe(
  Schema.minLength(8),
  Schema.pattern(/(?=.*[a-z])/, { description: "Must contain lowercase" }),
  Schema.pattern(/(?=.*[A-Z])/, { description: "Must contain uppercase" }),
  Schema.pattern(/(?=.*\d)/, { description: "Must contain number" }),
  Schema.pattern(/(?=.*[@$!%*?&])/, { description: "Must contain special char" }),
  Schema.brand("StrongPassword")
);
```

### 2. Schema.fromSchema() Integration

```typescript
// Use pre-composed schemas in field definitions
const userTable = SurrealTable.create("user", [
  SurrealField.fromSchema("email", Email).unique(),
  SurrealField.fromSchema("username", Username).unique(),
  SurrealField.fromSchema("phone", Schema.optional(PhoneNumber)),
  SurrealField.fromSchema("website", Schema.optional(Url)),
]);
```

### 3. Branded Type Safety

```typescript
// These types are incompatible at compile time
type Email = string & Brand<"Email">
type Username = string & Brand<"Username">

// This would cause a TypeScript error:
// const email: Email = someUsername; // ❌ Type error!
```

### 4. Composable Validation Chains

```typescript
// Chain multiple constraints together
const Slug = Schema.String.pipe(
  Schema.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),  // Format
  Schema.brand("Slug")                            // Branding
);

const Score = Schema.Number.pipe(
  Schema.int(),                    // Must be integer
  Schema.between(0, 100),         // Range validation
  Schema.brand("Score")           // Type branding
);
```

## 📁 Files Overview

| File | Purpose |
|------|---------| 
| `index.ts` | Complete composition examples and validation |
| `README.md` | Documentation and learning guide |

## 🚀 Running the Examples

```bash
# Run Step 2 composition examples
pnpm step:02

# Shows constraint creation, validation testing, and schema generation
```

## 🧪 Validation Constraint Library

This step creates a comprehensive library of reusable constraints:

### String Validation
- **Email**: RFC-compliant email validation with branding
- **Username**: Alphanumeric + underscore, 3-20 characters
- **Slug**: URL-friendly identifiers (lowercase, hyphens)
- **PhoneNumber**: US phone format validation
- **Url**: HTTP/HTTPS URL validation

### Security Validation  
- **StrongPassword**: Comprehensive password requirements
  - Minimum 8 characters
  - Lowercase + uppercase letters
  - Numbers + special characters
  - Branded type for security

### Numeric Validation
- **PositiveInt**: Positive integer constraint
- **Score**: 0-100 range validation with integer requirement

## 🎓 Key Learnings

### 1. **Composition Benefits**
- **Reusability**: Define validation logic once, use everywhere
- **Testability**: Each constraint can be unit tested independently
- **Maintainability**: Change validation rules in one place
- **Type Safety**: Branded types prevent value mixing

### 2. **Schema.pipe Pattern**
```typescript
Schema.String
  .pipe(Schema.pattern(...))    // Add format validation
  .pipe(Schema.brand(...))      // Add type branding
```

### 3. **Error Message Quality**
- Each constraint provides descriptive error messages
- Validation failures show exactly what went wrong
- Context-aware error reporting

### 4. **Integration Strategy**
- Use `SurrealField.fromSchema()` for composed schemas
- Automatic type inference from Schema AST
- Preserve validation logic in TypeScript generation

## 📊 Composition Patterns Used

### Basic Pattern
```typescript
const constraint = Schema.BaseType.pipe(
  Schema.validation1(...),
  Schema.validation2(...),
  Schema.brand("TypeName")
);
```

### Optional Pattern
```typescript
const optionalConstraint = Schema.optional(
  Schema.String.pipe(
    Schema.pattern(...),
    Schema.brand("Type")
  )
);
```

### Numeric Range Pattern
```typescript
const rangedNumber = Schema.Number.pipe(
  Schema.int(),
  Schema.between(min, max),
  Schema.brand("RangedInt")
);
```

## ✅ Success Metrics

✅ **Reusable constraints**: Created 8 commonly-used validation patterns  
✅ **Type safety**: Branded types prevent value mixing  
✅ **Integration working**: SurrealField.fromSchema() accepts composed schemas  
✅ **Validation tested**: All constraints validated with passing/failing examples  
✅ **Schema generation**: Composed schemas generate proper SurrealQL  

## 🔜 Next Steps

Step 2 established reusable validation patterns. Next steps will explore:

- **Step 3**: Annotations and metadata for documentation and tooling
- **Step 4**: Advanced patterns like migrations and versioning  
- **Step 5**: Real-world application scenarios

## 💡 Real-World Impact

This pattern enables:
- **Consistent validation** across your entire application
- **Reduced duplication** of validation logic  
- **Better error messages** for user experience
- **Type-safe operations** preventing runtime errors
- **Easy maintenance** when validation rules change

The composition approach scales from simple validation to complex business rules while maintaining readability and testability!