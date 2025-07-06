import { Data } from "effect";
// SurrealDB event definition using Data.taggedClass
export class SurrealEventDefinition extends Data.TaggedClass("SurrealEventDefinition") {
}
// Improved SurrealEvent using Data.taggedClass
export class SurrealEvent extends Data.TaggedClass("SurrealEvent") {
    // Static factory methods
    static create(name, table, type, then) {
        return new SurrealEvent({
            definition: new SurrealEventDefinition({
                name,
                table,
                type,
                then,
            }),
        });
    }
    static onCreate(name, table, then) {
        return new SurrealEvent({
            definition: new SurrealEventDefinition({
                name,
                table,
                type: "CREATE",
                then,
            }),
        });
    }
    static onUpdate(name, table, then) {
        return new SurrealEvent({
            definition: new SurrealEventDefinition({
                name,
                table,
                type: "UPDATE",
                then,
            }),
        });
    }
    static onDelete(name, table, then) {
        return new SurrealEvent({
            definition: new SurrealEventDefinition({
                name,
                table,
                type: "DELETE",
                then,
            }),
        });
    }
    // Fluent API methods - all return new instances due to immutability
    condition(condition) {
        return new SurrealEvent({
            definition: new SurrealEventDefinition({
                ...this.definition,
                condition,
            }),
        });
    }
    description(desc) {
        return new SurrealEvent({
            definition: new SurrealEventDefinition({
                ...this.definition,
                description: desc,
            }),
        });
    }
    drop() {
        return new SurrealEvent({
            definition: new SurrealEventDefinition({
                ...this.definition,
                drop: true,
            }),
        });
    }
    // Helper methods
    getName() {
        return this.definition.name;
    }
    getTable() {
        return this.definition.table;
    }
    getType() {
        return this.definition.type;
    }
    getCondition() {
        return this.definition.condition;
    }
    getThen() {
        return this.definition.then;
    }
    getDescription() {
        return this.definition.description;
    }
    isDrop() {
        return this.definition.drop ?? false;
    }
    // Generate SurrealQL event definition
    toSurrealQL() {
        if (this.definition.drop) {
            return `REMOVE EVENT ${this.definition.name} ON ${this.definition.table}`;
        }
        const parts = [];
        parts.push(`DEFINE EVENT ${this.definition.name} ON ${this.definition.table}`);
        parts.push(`WHEN ${this.definition.type}`);
        if (this.definition.condition) {
            parts.push(`WHERE ${this.definition.condition}`);
        }
        parts.push(`THEN ${this.definition.then}`);
        if (this.definition.description) {
            parts.push(`COMMENT "${this.definition.description}"`);
        }
        return parts.join(" ");
    }
}
