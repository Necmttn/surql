/**
 * Step 1: Basic REST API Server
 * 
 * This demonstrates running the API we built with surql-schema
 */

import { serve } from "@hono/node-server";
import { app } from "./api";

const port = 3000;

console.log("🚀 Starting Task Management API Server");
console.log("📡 Built with surql-schema as ORM\n");

console.log(`🌍 Server starting on http://localhost:${port}`);
console.log("\n📋 Available endpoints:");
console.log(`   • GET  http://localhost:${port}/              - API info`);
console.log(`   • GET  http://localhost:${port}/health        - Health check`);
console.log(`   • GET  http://localhost:${port}/api/schema    - Schema definition`);
console.log(`   • GET  http://localhost:${port}/api/schema/sql - Generated SurrealQL`);
console.log(`   • GET  http://localhost:${port}/api/users     - List users`);
console.log(`   • POST http://localhost:${port}/api/users     - Create user`);
console.log(`   • GET  http://localhost:${port}/api/projects  - List projects`);
console.log(`   • POST http://localhost:${port}/api/projects  - Create project`);
console.log(`   • GET  http://localhost:${port}/api/tasks     - List tasks`);
console.log(`   • POST http://localhost:${port}/api/tasks     - Create task`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`\n✨ Server running! Try: curl http://localhost:${port}/health`);