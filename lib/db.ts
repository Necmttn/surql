// This module will handle connecting to SurrealDB and fetching schema

import type { Config } from "./config.ts";
import type { TableDefinition } from "./schema.ts";
// Direct import from surrealdb instead of dynamic import
import { Surreal } from "surrealdb";

/**
 * Schema information retrieved from SurrealDB info endpoints
 */
interface SurrealDBSchemaInfo {
	tables?: Record<string, string | { name: string }>;
	databases?: Record<string, string>;
	functions?: Record<string, string>;
	configs?: Record<string, string>;
	analyzers?: Record<string, string>;
	apis?: Record<string, string>;
	models?: Record<string, string>;
	params?: Record<string, string>;
	users?: Record<string, string>;
	accesses?: Record<string, string>;
}

/**
 * Object representation of a field in SurrealDB schema
 */
interface SurrealFieldInfo {
	name: string;
	type: string;
	kind: string;
	optional: boolean;
	value?: unknown;
}

/**
 * Schema information for a table from SurrealDB
 */
interface SurrealTableSchemaInfo {
	fields: Record<string, SurrealFieldInfo | string>;
	indexes?: Record<string, string>;
	events?: Record<string, string>;
	scopes?: Record<string, string>;
	lives?: Record<string, string>;
	params?: Record<string, string>;
	tables?: Record<string, string>;
	accesses?: Record<string, string>;
}

/**
 * Parse a field definition string from SurrealDB
 */
function parseFieldDefinition(fieldDef: string): {
	type: string;
	kind: string;
	optional: boolean;
	referencedTable?: string;
	description?: string;
	defaultValue?: string;
} {
	// Extract the actual type from the field definition
	const typeMatch = fieldDef.match(/TYPE\s+(\S+)/i);
	if (!typeMatch) {
		console.log(`No type found in field definition: ${fieldDef}`);
		return {
			type: "string",
			kind: "scalar",
			optional: false,
		};
	}

	const fieldType = typeMatch[1]; // This is the actual type like 'references<telegram_message>'
	console.log(`Extracted type: ${fieldType} from definition: ${fieldDef}`);

	// Default values
	let type = fieldType.toLowerCase();
	const kind = "scalar";
	let isOptional = false;
	let referencedTable: string | undefined;
	let description: string | undefined;
	let defaultValue: string | undefined;

	// Extract description from COMMENT clause
	const commentMatch = fieldDef.match(/COMMENT\s+['"]([^'"]+)['"]/i);
	if (commentMatch) {
		description = commentMatch[1];
	}

	// Extract default value from DEFAULT clause
	const defaultMatch = fieldDef.match(
		/DEFAULT\s+([^;]+?)(?:COMMENT|PERMISSIONS|ASSERT|;|$)/i,
	);
	if (defaultMatch) {
		defaultValue = defaultMatch[1].trim();
	}

	// Check if the type is an option type
	if (type.startsWith("option<")) {
		isOptional = true;
		// Extract the inner type
		const innerType = type.slice(7, -1);

		// Check for references type in the inner type
		if (innerType.startsWith("references<")) {
			const matchRef = innerType.match(/references<([^>]+)>/);
			referencedTable = matchRef ? matchRef[1] : undefined;
			console.log(
				`Found optional references field: ${innerType} -> ${referencedTable}`,
			);
			return {
				type: "references",
				kind: "relation",
				optional: isOptional,
				referencedTable,
				description,
				defaultValue,
			};
		}

		// Check for record type in inner type
		if (innerType.startsWith("record<")) {
			const matchRecord = innerType.match(/record<([^>]+)>/);
			referencedTable = matchRecord ? matchRecord[1] : undefined;
			console.log(
				`Found optional record field: ${innerType} -> ${referencedTable}`,
			);
			return {
				type: "record",
				kind: "relation",
				optional: isOptional,
				referencedTable,
				description,
				defaultValue,
			};
		}

		// Use the inner type for further processing
		type = innerType;
	}

	// Check for references type directly
	if (type.startsWith("references<")) {
		const matchRef = type.match(/references<([^>]+)>/);
		referencedTable = matchRef ? matchRef[1] : undefined;
		console.log(`Found references field: ${type} -> ${referencedTable}`);
		return {
			type: "references",
			kind: "relation",
			optional: isOptional,
			referencedTable,
			description,
			defaultValue,
		};
	}

	// Check for record type directly
	if (type.startsWith("record<")) {
		const matchRecord = type.match(/record<([^>]+)>/);
		referencedTable = matchRecord ? matchRecord[1] : undefined;
		console.log(`Found record field: ${type} -> ${referencedTable}`);
		return {
			type: "record",
			kind: "relation",
			optional: isOptional,
			referencedTable,
			description,
			defaultValue,
		};
	}

	// Simplify array types for consistency with mod.ts processing
	if (type.startsWith("array<")) {
		console.log(`Found array field: ${type}`);
		return {
			type: "array",
			kind: "array",
			optional: isOptional,
			description,
			defaultValue,
		};
	}

	// Handle basic types
	if (type === "int" || type === "integer" || type === "number") {
		return {
			type: "int",
			kind: "scalar",
			optional: isOptional,
			description,
			defaultValue,
		};
	}

	if (type === "bool" || type === "boolean") {
		return {
			type: "bool",
			kind: "scalar",
			optional: isOptional,
			description,
			defaultValue,
		};
	}

	if (type === "datetime") {
		return {
			type: "datetime",
			kind: "scalar",
			optional: isOptional,
			description,
			defaultValue,
		};
	}

	return {
		type,
		kind,
		optional: isOptional,
		referencedTable,
		description,
		defaultValue,
	};
}

/**
 * Convert a raw DB info response to a normalized schema info format
 */
export function normalizeSchemaInfo(raw: unknown): SurrealDBSchemaInfo {
	if (!raw || typeof raw !== "object") {
		return { tables: {} };
	}

	const info = raw as Record<string, unknown>;
	const result: SurrealDBSchemaInfo = {};

	// Extract all supported database objects
	const objectTypes = [
		"tables",
		"functions",
		"configs",
		"analyzers",
		"apis",
		"models",
		"params",
		"users",
		"accesses",
	];

	for (const type of objectTypes) {
		if (type in info) {
			// Handle tables specifically since it has a special type
			if (type === "tables") {
				result.tables = info.tables as Record<
					string,
					string | { name: string }
				>;
			} else {
				// For other types, they are expected to be Record<string, string>
				result[type as keyof SurrealDBSchemaInfo] = info[type] as Record<
					string,
					string
				>;
			}
		}
	}

	// If no data was found, at least return empty tables
	if (Object.keys(result).length === 0) {
		return { tables: {} };
	}

	return result;
}

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
		db = new Surreal();

		// Connect to the SurrealDB instance
		await db.connect(config.db.url);

		// Sign in with credentials if provided
		if (config.db.username && config.db.password) {
			await db.signin({
				username: config.db.username,
				password: config.db.password,
			});
		}

		// Use the specified namespace and database if provided
		if (config.db.namespace && config.db.database) {
			await db.use({
				namespace: config.db.namespace,
				database: config.db.database,
			});
		}

		// Fetch schema information using INFO command
		const infoResult = await db.query("INFO FOR DB;");
		console.log("Database INFO result:", JSON.stringify(infoResult, null, 2));

		if (!infoResult || !infoResult[0]) {
			throw new Error("Failed to retrieve schema information from SurrealDB");
		}

		const schemaInfo = normalizeSchemaInfo(infoResult[0]);
		console.log("Normalized schema info:", JSON.stringify(schemaInfo, null, 2));

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
			console.log(
				`Table ${tableName} INFO result:`,
				JSON.stringify(tableInfoResult, null, 2),
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
					console.log(
						`Processing field ${fieldName} with definition: ${fieldInfo}`,
					);
					const parsed = parseFieldDefinition(fieldInfo);
					console.log(
						`Parsed field ${fieldName}: type=${parsed.type}, optional=${parsed.optional}, referencedTable=${parsed.referencedTable}`,
					);

					// Use the parsed referencedTable from parseFieldDefinition
					fields.push({
						name: fieldName,
						type: parsed.type,
						optional: parsed.optional,
						description: parsed.description,
						defaultValue: parsed.defaultValue,
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

					// Extract description and default value if available
					let description: string | undefined = undefined;
					let defaultValue: string | undefined = undefined;

					// Try to extract description and default from the field information
					if (typeof fieldObject.type === "string") {
						// Try to extract from the type string
						const commentMatch = fieldObject.type.match(
							/COMMENT\s+['"]([^'"]+)['"]/i,
						);
						if (commentMatch) {
							description = commentMatch[1];
						}

						const defaultMatch = fieldObject.type.match(
							/DEFAULT\s+([^;]+?)(?:COMMENT|PERMISSIONS|ASSERT|;|$)/i,
						);
						if (defaultMatch) {
							defaultValue = defaultMatch[1].trim();
						}
					}

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
							description,
							defaultValue,
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
						description,
						defaultValue,
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
 * Check if SurrealDB is available at the given URL
 *
 * @param url - URL to check
 * @returns Promise that resolves to true if SurrealDB is available
 */
export async function checkDBConnection(url: string): Promise<boolean> {
	const db = new Surreal();
	try {
		await db.connect(url);
		return true;
	} catch (error) {
		console.error("Failed to connect to SurrealDB:", error);
		return false;
	} finally {
		await db.close();
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
					description: parsed.description,
					defaultValue: parsed.defaultValue,
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

				// Extract description and default value if available
				let description: string | undefined = undefined;
				let defaultValue: string | undefined = undefined;

				// Try to extract description and default from the field information
				if (typeof fieldObject.type === "string") {
					// Try to extract from the type string
					const commentMatch = fieldObject.type.match(
						/COMMENT\s+['"]([^'"]+)['"]/i,
					);
					if (commentMatch) {
						description = commentMatch[1];
					}

					const defaultMatch = fieldObject.type.match(
						/DEFAULT\s+([^;]+?)(?:COMMENT|PERMISSIONS|ASSERT|;|$)/i,
					);
					if (defaultMatch) {
						defaultValue = defaultMatch[1].trim();
					}
				}

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
						description,
						defaultValue,
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
					description,
					defaultValue,
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

/**
 * Export schema definitions from a SurrealDB database
 *
 * @param config - Configuration with database connection details
 * @param applyOverwrite - Whether to add OVERWRITE keyword to definitions
 * @returns Promise that resolves to the schema definitions as a string
 */
export async function exportSchemaFromDB(
	config: Config,
	applyOverwrite = false,
): Promise<string> {
	if (!config.db || !config.db.url) {
		throw new Error("Database URL is required in configuration");
	}

	console.log("Exporting schema from database:", config.db.url);
	if (config.db.namespace) {
		console.log("Using namespace:", config.db.namespace);
	}
	if (config.db.database) {
		console.log("Using database:", config.db.database);
	}

	// Helper function to ensure definition ends with semicolon
	const ensureSemicolon = (definition: string): string => {
		// Trim trailing whitespace
		const trimmed = definition.trim();
		// Add semicolon if it doesn't already end with one
		return trimmed.endsWith(";") ? trimmed : `${trimmed};`;
	};

	let db: Surreal | undefined;
	try {
		// Create a new SurrealDB instance
		db = new Surreal();

		// Connect to the SurrealDB instance
		await db.connect(config.db.url);

		// Sign in with credentials if provided
		if (config.db.username && config.db.password) {
			await db.signin({
				username: config.db.username,
				password: config.db.password,
			});
		}

		// Use the specified namespace and database if provided
		if (config.db.namespace && config.db.database) {
			await db.use({
				namespace: config.db.namespace,
				database: config.db.database,
			});
		}

		// Fetch schema information using INFO command
		const infoResult = await db.query("INFO FOR DB;");

		if (!infoResult || !infoResult[0]) {
			throw new Error("Failed to retrieve schema information from SurrealDB");
		}

		const schemaInfo = normalizeSchemaInfo(infoResult[0]);
		console.log("Schema info:", JSON.stringify(schemaInfo, null, 2));

		// Initialize schema lines
		const schemaLines: string[] = [
			"-- ------------------------------",
			"-- SCHEMA DEFINITIONS",
			"-- ------------------------------",
			"",
			"OPTION IMPORT;",
			"",
		];

		// Process database-level objects first
		const dbObjectTypes = [
			{ type: "functions", title: "FUNCTIONS" },
			{ type: "configs", title: "CONFIGS" },
			{ type: "analyzers", title: "ANALYZERS" },
			{ type: "apis", title: "APIS" },
			{ type: "models", title: "MODELS" },
			{ type: "params", title: "PARAMS" },
		];

		for (const { type, title } of dbObjectTypes) {
			const objects = schemaInfo[type as keyof SurrealDBSchemaInfo];

			if (objects && Object.keys(objects).length > 0) {
				// Add section header
				schemaLines.push("");
				schemaLines.push("-- ------------------------------");
				schemaLines.push(`-- ${title}`);
				schemaLines.push("-- ------------------------------");
				schemaLines.push("");

				// Add each object definition
				for (const [name, definition] of Object.entries(objects)) {
					if (typeof definition === "string") {
						// Only modify the definition if OVERWRITE is needed
						if (applyOverwrite) {
							// Definitions typically start with DEFINE <TYPE>
							// Add OVERWRITE after DEFINE <TYPE>
							const modifiedDef = definition.replace(
								/DEFINE\s+(FUNCTION|CONFIG|ANALYZER|API|MODEL|PARAM)/i,
								"DEFINE $1 OVERWRITE",
							);
							schemaLines.push(ensureSemicolon(modifiedDef));
						} else {
							schemaLines.push(ensureSemicolon(definition));
						}
						schemaLines.push("");
					}
				}
			}
		}

		// Process tables if they exist
		if (schemaInfo.tables && Object.keys(schemaInfo.tables).length > 0) {
			// Add section header for tables
			schemaLines.push("");
			schemaLines.push("-- ------------------------------");
			schemaLines.push("-- TABLES");
			schemaLines.push("-- ------------------------------");

			// Get all table definitions
			for (const tableName of Object.keys(schemaInfo.tables)) {
				// Skip any table definitions that look like system tables
				if (tableName.startsWith("_") || tableName.startsWith("sdb_")) {
					continue;
				}

				// Add table section comments
				schemaLines.push("");
				schemaLines.push("-- ------------------------------");
				schemaLines.push(`-- TABLE: ${tableName}`);
				schemaLines.push("-- ------------------------------");
				schemaLines.push("");

				// Get the raw table definition from schemaInfo, which comes directly from SurrealDB
				const rawTableDef =
					typeof schemaInfo.tables[tableName] === "string"
						? (schemaInfo.tables[tableName] as string)
						: `DEFINE TABLE ${tableName} TYPE NORMAL SCHEMAFULL PERMISSIONS NONE`;

				// Only modify the definition if OVERWRITE is needed
				if (applyOverwrite) {
					// Add OVERWRITE keyword after DEFINE TABLE
					schemaLines.push(
						ensureSemicolon(
							rawTableDef.replace("DEFINE TABLE", "DEFINE TABLE OVERWRITE"),
						),
					);
				} else {
					schemaLines.push(ensureSemicolon(rawTableDef));
				}

				schemaLines.push("");

				// Fetch table info to get fields and other table-level objects
				const tableInfoResult = await db.query(`INFO FOR TABLE ${tableName};`);

				if (tableInfoResult?.[0]) {
					const tableInfo = tableInfoResult[0] as SurrealTableSchemaInfo;

					// Process fields
					if (tableInfo.fields && Object.keys(tableInfo.fields).length > 0) {
						for (const fieldName of Object.keys(tableInfo.fields)) {
							const field = tableInfo.fields[fieldName];

							if (typeof field === "string") {
								// Raw field definition as string
								if (applyOverwrite) {
									// Add OVERWRITE keyword after DEFINE FIELD
									schemaLines.push(
										ensureSemicolon(
											field.replace("DEFINE FIELD", "DEFINE FIELD OVERWRITE"),
										),
									);
								} else {
									schemaLines.push(ensureSemicolon(field));
								}
							} else if (typeof field === "object") {
								// Handle complex field object (fallback in case the raw string isn't available)
								const overwriteKeyword = applyOverwrite ? "OVERWRITE " : "";
								let fieldDef = `DEFINE FIELD ${overwriteKeyword}${fieldName} ON ${tableName} TYPE ${field.type}`;

								if (field.value !== undefined) {
									fieldDef += ` VALUE ${field.value}`;
								}

								if (field.optional) {
									fieldDef += " OPTIONAL";
								}

								schemaLines.push(ensureSemicolon(fieldDef));
							}
						}
					}

					// Define a list of table-level objects to process
					const tableObjectTypes = [
						{ prop: "indexes", title: "Indexes", defineType: "INDEX" },
						{ prop: "events", title: "Events", defineType: "EVENT" },
						{ prop: "lives", title: "Lives", defineType: "LIVE" },
						{ prop: "scopes", title: "Scopes", defineType: "SCOPE" },
						{ prop: "params", title: "Params", defineType: "PARAM" },
						{ prop: "accesses", title: "Accesses", defineType: "ACCESS" },
					];

					// Process each type of table-level object
					for (const { prop, title, defineType } of tableObjectTypes) {
						const objectMap = tableInfo[prop as keyof SurrealTableSchemaInfo] as
							| Record<string, string>
							| undefined;

						if (objectMap && Object.keys(objectMap).length > 0) {
							schemaLines.push("");
							schemaLines.push(`-- ${title}`);

							for (const [objectName, objectDef] of Object.entries(objectMap)) {
								if (applyOverwrite) {
									// Add OVERWRITE keyword after DEFINE <TYPE>
									schemaLines.push(
										ensureSemicolon(
											objectDef.replace(
												`DEFINE ${defineType}`,
												`DEFINE ${defineType} OVERWRITE`,
											),
										),
									);
								} else {
									schemaLines.push(ensureSemicolon(objectDef));
								}
							}
						}
					}
				}
			}
		}

		return schemaLines.join("\n");
	} finally {
		// Close the database connection if open
		if (db) {
			try {
				await db.close();
				console.log("Database connection closed");
			} catch (closeError) {
				console.error("Error closing database connection:", closeError);
			}
		}
	}
}

/**
 * Apply schema definitions to a database
 *
 * @param config - Configuration with database connection details
 * @param schemaDefinitions - The schema definitions to apply
 */
export async function applySchemaToDatabase(
	config: Config,
	schemaDefinitions: string,
): Promise<void> {
	if (!config.db || !config.db.url) {
		throw new Error("Database URL is required in configuration");
	}

	console.log("Applying schema to database:", config.db.url);
	if (config.db.namespace) {
		console.log("Using namespace:", config.db.namespace);
	}
	if (config.db.database) {
		console.log("Using database:", config.db.database);
	}

	let db: Surreal | undefined;
	try {
		// Create a new SurrealDB instance
		db = new Surreal();

		// Connect to the SurrealDB instance
		await db.connect(config.db.url);

		// Sign in with credentials if provided
		if (config.db.username && config.db.password) {
			await db.signin({
				username: config.db.username,
				password: config.db.password,
			});
		}

		// Use the specified namespace and database if provided
		if (config.db.namespace && config.db.database) {
			await db.use({
				namespace: config.db.namespace,
				database: config.db.database,
			});
		}

		// Execute the schema definitions
		await db.query(schemaDefinitions);
		console.log("Schema definitions applied successfully");
	} finally {
		// Close the database connection if open
		if (db) {
			try {
				await db.close();
				console.log("Database connection closed");
			} catch (closeError) {
				console.error("Error closing database connection:", closeError);
			}
		}
	}
}
