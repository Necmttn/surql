# Surql-Gen Project Status & Documentation Router

This document serves as a central hub for tracking the status of the surql-gen
project and navigating the documentation.

## Project Overview

Surql-gen is a tool for generating type-safe schemas from SurrealQL definitions,
with support for automatic query type inference. We're in the process of
migrating from TypeBox to Effect Schema for better type safety and more advanced
features.

### Key Features

1. **Schema Generation**: Create type-safe schemas from SurrealQL definitions
   - TypeBox schemas (legacy)
   - Effect Schema (recommended)
2. **Query Type Inference**: Automatically infer TypeScript types from SurrealQL
   queries
3. **Type-Safe API**: Build a type-safe interface for working with SurrealDB

## Documentation Structure

```
surql-gen/
├── README.md                     # Main project documentation
├── docs/                         # Documentation directory
│   ├── HOW_TO_WORK.md            # Guide on working with the project
│   ├── COMPLETED.md              # Completed tasks
│   ├── TODO.md                   # Current todo items and priorities
│   ├── implementation/           # Implementation details
│   │   ├── OVERVIEW.md           # Implementation plan overview
│   │   └── STATUS.md             # Current implementation status
│   └── technical/                # Technical design documents
│       ├── TYPE_MAPPING.md       # TypeBox to Effect Schema mapping
│       └── QUERY_INFERENCE.md    # Query inference design
└── [Other project files and directories]
```

## Quick Links

### Getting Started

- [README.md](./README.md) - Project overview and usage instructions
- [docs/HOW_TO_WORK.md](./docs/HOW_TO_WORK.md) - Guide on working with the
  project

### Project Status

- [docs/TODO.md](./docs/TODO.md) - Current todo list and priorities
- [docs/COMPLETED.md](./docs/COMPLETED.md) - Completed tasks and milestones
- [docs/implementation/STATUS.md](./docs/implementation/STATUS.md) -
  Implementation status

### Technical Documentation

- [docs/implementation/OVERVIEW.md](./docs/implementation/OVERVIEW.md) -
  Implementation plan
- [docs/technical/TYPE_MAPPING.md](./docs/technical/TYPE_MAPPING.md) - TypeBox
  to Effect Schema mapping
- [docs/technical/QUERY_INFERENCE.md](./docs/technical/QUERY_INFERENCE.md) -
  Query inference design

### Examples and Source Code

- [examples/query-types/example.ts](./examples/query-types/example.ts) - Example
  usage of query type inference
- [lib/effect-schema.ts](./lib/effect-schema.ts) - Effect Schema implementation
- [lib/query-parser.ts](./lib/query-parser.ts) - Query parser implementation

## Current Phase: Core Functionality & Query Type Inference

We have completed several key milestones:

1. ✅ Initial implementation of the Effect Schema system
2. ✅ Array type handling and validation
3. ✅ Basic test coverage for schema generation
4. ✅ Basic query type inference

Current focus areas:

1. Enhancing the query parser to handle more complex queries
2. Improving test coverage
3. Resolving remaining linting issues
4. Documenting the implemented features

## Roadmap

| Phase | Description                     | Status               |
| ----- | ------------------------------- | -------------------- |
| 1     | Environment Setup & Research    | ✅ Complete          |
| 2     | Core Implementation             | ✅ Complete          |
| 3     | Query Type Inference (Basic)    | ✅ Complete          |
| 3.5   | Query Type Inference (Advanced) | 🟡 In Progress (60%) |
| 4     | Integration & API Design        | 🔴 Not Started       |
| 5     | Testing & Documentation         | 🟡 In Progress (40%) |
| 6     | Performance & Optimization      | 🔴 Not Started       |

## How to Work with This Project

For detailed information on working with the surql-gen project, please refer to
the [How to Work guide](./docs/HOW_TO_WORK.md). The guide covers:

- Development environment setup
- Project structure
- Development workflow
- Code style and standards
- Testing procedures
- Common tasks and troubleshooting

### Quick Start for Contributors

1. Set up your environment following the [HOW_TO_WORK.md](./docs/HOW_TO_WORK.md)
   guide
2. Choose a task from [TODO.md](./docs/TODO.md)
3. Familiarize yourself with the relevant technical documentation
4. Implement your changes following project standards
5. Add tests and update documentation
6. Submit a pull request

## Known Issues

1. NPM package dependencies are not automatically installed. Need to set up
   `nodeModulesDir` in `deno.json`.
2. The query parser doesn't currently handle complex JOINs properly.
3. Some linting issues remain in prototype implementations.
4. Array type handling needs more comprehensive testing with different
   scenarios.

## Questions?

If you have any questions about the project, please open an issue on GitHub or
refer to the documentation in the `docs/` directory.
