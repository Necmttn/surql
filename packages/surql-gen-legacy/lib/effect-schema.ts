// Effect Schema integration for SurrealDB types
import { Schema } from "effect";
import type { TableDefinition } from "./schema.ts";

// Brand for RecordId type
type RecordId<T extends string = string> = string & {
	readonly RecordId: unique symbol;
	readonly Table: T;
};

/**
 * Create a RecordId schema for a specific table
 * @param tableName The name of the table
 * @returns A branded string schema for SurrealDB record IDs
 */
export function recordId<T extends string>(
	tableName: T,
): Schema.Schema<RecordId<T>> {
	return Schema.String.pipe(
		Schema.pattern(/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/),
		Schema.brand(`RecordId<${tableName}>`),
	) as unknown as Schema.Schema<RecordId<T>>;
}

/**
 * Create a schema for a SurrealDB record with an ID
 * @param tableName The name of the table
 * @param schema The schema for the record fields
 * @returns A schema for the record with an ID field
 */
export function record<T extends string, A extends Record<string, unknown>>(
	tableName: T,
	schema: Schema.Schema<A>,
): Schema.Schema<A & { id: RecordId<T> }> {
	return Schema.Struct({
		id: recordId(tableName),
	}) as unknown as Schema.Schema<A & { id: RecordId<T> }>;
}

/**
 * Maps SurrealDB types to Effect Schema types
 * @param type The SurrealDB type
 * @param isOption Whether the type is optional
 * @param reference Optional reference information
 * @returns An Effect Schema schema for the type
 */
export function mapSurrealTypeToEffectSchema(
	type: string,
	isOption = false,
	reference?: { table: string; isOption: boolean },
): Schema.Schema<unknown> {
	let schema: Schema.Schema<unknown>;

	switch (type) {
		case "string":
			schema = Schema.String as unknown as Schema.Schema<unknown>;
			break;
		case "number":
		case "float":
		case "decimal":
			schema = Schema.Number as unknown as Schema.Schema<unknown>;
			break;
		case "int":
		case "integer":
			schema = Schema.Number.pipe(
				Schema.int(),
			) as unknown as Schema.Schema<unknown>;
			break;
		case "bool":
		case "boolean":
			schema = Schema.Boolean as unknown as Schema.Schema<unknown>;
			break;
		case "datetime":
			schema = Schema.Date as unknown as Schema.Schema<unknown>;
			break;
		case "record":
			if (reference) {
				schema = recordId(reference.table) as unknown as Schema.Schema<unknown>;
			} else {
				schema = Schema.String.pipe(
					Schema.pattern(/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/),
				) as unknown as Schema.Schema<unknown>;
			}
			break;
		case "array":
			schema = Schema.Array(
				Schema.Unknown,
			) as unknown as Schema.Schema<unknown>;
			break;
		case "array_record":
			if (reference) {
				schema = Schema.Array(
					recordId(reference.table),
				) as unknown as Schema.Schema<unknown>;
			} else {
				schema = Schema.Array(
					Schema.String.pipe(Schema.pattern(/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/)),
				) as unknown as Schema.Schema<unknown>;
			}
			break;
		case "array_float":
			schema = Schema.Array(Schema.Number) as unknown as Schema.Schema<unknown>;
			break;
		case "array_string":
			schema = Schema.Array(Schema.String) as unknown as Schema.Schema<unknown>;
			break;
		case "object":
			schema = Schema.Record({
				key: Schema.String,
				value: Schema.Unknown,
			}) as unknown as Schema.Schema<unknown>;
			break;
		default:
			schema = Schema.Unknown;
			break;
	}

	// Apply optional wrapper if needed
	if (isOption) {
		return Schema.optional(schema) as unknown as Schema.Schema<unknown>;
	}

	return schema;
}

/**
 * Format a table name as a type name
 * @param tableName The name of the table
 * @returns The formatted type name
 */
export function formatTypeName(tableName: string): string {
	return tableName.charAt(0).toUpperCase() + tableName.slice(1);
}

/**
 * Format a table name as a schema name
 * @param tableName The name of the table
 * @returns The formatted schema name
 */
export function formatSchemaName(tableName: string): string {
	return `${tableName}Schema`;
}

/**
 * Parse a SurrealDB type string into components
 * @param type The type string from SurrealDB schema
 * @returns Object containing baseType, isOption flag, and optional reference information
 */
export function parseType(type: string): {
	baseType: string;
	isOption: boolean;
	reference?: { table: string; isOption: boolean };
	constraints?: string[];
} {
	let isOption = false;
	let baseType = type;
	let reference: { table: string; isOption: boolean } | undefined;
	let constraints: string[] = [];

	// Remove any REFERENCE or other keywords that might appear after the type
	baseType = baseType.replace(/\s+REFERENCE.*$/i, "");

	// Remove trailing semicolons if present
	baseType = baseType.replace(/;$/, "");

	// Handle option types
	if (baseType.startsWith("option<")) {
		isOption = true;
		baseType = baseType.slice(7, -1);
	}

	// Handle record references
	if (baseType.startsWith("record<")) {
		const tableName = baseType.slice(7, -1);
		reference = {
			table: tableName,
			isOption: isOption,
		};
		baseType = "record";
	}

	// Handle references arrays
	if (baseType.startsWith("references<")) {
		const tableName = baseType.slice(11, -1);
		reference = {
			table: tableName,
			isOption: isOption,
		};
		baseType = "references";
	}

	// Handle array types
	if (baseType.startsWith("array<")) {
		const innerType = baseType.slice(6, -1);
		if (innerType.startsWith("record<")) {
			const tableName = innerType.slice(7, -1);
			reference = {
				table: tableName,
				isOption: false,
			};
			baseType = "array_record";
		} else if (innerType === "float") {
			baseType = "array_float";
		} else if (innerType === "string") {
			baseType = "array_string";
		} else {
			baseType = "array";
		}
	}

	// Extract constraints from the type string
	const constraintMatch = baseType.match(/\((.+)\)$/);
	if (constraintMatch) {
		// Remove the constraints from the base type
		baseType = baseType.replace(/\((.+)\)$/, "");

		// Parse the constraints
		const constraintStr = constraintMatch[1];
		constraints = constraintStr.split(",").map((c) => c.trim());
	}

	return { baseType, isOption, reference, constraints };
}
