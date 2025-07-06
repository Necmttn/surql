import { Schema } from "effect";
import { SurrealTable } from "./table";
import { SurrealEvent } from "./event";
import { SurrealIndex } from "./index-def";
declare const SchemaMetadataSchema: Schema.Struct<{
    description: Schema.optional<typeof Schema.String>;
    author: Schema.optional<typeof Schema.String>;
    createdAt: Schema.optional<typeof Schema.DateFromSelf>;
    updatedAt: Schema.optional<typeof Schema.DateFromSelf>;
    tags: Schema.optional<Schema.Array$<typeof Schema.String>>;
    version_info: Schema.optional<typeof Schema.Unknown>;
}>;
declare const SurrealSchema_base: Schema.Class<SurrealSchema, {
    name: Schema.filter<typeof Schema.String>;
    version: Schema.filter<typeof Schema.String>;
    description: Schema.optional<typeof Schema.String>;
    tables: Schema.Array$<typeof SurrealTable>;
    indexes: Schema.optional<Schema.Array$<typeof SurrealIndex>>;
    events: Schema.optional<Schema.Array$<typeof SurrealEvent>>;
    metadata: Schema.optional<Schema.Struct<{
        description: Schema.optional<typeof Schema.String>;
        author: Schema.optional<typeof Schema.String>;
        createdAt: Schema.optional<typeof Schema.DateFromSelf>;
        updatedAt: Schema.optional<typeof Schema.DateFromSelf>;
        tags: Schema.optional<Schema.Array$<typeof Schema.String>>;
        version_info: Schema.optional<typeof Schema.Unknown>;
    }>>;
}, Schema.Struct.Encoded<{
    name: Schema.filter<typeof Schema.String>;
    version: Schema.filter<typeof Schema.String>;
    description: Schema.optional<typeof Schema.String>;
    tables: Schema.Array$<typeof SurrealTable>;
    indexes: Schema.optional<Schema.Array$<typeof SurrealIndex>>;
    events: Schema.optional<Schema.Array$<typeof SurrealEvent>>;
    metadata: Schema.optional<Schema.Struct<{
        description: Schema.optional<typeof Schema.String>;
        author: Schema.optional<typeof Schema.String>;
        createdAt: Schema.optional<typeof Schema.DateFromSelf>;
        updatedAt: Schema.optional<typeof Schema.DateFromSelf>;
        tags: Schema.optional<Schema.Array$<typeof Schema.String>>;
        version_info: Schema.optional<typeof Schema.Unknown>;
    }>>;
}>, never, {
    readonly name: string;
} & {
    readonly description?: string | undefined;
} & {
    readonly version: string;
} & {
    readonly tables: readonly SurrealTable[];
} & {
    readonly indexes?: readonly SurrealIndex[] | undefined;
} & {
    readonly events?: readonly SurrealEvent[] | undefined;
} & {
    readonly metadata?: {
        readonly description?: string | undefined;
        readonly author?: string | undefined;
        readonly createdAt?: Date | undefined;
        readonly updatedAt?: Date | undefined;
        readonly tags?: readonly string[] | undefined;
        readonly version_info?: unknown;
    } | undefined;
}, {}, {}>;
/**
 * SurrealSchema as Schema.Class - batteries included schema registry
 *
 * This class provides:
 * - Built-in validation via Schema.Class
 * - Automatic encoding/decoding
 * - Schema-wide operations (migrations, comparisons)
 * - Complete code generation pipeline
 * - Database introspection integration
 */
export declare class SurrealSchema extends SurrealSchema_base {
    static validate: (u: unknown, overrideOptions?: import("effect/SchemaAST").ParseOptions) => SurrealSchema;
    static parse: (u: unknown, overrideOptions?: import("effect/SchemaAST").ParseOptions) => SurrealSchema;
    static safeParse: (u: unknown, overrideOptions?: import("effect/SchemaAST").ParseOptions) => import("effect/Option").Option<SurrealSchema>;
    static encode: (a: SurrealSchema, overrideOptions?: import("effect/SchemaAST").ParseOptions) => {
        readonly name: string;
        readonly version: string;
        readonly tables: readonly {
            readonly fields: readonly {
                readonly type: "string" | "number" | "object" | "int" | "bool" | "datetime" | "array" | "record" | "any";
                readonly isOptional: boolean;
                readonly isId: boolean;
                readonly name: string;
                readonly constraints?: {
                    readonly min?: number | undefined;
                    readonly length?: number | undefined;
                    readonly max?: number | undefined;
                    readonly pattern?: string | undefined;
                    readonly enum?: readonly string[] | undefined;
                    readonly unique?: boolean | undefined;
                    readonly required?: boolean | undefined;
                    readonly assert?: string | undefined;
                } | undefined;
                readonly permissions?: {
                    readonly select?: string | undefined;
                    readonly create?: string | undefined;
                    readonly update?: string | undefined;
                    readonly delete?: string | undefined;
                } | undefined;
                readonly defaultValue?: string | undefined;
                readonly description?: string | undefined;
                readonly references?: {
                    readonly table: string;
                    readonly field?: string | undefined;
                    readonly onDelete?: "CASCADE" | "SET NULL" | "RESTRICT" | undefined;
                } | undefined;
            }[];
            readonly name: string;
            readonly schemafull: boolean;
            readonly permissions?: {
                readonly select?: string | undefined;
                readonly create?: string | undefined;
                readonly update?: string | undefined;
                readonly delete?: string | undefined;
            } | undefined;
            readonly description?: string | undefined;
            readonly drop?: boolean | undefined;
            readonly view?: {
                readonly fields: readonly string[];
                readonly condition?: string | undefined;
            } | undefined;
            readonly aiHints?: {
                readonly primary_key?: string | undefined;
                readonly temporal_field?: string | undefined;
                readonly user_field?: string | undefined;
                readonly content_fields?: readonly string[] | undefined;
                readonly common_queries?: readonly string[] | undefined;
                readonly relationships?: unknown;
                readonly security_level?: string | undefined;
            } | undefined;
        }[];
        readonly description?: string | undefined;
        readonly indexes?: readonly {
            readonly table: string;
            readonly fields: readonly string[];
            readonly name: string;
            readonly unique?: boolean | undefined;
            readonly type?: "UNIQUE" | "SEARCH" | "MTREE" | undefined;
            readonly description?: string | undefined;
            readonly condition?: string | undefined;
            readonly fulltext?: boolean | undefined;
        }[] | undefined;
        readonly events?: readonly {
            readonly table: string;
            readonly name: string;
            readonly then: string;
            readonly when: "BEFORE" | "AFTER";
            readonly action: "CREATE" | "UPDATE" | "DELETE";
            readonly description?: string | undefined;
            readonly condition?: string | undefined;
        }[] | undefined;
        readonly metadata?: {
            readonly description?: string | undefined;
            readonly author?: string | undefined;
            readonly createdAt?: Date | undefined;
            readonly updatedAt?: Date | undefined;
            readonly tags?: readonly string[] | undefined;
            readonly version_info?: unknown;
        } | undefined;
    };
    static decode: (i: {
        readonly name: string;
        readonly version: string;
        readonly tables: readonly {
            readonly fields: readonly {
                readonly type: "string" | "number" | "object" | "int" | "bool" | "datetime" | "array" | "record" | "any";
                readonly isOptional: boolean;
                readonly isId: boolean;
                readonly name: string;
                readonly constraints?: {
                    readonly min?: number | undefined;
                    readonly length?: number | undefined;
                    readonly max?: number | undefined;
                    readonly pattern?: string | undefined;
                    readonly enum?: readonly string[] | undefined;
                    readonly unique?: boolean | undefined;
                    readonly required?: boolean | undefined;
                    readonly assert?: string | undefined;
                } | undefined;
                readonly permissions?: {
                    readonly select?: string | undefined;
                    readonly create?: string | undefined;
                    readonly update?: string | undefined;
                    readonly delete?: string | undefined;
                } | undefined;
                readonly defaultValue?: string | undefined;
                readonly description?: string | undefined;
                readonly references?: {
                    readonly table: string;
                    readonly field?: string | undefined;
                    readonly onDelete?: "CASCADE" | "SET NULL" | "RESTRICT" | undefined;
                } | undefined;
            }[];
            readonly name: string;
            readonly schemafull: boolean;
            readonly permissions?: {
                readonly select?: string | undefined;
                readonly create?: string | undefined;
                readonly update?: string | undefined;
                readonly delete?: string | undefined;
            } | undefined;
            readonly description?: string | undefined;
            readonly drop?: boolean | undefined;
            readonly view?: {
                readonly fields: readonly string[];
                readonly condition?: string | undefined;
            } | undefined;
            readonly aiHints?: {
                readonly primary_key?: string | undefined;
                readonly temporal_field?: string | undefined;
                readonly user_field?: string | undefined;
                readonly content_fields?: readonly string[] | undefined;
                readonly common_queries?: readonly string[] | undefined;
                readonly relationships?: unknown;
                readonly security_level?: string | undefined;
            } | undefined;
        }[];
        readonly description?: string | undefined;
        readonly indexes?: readonly {
            readonly table: string;
            readonly fields: readonly string[];
            readonly name: string;
            readonly unique?: boolean | undefined;
            readonly type?: "UNIQUE" | "SEARCH" | "MTREE" | undefined;
            readonly description?: string | undefined;
            readonly condition?: string | undefined;
            readonly fulltext?: boolean | undefined;
        }[] | undefined;
        readonly events?: readonly {
            readonly table: string;
            readonly name: string;
            readonly then: string;
            readonly when: "BEFORE" | "AFTER";
            readonly action: "CREATE" | "UPDATE" | "DELETE";
            readonly description?: string | undefined;
            readonly condition?: string | undefined;
        }[] | undefined;
        readonly metadata?: {
            readonly description?: string | undefined;
            readonly author?: string | undefined;
            readonly createdAt?: Date | undefined;
            readonly updatedAt?: Date | undefined;
            readonly tags?: readonly string[] | undefined;
            readonly version_info?: unknown;
        } | undefined;
    }, overrideOptions?: import("effect/SchemaAST").ParseOptions) => SurrealSchema;
    static create(name: string, version?: string): SurrealSchema;
    static fromTables(name: string, tables: readonly SurrealTable[], version?: string): SurrealSchema;
    withDescription(desc: string): SurrealSchema;
    withMetadata(metadata: Schema.Schema.Type<typeof SchemaMetadataSchema>): SurrealSchema;
    withVersion(version: string): SurrealSchema;
    addTable(table: SurrealTable): SurrealSchema;
    addTables(...tables: SurrealTable[]): SurrealSchema;
    removeTable(tableName: string): SurrealSchema;
    updateTable(tableName: string, updater: (table: SurrealTable) => SurrealTable): SurrealSchema;
    replaceTable(tableName: string, newTable: SurrealTable): SurrealSchema;
    addIndex(index: SurrealIndex): SurrealSchema;
    removeIndex(indexName: string): SurrealSchema;
    addEvent(event: SurrealEvent): SurrealSchema;
    removeEvent(eventName: string): SurrealSchema;
    getName(): string;
    getVersion(): string;
    getDescription(): string | undefined;
    getTables(): readonly SurrealTable[];
    getTable(name: string): SurrealTable | undefined;
    hasTable(name: string): boolean;
    getTableNames(): readonly string[];
    getIndexes(): readonly SurrealIndex[];
    getEvents(): readonly SurrealEvent[];
    getMetadata(): Schema.Schema.Type<typeof SchemaMetadataSchema> | undefined;
    getTableCount(): number;
    getFieldCount(): number;
    getIndexCount(): number;
    getEventCount(): number;
    validateSchema(): string[];
    toSurrealQL(): string;
    toTypeScript(): string;
    toEffectSchemaClasses(): string;
    static fromSurrealQL(sql: string): SurrealSchema;
    static generateMigration(from: SurrealSchema, to: SurrealSchema): string[];
    static compare(schema1: SurrealSchema, schema2: SurrealSchema): {
        added: string[];
        removed: string[];
        modified: string[];
        unchanged: string[];
    };
}
export type SurrealSchemaType = Schema.Schema.Type<typeof SurrealSchema>;
export type SchemaMetadata = Schema.Schema.Type<typeof SchemaMetadataSchema>;
export type SchemaIndex = SurrealIndex;
export type SchemaEvent = SurrealEvent;
export {};
//# sourceMappingURL=schema.d.ts.map