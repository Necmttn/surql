import { assertEquals } from "@std/assert";
import {
	formatSchemaName,
	formatTypeName,
	parseSurQL,
	parseType,
} from "../lib/schema.ts";

// Test for formatSchemaName
Deno.test("formatSchemaName formats table names correctly", () => {
	assertEquals(formatSchemaName("user"), "User");
	assertEquals(formatSchemaName("blog_post"), "BlogPost");
	assertEquals(formatSchemaName("customer_order"), "CustomerOrder");
	assertEquals(formatSchemaName("USER"), "User");
	assertEquals(formatSchemaName("user-data"), "UserData");
	assertEquals(formatSchemaName("user_data"), "UserData");
});

// Test for formatTypeName
Deno.test("formatTypeName formats type names correctly", () => {
	assertEquals(formatTypeName("user"), "UserType");
	assertEquals(formatTypeName("blog_post"), "BlogPostType");
	assertEquals(formatTypeName("customer_order"), "CustomerOrderType");
	assertEquals(formatTypeName("USER"), "UserType");
	assertEquals(formatTypeName("user-data"), "UserDataType");
	assertEquals(formatTypeName("user_data"), "UserDataType");
});

// Test for parseType function
Deno.test("parseType handles various SurrealQL types correctly", () => {
	// Test basic types
	assertEquals(parseType("string"), {
		baseType: "string",
		isOption: false,
		reference: undefined,
	});
	assertEquals(parseType("number"), {
		baseType: "number",
		isOption: false,
		reference: undefined,
	});
	assertEquals(parseType("bool"), {
		baseType: "bool",
		isOption: false,
		reference: undefined,
	});

	// Test option types
	assertEquals(parseType("option<string>"), {
		baseType: "string",
		isOption: true,
		reference: undefined,
	});
	assertEquals(parseType("option<number>"), {
		baseType: "number",
		isOption: true,
		reference: undefined,
	});

	// Test record references
	assertEquals(parseType("record<user>"), {
		baseType: "record",
		isOption: false,
		reference: { table: "user", isOption: false },
	});

	// Test option record references
	assertEquals(parseType("option<record<user>>"), {
		baseType: "record",
		isOption: true,
		reference: { table: "user", isOption: true },
	});

	// Test array types
	assertEquals(parseType("array"), {
		baseType: "array",
		isOption: false,
		reference: undefined,
	});
	assertEquals(parseType("option<array>"), {
		baseType: "array",
		isOption: true,
		reference: undefined,
	});

	// Test array record types
	assertEquals(parseType("array<record<telegram_message_entity>>"), {
		baseType: "array_record",
		isOption: false,
		reference: { table: "telegram_message_entity", isOption: false },
	});
});

// Test for parseSurQL function
Deno.test("parseSurQL parses SurrealQL schema correctly", () => {
	const schema = `
    DEFINE TABLE telegram_user SCHEMAFULL;
    DEFINE FIELD user_id ON telegram_user TYPE number;
    DEFINE FIELD username ON telegram_user TYPE string;
    DEFINE FIELD messages ON telegram_user TYPE array<record<telegram_message>>;

    DEFINE TABLE telegram_message SCHEMAFULL;
    DEFINE FIELD message_id ON telegram_message TYPE number;
    DEFINE FIELD user ON telegram_message TYPE record<telegram_user>;
    DEFINE FIELD message_text ON telegram_message TYPE string;
    DEFINE FIELD reply_to_message_id ON telegram_message TYPE option<record<telegram_message>>;
  `;

	const result = parseSurQL(schema);

	// Check number of tables
	assertEquals(result.length, 2);

	// Check first table
	assertEquals(result[0].name, "telegram_user");
	assertEquals(result[0].fields.length, 3);
	assertEquals(result[0].fields[0].name, "user_id");
	assertEquals(result[0].fields[0].type, "number");
	assertEquals(result[0].fields[0].optional, false);

	// Check second table
	assertEquals(result[1].name, "telegram_message");
	assertEquals(result[1].fields.length, 4);
	assertEquals(result[1].fields[2].name, "message_text");

	// Check references
	assertEquals(result[1].fields[1].reference?.table, "telegram_user");
	assertEquals(result[1].fields[1].optional, false);
});

// Test for generateTypeBoxSchemas function
Deno.test("generateTypeBoxSchemas generates correct TypeBox schema", () => {
	const tables = [
		{
			name: "telegram_user",
			fields: [
				{
					name: "user_id",
					type: "number",
					optional: false,
				},
				{
					name: "username",
					type: "string",
					optional: false,
				},
				{
					name: "messages",
					type: "references",
					optional: false,
					reference: {
						table: "telegram_message",
						isOption: false,
					},
				},
			],
		},
		{
			name: "telegram_message",
			fields: [
				{
					name: "message_id",
					type: "number",
					optional: false,
				},
				{
					name: "text",
					type: "string",
					optional: false,
				},
				{
					name: "user",
					type: "record",
					optional: false,
					reference: {
						table: "telegram_user",
						isOption: false,
					},
				},
				{
					name: "reply_to_message_id",
					type: "record",
					optional: true,
					reference: {
						table: "telegram_message",
						isOption: true,
					},
				},
			],
		},
	];
});
