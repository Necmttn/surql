// Example demonstrating SurrealQL query type inference with Effect Schema
import { Schema } from "@effect/schema";
import { inferQueryReturnType, SchemaRegistry } from "../../lib/query-parser.ts";
import { parseSurQL } from "../../lib/schema.ts";

// Sample SurrealQL schema definition
const SCHEMA = `
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD name ON user TYPE string;
DEFINE FIELD email ON user TYPE string;
DEFINE FIELD age ON user TYPE int;
DEFINE FIELD is_active ON user TYPE bool;
DEFINE FIELD created_at ON user TYPE datetime;

DEFINE TABLE post SCHEMAFULL;
DEFINE FIELD title ON post TYPE string;
DEFINE FIELD content ON post TYPE string;
DEFINE FIELD created_at ON post TYPE datetime;
DEFINE FIELD author ON post TYPE record<user>;
DEFINE FIELD tags ON post TYPE array<string>;

DEFINE TABLE comment SCHEMAFULL;
DEFINE FIELD content ON comment TYPE string;
DEFINE FIELD created_at ON comment TYPE datetime;
DEFINE FIELD author ON comment TYPE record<user>;
DEFINE FIELD post ON comment TYPE record<post>;
`;

// Parse the schema to get table definitions
const tables = parseSurQL(SCHEMA);

// Create a schema registry with the parsed tables
const registry = new SchemaRegistry(tables);

// Example 1: Simple query selecting all fields from a table
const query1 = "SELECT * FROM user";
const schema1 = inferQueryReturnType(query1, registry);
console.log("Schema for query:", query1);
console.log("Return type:", Schema.getIdentifier(schema1));

// Example 2: Query with specific fields
const query2 = "SELECT name, email FROM user";
const schema2 = inferQueryReturnType(query2, registry);
console.log("\nSchema for query:", query2);
console.log("Return type:", Schema.getIdentifier(schema2));

// Example 3: Query with a single result (LIMIT 1)
const query3 = "SELECT * FROM user LIMIT 1";
const schema3 = inferQueryReturnType(query3, registry);
console.log("\nSchema for query:", query3);
console.log("Return type:", Schema.getIdentifier(schema3));

// Example 4: Query with nested fields
const query4 = "SELECT *, author.* FROM post";
const schema4 = inferQueryReturnType(query4, registry);
console.log("\nSchema for query:", query4);
console.log("Return type:", Schema.getIdentifier(schema4));

// Example 5: More complex nested query
const query5 = "SELECT content, author.name, post.title FROM comment";
const schema5 = inferQueryReturnType(query5, registry);
console.log("\nSchema for query:", query5);
console.log("Return type:", Schema.getIdentifier(schema5));

// Function to build a query programmatically (as a prototype for a future API)
function createQuery() {
  // This is just a sketch of what the API could look like
  return {
    select: (fields: string | string[]) => ({
      from: (table: string) => ({
        where: (condition: string) => ({
          limit: (limit: number) => ({
            build: () => {
              const fieldsStr = Array.isArray(fields) ? fields.join(", ") : fields;
              return `SELECT ${fieldsStr} FROM ${table} WHERE ${condition} LIMIT ${limit}`;
            },
            execute: async () => {
              // In a real implementation, this would execute the query against SurrealDB
              console.log(`Executing: SELECT ${fieldsStr} FROM ${table} WHERE ${condition} LIMIT ${limit}`);
              // Mock execution results
              return [{ id: "user:1", name: "John", email: "john@example.com" }];
            }
          })
        })
      })
    })
  };
}

// Example 6: Using the programmatic query builder
const query6 = createQuery()
  .select(["name", "email"])
  .from("user")
  .where("is_active = true")
  .limit(10)
  .build();

console.log("\nProgrammatically built query:", query6);
const schema6 = inferQueryReturnType(query6, registry);
console.log("Return type:", Schema.getIdentifier(schema6));

// Example of how the query execution could look with type inference:
async function executeTypedQuery<T>(
  queryString: string,
  registry: SchemaRegistry
): Promise<T> {
  // In a real implementation:
  // 1. Infer the return type schema
  const schema = inferQueryReturnType(queryString, registry) as Schema.Schema<T>;

  // 2. Execute the query against SurrealDB
  console.log("Executing query:", queryString);

  // 3. Mock result (in a real implementation, this would be from the database)
  const mockResult = {
    id: "user:1",
    name: "John",
    email: "john@example.com",
    age: 30,
    is_active: true,
    created_at: new Date()
  };

  // 4. Validate and transform the result using the schema
  // This would use Schema.parse(schema)(mockResult) in a real implementation
  console.log("Validating result with schema...");

  // 5. Return the typed result
  return mockResult as T;
}

// Example 7: Execute a typed query
async function runExample() {
  const result = await executeTypedQuery(query3, registry);
  console.log("\nTyped query result:", result);
  // In TypeScript, 'result' would have the correct inferred type
}

runExample().catch(console.error); 