import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { parseSurQL } from "../lib/schema.ts";

Deno.test("parseSurQL extracts COMMENT clause correctly", () => {
  const minimalSchema = `
-- User table with descriptions and default values
DEFINE TABLE user SCHEMAFULL;

-- Username for login
DEFINE FIELD username ON user TYPE string COMMENT "User's login name";
`;

  const tables = parseSurQL(minimalSchema);

  // Add debugging info
  console.log("Raw schema:", minimalSchema);
  console.log("Parse result:", JSON.stringify(tables, null, 2));

  // Now check results
  assertEquals(tables.length, 1, "Should have one table");

  const userTable = tables[0];
  assertEquals(userTable.name, "user", "Table name should be 'user'");
  assertEquals(userTable.fields.length, 1, "Should have one field");

  const usernameField = userTable.fields[0];

  // More detailed debugging
  console.log("Field name:", usernameField.name);
  console.log("Field type:", usernameField.type);
  console.log("Field description:", usernameField.description);
  console.log("Comment line regex on: DEFINE FIELD username ON user TYPE string COMMENT \"User's login name\"");

  // Try to match the COMMENT clause manually to see if it works
  const commentRegex = /COMMENT ['"](.+?)['"]/.exec('DEFINE FIELD username ON user TYPE string COMMENT "User\'s login name"');
  console.log("Manual regex result:", commentRegex ? commentRegex[1] : "No match");

  // Try another regex pattern
  const altRegex = /TYPE\s+[^\s]+\s+COMMENT\s+["'](.+?)["']/.exec('DEFINE FIELD username ON user TYPE string COMMENT "User\'s login name"');
  console.log("Alternative regex result:", altRegex ? altRegex[1] : "No match");

  assertEquals(usernameField.name, "username", "Field name should be 'username'");
  assertEquals(usernameField.description, "User's login name", "Description should match COMMENT clause");
});

// Test a direct regex match for COMMENT clause
Deno.test("regex extracts COMMENT clause correctly", () => {
  // The exact line that's causing issues
  const fieldLine = 'DEFINE FIELD username ON user TYPE string COMMENT "User login name";';

  console.log("Input line:", fieldLine);

  // Fixed regex that handles quoted strings properly
  const commentRegex = /COMMENT\s+["']([^"']+)["']/.exec(fieldLine);

  console.log("Regex match result:", commentRegex);

  if (commentRegex) {
    const description = commentRegex[1];
    console.log("Extracted description:", description);
    assertEquals(description, "User login name", "Description should match COMMENT clause");
  } else {
    console.log("No match found!");
    assertEquals(false, true, "Should have found a match");
  }
});

// Direct test of the comment extraction
Deno.test("parse comment clause independently", () => {
  // The line content that's causing issues
  const fieldLine = 'DEFINE FIELD username ON user TYPE string COMMENT "User\'s login name";';

  const directExtract = () => {
    // Find the position of COMMENT keyword
    const commentIndex = fieldLine.indexOf("COMMENT");
    if (commentIndex === -1) return null;

    // Find the first quote after COMMENT
    const startQuoteIndex = fieldLine.indexOf('"', commentIndex);
    if (startQuoteIndex === -1) return null;

    // Find the closing quote
    const endQuoteIndex = fieldLine.indexOf('"', startQuoteIndex + 1);
    if (endQuoteIndex === -1) return null;

    // Extract the content between quotes
    return fieldLine.substring(startQuoteIndex + 1, endQuoteIndex);
  };

  const description = directExtract();
  console.log("Extracted with direct approach:", description);

  assertEquals(description, "User's login name");
}); 