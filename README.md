# @necmttn/surql-gen Monorepo

A comprehensive SurrealDB schema management toolkit with Effect.js integration.

## 📦 Packages

### [@necmttn/surql-schema](./packages/surql-gen/)
**Main Package** - Modern, type-safe SurrealDB schema management with Effect.js

- 🔧 **Code-first schemas** with Schema.Class architecture
- 🧩 **Schema.pipe composition** for reusable constraints  
- 📝 **Rich annotations** for documentation and tooling
- 🚀 **Migration support** with automated generation
- 🎯 **173 comprehensive tests** demonstrating all patterns
- 📚 **Progressive examples** from basic to real-world applications

### [@necmttn/surql-gen-legacy](./packages/surql-gen-legacy/)
**Legacy Package** - Original Deno-based implementation (archived)

- 📜 Historical reference and migration source
- 🦕 Deno runtime with TypeScript
- 🔍 Query parsing and type inference experiments

## 🚀 Apps

### [Dogfooding App](./apps/dogfooding-app/) *(Coming Soon)*
Real-world application built with @necmttn/surql-schema to validate the library design and user experience.

## 🛠 Development

```bash
# Install dependencies
bun install

# Run all tests
bun test

# Development mode (all packages)
bun dev

# Build all packages
bun build

# Format code
bun format

# Lint code  
bun lint
```

## 📖 Quick Start

```bash
# Install the main package
bun add @necmttn/surql-schema

# Create your first schema
import { SurrealField, SurrealTable, SurrealSchema } from '@necmttn/surql-schema';

const userTable = SurrealTable.create("user", [
  SurrealField.id("user"),
  SurrealField.string("email").unique().description("User email"),
  SurrealField.string("name").description("User display name"),
  SurrealField.datetime("created_at").default("time::now()"),
]);

const schema = SurrealSchema.create("my_app", "1.0.0")
  .addTable(userTable);

// Generate SurrealQL
console.log(schema.toSurrealQL());
```

## 🎯 Learning Path

Follow the progressive examples in the main package:

1. **[Level 1: Basic Usage](./packages/surql-gen/src/examples/01-basic/)** - Schema.Class fundamentals
2. **[Level 2: Composition](./packages/surql-gen/src/examples/02-composition/)** - Schema.pipe patterns
3. **[Level 3: Annotations](./packages/surql-gen/src/examples/03-annotations/)** - Metadata and documentation
4. **[Level 4: Advanced](./packages/surql-gen/src/examples/04-advanced/)** - Validation and migrations
5. **[Level 5: Real-World](./packages/surql-gen/src/examples/05-real-world/)** - Complete applications

## 🌟 Key Features

- **Effect.js Integration** - Leverages Effect's Schema.Class and pipe patterns
- **Type Safety** - Compile-time and runtime validation
- **Developer Experience** - Rich tooling and documentation generation
- **Migration Support** - Automated schema evolution with rollback
- **Performance** - Optimized for large schemas and complex relationships
- **Real-World Ready** - Production patterns for e-commerce, SaaS, and content platforms

## 📚 Documentation

- [Main Package Documentation](./packages/surql-gen/README.md)
- [Progressive Examples Guide](./packages/surql-gen/src/examples/README.md)
- [Migration Guide from Legacy](./docs/MIGRATION.md) *(Coming Soon)*

## 🤝 Contributing

We welcome contributions! The monorepo structure makes it easy to:

1. **Improve the core library** in `packages/surql-gen/`
2. **Add new examples** to demonstrate patterns
3. **Build applications** that showcase the library capabilities
4. **Enhance documentation** and learning resources

## 📄 License

MIT - See [LICENSE](./LICENSE) for details.