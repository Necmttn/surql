import { checkDBConnection } from "../../lib/db.ts";
import { delay } from "@std/async";
import { join } from "@std/path";
import type { Config } from "../../lib/config.ts";

// Helper function to create a temporary directory for SurrealDB data
export async function createTempDir(): Promise<string> {
	const tempDir = await Deno.makeTempDir({ prefix: "surql-gen-test-" });
	return tempDir;
}

// Helper to create a test schema file
export async function createTestSchema(
	content: string,
	filename = "test_schema.surql",
): Promise<string> {
	const fixturesDir = join(Deno.cwd(), "tests", "fixtures");

	try {
		await Deno.mkdir(fixturesDir, { recursive: true });
	} catch (err) {
		if (!(err instanceof Deno.errors.AlreadyExists)) {
			throw err;
		}
	}

	const schemaPath = join(fixturesDir, filename);

	await Deno.writeTextFile(schemaPath, content);
	return schemaPath;
}

// Class to manage the SurrealDB process
export class SurrealDBInstance {
	private static instance: SurrealDBInstance | null = null;
	private process: Deno.ChildProcess | null = null;
	private tempDir: string;
	public readonly url: string;
	public readonly port: number;
	private isRunning = false;

	private constructor(tempDir: string, port = 8000) {
		this.tempDir = tempDir;
		this.port = port;
		this.url = `http://localhost:${port}`;
	}

	// Singleton pattern
	public static async getInstance(): Promise<SurrealDBInstance> {
		if (!SurrealDBInstance.instance) {
			const tempDir = await createTempDir();
			SurrealDBInstance.instance = new SurrealDBInstance(tempDir);
			await SurrealDBInstance.instance.start();
		}
		return SurrealDBInstance.instance;
	}

	async start(): Promise<void> {
		if (this.isRunning) return;

		console.log("Starting SurrealDB instance...");

		// Start SurrealDB process
		const command = new Deno.Command("surreal", {
			args: [
				"start",
				"--log",
				"info",
				"--user",
				"root",
				"--pass",
				"root",
				"--bind",
				`0.0.0.0:${this.port}`,
				"memory",
			],
			stdout: "piped",
			stderr: "piped",
		});

		this.process = command.spawn();

		// Store references to stdout and stderr to properly close them later
		const stdout = this.process.stdout;
		const stderr = this.process.stderr;

		// Set up a listener to close resources when process exits
		this.process.status
			.then(() => {
				stdout.cancel();
				stderr.cancel();
			})
			.catch(() => {
				stdout.cancel();
				stderr.cancel();
			});

		// Wait for the server to be ready
		await delay(2000);

		// Check if the server is running
		let isConnected = false;
		let retries = 0;

		while (!isConnected && retries < 5) {
			try {
				isConnected = await checkDBConnection(this.url);
				if (isConnected) {
					console.log("SurrealDB is running");
					this.isRunning = true;
					break;
				}
			} catch (err) {
				console.error("Error connecting to SurrealDB:", err);
			}

			retries++;
			await delay(1000);
		}

		if (!isConnected) {
			// Make sure to close resources if we fail to connect
			stdout.cancel();
			stderr.cancel();
			throw new Error("Failed to start SurrealDB");
		}
	}

	async loadSchema(
		schemaPath: string,
		namespace = "test",
		database = "testdb",
	): Promise<void> {
		console.log(
			`Loading schema from ${schemaPath} into namespace=${namespace}, database=${database}...`,
		);

		const importCommand = new Deno.Command("surreal", {
			args: [
				"import",
				"--conn",
				this.url,
				"--user",
				"root",
				"--pass",
				"root",
				"--namespace",
				namespace,
				"--database",
				database,
				schemaPath,
			],
			stdout: "piped",
			stderr: "piped",
		});

		// Use output() instead of spawn() to properly handle resources
		const importResult = await importCommand.output();

		if (!importResult.success) {
			const decoder = new TextDecoder();
			console.error("Schema load failed:", decoder.decode(importResult.stderr));
			throw new Error("Failed to load schema");
		}

		console.log("Schema loaded successfully");
	}

	async createDatabase(namespace: string, database: string): Promise<void> {
		console.log(`Creating namespace=${namespace}, database=${database}...`);

		const schemaContent = `
DEFINE NAMESPACE ${namespace};
USE NAMESPACE ${namespace};
DEFINE DATABASE ${database};
USE DATABASE ${database};
`;

		const tempSchemaPath = await createTestSchema(
			schemaContent,
			`${namespace}_${database}_init.surql`,
		);
		await this.loadSchema(tempSchemaPath, namespace, database);
	}

	async stop(): Promise<void> {
		if (this.process && this.isRunning) {
			console.log("Stopping SurrealDB instance...");
			try {
				// Ensure process is stopped
				this.process.kill("SIGTERM");
				// Wait for the process to exit gracefully
				await Promise.race([this.process.status, delay(1000).then(() => null)]);
			} catch (err) {
				// Process might have already terminated
				console.log("Process already terminated");
			}
			this.process = null;
			this.isRunning = false;

			// Clean up temp directory
			try {
				await Deno.remove(this.tempDir, { recursive: true });
			} catch (err) {
				console.error("Error cleaning up temp directory:", err);
			}

			// Reset the singleton instance
			SurrealDBInstance.instance = null;
		}
	}
}

// Helper to create a test configuration with required properties
export function createTestConfig(
	url: string,
	namespace = "test",
	database = "testdb",
): Config {
	return {
		output: {
			path: "./generated",
			filename: "schema",
			extension: "ts",
		},
		imports: {
			style: "esm",
			paths: {
				effect: "effect",
			},
			schemaSystem: "effect",
		},
		db: {
			url,
			username: "root",
			password: "root",
			namespace,
			database,
		},
	};
}
