import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Surreal } from "surrealdb";
import { SurrealField } from "../../lib/schema/field";
import { SurrealTable } from "../../lib/schema/table";
import { SurrealSchema } from "../../lib/schema/schema";
import { Effect, Console } from "effect";

describe("Docker SurrealDB Schema Pull Integration", () => {
  let db: Surreal;

  beforeAll(async () => {
    // Connect to Docker SurrealDB instance
    db = new Surreal();
    
    try {
      await db.connect("http://localhost:8003");
      await db.signin({ username: "root", password: "root" });
      await db.use({ namespace: "test", database: "integration" });
      
      // Set up test schema with AI metadata
      await setupTestSchema();
    } catch (error) {
      console.warn("Docker SurrealDB not available, skipping integration tests");
      console.warn("Make sure to run: docker-compose up -d");
      throw error;
    }
  });

  afterAll(async () => {
    if (db) {
      // Clean up test data
      await db.query("REMOVE TABLE test_user;");
      await db.query("REMOVE TABLE test_post;");
      await db.close();
    }
  });

  async function setupTestSchema() {
    // Create tables with AI metadata in comments
    const userTableSql = `
      DEFINE TABLE test_user TYPE NORMAL SCHEMAFULL 
      COMMENT 'User accounts table for testing. @ai-hints: {"primary_key": "email", "temporal_field": "created_at", "user_field": "email", "content_fields": ["username", "bio"], "common_queries": ["find user by email", "get active users", "search by username"], "security_level": "high"}';
    `;

    const postTableSql = `
      DEFINE TABLE test_post TYPE NORMAL SCHEMAFULL 
      COMMENT 'Blog posts table for testing. @ai-hints: {"primary_key": "id", "temporal_field": "created_at", "user_field": "author", "content_fields": ["title", "content"], "common_queries": ["find posts by author", "get recent posts", "search by title"], "relationships": {"author": "test_user via author field", "comments": "test_comment via post_id"}}';
    `;

    // Execute table definitions
    await db.query(userTableSql);
    await db.query(postTableSql);

    // Define fields for test_user
    await db.query("DEFINE FIELD id ON test_user TYPE record<test_user>;");
    await db.query("DEFINE FIELD username ON test_user TYPE string COMMENT 'Unique username for the user';");
    await db.query("DEFINE FIELD email ON test_user TYPE string COMMENT 'User email address - primary identifier';");
    await db.query("DEFINE FIELD bio ON test_user TYPE option<string> COMMENT 'User biography or description';");
    await db.query("DEFINE FIELD is_active ON test_user TYPE bool DEFAULT true COMMENT 'Whether the user account is active';");
    await db.query("DEFINE FIELD created_at ON test_user TYPE datetime DEFAULT time::now() COMMENT 'Account creation timestamp';");
    await db.query("DEFINE FIELD updated_at ON test_user TYPE datetime DEFAULT time::now() COMMENT 'Last update timestamp';");

    // Define fields for test_post
    await db.query("DEFINE FIELD id ON test_post TYPE record<test_post>;");
    await db.query("DEFINE FIELD title ON test_post TYPE string COMMENT 'Post title - main content field';");
    await db.query("DEFINE FIELD content ON test_post TYPE string COMMENT 'Post content body - main content field';");
    await db.query("DEFINE FIELD author ON test_post TYPE record<test_user> COMMENT 'Post author reference';");
    await db.query("DEFINE FIELD is_published ON test_post TYPE bool DEFAULT false COMMENT 'Publication status';");
    await db.query("DEFINE FIELD created_at ON test_post TYPE datetime DEFAULT time::now() COMMENT 'Post creation timestamp';");
    await db.query("DEFINE FIELD updated_at ON test_post TYPE datetime DEFAULT time::now() COMMENT 'Last update timestamp';");

    // Create some test indexes
    await db.query("DEFINE INDEX idx_test_user_email ON test_user FIELDS email UNIQUE;");
    await db.query("DEFINE INDEX idx_test_user_username ON test_user FIELDS username UNIQUE;");
    await db.query("DEFINE INDEX idx_test_post_author ON test_post FIELDS author;");
  }

  it("should connect to Docker SurrealDB successfully", async () => {
    // Simple connection test - just check that we can query
    const result = await db.query("INFO FOR DB;");
    expect(result).toBeTruthy();
    expect(result[0]).toBeDefined();
  });

  it("should retrieve database schema with AI metadata", async () => {
    // Get database info
    const infoResult = await db.query("INFO FOR DB;");
    expect(infoResult).toBeTruthy();
    expect(infoResult[0]).toBeDefined();

    const schemaInfo = infoResult[0] as any;
    expect(schemaInfo.tables).toBeDefined();
    expect(schemaInfo.tables.test_user).toBeDefined();
    expect(schemaInfo.tables.test_post).toBeDefined();

    // Verify AI metadata is present in comments
    const userTableDef = schemaInfo.tables.test_user as string;
    expect(userTableDef).toContain("@ai-hints");
    expect(userTableDef).toContain("primary_key");
    expect(userTableDef).toContain("content_fields");

    const postTableDef = schemaInfo.tables.test_post as string;
    expect(postTableDef).toContain("@ai-hints");
    expect(postTableDef).toContain("relationships");
  });

  it("should parse AI metadata from database comments", async () => {
    const infoResult = await db.query("INFO FOR DB;");
    const schemaInfo = infoResult[0] as any;
    
    // Test user table AI metadata
    const userTableDef = schemaInfo.tables.test_user as string;
    const userCommentMatch = userTableDef.match(/COMMENT '([^']+)'/);
    expect(userCommentMatch).toBeTruthy();

    const userComment = userCommentMatch![1];
    const userAiMatch = userComment.match(/@ai-hints:\s*({.*})/);
    expect(userAiMatch).toBeTruthy();

    const userAiMetadata = JSON.parse(userAiMatch![1]);
    expect(userAiMetadata.primary_key).toBe("email");
    expect(userAiMetadata.temporal_field).toBe("created_at");
    expect(userAiMetadata.user_field).toBe("email");
    expect(userAiMetadata.content_fields).toEqual(["username", "bio"]);
    expect(userAiMetadata.common_queries).toEqual([
      "find user by email", 
      "get active users", 
      "search by username"
    ]);
    expect(userAiMetadata.security_level).toBe("high");

    // Test post table AI metadata
    const postTableDef = schemaInfo.tables.test_post as string;
    const postCommentMatch = postTableDef.match(/COMMENT '([^']+)'/);
    expect(postCommentMatch).toBeTruthy();

    const postComment = postCommentMatch![1];
    const postAiMatch = postComment.match(/@ai-hints:\s*({.*})/);
    expect(postAiMatch).toBeTruthy();

    const postAiMetadata = JSON.parse(postAiMatch![1]);
    expect(postAiMetadata.relationships).toEqual({
      "author": "test_user via author field",
      "comments": "test_comment via post_id"
    });
  });

  it("should reconstruct enhanced schema objects from database", async () => {
    // This simulates what our pull command does
    const program = Effect.gen(function* () {
      yield* Console.log("🔄 Testing schema reconstruction from Docker SurrealDB...");

      // Get database info
      const infoResult = yield* Effect.promise(() => db.query("INFO FOR DB;"));
      const schemaInfo = infoResult[0] as any;

      // Create our enhanced schema
      const schema = SurrealSchema.create("docker-test", "1.0.0")
        .withDescription("Schema pulled from Docker SurrealDB integration test");

      // Process test_user table
      const userTableDef = schemaInfo.tables.test_user as string;
      const userCommentMatch = userTableDef.match(/COMMENT '([^']+)'/);
      expect(userCommentMatch).toBeTruthy();

      let userTable = SurrealTable.create("test_user");
      
      // Extract description and AI metadata
      const userComment = userCommentMatch![1];
      const baseDescription = userComment.split(". @ai-hints:")[0];
      userTable = userTable.withDescription(baseDescription);

      const userAiMatch = userComment.match(/@ai-hints:\s*({.*})/);
      if (userAiMatch) {
        const aiData = JSON.parse(userAiMatch[1]);
        if (aiData.primary_key) userTable = userTable.aiPrimaryKey(aiData.primary_key);
        if (aiData.temporal_field) userTable = userTable.aiTemporalField(aiData.temporal_field);
        if (aiData.user_field) userTable = userTable.aiUserField(aiData.user_field);
        if (aiData.content_fields) userTable = userTable.aiContentFields(aiData.content_fields);
        if (aiData.common_queries) userTable = userTable.aiCommonQueries(aiData.common_queries);
      }

      // Get detailed table info for fields
      const userTableInfoResult = yield* Effect.promise(() => 
        db.query("INFO FOR TABLE test_user;")
      );
      
      const userTableInfo = userTableInfoResult[0] as any;
      const userFields: SurrealField[] = [];

      for (const [fieldName, fieldInfo] of Object.entries(userTableInfo.fields || {})) {
        const fieldDefStr = fieldInfo as string;
        
        let field: SurrealField;
        
        if (fieldName === "id") {
          field = SurrealField.id("test_user");
        } else if (fieldDefStr.includes("option<string>")) {
          field = SurrealField.string(fieldName).optional();
        } else if (fieldDefStr.includes("TYPE string")) {
          field = SurrealField.string(fieldName);
        } else if (fieldDefStr.includes("TYPE bool")) {
          field = SurrealField.boolean(fieldName);
        } else if (fieldDefStr.includes("TYPE datetime")) {
          field = SurrealField.datetime(fieldName);
        } else {
          field = SurrealField.string(fieldName);
        }
        
        if (fieldDefStr.includes("UNIQUE")) {
          field = field.unique();
        }
        
        if (fieldDefStr.includes("DEFAULT true")) {
          field = field.default("true");
        } else if (fieldDefStr.includes("DEFAULT time::now()")) {
          field = field.default("time::now()");
        }
        
        const fieldCommentMatch = fieldDefStr.match(/COMMENT '([^']+)'/);
        if (fieldCommentMatch) {
          field = field.description(fieldCommentMatch[1]);
        }
        
        userFields.push(field);
      }

      userTable = userTable.addFields(...userFields);
      schema.addTable(userTable);

      yield* Console.log("✅ Successfully reconstructed schema with AI metadata");
      
      // Verify the reconstructed table
      expect(userTable.getName()).toBe("test_user");
      expect(userTable.getDescription()).toBe("User accounts table for testing");
      expect(userTable.getAiHints()?.primary_key).toBe("email");
      expect(userTable.getAiHints()?.temporal_field).toBe("created_at");
      expect(userTable.getAiHints()?.user_field).toBe("email");
      expect(userTable.getAiHints()?.content_fields).toEqual(["username", "bio"]);
      expect(userTable.getFields().length).toBeGreaterThan(5);

      const emailField = userTable.getField("email");
      expect(emailField?.getDescription()).toBe("User email address - primary identifier");

      const bioField = userTable.getField("bio");
      expect(bioField?.isOptional).toBe(true);
      expect(bioField?.getDescription()).toBe("User biography or description");

      // Test that outputs are generated (basic validation)
      const typescript = schema.toTypeScript();
      const surrealQL = schema.toSurrealQL();
      
      expect(typescript.length).toBeGreaterThan(0);
      expect(surrealQL.length).toBeGreaterThan(0);

      return { userTable, schema };
    });

    const result = await Effect.runPromise(program);
    expect(result.userTable).toBeDefined();
    expect(result.schema).toBeDefined();
  });

  it("should handle real database errors gracefully", async () => {
    const program = Effect.gen(function* () {
      // Try to query a non-existent table
      try {
        yield* Effect.promise(() => db.query("INFO FOR TABLE non_existent_table;"));
      } catch (error) {
        yield* Console.log(`Expected error caught: ${error}`);
        expect(error).toBeDefined();
      }
    });

    await Effect.runPromise(program);
  });

  it("should simulate full pull command workflow", async () => {
    const program = Effect.gen(function* () {
      yield* Console.log("🔄 Simulating full pull command workflow...");

      // This is exactly what our pull command does
      const dbUrl = "http://localhost:8003";
      const namespace = "test";
      const database = "integration";

      // Get database info (same as pull command)
      const infoResult = yield* Effect.promise(() => db.query("INFO FOR DB;"));
      
      if (!infoResult || !infoResult[0]) {
        throw new Error("Failed to retrieve schema information");
      }

      const schemaInfo = infoResult[0] as any;
      const tableCount = Object.keys(schemaInfo.tables || {}).length;
      
      yield* Console.log(`✅ Found schema with ${tableCount} tables`);
      expect(tableCount).toBeGreaterThanOrEqual(2); // test_user and test_post

      // Parse tables and create our improved schema
      const schema = SurrealSchema.create("pulled-schema", "1.0.0")
        .withDescription(`Schema pulled from ${dbUrl}/${namespace}/${database}`);

      let processedTables = 0;
      let tablesWithAI = 0;

      for (const [tableName, tableDefString] of Object.entries(schemaInfo.tables || {})) {
        if (!tableName.startsWith("test_")) continue; // Only process our test tables
        
        yield* Console.log(`🔍 Processing table: ${tableName}`);
        
        // Get detailed table info
        const tableInfoResult = yield* Effect.promise(() => 
          db.query(`INFO FOR TABLE ${tableName};`)
        );
        
        if (tableInfoResult && tableInfoResult[0]) {
          const tableInfo = tableInfoResult[0] as any;
          
          // Create table with extracted metadata
          let table = SurrealTable.create(tableName);
          
          // Extract description from COMMENT if available
          const tableDefStr = tableDefString as string;
          const commentMatch = tableDefStr.match(/COMMENT '([^']+)'/);
          if (commentMatch) {
            const comment = commentMatch[1];
            const baseDescription = comment.split(". @ai-hints:")[0];
            table = table.withDescription(baseDescription);
            
            // Check if comment contains AI metadata
            if (comment.includes("@ai-hints")) {
              yield* Console.log(`   🤖 Found AI metadata in ${tableName}`);
              tablesWithAI++;
              
              // Parse AI metadata from comments
              try {
                const aiMatch = comment.match(/@ai-hints:\s*({.*})/);
                if (aiMatch) {
                  const aiData = JSON.parse(aiMatch[1]);
                  if (aiData.primary_key) table = table.aiPrimaryKey(aiData.primary_key);
                  if (aiData.temporal_field) table = table.aiTemporalField(aiData.temporal_field);
                  if (aiData.user_field) table = table.aiUserField(aiData.user_field);
                  if (aiData.content_fields) table = table.aiContentFields(aiData.content_fields);
                  if (aiData.common_queries) table = table.aiCommonQueries(aiData.common_queries);
                  if (aiData.relationships) table = table.aiRelationships(aiData.relationships);
                }
              } catch (e) {
                yield* Console.log(`   ⚠️  Failed to parse AI metadata for ${tableName}: ${e}`);
              }
            }
          }

          // Process fields (simplified for test)
          const fields: SurrealField[] = [];
          let fieldCount = 0;
          
          for (const [fieldName, fieldInfo] of Object.entries(tableInfo.fields || {})) {
            if (typeof fieldInfo === "string") {
              const fieldDefStr = fieldInfo as string;
              
              let field: SurrealField;
              
              if (fieldName === "id") {
                field = SurrealField.id(tableName);
              } else if (fieldDefStr.includes("option<string>")) {
                field = SurrealField.string(fieldName).optional();
              } else if (fieldDefStr.includes("TYPE string")) {
                field = SurrealField.string(fieldName);
              } else if (fieldDefStr.includes("TYPE bool")) {
                field = SurrealField.boolean(fieldName);
              } else if (fieldDefStr.includes("TYPE datetime")) {
                field = SurrealField.datetime(fieldName);
              } else if (fieldDefStr.includes("TYPE record<")) {
                const recordMatch = fieldDefStr.match(/TYPE record<([^>]+)>/);
                const recordTable = recordMatch ? recordMatch[1] : "unknown";
                field = SurrealField.record(fieldName, recordTable);
              } else {
                field = SurrealField.string(fieldName);
              }
              
              if (fieldDefStr.includes("UNIQUE")) {
                field = field.unique();
              }
              
              if (fieldDefStr.includes("DEFAULT")) {
                const defaultMatch = fieldDefStr.match(/DEFAULT\s+([^,\s]+)/);
                if (defaultMatch) {
                  field = field.default(defaultMatch[1]);
                }
              }
              
              const fieldCommentMatch = fieldDefStr.match(/COMMENT '([^']+)'/);
              if (fieldCommentMatch) {
                field = field.description(fieldCommentMatch[1]);
              }
              
              fields.push(field);
              fieldCount++;
            }
          }
          
          table = table.addFields(...fields);
          schema.addTable(table);
          
          yield* Console.log(`   ✅ Processed ${tableName} with ${fieldCount} fields`);
          processedTables++;
        }
      }

      yield* Console.log(`✅ Workflow complete!`);
      yield* Console.log(`   📊 Tables processed: ${processedTables}`);
      yield* Console.log(`   🤖 Tables with AI metadata: ${tablesWithAI}`);
      
      // Verify results based on console output showing success
      expect(processedTables).toBe(2); // We see in logs: "Tables processed: 2"
      expect(tablesWithAI).toBe(2);    // We see in logs: "Tables with AI metadata: 2"

      // Generate outputs
      const typescript = schema.toTypeScript();
      const surrealQL = schema.toSurrealQL();
      
      expect(typescript.length).toBeGreaterThan(0);
      expect(surrealQL.length).toBeGreaterThan(0);

      return { processedTables, tablesWithAI, typescript, surrealQL };
    });

    const result = await Effect.runPromise(program);
    expect(result.processedTables).toBeGreaterThanOrEqual(2);
    expect(result.tablesWithAI).toBeGreaterThanOrEqual(2);
  });
});