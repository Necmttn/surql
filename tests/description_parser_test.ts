import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { parseSurQL } from "../lib/schema.ts";

// Test parsing descriptions from schema
Deno.test("parseSurQL extracts descriptions from comments and COMMENT clauses", async () => {
  // Read test schema file
  const content = await Deno.readTextFile("./tests/fixtures/schema_with_descriptions.surql");
  const tables = parseSurQL(content);

  console.log("Tables:", tables.map(t => t.name));

  // Verify that we found tables
  assertEquals(tables.length > 0, true);

  // Check user table
  const userTable = tables.find(t => t.name === "user");
  console.log("User table description:", userTable?.description);

  // Log all user fields and their descriptions
  console.log("User fields:");
  userTable?.fields.forEach(f => {
    console.log(`  ${f.name}: "${f.description}", default: ${f.defaultValue}`);
  });

  // Continue with only the username test for now
  const username = userTable?.fields.find(f => f.name === "username");
  console.log("Username field description:", username?.description);
  assertEquals(username?.description, "User's login name");

  // Check specific field descriptions from various formats
  const email = userTable?.fields.find(f => f.name === "email");
  assertEquals(email?.description, "Primary email used for account notifications");

  const role = userTable?.fields.find(f => f.name === "role");
  assertEquals(role?.description, "User permission level");
  assertEquals(role?.defaultValue, '"user"');

  // Check comment table and fields (if it exists)
  const commentTable = tables.find(t => t.name === "comment");
  if (commentTable) {
    assertEquals(commentTable.description, "User comments on posts");

    const commentContent = commentTable.fields.find(f => f.name === "content");
    assertEquals(commentContent?.description, "Comment text content");
  }

  // Check post table fields with descriptions (if it exists)
  const postTable = tables.find(t => t.name === "post");
  if (postTable) {
    const postAuthor = postTable.fields.find(f => f.name === "author");
    if (postAuthor) {
      assertEquals(postAuthor.description, "Reference to the user who created this post");
      assertEquals(postAuthor.type, "record");
      assertEquals(postAuthor.reference?.table, "user");
    }

    const postTags = postTable.fields.find(f => f.name === "tags");
    if (postTags) {
      assertEquals(postTags.description, "List of tags associated with the post");
      assertEquals(postTags.defaultValue, "[]");
    }
  }
}); 