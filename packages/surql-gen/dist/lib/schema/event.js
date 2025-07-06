import { Schema } from "effect";
// Event timing schema
const EventTimingSchema = Schema.Literal("BEFORE", "AFTER");
// Event action schema  
const EventActionSchema = Schema.Literal("CREATE", "UPDATE", "DELETE");
/**
 * SurrealEvent as Schema.Class - self-validating event definitions
 *
 * This class provides:
 * - Built-in validation via Schema.Class
 * - Automatic encoding/decoding
 * - Fluent API for event configuration
 * - SurrealQL generation
 * - Migration support
 */
export class SurrealEvent extends Schema.Class("SurrealEvent")({
    name: Schema.String.pipe(Schema.minLength(1)),
    table: Schema.String.pipe(Schema.minLength(1)),
    when: EventTimingSchema,
    action: EventActionSchema,
    condition: Schema.optional(Schema.String),
    then: Schema.String.pipe(Schema.minLength(1)),
    description: Schema.optional(Schema.String)
}) {
    // Built-in validation methods from Schema.Class
    static validate = Schema.decodeUnknownSync(this);
    static parse = Schema.decodeUnknownSync(this);
    static safeParse = Schema.decodeUnknownOption(this);
    // Built-in encoding/decoding
    static encode = Schema.encodeSync(this);
    static decode = Schema.decodeSync(this);
    // Static factory methods with automatic validation
    static create(name, table, when, action, then) {
        return this.parse({
            name,
            table,
            when,
            action,
            then
        });
    }
    static onCreate(name, table, then) {
        return this.create(name, table, "AFTER", "CREATE", then);
    }
    static onUpdate(name, table, then) {
        return this.create(name, table, "AFTER", "UPDATE", then);
    }
    static onDelete(name, table, then) {
        return this.create(name, table, "AFTER", "DELETE", then);
    }
    static beforeCreate(name, table, then) {
        return this.create(name, table, "BEFORE", "CREATE", then);
    }
    static beforeUpdate(name, table, then) {
        return this.create(name, table, "BEFORE", "UPDATE", then);
    }
    static beforeDelete(name, table, then) {
        return this.create(name, table, "BEFORE", "DELETE", then);
    }
    // Fluent API methods that return validated instances
    withCondition(condition) {
        return SurrealEvent.parse({
            ...this,
            condition
        });
    }
    withDescription(description) {
        return SurrealEvent.parse({
            ...this,
            description
        });
    }
    withThen(then) {
        return SurrealEvent.parse({
            ...this,
            then
        });
    }
    // Helper methods
    getName() {
        return this.name;
    }
    getTable() {
        return this.table;
    }
    getTiming() {
        return this.when;
    }
    getAction() {
        return this.action;
    }
    getCondition() {
        return this.condition;
    }
    getThen() {
        return this.then;
    }
    getDescription() {
        return this.description;
    }
    // Generate SurrealQL event definition
    toSurrealQL() {
        let sql = `DEFINE EVENT ${this.name} ON TABLE ${this.table} WHEN ${this.when} ${this.action}`;
        if (this.condition) {
            sql += ` WHERE ${this.condition}`;
        }
        sql += ` THEN ${this.then}`;
        if (this.description) {
            sql += ` COMMENT '${this.description}'`;
        }
        return sql + ";";
    }
    // Parse SurrealQL to create event (basic parser)
    static fromSurrealQL(sql) {
        const trimmed = sql.trim().replace(/;$/, "");
        // Match: DEFINE EVENT name ON TABLE table WHEN timing action [WHERE condition] THEN statement [COMMENT 'description']
        const match = trimmed.match(/^DEFINE EVENT\s+(\w+)\s+ON\s+TABLE\s+(\w+)\s+WHEN\s+(BEFORE|AFTER)\s+(CREATE|UPDATE|DELETE)(?:\s+WHERE\s+(.+?))?(?:\s+THEN\s+(.+?))?(?:\s+COMMENT\s+'([^']*)')?$/i);
        if (!match) {
            throw new Error(`Invalid event definition: ${sql}`);
        }
        const [, name, table, when, action, condition, then, description] = match;
        return this.parse({
            name,
            table,
            when: when.toUpperCase(),
            action: action.toUpperCase(),
            condition: condition?.trim(),
            then: then?.trim() || "",
            description: description?.trim()
        });
    }
    // Generate migration operations
    static diff(oldEvent, newEvent) {
        const operations = [];
        // If name changed, it's a drop + create
        if (oldEvent.name !== newEvent.name) {
            operations.push(`REMOVE EVENT ${oldEvent.name} ON ${oldEvent.table};`);
            operations.push(newEvent.toSurrealQL());
            return operations;
        }
        // If table changed, it's a drop + create
        if (oldEvent.table !== newEvent.table) {
            operations.push(`REMOVE EVENT ${oldEvent.name} ON ${oldEvent.table};`);
            operations.push(newEvent.toSurrealQL());
            return operations;
        }
        // If any other property changed, replace the event
        if (oldEvent.when !== newEvent.when ||
            oldEvent.action !== newEvent.action ||
            oldEvent.condition !== newEvent.condition ||
            oldEvent.then !== newEvent.then ||
            oldEvent.description !== newEvent.description) {
            operations.push(`REMOVE EVENT ${oldEvent.name} ON ${oldEvent.table};`);
            operations.push(newEvent.toSurrealQL());
        }
        return operations;
    }
}
