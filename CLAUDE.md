# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

surql-gen (@necmttn/surql) is a TypeScript schema generator that converts SurrealDB schema definitions (SurrealQL) into type-safe Effect Schema classes. It provides automatic query type inference for type-safe database operations.

Key capabilities:
- Parses SurrealQL schema files and generates Effect Schema classes
- Infers types from SurrealDB queries for compile-time safety
- CLI for schema export, processing, and database operations
- Support for complex SurrealDB types (records, arrays, unions, datetime)
- Reference validation and cascading delete support

## Essential Commands

### Development
```bash
# Run tests
deno test -A

# Run CLI in development
deno run -A mod.ts

# Run specific CLI commands
deno run -A mod.ts export-schema --overwrite --db-url http://localhost:8000
deno run -A mod.ts process -i schema.surql -o generated/schema.ts
deno run -A mod.ts db --db-url http://localhost:8000
```

### Code Quality
```bash
# Lint code
deno lint

# Format code
deno fmt

# Type check
deno check mod.ts
```

## Architecture

### Core Components
- `mod.ts` - CLI entry point and module exports
- `lib/schema.ts` - Main schema parsing and generation logic
- `lib/effect-schema.ts` - Effect Schema generation implementation
- `lib/query-parser.ts` - SurrealQL query parsing for type inference
- `lib/db/` - Database connection and operations
- `lib/commands.ts` - CLI command implementations
- `lib/config.ts` - Configuration management

### Type Generation Flow
1. Parse SurrealQL schema definitions (DEFINE TABLE/FIELD statements)
2. Convert SurrealDB types to Effect Schema types
3. Generate TypeScript classes with proper relationships
4. Handle special cases (record IDs, references, arrays, unions)
5. Apply constraints and default values as annotations

### Query Type Inference
- Parses SELECT queries to infer return types
- Supports basic field selection and WHERE clauses
- Work in progress for JOINs and nested selections

## Key Development Patterns

### Type Mapping
- `string` → `Schema.String`
- `int/number/float` → `Schema.Number`
- `bool` → `Schema.Boolean`
- `datetime` → `Schema.DateFromSelf`
- `record<table>` → `recordId("table")` or actual record reference
- `array<T>` → `Schema.Array(T)`
- `option<T>` → `Schema.optional(T)`

### Configuration
Configuration via `surql-gen.config.ts` or `surql-gen.json`:
- Output path and filename settings
- Import style (ESM/CommonJS)
- Database connection settings
- Schema system selection (effect/typebox)

### Testing Approach
- Unit tests for each major component
- Integration tests with real SurrealDB instances
- Fixture-based testing for schema parsing
- Test both file and database schema sources

## Current Development Focus

1. **Active Work**:
   - Completing query type inference for complex queries
   - Fixing remaining linting issues
   - Improving error handling and user feedback

2. **Known Issues**:
   - Query parser needs enhancement for JOINs and nested selections
   - Some edge cases in array type handling
   - npm package resolution in Deno environment

3. **Testing Priority**:
   - Always run `deno test -A` before committing changes
   - Add tests for any new functionality
   - Maintain backward compatibility