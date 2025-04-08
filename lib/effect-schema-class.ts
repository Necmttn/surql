/**
 * ⚠️ AUTO-GENERATED FILE ⚠️
 * This file is automatically generated. Do not modify it manually.
 * Any changes made to this file will be overwritten when regenerating.
 *
 * Generated by: @necmttn/surql
 * Date: ${new Date().toISOString()}
 */

// Effect Model Class API integration for SurrealDB types
import { Schema } from "effect";
import { Model } from "@effect/sql";
import type { TableDefinition } from "./schema.ts";
import { RecordId, StringRecordId } from "surrealdb";

/**
 * Create a RecordId schema for a specific table
 */
function recordId<T extends string>(tableName: T) {
	return Schema.Union(
		Schema.TemplateLiteral(
			Schema.Literal(tableName),
			Schema.Literal(":"),
			Schema.String,
		),
		Schema.declare<RecordId<T>>(
			(input: unknown): input is RecordId<T> => input instanceof RecordId,
		),
		Schema.declare<StringRecordId>(
			(input: unknown): input is StringRecordId =>
				input instanceof StringRecordId,
		),
	);
}

/**
 * Format a table name as a class name
 */
function formatClassName(tableName: string): string {
	return tableName.charAt(0).toUpperCase() + tableName.slice(1);
}

/**
 * Generate Effect Model classes from SurrealDB table definitions
 */
export function generateEffectSchemas(tables: TableDefinition[]): string {
	// Prepare imports
	const imports = `/**
 * ⚠️ AUTO-GENERATED FILE ⚠️
 * This file is automatically generated. Do not modify it manually.
 * Any changes made to this file will be overwritten when regenerating.
 * 
 * Generated by: @necmttn/surql
 * Date: ${new Date().toISOString()}
 */

// Effect Model Class API integration for SurrealDB types
import { Schema } from "effect";
import { Model } from "@effect/sql";
import { RecordId, StringRecordId } from "surrealdb";

/**
 * Create a RecordId schema for a specific table
 */
function recordId<T extends string>(tableName: T) {
	return Schema.Union(
		Schema.declare<RecordId<T>>(
			(input: unknown): input is RecordId<T> => input instanceof RecordId,
		),
		Schema.TemplateLiteral(Schema.Literal(tableName), Schema.Literal(":"), Schema.String),
		Schema.declare<StringRecordId>(
			(input: unknown): input is StringRecordId => input instanceof StringRecordId,
		),
	);
}
`;

	// Generate table classes
	const tableClasses = tables
		.map((table) => {
			const { name, fields, description } = table;
			const className = formatClassName(name);

			// Check if table already has an 'id' field
			const hasIdField = fields.some((field) => field.name === "id");

			// Create a list of field definitions
			let fieldDefinitions = [];

			// Add default 'id' field if not explicitly defined
			if (!hasIdField) {
				fieldDefinitions.push(`  id: Model.Generated(recordId("${name}"))`);
			}

			// Add all other field definitions
			fieldDefinitions = fieldDefinitions.concat(
				fields.map((field) => {
					let effectType: string;
					const annotations: string[] = [];

					// Add description if available
					if (field.description) {
						const escapedDescription = field.description
							.replace(/\\'/g, "'")
							.replace(/'/g, "\\'");
						annotations.push(`description: '${escapedDescription}'`);
					}

					// Add default value if available
					if (field.defaultValue) {
						let formattedDefaultValue = field.defaultValue;

						// Handle SurrealDB function calls (like time::now())
						if (formattedDefaultValue.includes("::")) {
							// For datetime fields with SurrealDB functions, we'll add it as a separate annotation
							if (field.type.toLowerCase() === "datetime") {
								annotations.push(`surrealDefault: '${formattedDefaultValue}'`);
							} else {
								formattedDefaultValue = `'${formattedDefaultValue}'`;
								annotations.push(`default: ${formattedDefaultValue}`);
							}
						} else {
							// If it's a simple string with quotes, keep as is
							// If it's a boolean or number, keep as is
							// If it's a string that's not already quoted, add quotes
							if (
								!formattedDefaultValue.startsWith("'") &&
								!formattedDefaultValue.startsWith('"') &&
								formattedDefaultValue !== "true" &&
								formattedDefaultValue !== "false" &&
								!/^-?\d+(\.\d+)?$/.test(formattedDefaultValue) &&
								!formattedDefaultValue.startsWith("[") &&
								!formattedDefaultValue.startsWith("{")
							) {
								formattedDefaultValue = `'${formattedDefaultValue}'`;
							}

							annotations.push(`default: ${formattedDefaultValue}`);
						}
					}

					// Build annotations string
					const annotationsStr =
						annotations.length > 0
							? `.annotations({ ${annotations.join(", ")} })`
							: "";

					switch (field.type.toLowerCase()) {
						case "int":
						case "number":
							effectType = `Schema.Number.pipe(Schema.int())${annotationsStr}`;
							break;
						case "float":
							effectType = `Schema.Number${annotationsStr}`;
							break;
						case "bool":
							effectType = `Schema.Boolean${annotationsStr}`;
							break;
						case "datetime":
							effectType = `Schema.DateFromSelf${annotationsStr}`;
							break;
						case "array":
							effectType = `Schema.Array(Schema.String)${annotationsStr}`;
							break;
						case "array_float":
							effectType = `Schema.Array(Schema.Number)${annotationsStr}`;
							break;
						case "array_record":
							if (field.reference) {
								const refTableClassName = formatClassName(
									field.reference.table,
								);
								effectType = `Schema.Array(Schema.Union(recordId("${field.reference.table}"), Schema.suspend((): Schema.Schema<${refTableClassName}> => ${refTableClassName})))${annotationsStr}`;
							} else {
								effectType = `Schema.Array(Schema.String.pipe(Schema.pattern(/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/)))${annotationsStr}`;
							}
							break;
						case "object":
							effectType = `Schema.Unknown${annotationsStr}`;
							break;
						case "record":
							if (field.reference) {
								const refTableClassName = formatClassName(
									field.reference.table,
								);
								effectType = `Schema.Union(recordId("${field.reference.table}"), Schema.suspend((): Schema.Schema<${refTableClassName}> => ${refTableClassName}))${annotationsStr}`;
							} else {
								effectType = `Schema.String.pipe(Schema.pattern(/^[a-zA-Z0-9_-]+:⟨\\d+⟩$/))${annotationsStr}`;
							}
							break;
						case "references":
							if (field.reference) {
								const refTableClassName = formatClassName(
									field.reference.table,
								);
								effectType = `Schema.Array(Schema.Union(recordId("${field.reference.table}"), Schema.suspend((): Schema.Schema<${refTableClassName}> => ${refTableClassName})))${annotationsStr}`;
							} else {
								effectType = `Schema.Array(Schema.String)${annotationsStr}`;
							}
							break;
						default:
							effectType = `Schema.String${annotationsStr}`;
							break;
					}

					// Make optional if needed
					if (field.type.toLowerCase() !== "datetime" && field.optional) {
						effectType = `Schema.optional(${effectType})`;
					}

					return `  ${field.name}: ${effectType}`;
				}),
			);

			const tableDescription = description
				? `\n/**\n * ${description.replace(/'/g, "\\'")}\n */`
				: "";

			return `${tableDescription}
export class ${className} extends Model.Class<${className}>("${className}")({
${fieldDefinitions.join(",\n")}
}) {
  static readonly tableName = "${name}" as const;
}`;
		})
		.join("\n");

	return `${imports}\n${tableClasses}`;
}
