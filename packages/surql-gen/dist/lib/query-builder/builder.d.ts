import { Effect, type Schema } from "effect";
import type { SurrealSchema } from "../schema/schema";
import type { SurrealTable } from "../schema/table";
export interface SelectResult<T> {
    readonly _tag: "SelectResult";
    readonly data: readonly T[];
    readonly query: string;
    readonly params: Record<string, unknown>;
}
export interface InsertResult<T> {
    readonly _tag: "InsertResult";
    readonly data: readonly T[];
    readonly query: string;
    readonly params: Record<string, unknown>;
}
export interface UpdateResult<T> {
    readonly _tag: "UpdateResult";
    readonly data: readonly T[];
    readonly query: string;
    readonly params: Record<string, unknown>;
}
export interface DeleteResult {
    readonly _tag: "DeleteResult";
    readonly count: number;
    readonly query: string;
    readonly params: Record<string, unknown>;
}
export interface SelectQueryBuilder<T> {
    where(condition: string, params?: Record<string, unknown>): SelectQueryBuilder<T>;
    orderBy(field: string, direction?: "ASC" | "DESC"): SelectQueryBuilder<T>;
    limit(count: number): SelectQueryBuilder<T>;
    offset(count: number): SelectQueryBuilder<T>;
    build(): {
        query: string;
        params: Record<string, unknown>;
    };
    execute(): Effect.Effect<SelectResult<T>, Error>;
}
export interface InsertQueryBuilder<T> {
    values(data: Partial<T>): InsertQueryBuilder<T>;
    valuesMany(data: readonly Partial<T>[]): InsertQueryBuilder<T>;
    build(): {
        query: string;
        params: Record<string, unknown>;
    };
    execute(): Effect.Effect<InsertResult<T>, Error>;
}
export interface UpdateQueryBuilder<T> {
    set(field: keyof T, value: any): UpdateQueryBuilder<T>;
    setMany(data: Partial<T>): UpdateQueryBuilder<T>;
    where(condition: string, params?: Record<string, unknown>): UpdateQueryBuilder<T>;
    build(): {
        query: string;
        params: Record<string, unknown>;
    };
    execute(): Effect.Effect<UpdateResult<T>, Error>;
}
export interface DeleteQueryBuilder {
    where(condition: string, params?: Record<string, unknown>): DeleteQueryBuilder;
    build(): {
        query: string;
        params: Record<string, unknown>;
    };
    execute(): Effect.Effect<DeleteResult, Error>;
}
export declare class SurrealQueryBuilder<T = any> {
    private table;
    private schema;
    constructor(table: SurrealTable);
    select(): SelectQueryBuilder<T>;
    selectFields(...fields: string[]): SelectQueryBuilder<Partial<T>>;
    insert(): InsertQueryBuilder<T>;
    update(): UpdateQueryBuilder<T>;
    delete(): DeleteQueryBuilder;
    getTableName(): string;
    getSchema(): Schema.Schema<T>;
    getTable(): SurrealTable;
}
export declare const createQueryBuilder: <T = any>(table: SurrealTable) => SurrealQueryBuilder<T>;
export declare const createQueryBuilders: (schema: SurrealSchema) => Record<string, SurrealQueryBuilder>;
//# sourceMappingURL=builder.d.ts.map