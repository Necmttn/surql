/**
 * Step 1: Basic Schema Foundation
 * 
 * Starting as a small team with simple needs.
 * Using basic Schema.Class patterns for immediate productivity.
 */

// Import from our workspace package
import { SurrealField, SurrealTable, SurrealSchema } from "@necmttn/surql-schema";

console.log("🏗️  Step 1: Building Basic Schema Foundation");
console.log("📝 Creating simple task management schema for a small team\n");

// Step 1: Create basic User table
console.log("1️⃣  Creating User table with basic fields...");
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

console.log("✅ User table created with built-in validation");

// Step 2: Create Project table
console.log("\n2️⃣  Creating Project table with ownership...");
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

console.log("✅ Project table created with user relationships");

// Step 3: Create Task table
console.log("\n3️⃣  Creating Task table with hierarchy...");
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

console.log("✅ Task table created with project and user relationships");

// Step 4: Assemble the complete schema
console.log("\n4️⃣  Assembling complete task management schema...");
const taskManagementSchema = SurrealSchema.create("task_management", "1.0.0")
  .withDescription("Simple task management system for small teams")
  .addTable(userTable)
  .addTable(projectTable)
  .addTable(taskTable);

console.log("✅ Schema assembled with automatic validation");

// Step 5: Generate SurrealQL for database setup
console.log("\n5️⃣  Generating SurrealQL for database setup...");
const surrealql = taskManagementSchema.toSurrealQL();

console.log("📄 Generated SurrealQL:");
console.log("=" + "=".repeat(50));
console.log(surrealql);
console.log("=" + "=".repeat(50));

// Step 6: Validate our schema structure
console.log("\n6️⃣  Validating schema structure...");
const tables = taskManagementSchema.getTables();
console.log(`📊 Schema contains ${tables.length} tables:`);
tables.forEach(table => {
  const fields = table.getFields();
  console.log(`   • ${table.getName()}: ${fields.length} fields`);
});

// Step 7: Show TypeScript interface generation
console.log("\n7️⃣  Generating TypeScript interfaces...");
const typescript = taskManagementSchema.toTypeScript();
console.log("📝 Generated TypeScript interfaces:");
console.log("-" + "-".repeat(30));
console.log(typescript.substring(0, 500) + "...");
console.log("-" + "-".repeat(30));

console.log("\n🎉 Step 1 Complete!");
console.log("✨ We've built a solid foundation using basic Schema.Class patterns");
console.log("🔜 Next: Step 2 will add Schema.pipe composition for reusable constraints");

export { taskManagementSchema, userTable, projectTable, taskTable };