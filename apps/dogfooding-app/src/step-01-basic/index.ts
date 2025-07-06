/**
 * Step 1: Basic REST API using surql-schema as ORM
 * 
 * This demonstrates how users would build a real API using our library.
 * We'll create a simple task management API with CRUD operations.
 */

import { Hono } from "hono";
import { serve } from "@hono/node-server";
import Surreal from "surrealdb";
import { taskManagementSchema, userTable, projectTable, taskTable } from "./schema";

console.log("🚀 Starting Step 1: Basic REST API");
console.log("📡 Task Management API using surql-schema as ORM\n");

// Initialize our API
const app = new Hono();

// Database connection
const db = new Surreal();

// Connect to SurrealDB (in real app, this would be configurable)
await db.connect("http://localhost:8000");
await db.use({ namespace: "dogfooding", database: "step01" });

// Initialize schema in database
console.log("🗄️  Initializing database schema...");
const schemaSQL = taskManagementSchema.toSurrealQL();
await db.query(schemaSQL);
console.log("✅ Database schema initialized\n");

// Health check endpoint
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    schema: taskManagementSchema.getName(),
    version: taskManagementSchema.getVersion(),
    tables: taskManagementSchema.getTables().length
  });
});

// USER ENDPOINTS
console.log("👥 Setting up User endpoints...");

// GET /users - List all users
app.get("/users", async (c) => {
  try {
    const result = await db.query("SELECT * FROM user ORDER BY created_at DESC");
    return c.json({ users: result[0] || [] });
  } catch (error) {
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

// POST /users - Create new user
app.post("/users", async (c) => {
  try {
    const body = await c.req.json();
    
    // Use our schema for validation (basic example)
    const userData = {
      email: body.email,
      first_name: body.first_name,
      last_name: body.last_name,
      avatar_url: body.avatar_url,
    };

    const result = await db.create("user", userData);
    return c.json({ user: result }, 201);
  } catch (error) {
    return c.json({ error: "Failed to create user", details: error }, 400);
  }
});

// GET /users/:id - Get specific user
app.get("/users/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await db.select(`user:${id}`);
    
    if (!result) {
      return c.json({ error: "User not found" }, 404);
    }
    
    return c.json({ user: result });
  } catch (error) {
    return c.json({ error: "Failed to fetch user" }, 500);
  }
});

// PROJECT ENDPOINTS
console.log("📂 Setting up Project endpoints...");

// GET /projects - List all projects
app.get("/projects", async (c) => {
  try {
    const result = await db.query(`
      SELECT *, 
        owner.* AS owner_details,
        count((SELECT * FROM task WHERE project = $parent.id)) AS task_count
      FROM project 
      ORDER BY created_at DESC
    `);
    return c.json({ projects: result[0] || [] });
  } catch (error) {
    return c.json({ error: "Failed to fetch projects" }, 500);
  }
});

// POST /projects - Create new project
app.post("/projects", async (c) => {
  try {
    const body = await c.req.json();
    
    const projectData = {
      name: body.name,
      description: body.description,
      owner: `user:${body.owner_id}`,
      status: body.status || "active"
    };

    const result = await db.create("project", projectData);
    return c.json({ project: result }, 201);
  } catch (error) {
    return c.json({ error: "Failed to create project", details: error }, 400);
  }
});

// TASK ENDPOINTS  
console.log("✅ Setting up Task endpoints...");

// GET /tasks - List all tasks
app.get("/tasks", async (c) => {
  try {
    const projectId = c.req.query("project_id");
    
    let query = `
      SELECT *, 
        project.name AS project_name,
        assignee.first_name AS assignee_name,
        created_by.first_name AS creator_name
      FROM task 
    `;
    
    if (projectId) {
      query += ` WHERE project = project:${projectId}`;
    }
    
    query += " ORDER BY created_at DESC";
    
    const result = await db.query(query);
    return c.json({ tasks: result[0] || [] });
  } catch (error) {
    return c.json({ error: "Failed to fetch tasks" }, 500);
  }
});

// POST /tasks - Create new task
app.post("/tasks", async (c) => {
  try {
    const body = await c.req.json();
    
    const taskData = {
      title: body.title,
      description: body.description,
      project: `project:${body.project_id}`,
      assignee: body.assignee_id ? `user:${body.assignee_id}` : undefined,
      created_by: `user:${body.created_by_id}`,
      status: body.status || "todo",
      priority: body.priority || "medium",
      due_date: body.due_date ? new Date(body.due_date) : undefined
    };

    const result = await db.create("task", taskData);
    return c.json({ task: result }, 201);
  } catch (error) {
    return c.json({ error: "Failed to create task", details: error }, 400);
  }
});

// PUT /tasks/:id/status - Update task status
app.put("/tasks/:id/status", async (c) => {
  try {
    const id = c.req.param("id");
    const { status } = await c.req.json();
    
    const updateData: any = { 
      status,
      updated_at: new Date()
    };
    
    // If marking as complete, set completion time
    if (status === "completed") {
      updateData.completed_at = new Date();
    }

    const result = await db.merge(`task:${id}`, updateData);
    return c.json({ task: result });
  } catch (error) {
    return c.json({ error: "Failed to update task status" }, 400);
  }
});

// SCHEMA INTROSPECTION ENDPOINTS
console.log("🔍 Setting up Schema introspection endpoints...");

// GET /schema - Get schema information
app.get("/schema", (c) => {
  return c.json({
    name: taskManagementSchema.getName(),
    version: taskManagementSchema.getVersion(),
    description: taskManagementSchema.getDescription(),
    tables: taskManagementSchema.getTables().map(table => ({
      name: table.getName(),
      description: table.getDescription(),
      fields: table.getFields().map(field => ({
        name: field.getName(),
        type: field.getType(),
        description: field.getDescription(),
        optional: field.isOptional,
        defaultValue: field.getDefaultValue()
      }))
    }))
  });
});

// GET /schema/sql - Get SurrealQL schema
app.get("/schema/sql", (c) => {
  c.header("Content-Type", "text/plain");
  return c.text(taskManagementSchema.toSurrealQL());
});

// GET /schema/typescript - Get TypeScript interfaces
app.get("/schema/typescript", (c) => {
  c.header("Content-Type", "text/plain");
  return c.text(taskManagementSchema.toTypeScript());
});

// SEED DATA ENDPOINT (for demo purposes)
app.post("/seed", async (c) => {
  try {
    console.log("🌱 Seeding demo data...");
    
    // Create demo users
    const user1 = await db.create("user", {
      email: "john@example.com",
      first_name: "John",
      last_name: "Doe"
    });
    
    const user2 = await db.create("user", {
      email: "jane@example.com", 
      first_name: "Jane",
      last_name: "Smith"
    });

    // Create demo project
    const project = await db.create("project", {
      name: "Website Redesign",
      description: "Complete overhaul of company website",
      owner: user1.id
    });

    // Create demo tasks
    await db.create("task", {
      title: "Design new homepage",
      description: "Create wireframes and mockups for the new homepage",
      project: project.id,
      assignee: user2.id,
      created_by: user1.id,
      priority: "high"
    });

    await db.create("task", {
      title: "Set up development environment",
      project: project.id,
      created_by: user1.id,
      assignee: user1.id,
      priority: "medium"
    });

    console.log("✅ Demo data seeded successfully");
    return c.json({ message: "Demo data seeded successfully" });
  } catch (error) {
    return c.json({ error: "Failed to seed data", details: error }, 500);
  }
});

// Start server
const port = 3001;
console.log(`🎯 Server starting on port ${port}`);
console.log("📋 Available endpoints:");
console.log("   • GET  /health           - API health check");
console.log("   • GET  /users            - List users");
console.log("   • POST /users            - Create user");
console.log("   • GET  /users/:id        - Get specific user");
console.log("   • GET  /projects         - List projects");
console.log("   • POST /projects         - Create project");
console.log("   • GET  /tasks            - List tasks");
console.log("   • POST /tasks            - Create task");
console.log("   • PUT  /tasks/:id/status - Update task status");
console.log("   • GET  /schema           - Schema information");
console.log("   • GET  /schema/sql       - SurrealQL schema");
console.log("   • GET  /schema/typescript- TypeScript interfaces");
console.log("   • POST /seed             - Seed demo data");

serve({
  fetch: app.fetch,
  port
});

console.log(`\n🚀 Step 1 API is running! Try these commands:`);
console.log(`   curl http://localhost:${port}/health`);
console.log(`   curl -X POST http://localhost:${port}/seed`);
console.log(`   curl http://localhost:${port}/users`);
console.log(`   curl http://localhost:${port}/schema`);