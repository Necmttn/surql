import { Schema } from "effect";
import { SurrealField } from "./field";
declare const AITableHintsSchema: Schema.Struct<{
    primary_key: Schema.optional<typeof Schema.String>;
    temporal_field: Schema.optional<typeof Schema.String>;
    user_field: Schema.optional<typeof Schema.String>;
    content_fields: Schema.optional<Schema.Array$<typeof Schema.String>>;
    common_queries: Schema.optional<Schema.Array$<typeof Schema.String>>;
    relationships: Schema.optional<typeof Schema.Unknown>;
    security_level: Schema.optional<typeof Schema.String>;
}>;
declare const TablePermissionsSchema: Schema.Struct<{
    select: Schema.optional<typeof Schema.String>;
    create: Schema.optional<typeof Schema.String>;
    update: Schema.optional<typeof Schema.String>;
    delete: Schema.optional<typeof Schema.String>;
}>;
declare const TableViewSchema: Schema.Struct<{
    fields: Schema.Array$<typeof Schema.String>;
    condition: Schema.optional<typeof Schema.String>;
}>;
declare const SurrealTable_base: Schema.Class<SurrealTable, {
    name: Schema.filter<typeof Schema.String>;
    description: Schema.optional<typeof Schema.String>;
    fields: Schema.Array$<typeof SurrealField>;
    permissions: Schema.optional<Schema.Struct<{
        select: Schema.optional<typeof Schema.String>;
        create: Schema.optional<typeof Schema.String>;
        update: Schema.optional<typeof Schema.String>;
        delete: Schema.optional<typeof Schema.String>;
    }>>;
    schemafull: typeof Schema.Boolean;
    drop: Schema.optional<typeof Schema.Boolean>;
    view: Schema.optional<Schema.Struct<{
        fields: Schema.Array$<typeof Schema.String>;
        condition: Schema.optional<typeof Schema.String>;
    }>>;
    aiHints: Schema.optional<Schema.Struct<{
        primary_key: Schema.optional<typeof Schema.String>;
        temporal_field: Schema.optional<typeof Schema.String>;
        user_field: Schema.optional<typeof Schema.String>;
        content_fields: Schema.optional<Schema.Array$<typeof Schema.String>>;
        common_queries: Schema.optional<Schema.Array$<typeof Schema.String>>;
        relationships: Schema.optional<typeof Schema.Unknown>;
        security_level: Schema.optional<typeof Schema.String>;
    }>>;
}, Schema.Struct.Encoded<{
    name: Schema.filter<typeof Schema.String>;
    description: Schema.optional<typeof Schema.String>;
    fields: Schema.Array$<typeof SurrealField>;
    permissions: Schema.optional<Schema.Struct<{
        select: Schema.optional<typeof Schema.String>;
        create: Schema.optional<typeof Schema.String>;
        update: Schema.optional<typeof Schema.String>;
        delete: Schema.optional<typeof Schema.String>;
    }>>;
    schemafull: typeof Schema.Boolean;
    drop: Schema.optional<typeof Schema.Boolean>;
    view: Schema.optional<Schema.Struct<{
        fields: Schema.Array$<typeof Schema.String>;
        condition: Schema.optional<typeof Schema.String>;
    }>>;
    aiHints: Schema.optional<Schema.Struct<{
        primary_key: Schema.optional<typeof Schema.String>;
        temporal_field: Schema.optional<typeof Schema.String>;
        user_field: Schema.optional<typeof Schema.String>;
        content_fields: Schema.optional<Schema.Array$<typeof Schema.String>>;
        common_queries: Schema.optional<Schema.Array$<typeof Schema.String>>;
        relationships: Schema.optional<typeof Schema.Unknown>;
        security_level: Schema.optional<typeof Schema.String>;
    }>>;
}>, never, {
    readonly fields: readonly SurrealField[];
} & {
    readonly name: string;
} & {
    readonly permissions?: {
        readonly select?: string | undefined;
        readonly create?: string | undefined;
        readonly update?: string | undefined;
        readonly delete?: string | undefined;
    } | undefined;
} & {
    readonly description?: string | undefined;
} & {
    readonly schemafull: boolean;
} & {
    readonly drop?: boolean | undefined;
} & {
    readonly view?: {
        readonly fields: readonly string[];
        readonly condition?: string | undefined;
    } | undefined;
} & {
    readonly aiHints?: {
        readonly primary_key?: string | undefined;
        readonly temporal_field?: string | undefined;
        readonly user_field?: string | undefined;
        readonly content_fields?: readonly string[] | undefined;
        readonly common_queries?: readonly string[] | undefined;
        readonly relationships?: unknown;
        readonly security_level?: string | undefined;
    } | undefined;
}, {}, {}>;
/**
 * SurrealTable as Schema.Class - batteries included table definition
 *
 * This class provides:
 * - Built-in validation via Schema.Class
 * - Automatic encoding/decoding
 * - Fluent API that maintains validation
 * - Self-serialization to SurrealQL
 * - Migration generation via comparison
 * - AI metadata integration
 */
export declare class SurrealTable extends SurrealTable_base {
    static validate: (u: unknown, overrideOptions?: import("effect/SchemaAST").ParseOptions) => SurrealTable;
    static parse: (u: unknown, overrideOptions?: import("effect/SchemaAST").ParseOptions) => SurrealTable;
    static safeParse: (u: unknown, overrideOptions?: import("effect/SchemaAST").ParseOptions) => import("effect/Option").Option<SurrealTable>;
    static encode: (a: SurrealTable, overrideOptions?: import("effect/SchemaAST").ParseOptions) => {
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
    };
    static decode: (i: {
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
    }, overrideOptions?: import("effect/SchemaAST").ParseOptions) => SurrealTable;
    static create(name: string, fields?: readonly SurrealField[]): SurrealTable;
    static schemaless(name: string, fields?: readonly SurrealField[]): SurrealTable;
    static view(name: string, viewFields: readonly string[], condition?: string): SurrealTable;
    withDescription(desc: string): SurrealTable;
    addField(field: SurrealField): SurrealTable;
    addFields(...fields: SurrealField[]): SurrealTable;
    removeField(fieldName: string): SurrealTable;
    updateField(fieldName: string, updater: (field: SurrealField) => SurrealField): SurrealTable;
    withPermissions(permissions: Schema.Schema.Type<typeof TablePermissionsSchema>): SurrealTable;
    schemafullMode(): SurrealTable;
    schemalessMode(): SurrealTable;
    withAiHints(hints: Schema.Schema.Type<typeof AITableHintsSchema>): SurrealTable;
    aiPrimaryKey(field: string): SurrealTable;
    aiTemporalField(field: string): SurrealTable;
    aiUserField(field: string): SurrealTable;
    aiContentFields(fields: readonly string[]): SurrealTable;
    aiCommonQueries(queries: readonly string[]): SurrealTable;
    aiRelationships(relationships: Record<string, string>): SurrealTable;
    aiSecurityLevel(level: string): SurrealTable;
    getName(): string;
    getDescription(): string | undefined;
    getFields(): readonly SurrealField[];
    getField(name: string): SurrealField | undefined;
    hasField(name: string): boolean;
    getPermissions(): Schema.Schema.Type<typeof TablePermissionsSchema> | undefined;
    isSchemaFull(): boolean;
    isView(): boolean;
    getView(): Schema.Schema.Type<typeof TableViewSchema> | undefined;
    getAiHints(): Schema.Schema.Type<typeof AITableHintsSchema> | undefined;
    toSurrealQL(): string;
    static fromSurrealQL(sql: string): SurrealTable;
    static diff(oldTable: SurrealTable, newTable: SurrealTable): string[];
    toEffectSchemaClass(): string;
    toTypeScriptInterface(): string;
}
export type SurrealTableType = Schema.Schema.Type<typeof SurrealTable>;
export type TablePermissions = Schema.Schema.Type<typeof TablePermissionsSchema>;
export type TableView = Schema.Schema.Type<typeof TableViewSchema>;
export type AITableHints = Schema.Schema.Type<typeof AITableHintsSchema>;
export {};
//# sourceMappingURL=table.d.ts.map