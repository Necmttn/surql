import { Schema } from "effect";
declare const IndexTypeSchema: Schema.optional<Schema.Literal<["UNIQUE", "SEARCH", "MTREE"]>>;
declare const SurrealIndex_base: Schema.Class<SurrealIndex, {
    name: Schema.filter<typeof Schema.String>;
    table: Schema.filter<typeof Schema.String>;
    fields: Schema.filter<Schema.Array$<Schema.filter<typeof Schema.String>>>;
    type: Schema.optional<Schema.Literal<["UNIQUE", "SEARCH", "MTREE"]>>;
    unique: Schema.optional<typeof Schema.Boolean>;
    fulltext: Schema.optional<typeof Schema.Boolean>;
    condition: Schema.optional<typeof Schema.String>;
    description: Schema.optional<typeof Schema.String>;
}, Schema.Struct.Encoded<{
    name: Schema.filter<typeof Schema.String>;
    table: Schema.filter<typeof Schema.String>;
    fields: Schema.filter<Schema.Array$<Schema.filter<typeof Schema.String>>>;
    type: Schema.optional<Schema.Literal<["UNIQUE", "SEARCH", "MTREE"]>>;
    unique: Schema.optional<typeof Schema.Boolean>;
    fulltext: Schema.optional<typeof Schema.Boolean>;
    condition: Schema.optional<typeof Schema.String>;
    description: Schema.optional<typeof Schema.String>;
}>, never, {
    readonly unique?: boolean | undefined;
} & {
    readonly table: string;
} & {
    readonly type?: "UNIQUE" | "SEARCH" | "MTREE" | undefined;
} & {
    readonly fields: readonly string[];
} & {
    readonly name: string;
} & {
    readonly description?: string | undefined;
} & {
    readonly condition?: string | undefined;
} & {
    readonly fulltext?: boolean | undefined;
}, {}, {}>;
/**
 * SurrealIndex as Schema.Class - self-validating index definitions
 *
 * This class provides:
 * - Built-in validation via Schema.Class
 * - Automatic encoding/decoding
 * - Fluent API for index configuration
 * - SurrealQL generation
 * - Migration support
 */
export declare class SurrealIndex extends SurrealIndex_base {
    static validate: (u: unknown, overrideOptions?: import("effect/SchemaAST").ParseOptions) => SurrealIndex;
    static parse: (u: unknown, overrideOptions?: import("effect/SchemaAST").ParseOptions) => SurrealIndex;
    static safeParse: (u: unknown, overrideOptions?: import("effect/SchemaAST").ParseOptions) => import("effect/Option").Option<SurrealIndex>;
    static encode: (a: SurrealIndex, overrideOptions?: import("effect/SchemaAST").ParseOptions) => {
        readonly table: string;
        readonly fields: readonly string[];
        readonly name: string;
        readonly unique?: boolean | undefined;
        readonly type?: "UNIQUE" | "SEARCH" | "MTREE" | undefined;
        readonly description?: string | undefined;
        readonly condition?: string | undefined;
        readonly fulltext?: boolean | undefined;
    };
    static decode: (i: {
        readonly table: string;
        readonly fields: readonly string[];
        readonly name: string;
        readonly unique?: boolean | undefined;
        readonly type?: "UNIQUE" | "SEARCH" | "MTREE" | undefined;
        readonly description?: string | undefined;
        readonly condition?: string | undefined;
        readonly fulltext?: boolean | undefined;
    }, overrideOptions?: import("effect/SchemaAST").ParseOptions) => SurrealIndex;
    static create(name: string, table: string, fields: string[]): SurrealIndex;
    static unique(name: string, table: string, fields: string[]): SurrealIndex;
    static search(name: string, table: string, fields: string[]): SurrealIndex;
    static mtree(name: string, table: string, field: string): SurrealIndex;
    makeUnique(): SurrealIndex;
    makeSearch(): SurrealIndex;
    makeMtree(): SurrealIndex;
    withCondition(condition: string): SurrealIndex;
    withDescription(description: string): SurrealIndex;
    getName(): string;
    getTable(): string;
    getFields(): readonly string[];
    getType(): Schema.Schema.Type<typeof IndexTypeSchema>;
    isUnique(): boolean;
    isSearch(): boolean;
    isMtree(): boolean;
    getCondition(): string | undefined;
    getDescription(): string | undefined;
    toSurrealQL(): string;
    static fromSurrealQL(sql: string): SurrealIndex;
    static diff(oldIndex: SurrealIndex, newIndex: SurrealIndex): string[];
}
export type SurrealIndexType = Schema.Schema.Type<typeof SurrealIndex>;
export type IndexType = Schema.Schema.Type<typeof IndexTypeSchema>;
export {};
//# sourceMappingURL=index-def.d.ts.map