import { assertEquals } from "@std/assert";
import { generateEffectSchemas } from "../lib/effect-schema-class.ts";
import type { TableDefinition } from "../lib/schema.ts";

Deno.test({
	name: "Effect Schema constraints generation",
	ignore: true,
	async fn() {
		const tables: TableDefinition[] = [
			{
				name: "user",
				fields: [
					{
						name: "email",
						type: "string",
						optional: false,
						description: "User's email address",
					},
					{
						name: "age",
						type: "int",
						optional: true,
						description: "User's age",
					},
					{
						name: "roles",
						type: "array<string>",
						optional: false,
						description: "User's roles",
					},
					{
						name: "profile",
						type: "object",
						optional: true,
						description: "User's profile information",
					},
					{
						name: "created_at",
						type: "datetime",
						optional: false,
						description: "When the user was created",
					},
					{
						name: "manager",
						type: "record<user>",
						optional: true,
						description: "User's manager",
					},
					{
						name: "subordinates",
						type: "array<record<user>>",
						optional: true,
						description: "User's subordinates",
					},
				],
			},
		];

		const generatedSchemas = generateEffectSchemas(tables);
		const lines = generatedSchemas.split("\n");

		// Find the userSchema definition
		const userSchemaStart = lines.findIndex((line) =>
			line.includes("export const userSchema = Schema.Struct({"),
		);
		const userSchemaEnd = lines.findIndex(
			(line, index) => index > userSchemaStart && line.trim() === "});",
		);

		// Extract the field definitions
		const fieldDefinitions = lines.slice(userSchemaStart + 1, userSchemaEnd);

		// Helper function to find a specific field definition
		const findField = (fieldName: string) => {
			return fieldDefinitions.find((line) =>
				line.trim().startsWith(`${fieldName}:`),
			);
		};

		// Verify each field definition
		assertEquals(
			findField("email")?.trim(),
			`email: Schema.String.annotations({ description: 'User\\'s email address' }),`,
			"Email field should be a string type with description",
		);

		assertEquals(
			findField("age")?.trim(),
			`age: Schema.optional(Schema.Number.pipe(Schema.int()).annotations({ description: 'User\\'s age' })),`,
			"Age field should be an optional integer with description",
		);

		assertEquals(
			findField("roles")?.trim(),
			`roles: Schema.String.annotations({ description: 'User\\'s roles' }),`,
			"Roles field should be a string type with description",
		);

		assertEquals(
			findField("profile")?.trim(),
			`profile: Schema.optional(Schema.Unknown.annotations({ description: 'User\\'s profile information' })),`,
			"Profile field should be an optional object with description",
		);

		assertEquals(
			findField("created_at")?.trim(),
			`created_at: Schema.Date.annotations({ description: 'When the user was created' }),`,
			"Created_at field should be a datetime type with description",
		);

		assertEquals(
			findField("manager")?.trim(),
			`manager: Schema.optional(recordId("user").annotations({ description: 'User\\'s manager' })),`,
			"Manager field should be an optional record reference to user with description",
		);

		assertEquals(
			findField("subordinates")?.trim(),
			`subordinates: Schema.optional(Schema.Array(recordId("user")).annotations({ description: 'User\\'s subordinates' })),`,
			"Subordinates field should be an optional array of record references to user with description",
		);
	},
});
