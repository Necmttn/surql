import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { generateEffectSchemas } from "../lib/effect-schema.ts";
import type { TableDefinition } from "../lib/schema.ts";

Deno.test("Effect Schema constraints generation", () => {
  const tables: TableDefinition[] = [
    {
      name: "user",
      fields: [
        {
          name: "email",
          type: "string",
          optional: false,
          description: "User's email address"
        },
        {
          name: "age",
          type: "int",
          optional: true,
          description: "User's age"
        },
        {
          name: "roles",
          type: "array<string>",
          optional: false,
          description: "User's roles"
        },
        {
          name: "profile",
          type: "object",
          optional: true,
          description: "User's profile information"
        },
        {
          name: "created_at",
          type: "datetime",
          optional: false,
          description: "When the user was created"
        },
        {
          name: "manager",
          type: "record<user>",
          optional: true,
          description: "User's manager"
        },
        {
          name: "subordinates",
          type: "array<record<user>>",
          optional: true,
          description: "User's subordinates"
        }
      ],
    },
  ];

  const generatedSchemas = generateEffectSchemas(tables);

  // Verify the generated schema contains the expected types
  assertEquals(
    generatedSchemas.includes("email: Schema.String"),
    true,
    "Email field should be a string type"
  );

  assertEquals(
    generatedSchemas.includes("age: Schema.optional(Schema.Number.pipe(Schema.int()))"),
    true,
    "Age field should be an optional integer"
  );

  assertEquals(
    generatedSchemas.includes("roles: Schema.Array(Schema.String)"),
    true,
    "Roles field should be an array of strings"
  );

  assertEquals(
    generatedSchemas.includes("profile: Schema.optional(Schema.Record(Schema.String))"),
    true,
    "Profile field should be an optional object"
  );

  assertEquals(
    generatedSchemas.includes("created_at: Schema.Date"),
    true,
    "Created_at field should be a datetime type"
  );

  assertEquals(
    generatedSchemas.includes("manager: Schema.optional(recordId(\"user\"))"),
    true,
    "Manager field should be an optional record reference to user"
  );

  assertEquals(
    generatedSchemas.includes("subordinates: Schema.optional(Schema.Array(recordId(\"user\")))"),
    true,
    "Subordinates field should be an optional array of record references to user"
  );

  assertEquals(
    generatedSchemas.includes('Schema.Array(Schema.String)'),
    true,
    "Generated schema should include array<string> type"
  );
}); 