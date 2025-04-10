import type { Config } from "../config.ts";
import type { SurrealTableSchemaInfo } from "./interfaces.ts";
import type { Surreal } from "surrealdb";
import { normalizeSchemaInfo } from "./parser.ts";
import { createDBConnection } from "./connection.ts";
import { ensureSemicolon } from "./utils.ts";

/**
 * Options for exporting schema definitions
 */
export interface ExportSchemaOptions {
	/** Whether to add OVERWRITE keyword to definitions */
	applyOverwrite?: boolean;
	/** Force a specific table type for all tables */
	forceTableType?: string;
	/** Force a specific schema mode (SCHEMAFULL or SCHEMALESS) */
	forceSchemaMode?: string;
}

/**
 * Export schema definitions from a SurrealDB database
 *
 * @param config - Configuration with database connection details
 * @param options - Options for schema export
 * @returns Promise that resolves to the schema definitions as a string
 */
export async function exportSchemaFromDB(
	config: Config,
	options?: ExportSchemaOptions | boolean,
): Promise<string> {
	// Handle backward compatibility with boolean parameter
	let exportOptions: ExportSchemaOptions;
	if (typeof options === "boolean") {
		exportOptions = { applyOverwrite: options };
	} else {
		exportOptions = options || {};
	}

	const {
		applyOverwrite = false,
		forceTableType,
		forceSchemaMode,
	} = exportOptions;

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
			const objects = schemaInfo[type as keyof typeof schemaInfo];

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
				let rawTableDef =
					typeof schemaInfo.tables[tableName] === "string"
						? (schemaInfo.tables[tableName] as string)
						: `DEFINE TABLE ${tableName} TYPE NORMAL SCHEMAFULL PERMISSIONS NONE`;

				// Apply forced table type if specified
				if (forceTableType) {
					rawTableDef = rawTableDef.replace(
						/TYPE\s+\w+/i,
						`TYPE ${forceTableType.toUpperCase()}`,
					);
				}

				// Apply forced schema mode if specified
				if (forceSchemaMode) {
					rawTableDef = rawTableDef.replace(
						/SCHEMA(FULL|LESS)/i,
						forceSchemaMode.toUpperCase(),
					);
				}

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
							const field = tableInfo.fields[fieldName] as string;

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
