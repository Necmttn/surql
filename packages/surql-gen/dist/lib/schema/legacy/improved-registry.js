import { Data, Effect, Equal } from "effect";
// Schema metadata using Data.taggedClass
export class SurrealSchemaMetadata extends Data.TaggedClass("SurrealSchemaMetadata") {
}
// Schema registry definition using Data.taggedClass
export class SurrealSchemaRegistry extends Data.TaggedClass("SurrealSchemaRegistry") {
}
// Improved schema registry class using Data.taggedClass
export class SurrealSchema extends Data.TaggedClass("SurrealSchema") {
    // Static factory methods
    static create(name, version = "1.0.0") {
        return new SurrealSchema({
            registry: new SurrealSchemaRegistry({
                name,
                version,
                tables: new Map(),
                indexes: new Map(),
                events: new Map(),
            }),
        });
    }
    static fromTables(name, tables, version = "1.0.0") {
        const schema = new SurrealSchema({
            registry: new SurrealSchemaRegistry({
                name,
                version,
                tables: new Map(),
                indexes: new Map(),
                events: new Map(),
            }),
        });
        return schema.addTables(...tables);
    }
    // Fluent API methods - all return new instances due to immutability
    description(desc) {
        const currentMetadata = this.registry.metadata ?? new SurrealSchemaMetadata({});
        const newMetadata = new SurrealSchemaMetadata({
            ...currentMetadata,
            description: desc,
            updatedAt: new Date(),
        });
        return new SurrealSchema({
            registry: new SurrealSchemaRegistry({
                ...this.registry,
                metadata: newMetadata,
            }),
        });
    }
    author(author) {
        const currentMetadata = this.registry.metadata ?? new SurrealSchemaMetadata({});
        const newMetadata = new SurrealSchemaMetadata({
            ...currentMetadata,
            author,
            updatedAt: new Date(),
        });
        return new SurrealSchema({
            registry: new SurrealSchemaRegistry({
                ...this.registry,
                metadata: newMetadata,
            }),
        });
    }
    version(version) {
        return new SurrealSchema({
            registry: new SurrealSchemaRegistry({
                ...this.registry,
                version,
            }),
        });
    }
    // Table management
    addTable(table) {
        const newTables = new Map(this.registry.tables);
        newTables.set(table.getName(), table);
        return new SurrealSchema({
            registry: new SurrealSchemaRegistry({
                ...this.registry,
                tables: newTables,
            }),
        });
    }
    addTables(...tables) {
        let result = this;
        for (const table of tables) {
            result = result.addTable(table);
        }
        return result;
    }
    removeTable(tableName) {
        const newTables = new Map(this.registry.tables);
        newTables.delete(tableName);
        return new SurrealSchema({
            registry: new SurrealSchemaRegistry({
                ...this.registry,
                tables: newTables,
            }),
        });
    }
    updateTable(tableName, updater) {
        const table = this.registry.tables.get(tableName);
        if (!table) {
            throw new Error(`Table ${tableName} not found`);
        }
        const updatedTable = updater(table);
        return this.addTable(updatedTable);
    }
    // Index management
    addIndex(index) {
        const newIndexes = new Map(this.registry.indexes);
        newIndexes.set(index.getName(), index);
        return new SurrealSchema({
            registry: new SurrealSchemaRegistry({
                ...this.registry,
                indexes: newIndexes,
            }),
        });
    }
    addIndexes(...indexes) {
        let result = this;
        for (const index of indexes) {
            result = result.addIndex(index);
        }
        return result;
    }
    removeIndex(indexName) {
        const newIndexes = new Map(this.registry.indexes);
        newIndexes.delete(indexName);
        return new SurrealSchema({
            registry: new SurrealSchemaRegistry({
                ...this.registry,
                indexes: newIndexes,
            }),
        });
    }
    // Event management
    addEvent(event) {
        const newEvents = new Map(this.registry.events);
        newEvents.set(event.getName(), event);
        return new SurrealSchema({
            registry: new SurrealSchemaRegistry({
                ...this.registry,
                events: newEvents,
            }),
        });
    }
    addEvents(...events) {
        let result = this;
        for (const event of events) {
            result = result.addEvent(event);
        }
        return result;
    }
    removeEvent(eventName) {
        const newEvents = new Map(this.registry.events);
        newEvents.delete(eventName);
        return new SurrealSchema({
            registry: new SurrealSchemaRegistry({
                ...this.registry,
                events: newEvents,
            }),
        });
    }
    // Query methods
    getName() {
        return this.registry.name;
    }
    getVersion() {
        return this.registry.version;
    }
    getTable(name) {
        return this.registry.tables.get(name);
    }
    getTables() {
        return Array.from(this.registry.tables.values());
    }
    getTableNames() {
        return Array.from(this.registry.tables.keys());
    }
    hasTable(name) {
        return this.registry.tables.has(name);
    }
    getIndex(name) {
        return this.registry.indexes.get(name);
    }
    getIndexes() {
        return Array.from(this.registry.indexes.values());
    }
    getIndexesForTable(tableName) {
        return Array.from(this.registry.indexes.values()).filter((index) => index.getTable() === tableName);
    }
    getEvent(name) {
        return this.registry.events.get(name);
    }
    getEvents() {
        return Array.from(this.registry.events.values());
    }
    getEventsForTable(tableName) {
        return Array.from(this.registry.events.values()).filter((event) => event.getTable() === tableName);
    }
    getMetadata() {
        return this.registry.metadata;
    }
    // Schema comparison using Data.taggedClass automatic equality
    equals(other) {
        return Equal.equals(this.registry, other.registry);
    }
    // Generate outputs
    toSurrealQL() {
        const parts = [];
        // Add header comment
        if (this.registry.metadata?.description) {
            parts.push(`-- ${this.registry.metadata.description}`);
        }
        parts.push(`-- Schema: ${this.registry.name} v${this.registry.version}`);
        if (this.registry.metadata?.author) {
            parts.push(`-- Author: ${this.registry.metadata.author}`);
        }
        if (this.registry.metadata?.createdAt) {
            parts.push(`-- Created: ${this.registry.metadata.createdAt.toISOString()}`);
        }
        parts.push("");
        // Add tables
        for (const table of this.registry.tables.values()) {
            parts.push(table.toSurrealQL());
            parts.push("");
        }
        // Add indexes
        for (const index of this.registry.indexes.values()) {
            parts.push(index.toSurrealQL());
        }
        if (this.registry.indexes.size > 0) {
            parts.push("");
        }
        // Add events
        for (const event of this.registry.events.values()) {
            parts.push(event.toSurrealQL());
        }
        return parts.join("\n");
    }
    toTypeScript() {
        const parts = [];
        // Add header comment
        parts.push(`// Generated schema: ${this.registry.name} v${this.registry.version}`);
        if (this.registry.metadata?.description) {
            parts.push(`// ${this.registry.metadata.description}`);
        }
        parts.push("");
        // Add imports
        parts.push('import { Schema } from "effect";');
        parts.push('import type { RecordId } from "surrealdb";');
        parts.push("");
        // Add table types
        for (const table of this.registry.tables.values()) {
            parts.push(table.toTypeScript());
            parts.push("");
        }
        return parts.join("\n");
    }
    // Validation
    validate() {
        return Effect.gen(() => {
            const errors = [];
            // Check for table reference consistency
            for (const table of this.registry.tables.values()) {
                for (const field of table.getFields()) {
                    const ref = field.getReferences();
                    if (ref && !this.registry.tables.has(ref.table)) {
                        errors.push(`Table ${table.getName()} field ${field.getName()} references non-existent table ${ref.table}`);
                    }
                }
            }
            // Check for index table consistency
            for (const index of this.registry.indexes.values()) {
                if (!this.registry.tables.has(index.getTable())) {
                    errors.push(`Index ${index.getName()} references non-existent table ${index.getTable()}`);
                }
            }
            // Check for event table consistency
            for (const event of this.registry.events.values()) {
                if (!this.registry.tables.has(event.getTable())) {
                    errors.push(`Event ${event.getName()} references non-existent table ${event.getTable()}`);
                }
            }
            if (errors.length > 0) {
                return Effect.fail(errors.join("; "));
            }
        });
    }
}
