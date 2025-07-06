import { Effect, Schema } from "effect";
import type { SurrealSchema } from "../schema/schema";
import type { SurrealTable } from "../schema/table";
import {
  type DeleteResult,
  type InsertResult,
  type SelectResult,
  SurrealQueryBuilder,
  type UpdateResult,
} from "./builder";

// Enhanced query builder that integrates with existing SurrealTyped service
export class IntegratedQueryBuilder<T = any> extends SurrealQueryBuilder<T> {
  private db: SurrealTyped;

  constructor(table: SurrealTable, db: SurrealTyped) {
    super(table);
    this.db = db;
  }

  // Override the select method to return an integrated builder
  select(): IntegratedSelectBuilder<T> {
    return new IntegratedSelectBuilder<T>(
      this.getTable(),
      this.getSchema(),
      this.db,
    );
  }

  selectFields(...fields: string[]): IntegratedSelectBuilder<Partial<T>> {
    return new IntegratedSelectBuilder<Partial<T>>(
      this.getTable(),
      this.getSchema(),
      this.db,
      fields,
    );
  }

  // Override insert method
  insert(): IntegratedInsertBuilder<T> {
    return new IntegratedInsertBuilder<T>(
      this.getTable(),
      this.getSchema(),
      this.db,
    );
  }

  // Override update method
  update(): IntegratedUpdateBuilder<T> {
    return new IntegratedUpdateBuilder<T>(
      this.getTable(),
      this.getSchema(),
      this.db,
    );
  }

  // Override delete method
  delete(): IntegratedDeleteBuilder {
    return new IntegratedDeleteBuilder(this.getTable(), this.db);
  }
}

// Integrated SELECT builder
class IntegratedSelectBuilder<T> {
  private table: SurrealTable;
  private schema: Schema.Schema<T>;
  private db: SurrealTyped;
  private fields?: readonly string[];
  private whereCondition?: string;
  private whereParams: Record<string, unknown> = {};
  private orderByField?: string;
  private orderByDirection: "ASC" | "DESC" = "ASC";
  private limitCount?: number;
  private offsetCount?: number;

  constructor(
    table: SurrealTable,
    schema: Schema.Schema<T>,
    db: SurrealTyped,
    fields?: readonly string[],
  ) {
    this.table = table;
    this.schema = schema;
    this.db = db;
    this.fields = fields;
  }

  where(
    condition: string,
    params: Record<string, unknown> = {},
  ): IntegratedSelectBuilder<T> {
    this.whereCondition = condition;
    this.whereParams = { ...this.whereParams, ...params };
    return this;
  }

  orderBy(
    field: string,
    direction: "ASC" | "DESC" = "ASC",
  ): IntegratedSelectBuilder<T> {
    this.orderByField = field;
    this.orderByDirection = direction;
    return this;
  }

  limit(count: number): IntegratedSelectBuilder<T> {
    this.limitCount = count;
    return this;
  }

  offset(count: number): IntegratedSelectBuilder<T> {
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

  // Execute with actual SurrealTyped integration
  execute(): Effect.Effect<SelectResult<T>, Error> {
    return Effect.gen(
      function* (_) {
        const { query, params } = this.build();

        const [result] = yield* this.db
          .query(query, params)
          .decode([Schema.Array(this.schema)]);

        return {
          _tag: "SelectResult" as const,
          data: result,
          query,
          params,
        };
      }.bind(this),
    );
  }

  // Execute and return first result
  executeFirst(): Effect.Effect<T | null, Error> {
    return Effect.gen(function* (_) {
      const result = yield* this.execute();
      return result.data[0] ?? null;
    });
  }

  // Execute and expect exactly one result
  executeOne(): Effect.Effect<T, Error> {
    return Effect.gen(function* (_) {
      const result = yield* this.execute();

      if (result.data.length === 0) {
        return yield* Effect.fail(new Error("No records found"));
      }

      if (result.data.length > 1) {
        return yield* Effect.fail(
          new Error("Multiple records found, expected one"),
        );
      }

      return result.data[0];
    });
  }
}

// Integrated INSERT builder
class IntegratedInsertBuilder<T> {
  private table: SurrealTable;
  private schema: Schema.Schema<T>;
  private db: SurrealTyped;
  private insertData: readonly Partial<T>[] = [];

  constructor(table: SurrealTable, schema: Schema.Schema<T>, db: SurrealTyped) {
    this.table = table;
    this.schema = schema;
    this.db = db;
  }

  values(data: Partial<T>): IntegratedInsertBuilder<T> {
    this.insertData = [data];
    return this;
  }

  valuesMany(data: readonly Partial<T>[]): IntegratedInsertBuilder<T> {
    this.insertData = data;
    return this;
  }

  build(): { query: string; params: Record<string, unknown> } {
    const tableName = this.table.getName();

    if (this.insertData.length === 0) {
      throw new Error("No data provided for insert");
    }

    if (this.insertData.length === 1) {
      const data = this.insertData[0];
      const fields = Object.keys(data);
      const values = fields.map((field) => `$${field}`);

      const query = `INSERT INTO ${tableName} (${fields.join(", ")}) VALUES (${values.join(", ")})`;
      const params = data as Record<string, unknown>;

      return { query, params };
    }
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
    return Effect.gen(
      function* (_) {
        const { query, params } = this.build();

        const [result] = yield* this.db
          .query(query, params)
          .decode([Schema.Array(this.schema)]);

        return {
          _tag: "InsertResult" as const,
          data: result,
          query,
          params,
        };
      }.bind(this),
    );
  }
}

// Integrated UPDATE builder
class IntegratedUpdateBuilder<T> {
  private table: SurrealTable;
  private schema: Schema.Schema<T>;
  private db: SurrealTyped;
  private setFields: Record<string, unknown> = {};
  private whereCondition?: string;
  private whereParams: Record<string, unknown> = {};

  constructor(table: SurrealTable, schema: Schema.Schema<T>, db: SurrealTyped) {
    this.table = table;
    this.schema = schema;
    this.db = db;
  }

  set(field: keyof T, value: any): IntegratedUpdateBuilder<T> {
    this.setFields[field as string] = value;
    return this;
  }

  setMany(data: Partial<T>): IntegratedUpdateBuilder<T> {
    this.setFields = { ...this.setFields, ...data };
    return this;
  }

  where(
    condition: string,
    params: Record<string, unknown> = {},
  ): IntegratedUpdateBuilder<T> {
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
    return Effect.gen(
      function* (_) {
        const { query, params } = this.build();

        const [result] = yield* this.db
          .query(query, params)
          .decode([Schema.Array(this.schema)]);

        return {
          _tag: "UpdateResult" as const,
          data: result,
          query,
          params,
        };
      }.bind(this),
    );
  }
}

// Integrated DELETE builder
class IntegratedDeleteBuilder {
  private table: SurrealTable;
  private db: SurrealTyped;
  private whereCondition?: string;
  private whereParams: Record<string, unknown> = {};

  constructor(table: SurrealTable, db: SurrealTyped) {
    this.table = table;
    this.db = db;
  }

  where(
    condition: string,
    params: Record<string, unknown> = {},
  ): IntegratedDeleteBuilder {
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
    return Effect.gen(
      function* (_) {
        const { query, params } = this.build();

        // For delete, we just need to know how many records were affected
        yield* this.db.query(query, params).raw();

        // Note: SurrealDB doesn't return count for DELETE operations directly
        // You'd need to count before deleting or use a different approach
        return {
          _tag: "DeleteResult" as const,
          count: 0, // This would need to be implemented properly
          query,
          params,
        };
      }.bind(this),
    );
  }
}

// Factory functions that integrate with SurrealTyped
export const createIntegratedQueryBuilder = <T = any>(
  table: SurrealTable,
  db: SurrealTyped,
): IntegratedQueryBuilder<T> => {
  return new IntegratedQueryBuilder<T>(table, db);
};

// Service that provides query builders for all tables in a schema
export class SchemaQueryService extends Effect.Service<SchemaQueryService>()(
  "SchemaQueryService",
  {
    effect: Effect.gen(function* (_) {
      const db = yield* SurrealTyped;

      const createQueryBuildersForSchema = (schema: SurrealSchema) => {
        const builders: Record<string, IntegratedQueryBuilder> = {};

        for (const table of schema.getTables()) {
          builders[table.getName()] = createIntegratedQueryBuilder(table, db);
        }

        return builders;
      };

      const getQueryBuilder = <T = any>(
        table: SurrealTable,
      ): IntegratedQueryBuilder<T> => {
        return createIntegratedQueryBuilder<T>(table, db);
      };

      return {
        createQueryBuildersForSchema,
        getQueryBuilder,
      };
    }),
    dependencies: [SurrealTyped.Default],
  },
) {}
