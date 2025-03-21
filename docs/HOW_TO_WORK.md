# How to Work with Surql-Gen

This guide provides information on how to work with the surql-gen codebase,
including development environment setup, coding standards, and contribution
workflow.

## Development Environment Setup

### Prerequisites

- [Deno](https://deno.land/) (v1.34.0 or newer)
- [Node.js](https://nodejs.org/) (v18 or newer) - For npm package testing
- [SurrealDB](https://surrealdb.com/) - For testing with a live database

### Setting Up Your Environment

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/surql-gen.git
   cd surql-gen
   ```

2. **Configure Deno**: The project uses Deno as the primary runtime. Make sure
   your editor has Deno extensions installed for proper linting and type
   checking.

3. **Install npm dependencies** (for testing npm package):
   ```bash
   # Create a node_modules directory for Deno to find npm packages
   mkdir -p .npm/node_modules
   # Add to deno.json
   # "nodeModulesDir": "./.npm"

   # Install dependencies
   cd .npm
   npm init -y
   npm install @effect/schema effect @sinclair/typebox
   cd ..
   ```

4. **Start SurrealDB for testing** (optional):
   ```bash
   surreal start --user root --pass root memory
   ```

## Project Structure

```
surql-gen/
├── lib/                # Core library code
│   ├── schema.ts       # Schema parsing and generation
│   ├── effect-schema.ts # Effect Schema implementation
│   ├── query-parser.ts # SurrealQL query parsing
│   ├── config.ts       # Configuration management
│   └── commands.ts     # CLI commands
├── docs/               # Documentation
│   ├── technical/      # Technical design docs
│   └── implementation/ # Implementation details
├── examples/           # Example code
├── tests/              # Test suite
├── scripts/            # Utility scripts
└── generated/          # Output directory for generated schemas
```

## Development Workflow

### Running the CLI

```bash
# Development mode
deno run -A mod.ts

# Run a specific command
deno run -A mod.ts process -i schema.surql -o generated/schema.ts
```

### Testing

```bash
# Run all tests
deno test -A

# Run a specific test file
deno test -A tests/query_parser_test.ts

# Watch mode for development
deno test --watch
```

### Code Style and Standards

The project follows these coding standards:

1. **TypeScript Style**:
   - Use explicit types where beneficial for readability
   - Prefer interfaces over type aliases for object types
   - Use branded types for domain-specific types (like RecordId)

2. **Documentation**:
   - Document all public functions and types with JSDoc comments
   - Include examples where appropriate
   - Keep README.md updated with new features

3. **Testing**:
   - Write tests for all new features
   - Ensure backward compatibility with existing code
   - Include both unit tests and integration tests

### Making Changes

1. **Create a new branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement your changes**:
   - Follow coding standards
   - Update tests
   - Update documentation

3. **Test your changes**:
   ```bash
   deno test -A
   ```

4. **Lint your code**:
   ```bash
   deno lint
   ```

5. **Format your code**:
   ```bash
   deno fmt
   ```

## Working with Effect Schema

The project is migrating from TypeBox to Effect Schema. When working with the
codebase:

1. **Use Effect Schema for new code**:
   ```typescript
   import { Schema } from "@effect/schema";

   const UserSchema = Schema.struct({
     name: Schema.string,
     age: Schema.number.pipe(Schema.int()),
   });
   ```

2. **Maintain backward compatibility** with TypeBox for existing code until the
   migration is complete.

3. **Add tests** that verify both TypeBox and Effect Schema implementations work
   correctly.

## Common Tasks

### Adding a New Feature

1. Update relevant documentation in `docs/`
2. Implement the feature in `lib/`
3. Add tests in `tests/`
4. Add examples in `examples/` if appropriate
5. Update `README.md` if the feature is user-facing

### Fixing a Bug

1. Add a test that reproduces the bug
2. Fix the bug
3. Verify the test passes
4. Document the fix in the commit message

### Updating Documentation

1. For user-facing changes, update `README.md`
2. For technical design changes, update files in `docs/technical/`
3. For implementation details, update files in `docs/implementation/`

## Troubleshooting

### Common Issues

1. **Type Errors with npm Packages**:
   - Ensure the `nodeModulesDir` is correctly set in `deno.json`
   - Make sure all required npm packages are installed in `.npm/node_modules`

2. **SurrealDB Connection Issues**:
   - Verify SurrealDB is running and accessible
   - Check credentials in your config file

3. **Linting Issues**:
   - Run `deno lint` to see all linting issues
   - Use `// deno-lint-ignore <rule>` for cases where the lint rule is too
     strict

## Getting Help

If you need help with the project, you can:

1. Check the existing documentation in the `docs/` directory
2. Open an issue on GitHub with a detailed description of your problem
3. Reach out to the maintainers via email or chat
