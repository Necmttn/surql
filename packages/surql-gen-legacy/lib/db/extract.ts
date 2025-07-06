import type { Config } from "../config.ts";
import type { TableDefinition } from "../schema.ts";
import type { SurrealFieldInfo, SurrealTableSchemaInfo } from "./interfaces.ts";
import type { Surreal } from "surrealdb";
import { normalizeSchemaInfo, parseFieldDefinition } from "./parser.ts";
import { createDBConnection } from "./connection.ts";

/**
 * Connect to SurrealDB and retrieve schema information
 *
 * @param config - Configuration with database connection details
 * @returns Promise that resolves to table definitions
 */
export async function fetchSchemaFromDB(
	config: Config,
): Promise<TableDefinition[]> {
	if (!config.db?.url) {
		throw new Error("Database URL is required in configuration");
	}

	console.log("Fetching schema from database:", config.db.url);
	if (config.db.namespace) {
		console.log("Using namespace:", config.db.namespace);
	}
	if (config.db.database) {
		console.log("Using database:", config.db.database);
	}

	let db: Surreal | undefined;
	try {
		// Create a new SurrealDB instance
		db = await createDBConnection(config);

		// Fetch schema information using INFO command
		const infoResult = await db.query("INFO FOR DB;");

		if (!infoResult || !infoResult[0]) {
			throw new Error("Failed to retrieve schema information from SurrealDB");
		}

		const schemaInfo = normalizeSchemaInfo(infoResult[0]);

		if (!schemaInfo.tables || Object.keys(schemaInfo.tables).length === 0) {
			throw new Error("No tables found in schema information");
		}

		// Convert the schema information to TableDefinition[]
		const tables: TableDefinition[] = [];

		// Safely process tables with defensive programming to handle potential null/undefined values
		for (const tableName of Object.keys(schemaInfo.tables)) {
			// Skip any table definitions that look like system tables
			if (tableName.startsWith("_") || tableName.startsWith("sdb_")) {
				continue;
			}

			const tableInfoResult = await db.query<[SurrealTableSchemaInfo]>(
				`INFO FOR TABLE ${tableName};`,
			);
			const tableInfo = tableInfoResult?.[0];

			if (!tableInfo || !tableInfo.fields) {
				console.warn(`Table ${tableName} has no fields, skipping`);
				continue;
			}

			const fields = [];

			// Safely process fields
			for (const fieldName of Object.keys(tableInfo.fields)) {
				// Skip array item definitions like field[*]
				if (fieldName.includes("[*]")) {
					continue;
				}

				const fieldInfo = tableInfo.fields[fieldName];

				if (!fieldInfo) {
					console.warn(
						`Field ${fieldName} in table ${tableName} has no data, skipping`,
					);
					continue;
				}

				// Handle both object and string field definitions
				if (typeof fieldInfo === "string") {
					// Parse the string definition
					const parsed = parseFieldDefinition(fieldInfo);
					console.log(
						`Parsed field ${fieldName}: type=${parsed.type}, optional=${parsed.optional}, referencedTable=${parsed.referencedTable}`,
					);

					// Use the parsed referencedTable from parseFieldDefinition
					fields.push({
						name: fieldName,
						type: parsed.type,
						optional: parsed.optional,
						reference: parsed.referencedTable
							? {
									table: parsed.referencedTable,
									isOption: parsed.optional,
								}
							: undefined,
					});
				} else if (typeof fieldInfo === "object") {
					// It's already an object with properties
					const fieldObject = fieldInfo as SurrealFieldInfo;
					const fieldType = fieldObject.type || "string";
					const fieldKind = fieldObject.kind;
					const isOptional = fieldObject.optional === true;

					console.log(
						`Processing object field ${fieldName} with type: ${fieldType}`,
					);

					// Check if it's a references field
					if (
						typeof fieldType === "string" &&
						fieldType.startsWith("references<")
					) {
						console.log(
							`Found references type for field ${fieldName}: ${fieldType}`,
						);
						// Extract the referenced table name
						const match = fieldType.match(/references<([^>]+)>/);
						const referencedTable = match ? match[1] : undefined;

						fields.push({
							name: fieldName,
							type: "references",
							optional: isOptional,
							reference: referencedTable
								? {
										table: referencedTable,
										isOption: isOptional,
									}
								: undefined,
						});
						continue;
					}

					// Extract table name from record type
					let referencedTable: string | undefined;
					if (
						fieldType &&
						typeof fieldType === "string" &&
						fieldType.includes("record<")
					) {
						const match = fieldType.match(/record<([^>]+)>/);
						referencedTable = match ? match[1] : undefined;
					}

					fields.push({
						name: fieldName,
						type: fieldType,
						optional: isOptional,
						reference:
							referencedTable || fieldKind === "relation"
								? {
										table: referencedTable || "",
										isOption:
											typeof fieldType === "string" &&
											fieldType.startsWith("option<"),
									}
								: undefined,
					});
				} else {
					console.warn(
						`Field ${fieldName} in table ${tableName} has unexpected format, skipping`,
					);
				}
			}

			tables.push({
				name: tableName,
				fields,
			});
		}

		return tables;
	} catch (error) {
		console.error("Error fetching schema from SurrealDB:", error);
		throw error;
	} finally {
		// Close the connection
		if (db) {
			try {
				await db.close();
				console.log("Database connection closed");
			} catch (closeError) {
				console.warn("Error closing SurrealDB connection:", closeError);
			}
		}
	}
}

/**
 * Parse schema directly from INFO FOR DB and INFO FOR TABLE responses
 * This is primarily for testing without a live database connection
 *
 * @param dbInfo - Database info from INFO FOR DB response
 * @param tableInfos - Map of table infos from INFO FOR TABLE responses
 *
 * @returns Array of parsed table definitions
 */
export function parseSchemaFromInfoResponses(
	dbInfo: unknown,
	tableInfos: Record<string, unknown>,
): TableDefinition[] {
	const schemaInfo = normalizeSchemaInfo(dbInfo);
	const tables: TableDefinition[] = [];

	if (!schemaInfo.tables || Object.keys(schemaInfo.tables).length === 0) {
		return tables;
	}

	// Process each table
	for (const tableName of Object.keys(schemaInfo.tables)) {
		// Skip system tables
		if (tableName.startsWith("_") || tableName.startsWith("sdb_")) {
			continue;
		}

		const tableInfo = tableInfos[tableName] as SurrealTableSchemaInfo;
		if (!tableInfo || !tableInfo.fields) {
			continue;
		}

		const fields = [];

		// Process fields
		for (const fieldName of Object.keys(tableInfo.fields)) {
			// Skip array item definitions
			if (fieldName.includes("[*]")) {
				continue;
			}

			const fieldInfo = tableInfo.fields[fieldName];
			if (!fieldInfo) {
				continue;
			}

			// Handle both object and string field definitions
			if (typeof fieldInfo === "string") {
				// Parse the string definition
				const parsed = parseFieldDefinition(fieldInfo);

				// Use the parsed referencedTable from parseFieldDefinition
				fields.push({
					name: fieldName,
					type: parsed.type,
					optional: parsed.optional,
					reference: parsed.referencedTable
						? {
								table: parsed.referencedTable,
								isOption: parsed.optional,
							}
						: undefined,
				});
			} else if (typeof fieldInfo === "object") {
				// It's already an object with properties
				const fieldObject = fieldInfo as SurrealFieldInfo;
				const fieldType = fieldObject.type || "string";
				const fieldKind = fieldObject.kind;
				const isOptional = fieldObject.optional === true;

				// Check if it's a references field
				if (
					typeof fieldType === "string" &&
					fieldType.startsWith("references<")
				) {
					// Extract the referenced table name
					const match = fieldType.match(/references<([^>]+)>/);
					const referencedTable = match ? match[1] : undefined;

					fields.push({
						name: fieldName,
						type: "references",
						optional: isOptional,
						reference: referencedTable
							? {
									table: referencedTable,
									isOption: isOptional,
								}
							: undefined,
					});
					continue;
				}

				// Extract table name from record type
				let referencedTable: string | undefined;
				if (
					fieldType &&
					typeof fieldType === "string" &&
					fieldType.includes("record<")
				) {
					const match = fieldType.match(/record<([^>]+)>/);
					referencedTable = match ? match[1] : undefined;
				}

				fields.push({
					name: fieldName,
					type: fieldType,
					optional: isOptional,
					reference:
						referencedTable || fieldKind === "relation"
							? {
									table: referencedTable || "",
									isOption:
										typeof fieldType === "string" &&
										fieldType.startsWith("option<"),
								}
							: undefined,
				});
			}
		}

		tables.push({
			name: tableName,
			fields,
		});
	}

	return tables;
}
