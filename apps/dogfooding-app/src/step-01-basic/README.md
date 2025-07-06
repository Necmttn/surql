# Step 1: Basic Schema Foundation

This step demonstrates how to use `@necmttn/surql-schema` for basic schema creation and REST API development.

## 🎯 User Story

> "We're a startup team of 5 people who need to track our tasks and projects. We want something simple but type-safe that can power a REST API."

## 🏗️ What We Built

**Complete Task Management System** using our library as the foundation:
- **Database Schema**: Users, Projects, and Tasks with relationships
- **REST API**: Full CRUD operations with automatic validation
- **Type Safety**: Generated TypeScript interfaces
- **SQL Generation**: Ready-to-use SurrealQL for database setup

## ✅ Key Features Demonstrated

### Schema Definition
```typescript
const userTable = SurrealTable.create("user", [
  SurrealField.id("user"),
  SurrealField.string("email").unique().withDescription("User email address"),
  SurrealField.string("first_name").withDescription("User first name"),
  // ... more fields
]);
```

### Fluent API with Method Chaining
```typescript
const emailField = SurrealField.string("email")
  .unique()                    // Adds unique constraint
  .withDescription("Email")    // Adds documentation
  .default("''");             // Sets default value
```

### Automatic SurrealQL Generation
```surql
-- Generated automatically from schema definition
DEFINE TABLE user SCHEMAFULL COMMENT 'User accounts for the team';
DEFINE FIELD id ON user TYPE record<user>;
DEFINE FIELD email ON user TYPE string COMMENT 'User email address';
DEFINE INDEX idx_unique_email ON user FIELDS email UNIQUE;
```

### TypeScript Interface Generation
```typescript
// Generated automatically from schema
export interface User {
  id: RecordId<"user">;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | undefined;
  is_active: boolean;
  created_at: Date;
  last_login: Date | undefined;
}
```

## 📁 Files Overview

| File | Purpose |
|------|---------|
| `schema.ts` | Core schema definition demo |
| `api.ts` | REST API using schema as ORM |
| `server.ts` | HTTP server to run the API |
| `test-api.ts` | Comprehensive API testing |
| `test-schema-only.ts` | Schema generation testing |
| `test-intellisense.ts` | TypeScript intellisense verification |

## 🚀 Running the Examples

### 1. Basic Schema Generation
```bash
pnpm step:01
# Shows schema creation, validation, and SQL generation
```

### 2. REST API Server
```bash
pnpm step:01:api
# Starts HTTP server on http://localhost:3000
```

### 3. API Testing
```bash
pnpm exec bun src/step-01-basic/test-api.ts
# Tests all API endpoints and validates responses
```

### 4. Schema-Only Testing
```bash
pnpm exec bun src/step-01-basic/test-schema-only.ts
# Tests just the schema generation without database
```

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API information and available endpoints |
| `GET` | `/health` | Health check and schema validation status |
| `GET` | `/api/schema` | Complete schema definition with metadata |
| `GET` | `/api/schema/sql` | Generated SurrealQL for database setup |
| `GET` | `/api/schema/typescript` | Generated TypeScript interfaces |
| `GET` | `/api/users` | List all users |
| `POST` | `/api/users` | Create new user (with validation) |
| `GET` | `/api/projects` | List all projects |
| `POST` | `/api/projects` | Create new project |
| `GET` | `/api/tasks` | List all tasks |
| `POST` | `/api/tasks` | Create new task |

## 🎓 Key Learnings

### 1. **Schema as Code**
- Define database schema programmatically
- Version control your schema definitions
- Automatic validation and type safety

### 2. **Developer Experience**
- IntelliSense support for all schema operations
- Method chaining for readable field definitions
- Immediate feedback on schema errors

### 3. **Code Generation**
- Automatic SurrealQL generation
- TypeScript interface generation
- No manual SQL writing required

### 4. **API Integration**
- Schema introspection enables dynamic APIs
- Automatic field validation
- Consistent query generation

## ✅ Success Metrics

✅ **Basic functionality working**: Schema creation, validation, SQL generation  
✅ **REST API functional**: All endpoints responding correctly  
✅ **Type safety verified**: TypeScript interfaces generated and working  
✅ **Developer experience**: IntelliSense and method chaining working  
✅ **Real-world usage**: Practical example that could be used in production  

## 🔜 Next Steps

Step 1 established the foundation. Next steps will explore:

- **Step 2**: Schema.pipe composition for reusable constraints
- **Step 3**: Annotations and metadata for documentation
- **Step 4**: Advanced patterns like migrations and versioning
- **Step 5**: Real-world application scenarios

This demonstrates that `@necmttn/surql-schema` successfully provides a modern, type-safe way to manage SurrealDB schemas with excellent developer experience!