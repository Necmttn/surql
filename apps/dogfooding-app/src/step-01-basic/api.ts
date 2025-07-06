/**
 * Step 1: Basic REST API using surql-schema as ORM
 * 
 * This demonstrates how to use our library in a real-world scenario:
 * - Creating schemas programmatically
 * - Building a REST API with Hono
 * - Using the generated SurrealQL for database operations
 */

import { Hono } from "hono";
import { SurrealField, SurrealTable, SurrealSchema } from "@necmttn/surql-schema";

console.log("🚀 Starting Step 1: Basic REST API");
console.log("📡 Task Management API using surql-schema as ORM\n");

// Step 1: Define our schema using the library
console.log("🏗️  Defining database schema...");

const userTable = SurrealTable.create("user", [
  SurrealField.id("user"),
  SurrealField.string("email").unique().withDescription("User email address"),
  SurrealField.string("first_name").withDescription("User first name"),
  SurrealField.string("last_name").withDescription("User last name"),
  SurrealField.string("avatar_url").optional().withDescription("Profile picture URL"),
  SurrealField.boolean("is_active").default("true").withDescription("Account status"),
  SurrealField.datetime("created_at").default("time::now()").withDescription("Account creation time"),
  SurrealField.datetime("last_login").optional().withDescription("Last login timestamp"),
])
  .withDescription("User accounts for the team");

const projectTable = SurrealTable.create("project", [
  SurrealField.id("project"),
  SurrealField.string("name").withDescription("Project name"),
  SurrealField.string("description").optional().withDescription("Project description"),
  SurrealField.record("owner", "user").withDescription("Project owner"),
  SurrealField.string("status").default("'active'").withDescription("Project status"),
  SurrealField.datetime("created_at").default("time::now()").withDescription("Project creation time"),
  SurrealField.datetime("updated_at").default("time::now()").withDescription("Last project update"),
  SurrealField.datetime("deadline").optional().withDescription("Project deadline"),
])
  .withDescription("Team projects and work containers");

const taskTable = SurrealTable.create("task", [
  SurrealField.id("task"),
  SurrealField.string("title").withDescription("Task title"),
  SurrealField.string("description").optional().withDescription("Task description"),
  SurrealField.record("project", "project").withDescription("Parent project"),
  SurrealField.record("assignee", "user").optional().withDescription("Assigned user"),
  SurrealField.record("created_by", "user").withDescription("Task creator"),
  SurrealField.string("status").default("'todo'").withDescription("Task status"),
  SurrealField.string("priority").default("'medium'").withDescription("Task priority"),
  SurrealField.datetime("created_at").default("time::now()").withDescription("Task creation time"),
  SurrealField.datetime("updated_at").default("time::now()").withDescription("Last task update"),
  SurrealField.datetime("due_date").optional().withDescription("Task deadline"),
  SurrealField.datetime("completed_at").optional().withDescription("Task completion time"),
])
  .withDescription("Individual tasks within projects");

const schema = SurrealSchema.create("task_management_api", "1.0.0")
  .withDescription("REST API for task management using surql-schema")
  .addTable(userTable)
  .addTable(projectTable)
  .addTable(taskTable);

console.log("✅ Schema defined with automatic validation");

// Step 2: Generate SurrealQL for database setup
console.log("\n📄 Generated database schema:");
const surrealql = schema.toSurrealQL();
console.log("=" + "=".repeat(50));
console.log(surrealql.substring(0, 300) + "...");
console.log("=" + "=".repeat(50));

// Step 3: Create Hono REST API
console.log("\n🌐 Setting up REST API with Hono...");

const app = new Hono();

// Middleware for JSON parsing and CORS
app.use('*', async (c, next) => {
  c.header('Content-Type', 'application/json');
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (c.req.method === 'OPTIONS') {
    return c.text('');
  }
  
  await next();
});

// Step 4: Schema introspection endpoints
app.get('/api/schema', (c) => {
  return c.json({
    name: schema.getName(),
    version: schema.getVersion(),
    description: schema.getMetadata()?.description,
    tables: schema.getTables().map(table => ({
      name: table.getName(),
      description: table.getDescription(),
      fields: table.getFields().map(field => ({
        name: field.getName(),
        type: field.getType(),
        description: field.getDescription(),
        optional: field.isOptional,
        constraints: field.getConstraints()
      }))
    })),
    surrealql: schema.toSurrealQL()
  });
});

app.get('/api/schema/sql', (c) => {
  c.header('Content-Type', 'text/plain');
  return c.text(schema.toSurrealQL());
});

app.get('/api/schema/typescript', (c) => {
  c.header('Content-Type', 'text/plain');
  return c.text(schema.toTypeScript());
});

// Step 5: Users API endpoints
app.get('/api/users', (c) => {
  // In a real app, this would query SurrealDB using the generated schema
  const query = `SELECT * FROM ${userTable.getName()};`;
  
  return c.json({
    message: "Get all users",
    query,
    schema: {
      table: userTable.getName(),
      fields: userTable.getFields().map(f => f.getName())
    },
    mock_data: [
      {
        id: "user:john",
        email: "john@example.com",
        first_name: "John",
        last_name: "Doe",
        is_active: true,
        created_at: "2024-01-01T12:00:00Z"
      }
    ]
  });
});

app.post('/api/users', async (c) => {
  const body = await c.req.json();
  
  // Validate against our schema fields
  const requiredFields = userTable.getFields()
    .filter(f => !f.isOptional && f.getName() !== 'id')
    .map(f => f.getName());
  
  const missingFields = requiredFields.filter(field => !body[field]);
  
  if (missingFields.length > 0) {
    return c.json({
      error: "Missing required fields",
      missing: missingFields,
      required: requiredFields
    }, 400);
  }
  
  const insertQuery = `INSERT INTO ${userTable.getName()} {
    email: $email,
    first_name: $first_name,
    last_name: $last_name,
    avatar_url: $avatar_url,
    is_active: $is_active
  };`;
  
  return c.json({
    message: "Create user",
    query: insertQuery,
    params: body,
    mock_result: {
      id: `user:${Date.now()}`,
      ...body,
      created_at: new Date().toISOString()
    }
  });
});

// Step 6: Projects API endpoints
app.get('/api/projects', (c) => {
  const query = `SELECT *, owner.* FROM ${projectTable.getName()};`;
  
  return c.json({
    message: "Get all projects",
    query,
    mock_data: [
      {
        id: "project:website",
        name: "Company Website",
        description: "Redesign company website",
        owner: "user:john",
        status: "active",
        created_at: "2024-01-01T12:00:00Z"
      }
    ]
  });
});

app.post('/api/projects', async (c) => {
  const body = await c.req.json();
  
  const insertQuery = `INSERT INTO ${projectTable.getName()} {
    name: $name,
    description: $description,
    owner: $owner,
    status: $status
  };`;
  
  return c.json({
    message: "Create project",
    query: insertQuery,
    params: body,
    mock_result: {
      id: `project:${Date.now()}`,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  });
});

// Step 7: Tasks API endpoints
app.get('/api/tasks', (c) => {
  const query = `SELECT *, project.*, assignee.*, created_by.* FROM ${taskTable.getName()};`;
  
  return c.json({
    message: "Get all tasks",
    query,
    mock_data: [
      {
        id: "task:homepage",
        title: "Design homepage",
        description: "Create modern homepage design",
        project: "project:website",
        assignee: "user:john",
        created_by: "user:john",
        status: "todo",
        priority: "high",
        created_at: "2024-01-01T12:00:00Z"
      }
    ]
  });
});

app.post('/api/tasks', async (c) => {
  const body = await c.req.json();
  
  const insertQuery = `INSERT INTO ${taskTable.getName()} {
    title: $title,
    description: $description,
    project: $project,
    assignee: $assignee,
    created_by: $created_by,
    status: $status,
    priority: $priority,
    due_date: $due_date
  };`;
  
  return c.json({
    message: "Create task",
    query: insertQuery,
    params: body,
    mock_result: {
      id: `task:${Date.now()}`,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  });
});

// Step 8: Health check and info endpoints
app.get('/', (c) => {
  return c.json({
    name: "Task Management API",
    version: "1.0.0",
    description: "REST API built with surql-schema as ORM",
    schema: {
      name: schema.getName(),
      version: schema.getVersion(),
      tables: schema.getTableNames()
    },
    endpoints: {
      schema: "/api/schema",
      users: "/api/users",
      projects: "/api/projects", 
      tasks: "/api/tasks"
    }
  });
});

app.get('/health', (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    schema_validation: "✅ Schema compiled successfully",
    tables_count: schema.getTables().length
  });
});

console.log("✅ REST API configured");
console.log("\n📊 API Summary:");
console.log(`   • Tables: ${schema.getTables().length}`);
console.log(`   • Endpoints: /api/users, /api/projects, /api/tasks`);
console.log(`   • Schema info: /api/schema`);
console.log(`   • Health check: /health`);

export { app, schema, userTable, projectTable, taskTable };