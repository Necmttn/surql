import { Effect } from "effect";
import type { SurrealEvent } from "./improved-event.ts";
import type { SurrealIndex } from "./improved-index.ts";
import type { SurrealTable } from "./improved-table.ts";
declare const SurrealSchemaMetadata_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => Readonly<A> & {
    readonly _tag: "SurrealSchemaMetadata";
};
export declare class SurrealSchemaMetadata extends SurrealSchemaMetadata_base<{
    readonly description?: string;
    readonly author?: string;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
}> {
}
declare const SurrealSchemaRegistry_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => Readonly<A> & {
    readonly _tag: "SurrealSchemaRegistry";
};
export declare class SurrealSchemaRegistry extends SurrealSchemaRegistry_base<{
    readonly name: string;
    readonly version: string;
    readonly tables: ReadonlyMap<string, SurrealTable>;
    readonly indexes: ReadonlyMap<string, SurrealIndex>;
    readonly events: ReadonlyMap<string, SurrealEvent>;
    readonly metadata?: SurrealSchemaMetadata;
}> {
}
declare const SurrealSchema_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => Readonly<A> & {
    readonly _tag: "SurrealSchema";
};
export declare class SurrealSchema extends SurrealSchema_base<{
    readonly registry: SurrealSchemaRegistry;
}> {
    static create(name: string, version?: string): SurrealSchema;
    static fromTables(name: string, tables: readonly SurrealTable[], version?: string): SurrealSchema;
    description(desc: string): SurrealSchema;
    author(author: string): SurrealSchema;
    version(version: string): SurrealSchema;
    addTable(table: SurrealTable): SurrealSchema;
    addTables(...tables: readonly SurrealTable[]): SurrealSchema;
    removeTable(tableName: string): SurrealSchema;
    updateTable(tableName: string, updater: (table: SurrealTable) => SurrealTable): SurrealSchema;
    addIndex(index: SurrealIndex): SurrealSchema;
    addIndexes(...indexes: readonly SurrealIndex[]): SurrealSchema;
    removeIndex(indexName: string): SurrealSchema;
    addEvent(event: SurrealEvent): SurrealSchema;
    addEvents(...events: readonly SurrealEvent[]): SurrealSchema;
    removeEvent(eventName: string): SurrealSchema;
    getName(): string;
    getVersion(): string;
    getTable(name: string): SurrealTable | undefined;
    getTables(): readonly SurrealTable[];
    getTableNames(): readonly string[];
    hasTable(name: string): boolean;
    getIndex(name: string): SurrealIndex | undefined;
    getIndexes(): readonly SurrealIndex[];
    getIndexesForTable(tableName: string): readonly SurrealIndex[];
    getEvent(name: string): SurrealEvent | undefined;
    getEvents(): readonly SurrealEvent[];
    getEventsForTable(tableName: string): readonly SurrealEvent[];
    getMetadata(): SurrealSchemaMetadata | undefined;
    equals(other: SurrealSchema): boolean;
    toSurrealQL(): string;
    toTypeScript(): string;
    validate(): Effect.Effect<void, string>;
}
export {};
//# sourceMappingURL=improved-registry.d.ts.map