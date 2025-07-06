# Progressive Examples: Schema.Class + Schema.pipe Patterns

This examples folder demonstrates the improved Developer Experience (DX) using Effect Schema.Class combined with Schema.pipe patterns for building composable, type-safe SurrealDB schemas.

## 📚 Learning Path

### [Level 1: Basic Schema.Class Usage](./01-basic/)
**Start here!** Learn the fundamentals of our Schema.Class architecture.

- `field-factory.test.ts` - Core field types and factory methods (71 tests)
- `table-creation.test.ts` - Table assembly and field management (24 tests)
- `schema-assembly.test.ts` - Complete schema composition (22 tests)

**Key Concepts:**
- SurrealField factory methods with built-in validation
- SurrealTable creation and fluent field management
- Schema.Class immutability and encoding/decoding
- SurrealQL generation and TypeScript interfaces

### [Level 2: Schema.pipe Composition](./02-composition/)
**Build composable schemas** using Effect's native pipe patterns for DX improvement.

- `reusable-constraints.test.ts` - Creating reusable validation schemas (16 tests)
- `field-presets.test.ts` - Pre-composed field types for common patterns (17 tests)
- `constraint-composition.test.ts` - Advanced constraint combinations (9 tests)

**Key Concepts:**
- Schema.pipe for constraint composition instead of fluent chaining
- Reusable validation schemas that work across different fields
- Composable constraints vs repetitive field creation
- Performance benefits of constraint reuse

### [Level 3: Annotations & Metadata](./03-annotations/)
**Rich metadata** using Effect's annotations system for documentation and tooling.

- `schema-metadata.test.ts` - Comprehensive annotation usage (8 tests)
- `field-integration.test.ts` - Field annotations with validation (7 tests)
- `validation-messages.test.ts` - Custom error messages and localization (4 tests)
- `documentation-generation.test.ts` - Auto-generated docs from annotations (4 tests)

**Key Concepts:**
- Effect Schema annotations for metadata preservation
- Custom error messages and validation contexts
- Documentation generation from schema annotations
- API and database documentation automation

### [Level 4: Advanced Patterns](./04-advanced/)
**Production-ready patterns** for complex validation and schema evolution.

- `validation-workflows.test.ts` - Complex business rules and async validation (6 tests)
- `schema-migrations.test.ts` - Schema evolution and versioning (8 tests)
- `type-inference.test.ts` - Advanced type patterns and dynamic schemas (8 tests)

**Key Concepts:**
- Multi-step validation workflows and business rules
- Schema versioning and migration generation
- Conditional schemas and type inference
- Effect integration patterns and async validation

### [Level 5: Real-World Scenarios](./05-real-world/)
**Complete application schemas** demonstrating all patterns in production contexts.

- `e-commerce-platform.test.ts` - Full e-commerce system (4 tests, 6 tables, 16 indexes)
- `blog-platform.test.ts` - Blog/CMS with comments and media (5 tests, 6 tables, 22 indexes)
- `saas-application.test.ts` - Multi-tenant SaaS platform (5 tests, 7 tables, 25 indexes)

**Key Concepts:**
- Production schema design with performance optimization
- Multi-tenancy and role-based access control (RBAC)
- Complex relationships and business logic events
- Schema evolution with real migration scenarios

## 🧪 Running Examples

```bash
# Run all example tests (173 tests total)
bun test src/examples/

# Run specific level
bun test src/examples/01-basic/
bun test src/examples/02-composition/
bun test src/examples/03-annotations/
bun test src/examples/04-advanced/
bun test src/examples/05-real-world/

# Run individual examples
bun test src/examples/05-real-world/e-commerce-platform.test.ts
```

## 🎯 Learning Goals

By the end of this progression, you'll understand:

### Developer Experience (DX) Improvements
1. **Schema.pipe Pattern**: Using Effect's native composition instead of fluent APIs
2. **Constraint Reusability**: Building shared validation logic across fields
3. **Rich Annotations**: Enhanced metadata for documentation and tooling
4. **Type Safety**: Compile-time and runtime validation with Effect Schema

### Production Patterns
5. **Schema Evolution**: Managing changes with automated migrations
6. **Performance**: Strategic indexing and query optimization
7. **Business Logic**: Enforcing rules through database events
8. **Real-World Architecture**: Multi-tenancy, RBAC, and complex relationships

### Technical Benefits
- **173 passing tests** demonstrating comprehensive coverage
- **Immutable transformations** ensuring data integrity
- **Self-documenting schemas** with rich metadata
- **Automatic code generation** for SurrealQL and TypeScript
- **Migration support** with Drizzle-kit style versioning

Each level builds on the previous, creating a solid foundation for building maintainable, type-safe SurrealDB schemas with excellent developer experience.

## 🔗 Integration

The examples demonstrate integration with:
- **Effect.js ecosystem** - Schema, Layer, Service patterns
- **SurrealDB features** - Tables, indexes, events, permissions
- **TypeScript generation** - Interfaces and type definitions
- **Migration tools** - Schema comparison and SQL generation
- **AI metadata** - Query optimization and semantic information