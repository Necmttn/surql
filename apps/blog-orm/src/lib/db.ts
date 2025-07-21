/**
 * Enhanced Database Layer for Blog ORM
 * 
 * This demonstrates improved patterns for using surql-schema as an ORM,
 * addressing common pain points:
 * - Manual schema construction for query results
 * - Repetitive validation with Schema.encodeUnknownSync
 * - Type casting with 'as RecordId<"table">'
 * - Complex union types for joined queries
 */

import {
  Config,
  ConfigProvider,
  Data,
  Effect,
  Layer,
  LogLevel,
  Schema,
} from "effect";
import { Surreal } from "surrealdb";
import type { RecordId } from "surrealdb";

/**
 * Database configuration
 */
export type SurrealDBConfig = {
  url: string;
  namespace: string;
  database: string;
  username: string;
  password: string;
};

/**
 * Enhanced error types for better error handling
 */
export class DatabaseConnectionError extends Data.TaggedError(
  "DatabaseConnectionError",
)<{
  cause?: unknown;
  message?: string;
}> {}

export class DatabaseQueryError extends Data.TaggedError(
  "DatabaseQueryError",
)<{
  cause?: unknown;
  message: string;
  query?: string;
  operation?: string;
  tableName?: string;
}> {}

export class SchemaValidationError extends Data.TaggedError(
  "SchemaValidationError",
)<{
  cause?: unknown;
  message: string;
  query?: string;
  operation?: string;
  tableName?: string;
  schemaIndex?: number;
  actualData?: string;
}> {}

/**
 * SurrealDB Service following Effect Service pattern
 */
const dbConfig = Config.all({
  url: Config.string("SURREALDB_URL").pipe(
    Config.withDefault("http://localhost:8000")
  ),
  namespace: Config.string("SURREALDB_NAMESPACE").pipe(
    Config.withDefault("blog")
  ),
  database: Config.string("SURREALDB_DATABASE").pipe(
    Config.withDefault("blog")
  ),
  username: Config.string("SURREALDB_USERNAME").pipe(
    Config.withDefault("root")
  ),
  password: Config.string("SURREALDB_PASSWORD").pipe(
    Config.withDefault("root")
  ),
});

export class SurrealDBService extends Effect.Service<SurrealDBService>()(
  "SurrealDBService",
  {
    scoped: Effect.gen(function* (_) {
      const config = yield* dbConfig;
      const db = new Surreal();

      yield* Effect.logWithLevel(LogLevel.Debug, "Connecting to SurrealDB...");
      
      yield* Effect.tryPromise({
        try: () =>
          db.connect(config.url, {
            namespace: config.namespace,
            database: config.database,
            auth: {
              username: config.username,
              password: config.password,
            },
          }),
        catch: (error) =>
          new DatabaseConnectionError({
            cause: error,
            message: "Failed to connect to SurrealDB",
          }),
      });

      yield* Effect.addFinalizer(() =>
        Effect.sync(() => db.close()).pipe(
          Effect.tap(() =>
            Effect.logWithLevel(LogLevel.Debug, "SurrealDB connection closed")
          )
        )
      );

      yield* Effect.logWithLevel(LogLevel.Debug, "SurrealDB connected successfully");
      return db;
    }),
    dependencies: [],
  }
) {
  static readonly fromConfig = (config: SurrealDBConfig) =>
    SurrealDBService.Default.pipe(
      Layer.provide(
        Layer.setConfigProvider(
          ConfigProvider.fromMap(
            new Map([
              ["SURREALDB_URL", config.url],
              ["SURREALDB_NAMESPACE", config.namespace],
              ["SURREALDB_DATABASE", config.database],
              ["SURREALDB_USERNAME", config.username],
              ["SURREALDB_PASSWORD", config.password],
            ])
          )
        )
      )
    );
}

/**
 * Type helpers for better inference
 */
type InferSchemaTypes<T extends readonly Schema.Schema.Any[]> = {
  [K in keyof T]: T[K] extends Schema.Schema.Any
    ? Schema.Schema.Type<T[K]>
    : never;
};

type InferSchemaEncoded<T extends readonly Schema.Schema.Any[]> = {
  [K in keyof T]: T[K] extends Schema.Schema.Any
    ? Schema.Schema.Encoded<T[K]>
    : never;
};

/**
 * Enhanced Query Builder for better type safety and reduced boilerplate
 */
export class QueryBuilder<TResult = unknown> {
  constructor(
    private queryStr: string,
    private params: Record<string, unknown> = {},
    private db: Surreal
  ) {}

  /**
   * Add parameters to the query
   */
  withParams(params: Record<string, unknown>): QueryBuilder<TResult> {
    return new QueryBuilder(this.queryStr, { ...this.params, ...params }, this.db);
  }

  /**
   * Execute query with automatic schema validation
   */
  decode<T extends readonly Schema.Schema.Any[]>(
    schemas: T
  ): Effect.Effect<
    InferSchemaTypes<T>,
    DatabaseQueryError | SchemaValidationError,
    never
  > {
    return this.executeQuery().pipe(
      Effect.flatMap((results) =>
        Effect.all(
          schemas.map((schema, index) =>
            Schema.decode(schema)(results[index]).pipe(
              Effect.mapError((error) => {
                const errorDetails = {
                  message: `Schema validation failed at index ${index}`,
                  query: this.queryStr.substring(0, 200),
                  schemaIndex: index,
                  actualData: JSON.stringify(results[index], null, 2).substring(0, 500),
                };
                
                return new SchemaValidationError({
                  cause: error,
                  message: errorDetails.message,
                  query: errorDetails.query,
                  schemaIndex: errorDetails.schemaIndex,
                  actualData: errorDetails.actualData,
                });
              })
            )
          ),
          { concurrency: "unbounded" }
        )
      )
    ) as Effect.Effect<InferSchemaTypes<T>, DatabaseQueryError | SchemaValidationError, never>;
  }

  /**
   * Execute query with encoding (for parameters)
   */
  encode<T extends readonly Schema.Schema.Any[]>(
    schemas: T
  ): Effect.Effect<
    InferSchemaEncoded<T>,
    DatabaseQueryError | SchemaValidationError,
    never
  > {
    return this.executeQuery().pipe(
      Effect.flatMap((results) =>
        Effect.all(
          schemas.map((schema, index) =>
            Schema.encode(schema)(results[index]).pipe(
              Effect.mapError((error) =>
                new SchemaValidationError({
                  cause: error,
                  message: `Schema encoding failed at index ${index}`,
                  query: this.queryStr.substring(0, 200),
                  schemaIndex: index,
                  actualData: JSON.stringify(results[index], null, 2).substring(0, 500),
                })
              )
            )
          ),
          { concurrency: "unbounded" }
        )
      )
    ) as Effect.Effect<InferSchemaEncoded<T>, DatabaseQueryError | SchemaValidationError, never>;
  }

  /**
   * Execute query and return raw results
   */
  raw(): Effect.Effect<unknown[], DatabaseQueryError, never> {
    return this.executeQuery();
  }

  /**
   * Execute the query with proper error handling and telemetry
   */
  private executeQuery(): Effect.Effect<unknown[], DatabaseQueryError, never> {
    const operation = this.queryStr.trim().split(/\s+/)[0]?.toUpperCase() || "QUERY";
    const tableMatch = 
      this.queryStr.match(/FROM\s+(\w+)/i) ||
      this.queryStr.match(/INSERT\s+INTO\s+(\w+)/i) ||
      this.queryStr.match(/UPDATE\s+(\w+)/i) ||
      this.queryStr.match(/DELETE\s+(\w+)/i);
    const tableName = tableMatch ? tableMatch[1] : "unknown";

    return Effect.withSpan(`db.${operation.toLowerCase()}.${tableName}`, {
      attributes: {
        "db.system": "surrealdb",
        "db.operation": operation,
        "db.statement": this.queryStr.substring(0, 500),
        "db.table": tableName,
        "db.params.count": Object.keys(this.params).length,
      },
    })(
      Effect.tryPromise({
        try: () => this.db.query(this.queryStr, this.params),
        catch: (error) =>
          new DatabaseQueryError({
            cause: error,
            message: `Database query failed: ${String(error)}`,
            query: this.queryStr.substring(0, 200),
            operation,
            tableName,
          }),
      })
    );
  }
}

/**
 * Enhanced SurrealTyped with better query building and reduced boilerplate
 */
export class EnhancedSurrealTyped extends Effect.Service<EnhancedSurrealTyped>()(
  "EnhancedSurrealTyped",
  {
    effect: Effect.gen(function* (_) {
      const db = yield* SurrealDBService;

      /**
       * Create a query builder for better composition
       */
      const query = (queryStr: string, params?: Record<string, unknown>) =>
        new QueryBuilder(queryStr, params, db);

      /**
       * Helper for typed parameter encoding
       */
      const encodeParams = <A, I>(schema: Schema.Schema<A, I>) => (data: A) =>
        Schema.encode(schema)(data);

      /**
       * Create a record with automatic validation
       */
      const create = <T>(
        table: string,
        schema: Schema.Schema<T>,
        data: T
      ): Effect.Effect<T, DatabaseQueryError | SchemaValidationError, never> =>
        Effect.gen(function* (_) {
          const encoded = yield* Schema.encode(schema)(data);
          const [result] = yield* query(
            `CREATE ${table} CONTENT $data`,
            { data: encoded }
          ).decode([schema]);
          return result;
        });

      /**
       * Update a record with automatic validation
       */
      const update = <T>(
        id: RecordId | string,
        schema: Schema.Schema<T>,
        data: Partial<T>
      ): Effect.Effect<T, DatabaseQueryError | SchemaValidationError, never> =>
        Effect.gen(function* (_) {
          const encoded = yield* Schema.encode(Schema.partial(schema))(data);
          const [result] = yield* query(
            `UPDATE $id SET $data`,
            { id, data: encoded }
          ).decode([schema]);
          return result;
        });

      /**
       * Find a record by ID with automatic validation
       */
      const findById = <T>(
        id: RecordId | string,
        schema: Schema.Schema<T>
      ): Effect.Effect<T | null, DatabaseQueryError | SchemaValidationError, never> =>
        Effect.gen(function* (_) {
          const [result] = yield* query(`SELECT * FROM ONLY $id`, { id }).decode([
            Schema.optional(schema),
          ]);
          return result || null;
        });

      /**
       * Delete a record
       */
      const deleteById = (
        id: RecordId | string
      ): Effect.Effect<boolean, DatabaseQueryError, never> =>
        Effect.gen(function* (_) {
          yield* query(`DELETE $id`, { id }).raw();
          return true;
        });

      return {
        query,
        encodeParams,
        create,
        update,
        findById,
        deleteById,
      };
    }),
    dependencies: [SurrealDBService.Default],
  }
) {}

/**
 * Export commonly used schemas for RecordId handling
 */
export const recordId = <T extends string>(tableName: T) => {
  return Schema.Union(
    Schema.instanceOf(RecordId).pipe(
      Schema.filter((id) => id.tb === tableName, {
        message: () => `Expected RecordId for table ${tableName}`,
      })
    ),
    Schema.String.pipe(
      Schema.pattern(new RegExp(`^${tableName}:`), {
        message: () => `Expected string RecordId for table ${tableName}`,
      })
    )
  );
};