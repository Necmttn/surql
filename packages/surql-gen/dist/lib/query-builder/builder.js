import { Effect } from "effect";
// Main query builder class
export class SurrealQueryBuilder {
    table;
    schema;
    constructor(table) {
        this.table = table;
        this.schema = table.toEffectSchema();
    }
    // SELECT operations
    select() {
        return new SelectBuilder(this.table, this.schema);
    }
    selectFields(...fields) {
        return new SelectBuilder(this.table, this.schema, fields);
    }
    // INSERT operations
    insert() {
        return new InsertBuilder(this.table, this.schema);
    }
    // UPDATE operations
    update() {
        return new UpdateBuilder(this.table, this.schema);
    }
    // DELETE operations
    delete() {
        return new DeleteBuilder(this.table);
    }
    // Utility methods
    getTableName() {
        return this.table.getName();
    }
    getSchema() {
        return this.schema;
    }
    getTable() {
        return this.table;
    }
}
// SELECT query builder implementation
class SelectBuilder {
    table;
    schema;
    fields;
    whereCondition;
    whereParams = {};
    orderByField;
    orderByDirection = "ASC";
    limitCount;
    offsetCount;
    constructor(table, schema, fields) {
        this.table = table;
        this.schema = schema;
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
    execute() {
        return Effect.gen(() => {
            // This would integrate with the SurrealTyped service
            const { query, params } = this.build();
            return {
                _tag: "SelectResult",
                data: [],
                query,
                params,
            };
        });
    }
}
// INSERT query builder implementation
class InsertBuilder {
    table;
    schema;
    insertData = [];
    constructor(table, schema) {
        this.table = table;
        this.schema = schema;
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
            // Single insert
            const data = this.insertData[0];
            const fields = Object.keys(data);
            const values = fields.map((field) => `$${field}`);
            const query = `INSERT INTO ${tableName} (${fields.join(", ")}) VALUES (${values.join(", ")})`;
            const params = data;
            return { query, params };
        }
        // Multiple insert
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
        return Effect.gen(() => {
            const { query, params } = this.build();
            return {
                _tag: "InsertResult",
                data: [],
                query,
                params,
            };
        });
    }
}
// UPDATE query builder implementation
class UpdateBuilder {
    table;
    schema;
    setFields = {};
    whereCondition;
    whereParams = {};
    constructor(table, schema) {
        this.table = table;
        this.schema = schema;
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
        return Effect.gen(() => {
            const { query, params } = this.build();
            return {
                _tag: "UpdateResult",
                data: [],
                query,
                params,
            };
        });
    }
}
// DELETE query builder implementation
class DeleteBuilder {
    table;
    whereCondition;
    whereParams = {};
    constructor(table) {
        this.table = table;
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
        return Effect.gen(() => {
            const { query, params } = this.build();
            return {
                _tag: "DeleteResult",
                count: 0,
                query,
                params,
            };
        });
    }
}
// Factory function to create query builders for tables
export const createQueryBuilder = (table) => {
    return new SurrealQueryBuilder(table);
};
// Utility function to create query builders from schema registry
export const createQueryBuilders = (schema) => {
    const builders = {};
    for (const table of schema.getTables()) {
        builders[table.getName()] = createQueryBuilder(table);
    }
    return builders;
};
