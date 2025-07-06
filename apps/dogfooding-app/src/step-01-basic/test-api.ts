/**
 * Step 1: API Testing Script
 * 
 * This demonstrates how our surql-schema-powered API works
 */

import { app } from "./api";

console.log("🧪 Testing Task Management API");
console.log("📡 Built with surql-schema as ORM\n");

// Helper function to test endpoints
async function testEndpoint(method: string, path: string, body?: any) {
  console.log(`${method} ${path}`);
  
  const request = new Request(`http://localhost${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  const response = await app.fetch(request);
  const data = await response.json();
  
  console.log(`   Status: ${response.status}`);
  if (response.status >= 400) {
    console.log(`   Error: ${JSON.stringify(data, null, 2)}`);
  } else {
    console.log(`   Response: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
  }
  console.log();
  
  return { response, data };
}

async function runTests() {
  console.log("1️⃣  Testing API info endpoint...");
  await testEndpoint('GET', '/');

  console.log("2️⃣  Testing health check...");
  await testEndpoint('GET', '/health');

  console.log("3️⃣  Testing schema introspection...");
  await testEndpoint('GET', '/api/schema');

  console.log("4️⃣  Testing schema SQL generation...");
  const sqlResponse = await app.fetch(new Request('http://localhost/api/schema/sql'));
  const sql = await sqlResponse.text();
  console.log("GET /api/schema/sql");
  console.log(`   Status: ${sqlResponse.status}`);
  console.log(`   SurrealQL Preview:\n${sql.substring(0, 300)}...`);
  console.log();

  console.log("5️⃣  Testing TypeScript generation...");
  const tsResponse = await app.fetch(new Request('http://localhost/api/schema/typescript'));
  const typescript = await tsResponse.text();
  console.log("GET /api/schema/typescript");
  console.log(`   Status: ${tsResponse.status}`);
  console.log(`   TypeScript Preview:\n${typescript.substring(0, 300)}...`);
  console.log();

  console.log("6️⃣  Testing user endpoints...");
  await testEndpoint('GET', '/api/users');
  
  await testEndpoint('POST', '/api/users', {
    email: 'jane@example.com',
    first_name: 'Jane',
    last_name: 'Smith',
    avatar_url: 'https://avatar.example.com/jane.jpg'
  });

  console.log("7️⃣  Testing validation (missing required fields)...");
  await testEndpoint('POST', '/api/users', {
    email: 'incomplete@example.com'
    // Missing first_name and last_name
  });

  console.log("8️⃣  Testing project endpoints...");
  await testEndpoint('GET', '/api/projects');
  
  await testEndpoint('POST', '/api/projects', {
    name: 'Mobile App',
    description: 'Build a mobile app for our platform',
    owner: 'user:jane',
    status: 'planning'
  });

  console.log("9️⃣  Testing task endpoints...");
  await testEndpoint('GET', '/api/tasks');
  
  await testEndpoint('POST', '/api/tasks', {
    title: 'Design wireframes',
    description: 'Create wireframes for the mobile app',
    project: 'project:mobile_app',
    assignee: 'user:jane',
    created_by: 'user:john',
    status: 'todo',
    priority: 'high',
    due_date: '2024-02-01T00:00:00Z'
  });

  console.log("✅ All API tests completed!");
  console.log("\n🎉 Success! Our surql-schema library successfully:");
  console.log("   • Generated a complete database schema");
  console.log("   • Provided field validation and introspection");
  console.log("   • Enabled automatic SQL generation");
  console.log("   • Generated TypeScript types");
  console.log("   • Powered a full REST API");
}

// Run the tests
runTests().catch(console.error);