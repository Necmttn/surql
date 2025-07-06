export type SurrealIndexType = "UNIQUE" | "SEARCH" | "MTREE";
declare const SurrealIndexDefinition_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => Readonly<A> & {
    readonly _tag: "SurrealIndexDefinition";
};
export declare class SurrealIndexDefinition extends SurrealIndexDefinition_base<{
    readonly name: string;
    readonly table: string;
    readonly type?: SurrealIndexType;
    readonly fields: readonly string[];
    readonly condition?: string;
    readonly description?: string;
    readonly drop?: boolean;
    readonly dimension?: number;
    readonly distance?: "COSINE" | "EUCLIDEAN" | "MANHATTAN" | "PEARSON";
    readonly doc_ids_order?: number;
    readonly doc_lengths_order?: number;
    readonly postings_order?: number;
    readonly terms_order?: number;
    readonly analyzer?: string;
    readonly bm25?: {
        readonly k1?: number;
        readonly b?: number;
    };
    readonly highlights?: boolean;
}> {
}
declare const SurrealIndex_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => Readonly<A> & {
    readonly _tag: "SurrealIndex";
};
export declare class SurrealIndex extends SurrealIndex_base<{
    readonly definition: SurrealIndexDefinition;
}> {
    static create(name: string, table: string, fields: readonly string[]): SurrealIndex;
    static unique(name: string, table: string, fields: readonly string[]): SurrealIndex;
    static search(name: string, table: string, fields: readonly string[]): SurrealIndex;
    static mtree(name: string, table: string, field: string, dimension: number): SurrealIndex;
    unique(): SurrealIndex;
    search(): SurrealIndex;
    mtree(dimension: number): SurrealIndex;
    condition(condition: string): SurrealIndex;
    description(desc: string): SurrealIndex;
    drop(): SurrealIndex;
    distance(distance: "COSINE" | "EUCLIDEAN" | "MANHATTAN" | "PEARSON"): SurrealIndex;
    analyzer(analyzer: string): SurrealIndex;
    bm25(k1?: number, b?: number): SurrealIndex;
    highlights(enabled?: boolean): SurrealIndex;
    docIdsOrder(order: number): SurrealIndex;
    docLengthsOrder(order: number): SurrealIndex;
    postingsOrder(order: number): SurrealIndex;
    termsOrder(order: number): SurrealIndex;
    getName(): string;
    getTable(): string;
    getType(): SurrealIndexType | undefined;
    getFields(): readonly string[];
    getCondition(): string | undefined;
    getDescription(): string | undefined;
    isDrop(): boolean;
    toSurrealQL(): string;
}
export {};
//# sourceMappingURL=improved-index.d.ts.map