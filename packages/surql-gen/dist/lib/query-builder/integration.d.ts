import { Effect, Schema } from "effect";
import type { SurrealTable } from "../schema/table";
import { type DeleteResult, type InsertResult, type SelectResult, SurrealQueryBuilder, type UpdateResult } from "./builder";
export declare class IntegratedQueryBuilder<T = any> extends SurrealQueryBuilder<T> {
    private db;
    constructor(table: SurrealTable, db: SurrealTyped);
    select(): IntegratedSelectBuilder<T>;
    selectFields(...fields: string[]): IntegratedSelectBuilder<Partial<T>>;
    insert(): IntegratedInsertBuilder<T>;
    update(): IntegratedUpdateBuilder<T>;
    delete(): IntegratedDeleteBuilder;
}
declare class IntegratedSelectBuilder<T> {
    private table;
    private schema;
    private db;
    private fields?;
    private whereCondition?;
    private whereParams;
    private orderByField?;
    private orderByDirection;
    private limitCount?;
    private offsetCount?;
    constructor(table: SurrealTable, schema: Schema.Schema<T>, db: SurrealTyped, fields?: readonly string[]);
    where(condition: string, params?: Record<string, unknown>): IntegratedSelectBuilder<T>;
    orderBy(field: string, direction?: "ASC" | "DESC"): IntegratedSelectBuilder<T>;
    limit(count: number): IntegratedSelectBuilder<T>;
    offset(count: number): IntegratedSelectBuilder<T>;
    build(): {
        query: string;
        params: Record<string, unknown>;
    };
    execute(): Effect.Effect<SelectResult<T>, Error>;
    executeFirst(): Effect.Effect<T | null, Error>;
    executeOne(): Effect.Effect<T, Error>;
}
declare class IntegratedInsertBuilder<T> {
    private table;
    private schema;
    private db;
    private insertData;
    constructor(table: SurrealTable, schema: Schema.Schema<T>, db: SurrealTyped);
    values(data: Partial<T>): IntegratedInsertBuilder<T>;
    valuesMany(data: readonly Partial<T>[]): IntegratedInsertBuilder<T>;
    build(): {
        query: string;
        params: Record<string, unknown>;
    };
    execute(): Effect.Effect<InsertResult<T>, Error>;
}
declare class IntegratedUpdateBuilder<T> {
    private table;
    private schema;
    private db;
    private setFields;
    private whereCondition?;
    private whereParams;
    constructor(table: SurrealTable, schema: Schema.Schema<T>, db: SurrealTyped);
    set(field: keyof T, value: any): IntegratedUpdateBuilder<T>;
    setMany(data: Partial<T>): IntegratedUpdateBuilder<T>;
    where(condition: string, params?: Record<string, unknown>): IntegratedUpdateBuilder<T>;
    build(): {
        query: string;
        params: Record<string, unknown>;
    };
    execute(): Effect.Effect<UpdateResult<T>, Error>;
}
declare class IntegratedDeleteBuilder {
    private table;
    private db;
    private whereCondition?;
    private whereParams;
    constructor(table: SurrealTable, db: SurrealTyped);
    where(condition: string, params?: Record<string, unknown>): IntegratedDeleteBuilder;
    build(): {
        query: string;
        params: Record<string, unknown>;
    };
    execute(): Effect.Effect<DeleteResult, Error>;
}
export declare const createIntegratedQueryBuilder: <T = any>(table: SurrealTable, db: SurrealTyped) => IntegratedQueryBuilder<T>;
declare const SchemaQueryService_base: any;
export declare class SchemaQueryService extends SchemaQueryService_base {
}
export {};
//# sourceMappingURL=integration.d.ts.map