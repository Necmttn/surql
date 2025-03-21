# SurrealQL Type Generator - TODO List

## Current Priorities

1. **Fix linting issues in prototype implementations**
   - [x] Fix array type handling in `lib/effect-schema.ts`
   - [ ] Resolve remaining linting issues in `lib/effect-schema.ts`
   - [ ] Resolve linting issues in `lib/query-parser.ts`
   - [ ] Fix issue with npm packages not being found (Need to set up
         nodeModulesDir in deno.json)

2. **Enhance SurrealQL query parser**
   - [ ] Improve parsing of complex queries (JOINs, nested selections)
   - [ ] Add better error handling for malformed queries
   - [ ] Support parsing of JOINs and nested selects (`*.owner.*` pattern)
   - [ ] Add more advanced query parsing and validation utilities

3. **Complete query type inference system**
   - [x] Basic type inference for simple queries
   - [ ] Add support for complex JOINs and relationships
   - [ ] Improve handling of nested field selections
   - [ ] Support for filtering based on WHERE clauses

4. **Create integration tests**
   - [x] Write basic tests for Effect Schema generation
   - [x] Add tests for array type handling
   - [ ] Write tests for query parsing and type inference
   - [ ] Ensure backward compatibility with TypeBox
   - [ ] Add test for output path validation

5. **Improve documentation**
   - [x] Document array type handling in Effect Schema
   - [ ] Add migration guide from TypeBox to Effect Schema
   - [ ] Document query type inference capabilities
   - [ ] Create comprehensive API reference

## Integration & API Design

- [ ] Design API for query type generation
  - [ ] Create a fluent interface for query building with type inference
  - [ ] Implement function to generate types from raw SurrealQL queries
  - [ ] Add support for parameterized queries
- [ ] Implement integration with SurrealDB client libraries
  - [ ] Add plug-in system for different SurrealDB client implementations
  - [ ] Create type-safe wrapper for query execution
- [ ] Design runtime validation system
  - [ ] Implement validation of query results against generated schemas
  - [ ] Add transformation capabilities for query results

## Testing & Documentation

- [ ] Update existing tests
  - [ ] Adapt tests to work with Effect Schema
  - [ ] Add new tests for query type inference
  - [ ] Create comprehensive test suite for different query patterns
- [ ] Create examples
  - [ ] Complex join example with nested selection
  - [ ] Full CRUD operations with type inference
- [ ] Improve error handling
  - [ ] Update the error handling to provide clearer messages about file paths
  - [ ] Add a logging option to show exactly where files are being generated
  - [ ] Create a command option to control whether existing files should be
        overwritten

## Future Enhancements (Lower Priority)

- [ ] Add support for field constraints and validations
  - [ ] Implement min/max length for strings
  - [ ] Add numeric range constraints
  - [ ] Support custom validation patterns
- [ ] Integration with GraphQL-like query builders
- [ ] Schema evolution and migration support
- [ ] IDE plugins for SurrealQL query validation and autocompletion
- [ ] Add automatic type detection improvements
- [ ] Add more complex examples
- [ ] Test against .surql files
- [ ] Test against SurrealDB running in Docker
- [ ] Package for npm release

## Performance & Optimization (Lower Priority)

- [ ] Benchmark TypeBox vs Effect Schema implementations
  - [ ] Compare schema generation time
  - [ ] Compare validation performance
- [ ] Optimize query parsing
  - [ ] Implement caching for parsed queries
  - [ ] Add support for query plan inspection
- [ ] Check consistency between implementations
  - [ ] Check if array handling is consistent between file and DB processing
  - [ ] Verify entity type conversion for edge cases
  - [ ] Add validation to ensure output paths are consistent
