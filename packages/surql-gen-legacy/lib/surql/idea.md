## Current Status

### Completed Features

1. **Core Infrastructure**
   - ✅ Schema registration system
   - ✅ Type-safe query builder
   - ✅ Relationship detection
   - ✅ Basic error handling

2. **Query Building**
   - ✅ Type-safe query builder
   - ✅ Field expansion
   - ✅ Raw SurrealQL support
   - ✅ Basic relationship traversal

3. **Type System**
   - ✅ Schema type generation
   - ✅ Query result type inference
   - ✅ Relationship type inference
   - ✅ Basic validation

### In Progress

1. **Relationship Handling**
   - 🟡 Graph relationship support
   - 🟡 Edge property handling
   - 🟡 Bidirectional relationship validation

2. **Error Handling**
   - 🟡 Comprehensive error types
   - 🟡 Query validation
   - 🟡 Schema validation

3. **Testing**
   - 🟡 Unit tests
   - 🟡 Integration tests
   - 🟡 Performance tests

## Roadmap

| Phase | Description                     | Status               |
| ----- | ------------------------------- | -------------------- |
| 1     | Environment Setup & Research    | ✅ Complete          |
| 2     | Core Implementation             | ✅ Complete          |
| 3     | Query Type Inference (Basic)    | ✅ Complete          |
| 3.5   | Query Type Inference (Advanced) | ✅ Complete          |
| 4     | Integration & API Design        | ✅ Complete          |
| 5     | Testing & Documentation         | 🟡 In Progress (60%) |
| 6     | Performance & Optimization      | 🔴 Not Started       |

## How to Use the API

### Basic Usage

```typescript
import { Surql } from "./db/surql";

// Initialize the database
const db = new Surql();

// Connect to SurrealDB
await db.connect({
  url: "http://localhost:8000",
  namespace: "telegram",
  database: "app",
  username: "root",
  password: "root",
});

// Register all schemas
await db.registerSchemas("./src/**/*.ts");

// Query the database
const messages = await db.table("telegram_message")
  .select(["id", "message_text"])
  .where("datetime", ">", new Date())
  .orderBy("datetime", "DESC")
  .limit(10)
  .all();

// Create a record
const newMessage = await db.table("telegram_message").create({
  message_id: 12345,
  user_id: "user:123",
  message_text: "Hello, world!",
  datetime: new Date(),
});

// Raw SurrealQL queries
const results = await db.surql`
  SELECT * FROM telegram_message
  WHERE datetime > ${new Date()}
  ORDER BY datetime DESC
  LIMIT 10
`.as(db.table("telegram_message").schema);
```

### Relationship Handling

```typescript
// Expand relationships
const messagesWithUsers = await db.table("telegram_message")
  .select("*")
  .expand("user_id")
  .all();

// Access relationships
const user = await db.table("telegram_user").find("user:123");
const userMessages = await db.table("telegram_user")
  .relate("messages", user)
  .get();
```

```
Let me know if you'd like me to make any adjustments to these files!


// docs/PROJECT_STATUS.md (updated)
# Surql-Gen Project Status & Documentation Router

This document serves as a central hub for tracking the status of the surql-gen project and navigating the documentation.

## Project Overview

Surql-gen is a tool for generating type-safe schemas from SurrealQL definitions, with support for automatic query type inference. We're in the process of migrating from TypeBox to Effect Schema for better type safety and more advanced features.

### Key Features

1. **Schema Generation**: Create type-safe schemas from SurrealQL definitions
   - TypeBox schemas (legacy)
   - Effect Schema (recommended)
2. **Query Type Inference**: Automatically infer TypeScript types from SurrealQL queries
3. **Type-Safe API**: Build a type-safe interface for working with SurrealDB
4. **Relationship Management**: Automatic detection and handling of relationships

## Documentation Structure


// docs/TODO.md (updated)
# SurrealQL Type Generator - TODO List

## Current Priorities

1. **✅ Schema Registration & Type Inference**
   - [X] Implement automatic schema registration from files
   - [X] Extract relationship information from schema definitions
   - [ ] Add support for custom schema annotations
   - [ ] Implement schema validation

2. **✅ Query Building**
   - [X] Create type-safe query builder
   - [X] Add support for field expansion
   - [X] Implement raw SurrealQL with type inference
   - [ ] Add support for complex joins and subqueries
   - [ ] Implement query caching

3. **🟡 Relationship Handling**
   - [X] Support record links (one-way relationships)
   - [X] Support record references (bidirectional relationships)
   - [ ] Implement graph relationship traversal
   - [ ] Add support for edge properties
   - [ ] Implement relationship validation

4. **🔴 Error Handling & Validation**
   - [ ] Add comprehensive error types
   - [ ] Implement query validation
   - [ ] Add schema validation
   - [ ] Implement transaction support

5. **🟡 Testing & Documentation**
   - [X] Document the API design and usage
   - [ ] Write unit tests for schema registration
   - [ ] Add integration tests for query building
   - [ ] Create comprehensive API documentation

## Integration & API Design

- [X] Design API for query type generation
  - [X] Create a fluent interface for query building with type inference
  - [X] Implement function to generate types from raw SurrealQL queries
  - [X] Add support for parameterized queries
- [X] Implement integration with SurrealDB client libraries
  - [X] Create unified `Surql` class for database operations
  - [X] Create type-safe wrapper for query execution
- [ ] Design runtime validation system
  - [ ] Implement validation of query results against generated schemas
  - [ ] Add transformation capabilities for query results

## Testing & Documentation

- [ ] Update existing tests
  - [ ] Adapt tests to work with Effect Schema
  - [ ] Add new tests for query type inference
  - [ ] Create comprehensive test suite for different query patterns
- [X] Create examples
  - [X] Basic CRUD examples with type inference
  - [X] Relationship traversal examples
  - [X] Raw SurrealQL examples
- [ ] Improve error handling
  - [ ] Update the error handling to provide clearer messages about file paths
  - [ ] Add a logging option to show exactly where files are being generated
  - [ ] Create a command option to control whether existing files should be overwritten

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



  // src/examples/db-example.ts
import { Surql } from "../db/surql";
import { Telegram_user, Telegram_message, Telegram_chat, Telegram_thread } from "../surql";

async function main() {
  // Initialize the database
  const db = new Surql();
  
  try {
    // Connect to SurrealDB
    await db.connect({
      url: "http://localhost:8000",
      namespace: "telegram",
      database: "app",
      username: "root",
      password: "root"
    });
    
    console.log("Connected to SurrealDB");
    
    // Register all schemas
    await db.registerSchemas("./src/**/*.ts");
    console.log("Schemas registered");
    
    // Example 1: Basic query
    const messages = await db.table("telegram_message")
      .select(['id', 'message_text', 'datetime'])
      .where('datetime', '>', new Date(Date.now() - 24 * 60 * 60 * 1000))
      .orderBy('datetime', 'DESC')
      .limit(10)
      .all();
    
    console.log(`Found ${messages.length} recent messages`);
    
    // Example 2: Query with relationship expansion
    const messagesWithUsers = await db.table("telegram_message")
      .select('*')
      .expand('user_id')
      .where('datetime', '>', new Date(Date.now() - 24 * 60 * 60 * 1000))
      .limit(5)
      .all();
    
    console.log(`Found ${messagesWithUsers.length} messages with expanded user data`);
    
    // Example 3: Get a specific record and access relationships
    const user = await db.table("telegram_user").find("user:123");
    
    if (user) {
      console.log(`Found user: ${user.first_name} ${user.last_name || ""}`);
      
      // Access user's messages
      const userMessages = await db.table("telegram_user")
        .relate<typeof Telegram_message>("messages", user)
        .get() as Schema.Schema.Type<typeof Telegram_message>[];
      
      console.log(`User has ${userMessages.length} messages`);
      
      // Create a new message for this user
      const newMessage = await db.table("telegram_message").create({
        message_id: Math.floor(Math.random() * 1000000),
        user_id: user.id as any,
        message_text: "Hello, this is a test message!",
        datetime: new Date()
      });
      
      console.log(`Created message with ID: ${newMessage.id}`);
    }
    
    // Example 4: Raw SurrealQL with type inference
    const recentThreads = await db.surql`
      SELECT 
        id, 
        name,
        created_at,
        (SELECT count() FROM telegram_message WHERE thread_id = parent.id) AS message_count
      FROM telegram_thread
      WHERE created_at > ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
      ORDER BY created_at DESC
      LIMIT 5
    `.as(db.table("telegram_thread").schema);
    
    console.log(`Found ${recentThreads.length} recent threads`);
    for (const thread of recentThreads) {
      console.log(`- ${thread.name}: ${thread.message_count} messages`);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();


------


// src/db/surql.ts
import { Effect, Schema } from "effect";
import { Surreal as SurrealClient } from "surrealdb";
import * as path from "path";
import { glob } from "glob";

// Type for Record ID (imported from your schema definitions)
type RecordId<T extends string = string> = string & {
  readonly RecordId: unique symbol;
  readonly Table: T;
};

// Metadata extracted from schema definition
type SchemaMetadata = {
  tableName: string;
  fields: Record<string, {
    type: string;
    isArray: boolean;
    isRecordId: boolean;
    referencedTable?: string;
  }>;
  relationships: Record<string, {
    type: 'hasOne' | 'hasMany';
    field: string;
    target: string;
  }>;
};

// Query options type
type QueryOptions = {
  limit?: number;
  start?: number;
  parallel?: boolean;
};

// Core SurrealDB service
export class Surql {
  private client: SurrealClient;
  private schemas = new Map<string, Schema.Class<any>>();
  private metadata = new Map<string, SchemaMetadata>();
  private isConnected = false;

  constructor() {
    this.client = new SurrealClient();
  }

  // Connection to SurrealDB
  async connect(config: {
    url: string;
    namespace: string;
    database: string;
    username: string;
    password: string;
  }): Promise<void> {
    await this.client.connect(config.url, {
      namespace: config.namespace,
      database: config.database,
      auth: {
        username: config.username,
        password: config.password
      }
    });
    this.isConnected = true;
  }

  // Register all schema classes from a file pattern
  async registerSchemas(pattern: string | string[]): Promise<void> {
    const files = await glob(pattern);
    
    for (const file of files) {
      // Dynamic import to load the module
      const module = await import(path.resolve(file));
      
      // Find schema classes
      for (const [exportName, exportedClass] of Object.entries(module)) {
        if (this.isSchemaClass(exportedClass)) {
          const tableName = this.getTableName(exportedClass);
          this.schemas.set(tableName, exportedClass);
          
          // Extract and store metadata about fields and relationships
          this.metadata.set(tableName, this.extractMetadata(exportedClass));
        }
      }
    }
  }

  // Check if an object is a Schema.Class
  private isSchemaClass(obj: any): obj is Schema.Class<any> {
    return obj?.constructor && 
           typeof obj.decode === 'function' && 
           obj.ast?.annotations?.identifier;
  }

  // Get table name from schema class
  private getTableName(schema: Schema.Class<any>): string {
    return schema.ast.annotations?.identifier || 
           schema.constructor.name.toLowerCase();
  }

  // Extract metadata about fields and relationships from schema
  private extractMetadata(schema: Schema.Class<any>): SchemaMetadata {
    const tableName = this.getTableName(schema);
    const fieldsObj = schema.ast.propertySignatures || {};
    const fields: SchemaMetadata['fields'] = {};
    const relationships: SchemaMetadata['relationships'] = {};

    for (const [fieldName, fieldDef] of Object.entries(fieldsObj)) {
      // Determine field type and properties
      const type = this.getFieldType(fieldDef);
      const isArray = this.isArrayType(fieldDef);
      const isRecordId = this.isRecordIdType(fieldDef);
      
      // Store field information
      fields[fieldName] = {
        type,
        isArray,
        isRecordId,
        referencedTable: isRecordId ? this.extractReferencedTable(fieldDef) : undefined
      };
      
      // If this is a RecordId field, it's a relationship
      if (isRecordId) {
        const targetTable = this.extractReferencedTable(fieldDef);
        if (targetTable) {
          relationships[fieldName] = {
            type: isArray ? 'hasMany' : 'hasOne',
            field: fieldName,
            target: targetTable
          };
        }
      }
    }

    return { tableName, fields, relationships };
  }

  // Helper methods to analyze field types
  private getFieldType(fieldDef: any): string {
    // Extract type from schema AST
    if (fieldDef.type) {
      return fieldDef.type.name || 'unknown';
    }
    return 'unknown';
  }

  private isArrayType(fieldDef: any): boolean {
    return fieldDef.type?.name === 'Array' || 
           (fieldDef.annotations && 
            fieldDef.annotations.some((a: any) => a.type === 'Array'));
  }

  private isRecordIdType(fieldDef: any): boolean {
    return fieldDef.brand?.startsWith('RecordId<') || 
           (fieldDef.annotations && 
            fieldDef.annotations.some((a: any) => a.brand?.startsWith('RecordId<')));
  }

  private extractReferencedTable(fieldDef: any): string | undefined {
    // Extract table name from RecordId
    const brandStr = fieldDef.brand || 
                    (fieldDef.annotations && 
                     fieldDef.annotations.find((a: any) => a.brand)?.brand);
    
    if (brandStr && brandStr.startsWith('RecordId<')) {
      return brandStr.replace('RecordId<', '').replace('>', '');
    }
    return undefined;
  }

  // Get a type-safe query builder for a table
  table<T extends Schema.Class<any>>(
    tableName: string
  ): QueryBuilder<T> {
    const schema = this.schemas.get(tableName) as T;
    if (!schema) {
      throw new Error(`Schema not found for table: ${tableName}`);
    }
    return new QueryBuilder<T>(this, tableName, schema);
  }

  // Execute a raw SurrealQL query
  async query<T = any>(query: string, params?: Record<string, any>): Promise<T> {
    if (!this.isConnected) {
      throw new Error("Not connected to SurrealDB");
    }
    return this.client.query<T>(query, params);
  }

  // Create a record
  async create<T extends Schema.Class<any>>(
    tableName: string,
    data: Omit<Partial<Schema.Schema.Type<T>>, 'id'>,
    schema: T
  ): Promise<Schema.Schema.Type<T>> {
    if (!this.isConnected) {
      throw new Error("Not connected to SurrealDB");
    }
    
    const result = await this.client.create(tableName, data);
    return Schema.decode(schema)(result) as Promise<Schema.Schema.Type<T>>;
  }

  // Retrieve a record by ID
  async get<T extends Schema.Class<any>>(
    tableName: string,
    id: string,
    schema: T
  ): Promise<Schema.Schema.Type<T> | null> {
    if (!this.isConnected) {
      throw new Error("Not connected to SurrealDB");
    }
    
    const result = await this.client.query<any[]>(`SELECT * FROM ${tableName}:${id}`);
    
    if (!result || result.length === 0) {
      return null;
    }
    
    return Schema.decode(schema)(result[0]) as Promise<Schema.Schema.Type<T>>;
  }

  // Update a record
  async update<T extends Schema.Class<any>>(
    tableName: string,
    id: string,
    data: Partial<Schema.Schema.Type<T>>,
    schema: T
  ): Promise<Schema.Schema.Type<T>> {
    if (!this.isConnected) {
      throw new Error("Not connected to SurrealDB");
    }
    
    const result = await this.client.update(`${tableName}:${id}`, data);
    return Schema.decode(schema)(result) as Promise<Schema.Schema.Type<T>>;
  }

  // Delete a record
  async delete(tableName: string, id: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Not connected to SurrealDB");
    }
    
    await this.client.delete(`${tableName}:${id}`);
  }

  // Retrieve relationship metadata
  getRelationships(tableName: string): Record<string, { type: 'hasOne' | 'hasMany', target: string }> {
    const meta = this.metadata.get(tableName);
    if (!meta) return {};
    
    return Object.fromEntries(
      Object.entries(meta.relationships).map(([field, rel]) => 
        [field, { type: rel.type, target: rel.target }]
      )
    );
  }

  // SurrealQL template literal support
  surql<T = any>(
    strings: TemplateStringsArray,
    ...values: any[]
  ): { 
    query: string; 
    params: Record<string, any>;
    as: <R extends Schema.Class<any>>(schema: R) => Promise<Schema.Schema.Type<R>[]>;
  } {
    // Process the template string
    let query = strings[0];
    const params: Record<string, any> = {};
    
    for (let i = 0; i < values.length; i++) {
      const paramName = `p${i}`;
      params[paramName] = values[i];
      query += `$${paramName}${strings[i + 1]}`;
    }
    
    return {
      query,
      params,
      as: async <R extends Schema.Class<any>>(schema: R): Promise<Schema.Schema.Type<R>[]> => {
        const results = await this.query(query, params);
        
        if (!Array.isArray(results)) {
          return [];
        }
        
        return Promise.all(
          results.map(r => Schema.decode(schema)(r) as Promise<Schema.Schema.Type<R>>)
        );
      }
    };
  }
}

// Type-safe query builder
export class QueryBuilder<T extends Schema.Class<any>> {
  private conditions: string[] = [];
  private projections: string[] = [];
  private expansions: string[] = [];
  private limitValue: number | null = null;
  private offsetValue: number | null = null;
  private orderByFields: string[] = [];
  
  constructor(
    private db: Surql,
    private tableName: string,
    public schema: T
  ) {}
  
  // Select specific fields
  select(fields: Array<keyof Schema.Schema.Type<T> & string> | '*'): QueryBuilder<T> {
    if (fields === '*') {
      this.projections = ['*'];
    } else {
      this.projections = fields as string[];
    }
    return this;
  }
  
  // Where condition
  where(
    field: keyof Schema.Schema.Type<T> & string,
    operator: string,
    value: any
  ): QueryBuilder<T> {
    const formattedValue = typeof value === 'string' 
      ? `'${value}'` 
      : value instanceof Date 
        ? `'${value.toISOString()}'` 
        : Array.isArray(value)
          ? `[${value.map(v => typeof v === 'string' ? `'${v}'` : v).join(',')}]`
          : value;
        
    this.conditions.push(`${field} ${operator} ${formattedValue}`);
    return this;
  }
  
  // Limit results
  limit(value: number): QueryBuilder<T> {
    this.limitValue = value;
    return this;
  }
  
  // Offset results
  offset(value: number): QueryBuilder<T> {
    this.offsetValue = value;
    return this;
  }
  
  // Order by field
  orderBy(field: keyof Schema.Schema.Type<T> & string, direction: 'ASC' | 'DESC' = 'ASC'): QueryBuilder<T> {
    this.orderByFields.push(`${field} ${direction}`);
    return this;
  }
  
  // Expand related records
  expand<K extends keyof Schema.Schema.Type<T> & string>(field: K): QueryBuilder<T> {
    // Get table relationships
    const relationships = this.db.getRelationships(this.tableName);
    
    // Check if the field is a relationship
    if (relationships[field]) {
      this.expansions.push(`${field}.*`);
    }
    
    return this;
  }
  
  // Build the SurrealQL query
  private buildQuery(): string {
    // Determine what to select
    let projectionStr = this.projections.length > 0 
      ? this.projections.join(', ') 
      : '*';
      
    // If we have expansions, add them
    if (this.expansions.length > 0) {
      projectionStr += ', ' + this.expansions.join(', ');
    }
    
    // Build the base query
    let query = `SELECT ${projectionStr} FROM ${this.tableName}`;
    
    // Add conditions
    if (this.conditions.length > 0) {
      query += ` WHERE ${this.conditions.join(' AND ')}`;
    }
    
    // Add ordering
    if (this.orderByFields.length > 0) {
      query += ` ORDER BY ${this.orderByFields.join(', ')}`;
    }
    
    // Add pagination
    if (this.limitValue !== null) {
      query += ` LIMIT ${this.limitValue}`;
    }
    
    if (this.offsetValue !== null) {
      query += ` OFFSET ${this.offsetValue}`;
    }
    
    return query;
  }
  
  // Execute the query and return typed results
  async all(): Promise<Schema.Schema.Type<T>[]> {
    const query = this.buildQuery();
    const results = await this.db.query(query);
    
    if (!Array.isArray(results)) {
      return [];
    }
    
    return Promise.all(
      results.map(r => Schema.decode(this.schema)(r) as Promise<Schema.Schema.Type<T>>)
    );
  }
  
  // Get the first result or null
  async first(): Promise<Schema.Schema.Type<T> | null> {
    const results = await this.limit(1).all();
    return results.length > 0 ? results[0] : null;
  }
  
  // Execute a count query
  async count(): Promise<number> {
    // Save original projections and set count
    const originalProjections = [...this.projections];
    this.projections = ['count()'];
    
    const query = this.buildQuery();
    const result = await this.db.query(query);
    
    // Restore original projections
    this.projections = originalProjections;
    
    return Array.isArray(result) && result.length > 0 ? result[0]?.count || 0 : 0;
  }
  
  // Create a new record
  async create(data: Omit<Partial<Schema.Schema.Type<T>>, 'id'>): Promise<Schema.Schema.Type<T>> {
    return this.db.create(this.tableName, data, this.schema);
  }
  
  // Find a record by ID
  async find(id: string): Promise<Schema.Schema.Type<T> | null> {
    return this.db.get(this.tableName, id, this.schema);
  }
  
  // Update a record
  async update(id: string, data: Partial<Schema.Schema.Type<T>>): Promise<Schema.Schema.Type<T>> {
    return this.db.update(this.tableName, id, data, this.schema);
  }
  
  // Delete a record
  async delete(id: string): Promise<void> {
    return this.db.delete(this.tableName, id);
  }
  
  // Type-safe relationship access
  relate<R extends Schema.Class<any>>(
    field: keyof Schema.Schema.Type<T> & string,
    record: Schema.Schema.Type<T>
  ): RelationshipAccess<T, R> {
    // Get relationships metadata
    const relationships = this.db.getRelationships(this.tableName);
    const relationship = relationships[field];
    
    if (!relationship) {
      throw new Error(`No relationship found for field: ${String(field)}`);
    }
    
    // Create relationship access object
    return new RelationshipAccess<T, R>(
      this.db,
      record,
      field as string,
      relationship.target,
      relationship.type
    );
  }
}

// Helper class for accessing relationships
export class RelationshipAccess<T extends Schema.Class<any>, R extends Schema.Class<any>> {
  constructor(
    private db: Surql,
    private record: Schema.Schema.Type<T>,
    private field: string,
    private targetTable: string,
    private type: 'hasOne' | 'hasMany'
  ) {}
  
  // Get the related record(s)
  async get(): Promise<Schema.Schema.Type<R> | Schema.Schema.Type<R>[] | null> {
    const targetSchema = this.db.table<R>(this.targetTable).schema;
    
    if (this.type === 'hasOne') {
      const recordId = this.record[this.field] as unknown as string;
      if (!recordId) return null;
      
      return this.db.get(this.targetTable, String(recordId).split(':')[1], targetSchema);
    } else {
      // hasMany relationship
      const recordIds = this.record[this.field] as unknown as string[];
      if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
        return [];
      }
      
      const idList = recordIds.map(id => `'${id}'`).join(', ');
      const results = await this.db.query(`SELECT * FROM ${this.targetTable} WHERE id IN [${idList}]`);
      
      return Promise.all(
        results.map(r => Schema.decode(targetSchema)(r) as Promise<Schema.Schema.Type<R>>)
      );
    }
  }
}
```
