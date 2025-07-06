import { Effect, Schema } from "effect";
import { SurrealQueryBuilder, } from "./builder";
// Enhanced query builder that integrates with existing SurrealTyped service
export class IntegratedQueryBuilder extends SurrealQueryBuilder {
    db;
    constructor(table, db) {
        super(table);
        this.db = db;
    }
    // Override the select method to return an integrated builder
    select() {
        return new IntegratedSelectBuilder(this.getTable(), this.getSchema(), this.db);
    }
    selectFields(...fields) {
        return new IntegratedSelectBuilder(this.getTable(), this.getSchema(), this.db, fields);
    }
    // Override insert method
    insert() {
        return new IntegratedInsertBuilder(this.getTable(), this.getSchema(), this.db);
    }
    // Override update method
    update() {
        return new IntegratedUpdateBuilder(this.getTable(), this.getSchema(), this.db);
    }
    // Override delete method
    delete() {
        return new IntegratedDeleteBuilder(this.getTable(), this.db);
    }
}
// Integrated SELECT builder
class IntegratedSelectBuilder {
    table;
    schema;
    db;
    fields;
    whereCondition;
    whereParams = {};
    orderByField;
    orderByDirection = "ASC";
    limitCount;
    offsetCount;
    constructor(table, schema, db, fields) {
        this.table = table;
        this.schema = schema;
        this.db = db;
        this.fields = fields;
    }
    where(condition, params = {}) {
        this.whereCondition = condition;
        this.whereParams = { ...this.whereParams, ...params };
        return this;
    }
    orderBy(field, direction = "ASC") {
        this.orderByField = field;
        this.orderByDirection = direction;
        return this;
    }
    limit(count) {
        this.limitCount = count;
        return this;
    }
    offset(count) {
        this.offsetCount = count;
        return this;
    }
    build() {
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
    execute() {
        return Effect.gen(function* (_) {
            const { query, params } = this.build();
            const [result] = yield* this.db
                .query(query, params)
                .decode([Schema.Array(this.schema)]);
            return {
                _tag: "SelectResult",
                data: result,
                query,
                params,
            };
        }.bind(this));
    }
    // Execute and return first result
    executeFirst() {
        return Effect.gen(function* (_) {
            const result = yield* this.execute();
            return result.data[0] ?? null;
        });
    }
    // Execute and expect exactly one result
    executeOne() {
        return Effect.gen(function* (_) {
            const result = yield* this.execute();
            if (result.data.length === 0) {
                return yield* Effect.fail(new Error("No records found"));
            }
            if (result.data.length > 1) {
                return yield* Effect.fail(new Error("Multiple records found, expected one"));
            }
            return result.data[0];
        });
    }
}
// Integrated INSERT builder
class IntegratedInsertBuilder {
    table;
    schema;
    db;
    insertData = [];
    constructor(table, schema, db) {
        this.table = table;
        this.schema = schema;
        this.db = db;
    }
    values(data) {
        this.insertData = [data];
        return this;
    }
    valuesMany(data) {
        this.insertData = data;
        return this;
    }
    build() {
        const tableName = this.table.getName();
        if (this.insertData.length === 0) {
            throw new Error("No data provided for insert");
        }
        if (this.insertData.length === 1) {
            const data = this.insertData[0];
            const fields = Object.keys(data);
            const values = fields.map((field) => `$${field}`);
            const query = `INSERT INTO ${tableName} (${fields.join(", ")}) VALUES (${values.join(", ")})`;
            const params = data;
            return { query, params };
        }
        const allFields = new Set();
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
        const params = {};
        this.insertData.forEach((item, index) => {
            fields.forEach((field) => {
                params[`${field}_${index}`] = item[field];
            });
        });
        return { query, params };
    }
    execute() {
        return Effect.gen(function* (_) {
            const { query, params } = this.build();
            const [result] = yield* this.db
                .query(query, params)
                .decode([Schema.Array(this.schema)]);
            return {
                _tag: "InsertResult",
                data: result,
                query,
                params,
            };
        }.bind(this));
    }
}
// Integrated UPDATE builder
class IntegratedUpdateBuilder {
    table;
    schema;
    db;
    setFields = {};
    whereCondition;
    whereParams = {};
    constructor(table, schema, db) {
        this.table = table;
        this.schema = schema;
        this.db = db;
    }
    set(field, value) {
        this.setFields[field] = value;
        return this;
    }
    setMany(data) {
        this.setFields = { ...this.setFields, ...data };
        return this;
    }
    where(condition, params = {}) {
        this.whereCondition = condition;
        this.whereParams = { ...this.whereParams, ...params };
        return this;
    }
    build() {
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
        const params = { ...this.whereParams };
        Object.entries(this.setFields).forEach(([field, value]) => {
            params[`set_${field}`] = value;
        });
        return { query, params };
    }
    execute() {
        return Effect.gen(function* (_) {
            const { query, params } = this.build();
            const [result] = yield* this.db
                .query(query, params)
                .decode([Schema.Array(this.schema)]);
            return {
                _tag: "UpdateResult",
                data: result,
                query,
                params,
            };
        }.bind(this));
    }
}
// Integrated DELETE builder
class IntegratedDeleteBuilder {
    table;
    db;
    whereCondition;
    whereParams = {};
    constructor(table, db) {
        this.table = table;
        this.db = db;
    }
    where(condition, params = {}) {
        this.whereCondition = condition;
        this.whereParams = { ...this.whereParams, ...params };
        return this;
    }
    build() {
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
    execute() {
        return Effect.gen(function* (_) {
            const { query, params } = this.build();
            // For delete, we just need to know how many records were affected
            yield* this.db.query(query, params).raw();
            // Note: SurrealDB doesn't return count for DELETE operations directly
            // You'd need to count before deleting or use a different approach
            return {
                _tag: "DeleteResult",
                count: 0, // This would need to be implemented properly
                query,
                params,
            };
        }.bind(this));
    }
}
// Factory functions that integrate with SurrealTyped
export const createIntegratedQueryBuilder = (table, db) => {
    return new IntegratedQueryBuilder(table, db);
};
// Service that provides query builders for all tables in a schema
export class SchemaQueryService extends Effect.Service()("SchemaQueryService", {
    effect: Effect.gen(function* (_) {
        const db = yield* SurrealTyped;
        const createQueryBuildersForSchema = (schema) => {
            const builders = {};
            for (const table of schema.getTables()) {
                builders[table.getName()] = createIntegratedQueryBuilder(table, db);
            }
            return builders;
        };
        const getQueryBuilder = (table) => {
            return createIntegratedQueryBuilder(table, db);
        };
        return {
            createQueryBuildersForSchema,
            getQueryBuilder,
        };
    }),
    dependencies: [SurrealTyped.Default],
}) {
}
