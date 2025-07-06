# Level 5: Real-World Scenarios

This level demonstrates complete, production-ready examples that combine all the patterns from previous levels into realistic applications.

## Examples in this Level

### 1. **E-commerce Platform** (`e-commerce-platform.test.ts`)
A complete e-commerce schema with products, users, orders, and inventory management. Demonstrates:
- Complex table relationships
- Advanced constraints and validation
- Business rule enforcement via events
- AI-optimized metadata for search and recommendations
- Complete migration workflows

### 2. **Blog Platform with Comments** (`blog-platform.test.ts`) 
A multi-tenant blogging platform with users, posts, comments, and categories. Shows:
- Multi-level relationship modeling
- Permission-based access control
- Content management workflows
- AI metadata for content discovery
- Schema evolution and versioning

### 3. **SaaS Application Schema** (`saas-application.test.ts`)
An organization-based SaaS platform with teams, projects, and resources. Features:
- Multi-tenancy with organizations
- Role-based permissions
- Resource allocation and billing
- Activity tracking and analytics
- Complex business constraints

### 4. **Content Management System** (`cms-platform.test.ts`)
A flexible CMS with dynamic content types and publishing workflows. Includes:
- Flexible content modeling
- Publishing state management
- Media asset organization
- SEO optimization metadata
- Workflow automation

## Key Learning Objectives

By completing this level, you'll understand:

1. **System Architecture**: How to design complete database schemas for real applications
2. **Relationship Modeling**: Complex many-to-many and hierarchical relationships
3. **Business Logic**: Enforcing business rules through constraints and events
4. **Schema Evolution**: Managing schema changes in production systems
5. **Performance Optimization**: Using AI metadata and indexes for optimal queries
6. **Migration Strategies**: Safe deployment of schema changes

## Usage Patterns

Each example follows this structure:

```typescript
// 1. Define reusable constraints using Schema.pipe
const businessConstraints = {
  email: emailSchema,
  slug: slugSchema,
  currency: currencySchema
};

// 2. Build tables with rich metadata
const tables = [
  SurrealTable.create("user", [...fields])
    .withDescription("...")
    .aiPrimaryKey("email")
    .aiTemporalField("created_at"),
  // ... more tables
];

// 3. Assemble complete schema
const schema = SurrealSchema.create("app", "1.0.0")
  .addTables(...tables)
  .addIndex(...)
  .addEvent(...);

// 4. Generate migrations for deployment
const migration = MigrationGenerator.generateMigration(diff);

// 5. Export for different environments
const typescript = schema.toTypeScript();
const surrealql = schema.toSurrealQL();
```

## Testing Strategy

Each real-world example includes:

- **Unit Tests**: Individual component validation
- **Integration Tests**: Cross-table relationship validation  
- **Migration Tests**: Schema evolution scenarios
- **Performance Tests**: Query optimization validation
- **Business Logic Tests**: Constraint and event verification

Run tests for this level:

```bash
bun test src/examples/05-real-world/
```

## Next Steps

After mastering these real-world scenarios:

1. Apply these patterns to your own domain models
2. Customize the constraint library for your business rules
3. Extend the AI metadata system for your use cases
4. Build custom migration strategies for your deployment pipeline
5. Integrate with your existing Effect.js applications