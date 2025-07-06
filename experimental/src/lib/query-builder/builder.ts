import { Effect, type Schema } from "effect";
import type { SurrealField } from "../schema/field.ts";
import type { SurrealSchema } from "../schema/registry.ts";
import type { SurrealTable } from "../schema/table.ts";

// Type utilities for extracting table types
type TableType<T extends SurrealTable> = T extends SurrealTable
  ? { [K in keyof T["definition"]["fields"][number]["definition"]["name"]]: any }
  : never;

type FieldType<T extends SurrealField> = T extends SurrealField
  ? T["definition"]["schema"] extends Schema.Schema<infer A, any>
    ? A
    : any
  : never;

// Query result types
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

// Query builder interfaces
export interface SelectQueryBuilder<T> {
  where(condition: string, params?: Record<string, unknown>): SelectQueryBuilder<T>;
  orderBy(field: string, direction?: "ASC" | "DESC"): SelectQueryBuilder<T>;
  limit(count: number): SelectQueryBuilder<T>;
  offset(count: number): SelectQueryBuilder<T>;
  build(): { query: string; params: Record<string, unknown> };
  execute(): Effect.Effect<SelectResult<T>, Error>;
}

export interface InsertQueryBuilder<T> {
  values(data: Partial<T>): InsertQueryBuilder<T>;
  valuesMany(data: readonly Partial<T>[]): InsertQueryBuilder<T>;
  build(): { query: string; params: Record<string, unknown> };
  execute(): Effect.Effect<InsertResult<T>, Error>;
}

export interface UpdateQueryBuilder<T> {
  set(field: keyof T, value: any): UpdateQueryBuilder<T>;
  setMany(data: Partial<T>): UpdateQueryBuilder<T>;
  where(condition: string, params?: Record<string, unknown>): UpdateQueryBuilder<T>;
  build(): { query: string; params: Record<string, unknown> };
  execute(): Effect.Effect<UpdateResult<T>, Error>;
}

export interface DeleteQueryBuilder {
  where(condition: string, params?: Record<string, unknown>): DeleteQueryBuilder;
  build(): { query: string; params: Record<string, unknown> };
  execute(): Effect.Effect<DeleteResult, Error>;
}

// Main query builder class
export class SurrealQueryBuilder<T = any> {
  private table: SurrealTable;
  private schema: Schema.Schema<T>;

  constructor(table: SurrealTable) {
    this.table = table;
    this.schema = table.toEffectSchema() as Schema.Schema<T>;
  }

  // SELECT operations
  select(): SelectQueryBuilder<T> {
    return new SelectBuilder<T>(this.table, this.schema);
  }

  selectFields(...fields: string[]): SelectQueryBuilder<Partial<T>> {
    return new SelectBuilder<Partial<T>>(this.table, this.schema, fields);
  }

  // INSERT operations
  insert(): InsertQueryBuilder<T> {
    return new InsertBuilder<T>(this.table, this.schema);
  }

  // UPDATE operations
  update(): UpdateQueryBuilder<T> {
    return new UpdateBuilder<T>(this.table, this.schema);
  }

  // DELETE operations
  delete(): DeleteQueryBuilder {
    return new DeleteBuilder(this.table);
  }

  // Utility methods
  getTableName(): string {
    return this.table.getName();
  }

  getSchema(): Schema.Schema<T> {
    return this.schema;
  }

  getTable(): SurrealTable {
    return this.table;
  }
}

// SELECT query builder implementation
class SelectBuilder<T> implements SelectQueryBuilder<T> {
  private table: SurrealTable;
  private schema: Schema.Schema<T>;
  private fields?: readonly string[];
  private whereCondition?: string;
  private whereParams: Record<string, unknown> = {};
  private orderByField?: string;
  private orderByDirection: "ASC" | "DESC" = "ASC";
  private limitCount?: number;
  private offsetCount?: number;

  constructor(table: SurrealTable, schema: Schema.Schema<T>, fields?: readonly string[]) {
    this.table = table;
    this.schema = schema;
    this.fields = fields;
  }

  where(condition: string, params: Record<string, unknown> = {}): SelectQueryBuilder<T> {
    this.whereCondition = condition;
    this.whereParams = { ...this.whereParams, ...params };
    return this;
  }

  orderBy(field: string, direction: "ASC" | "DESC" = "ASC"): SelectQueryBuilder<T> {
    this.orderByField = field;
    this.orderByDirection = direction;
    return this;
  }

  limit(count: number): SelectQueryBuilder<T> {
    this.limitCount = count;
    return this;
  }

  offset(count: number): SelectQueryBuilder<T> {
    this.offsetCount = count;
    return this;
  }

  build(): { query: string; params: Record<string, unknown> } {
    const tableName = this.table.getName();
    const fieldsStr = this.fields ? this.fields.join(", ") : "*";

    let query = `SELECT ${fieldsStr} FROM ${tableName}`;

    if (this.whereCondition) {
      query += ` WHERE ${this.whereCondition}`;
    }

    if (this.orderByField) {
      query += ` ORDER BY ${this.orderByField} ${this.orderByDirection}`;
    }

    if (this.limitCount !== undefined) {
      query += ` LIMIT ${this.limitCount}`;
    }

    if (this.offsetCount !== undefined) {
      query += ` START ${this.offsetCount}`;
    }

    return {
      query,
      params: this.whereParams,
    };
  }

  execute(): Effect.Effect<SelectResult<T>, Error> {
    return Effect.gen(() => {
      // This would integrate with the SurrealTyped service
      const { query, params } = this.build();

      return {
        _tag: "SelectResult" as const,
        data: [] as readonly T[],
        query,
        params,
      };
    });
  }
}

// INSERT query builder implementation
class InsertBuilder<T> implements InsertQueryBuilder<T> {
  private table: SurrealTable;
  private schema: Schema.Schema<T>;
  private insertData: readonly Partial<T>[] = [];

  constructor(table: SurrealTable, schema: Schema.Schema<T>) {
    this.table = table;
    this.schema = schema;
  }

  values(data: Partial<T>): InsertQueryBuilder<T> {
    this.insertData = [data];
    return this;
  }

  valuesMany(data: readonly Partial<T>[]): InsertQueryBuilder<T> {
    this.insertData = data;
    return this;
  }

  build(): { query: string; params: Record<string, unknown> } {
    const tableName = this.table.getName();

    if (this.insertData.length === 0) {
      throw new Error("No data provided for insert");
    }

    if (this.insertData.length === 1) {
      // Single insert
      const data = this.insertData[0];
      const fields = Object.keys(data);
      const values = fields.map((field) => `$${field}`);

      const query = `INSERT INTO ${tableName} (${fields.join(", ")}) VALUES (${values.join(", ")})`;
      const params = data as Record<string, unknown>;

      return { query, params };
    }
    // Multiple insert
    const allFields = new Set<string>();
    for (const item of this.insertData) {
      Object.keys(item).forEach((field) => allFields.add(field));
    }

    const fields = Array.from(allFields);
    const valueGroups = this.insertData.map((_item, index) => {
      return fields.map((field) => `$${field}_${index}`);
    });

    const query = `INSERT INTO ${tableName} (${fields.join(", ")}) VALUES ${valueGroups
      .map((group) => `(${group.join(", ")})`)
      .join(", ")}`;

    const params: Record<string, unknown> = {};
    this.insertData.forEach((item, index) => {
      fields.forEach((field) => {
        params[`${field}_${index}`] = (item as any)[field];
      });
    });

    return { query, params };
  }

  execute(): Effect.Effect<InsertResult<T>, Error> {
    return Effect.gen(() => {
      const { query, params } = this.build();

      return {
        _tag: "InsertResult" as const,
        data: [] as readonly T[],
        query,
        params,
      };
    });
  }
}

// UPDATE query builder implementation
class UpdateBuilder<T> implements UpdateQueryBuilder<T> {
  private table: SurrealTable;
  private schema: Schema.Schema<T>;
  private setFields: Record<string, unknown> = {};
  private whereCondition?: string;
  private whereParams: Record<string, unknown> = {};

  constructor(table: SurrealTable, schema: Schema.Schema<T>) {
    this.table = table;
    this.schema = schema;
  }

  set(field: keyof T, value: any): UpdateQueryBuilder<T> {
    this.setFields[field as string] = value;
    return this;
  }

  setMany(data: Partial<T>): UpdateQueryBuilder<T> {
    this.setFields = { ...this.setFields, ...data };
    return this;
  }

  where(condition: string, params: Record<string, unknown> = {}): UpdateQueryBuilder<T> {
    this.whereCondition = condition;
    this.whereParams = { ...this.whereParams, ...params };
    return this;
  }

  build(): { query: string; params: Record<string, unknown> } {
    const tableName = this.table.getName();

    if (Object.keys(this.setFields).length === 0) {
      throw new Error("No fields to update");
    }

    const setClause = Object.keys(this.setFields)
      .map((field) => `${field} = $set_${field}`)
      .join(", ");

    let query = `UPDATE ${tableName} SET ${setClause}`;

    if (this.whereCondition) {
      query += ` WHERE ${this.whereCondition}`;
    }

    const params: Record<string, unknown> = { ...this.whereParams };
    Object.entries(this.setFields).forEach(([field, value]) => {
      params[`set_${field}`] = value;
    });

    return { query, params };
  }

  execute(): Effect.Effect<UpdateResult<T>, Error> {
    return Effect.gen(() => {
      const { query, params } = this.build();

      return {
        _tag: "UpdateResult" as const,
        data: [] as readonly T[],
        query,
        params,
      };
    });
  }
}

// DELETE query builder implementation
class DeleteBuilder implements DeleteQueryBuilder {
  private table: SurrealTable;
  private whereCondition?: string;
  private whereParams: Record<string, unknown> = {};

  constructor(table: SurrealTable) {
    this.table = table;
  }

  where(condition: string, params: Record<string, unknown> = {}): DeleteQueryBuilder {
    this.whereCondition = condition;
    this.whereParams = { ...this.whereParams, ...params };
    return this;
  }

  build(): { query: string; params: Record<string, unknown> } {
    const tableName = this.table.getName();

    let query = `DELETE FROM ${tableName}`;

    if (this.whereCondition) {
      query += ` WHERE ${this.whereCondition}`;
    }

    return {
      query,
      params: this.whereParams,
    };
  }

  execute(): Effect.Effect<DeleteResult, Error> {
    return Effect.gen(() => {
      const { query, params } = this.build();

      return {
        _tag: "DeleteResult" as const,
        count: 0,
        query,
        params,
      };
    });
  }
}

// Factory function to create query builders for tables
export const createQueryBuilder = <T = any>(table: SurrealTable): SurrealQueryBuilder<T> => {
  return new SurrealQueryBuilder<T>(table);
};

// Utility function to create query builders from schema registry
export const createQueryBuilders = (schema: SurrealSchema): Record<string, SurrealQueryBuilder> => {
  const builders: Record<string, SurrealQueryBuilder> = {};

  for (const table of schema.getTables()) {
    builders[table.getName()] = createQueryBuilder(table);
  }

  return builders;
};
