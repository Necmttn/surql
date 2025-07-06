import { Schema } from "effect";
import { SurrealTable } from "./table";
import { SurrealEvent } from "./event";
import { SurrealIndex } from "./index-def";
// Schema metadata schema
const SchemaMetadataSchema = Schema.Struct({
    description: Schema.optional(Schema.String),
    author: Schema.optional(Schema.String),
    createdAt: Schema.optional(Schema.DateFromSelf),
    updatedAt: Schema.optional(Schema.DateFromSelf),
    tags: Schema.optional(Schema.Array(Schema.String)),
    version_info: Schema.optional(Schema.Unknown)
});
/**
 * SurrealSchema as Schema.Class - batteries included schema registry
 *
 * This class provides:
 * - Built-in validation via Schema.Class
 * - Automatic encoding/decoding
 * - Schema-wide operations (migrations, comparisons)
 * - Complete code generation pipeline
 * - Database introspection integration
 */
export class SurrealSchema extends Schema.Class("SurrealSchema")({
    name: Schema.String.pipe(Schema.minLength(1)),
    version: Schema.String.pipe(Schema.minLength(1)),
    description: Schema.optional(Schema.String),
    tables: Schema.Array(SurrealTable),
    indexes: Schema.optional(Schema.Array(SurrealIndex)),
    events: Schema.optional(Schema.Array(SurrealEvent)),
    metadata: Schema.optional(SchemaMetadataSchema)
}) {
    // Built-in validation methods from Schema.Class
    static validate = Schema.decodeUnknownSync(this);
    static parse = Schema.decodeUnknownSync(this);
    static safeParse = Schema.decodeUnknownOption(this);
    // Built-in encoding/decoding
    static encode = Schema.encodeSync(this);
    static decode = Schema.decodeSync(this);
    // Static factory methods with automatic validation
    static create(name, version = "1.0.0") {
        return this.parse({
            name,
            version,
            tables: []
        });
    }
    static fromTables(name, tables, version = "1.0.0") {
        return this.parse({
            name,
            version,
            tables: [...tables]
        });
    }
    // Fluent API methods that return validated instances
    withDescription(desc) {
        return SurrealSchema.parse({
            ...this,
            description: desc
        });
    }
    withMetadata(metadata) {
        return SurrealSchema.parse({
            ...this,
            metadata
        });
    }
    withVersion(version) {
        return SurrealSchema.parse({
            ...this,
            version
        });
    }
    // Table management
    addTable(table) {
        return SurrealSchema.parse({
            ...this,
            tables: [...this.tables, table]
        });
    }
    addTables(...tables) {
        return SurrealSchema.parse({
            ...this,
            tables: [...this.tables, ...tables]
        });
    }
    removeTable(tableName) {
        return SurrealSchema.parse({
            ...this,
            tables: this.tables.filter(t => t.name !== tableName)
        });
    }
    updateTable(tableName, updater) {
        return SurrealSchema.parse({
            ...this,
            tables: this.tables.map(t => t.name === tableName ? updater(t) : t)
        });
    }
    replaceTable(tableName, newTable) {
        return SurrealSchema.parse({
            ...this,
            tables: this.tables.map(t => t.name === tableName ? newTable : t)
        });
    }
    // Index management
    addIndex(index) {
        const existingIndexes = this.indexes ?? [];
        return SurrealSchema.parse({
            ...this,
            indexes: [...existingIndexes, index]
        });
    }
    removeIndex(indexName) {
        const existingIndexes = this.indexes ?? [];
        return SurrealSchema.parse({
            ...this,
            indexes: existingIndexes.filter(i => i.name !== indexName)
        });
    }
    // Event management
    addEvent(event) {
        const existingEvents = this.events ?? [];
        return SurrealSchema.parse({
            ...this,
            events: [...existingEvents, event]
        });
    }
    removeEvent(eventName) {
        const existingEvents = this.events ?? [];
        return SurrealSchema.parse({
            ...this,
            events: existingEvents.filter(e => e.name !== eventName)
        });
    }
    // Helper methods
    getName() {
        return this.name;
    }
    getVersion() {
        return this.version;
    }
    getDescription() {
        return this.description;
    }
    getTables() {
        return this.tables;
    }
    getTable(name) {
        return this.tables.find(t => t.name === name);
    }
    hasTable(name) {
        return this.tables.some(t => t.name === name);
    }
    getTableNames() {
        return this.tables.map(t => t.name);
    }
    getIndexes() {
        return this.indexes ?? [];
    }
    getEvents() {
        return this.events ?? [];
    }
    getMetadata() {
        return this.metadata;
    }
    // Schema statistics
    getTableCount() {
        return this.tables.length;
    }
    getFieldCount() {
        return this.tables.reduce((total, table) => total + table.fields.length, 0);
    }
    getIndexCount() {
        return (this.indexes?.length ?? 0);
    }
    getEventCount() {
        return (this.events?.length ?? 0);
    }
    // Schema validation
    validateSchema() {
        const errors = [];
        // Check for duplicate table names
        const tableNames = this.tables.map(t => t.name);
        const duplicateTableNames = tableNames.filter((name, index) => tableNames.indexOf(name) !== index);
        if (duplicateTableNames.length > 0) {
            errors.push(`Duplicate table names: ${duplicateTableNames.join(", ")}`);
        }
        // Check for invalid table references in record fields
        for (const table of this.tables) {
            for (const field of table.fields) {
                if (field.type === "record" && field.references?.table) {
                    const referencedTable = field.references.table;
                    if (!this.hasTable(referencedTable)) {
                        errors.push(`Table '${table.name}' field '${field.name}' references non-existent table '${referencedTable}'`);
                    }
                }
            }
        }
        // Check for invalid index table references
        for (const index of this.getIndexes()) {
            if (!this.hasTable(index.table)) {
                errors.push(`Index '${index.name}' references non-existent table '${index.table}'`);
            }
            else {
                const table = this.getTable(index.table);
                for (const fieldName of index.fields) {
                    if (!table.hasField(fieldName)) {
                        errors.push(`Index '${index.name}' references non-existent field '${fieldName}' in table '${index.table}'`);
                    }
                }
            }
        }
        // Check for invalid event table references
        for (const event of this.getEvents()) {
            if (!this.hasTable(event.table)) {
                errors.push(`Event '${event.name}' references non-existent table '${event.table}'`);
            }
        }
        return errors;
    }
    // Generate complete SurrealQL schema
    toSurrealQL() {
        let sql = `-- Schema: ${this.name} v${this.version}\n`;
        if (this.description) {
            sql += `-- ${this.description}\n`;
        }
        sql += "\n";
        // Generate table definitions
        for (const table of this.tables) {
            sql += table.toSurrealQL() + "\n\n";
        }
        // Generate index definitions
        for (const index of this.getIndexes()) {
            sql += `DEFINE INDEX ${index.name} ON ${index.table} FIELDS ${index.fields.join(", ")}`;
            if (index.unique)
                sql += " UNIQUE";
            if (index.fulltext)
                sql += " SEARCH ANALYZER ascii BM25";
            sql += ";\n";
        }
        if (this.getIndexes().length > 0) {
            sql += "\n";
        }
        // Generate event definitions
        for (const event of this.getEvents()) {
            sql += `DEFINE EVENT ${event.name} ON TABLE ${event.table} WHEN ${event.when} ${event.action}`;
            if (event.condition)
                sql += ` WHERE ${event.condition}`;
            sql += ` THEN ${event.then};\n`;
        }
        return sql.trim();
    }
    // Generate TypeScript interfaces
    toTypeScript() {
        let ts = `// Generated schema: ${this.name} v${this.version}\n`;
        if (this.description) {
            ts += `// ${this.description}\n`;
        }
        ts += '\nimport { Schema } from "effect";\n';
        ts += 'import type { RecordId } from "surrealdb";\n\n';
        // Generate recordId helper function
        ts += 'export const recordId = <T extends string>(tableName: T) => Schema.String as Schema.Schema<`${T}:${string}`>;\n\n';
        // Generate interfaces for each table
        for (const table of this.tables) {
            ts += table.toTypeScriptInterface() + "\n\n";
        }
        return ts.trim();
    }
    // Generate Effect Schema classes
    toEffectSchemaClasses() {
        let code = `// Generated Effect Schema classes: ${this.name} v${this.version}\n`;
        if (this.description) {
            code += `// ${this.description}\n`;
        }
        code += '\nimport { Schema } from "effect";\n';
        code += 'import type { RecordId, StringRecordId } from "surrealdb";\n\n';
        // Generate helper functions first
        code += `export const stringRecordIdSchema = <T extends string>(tableName: T) =>
  Schema.transform(
    recordIdLiteral(tableName),
    Schema.instanceOf(StringRecordId),
    {
      strict: true,
      decode: (from: \`\${T}:\${string}\`) => new StringRecordId(from),
      encode: (to) => to.toString() as \`\${T}:\${string}\`,
    }
  );

export const recordIdSchema = <T extends string>(tableName: T) =>
  Schema.transform(recordIdLiteral(tableName), Schema.instanceOf(RecordId), {
    strict: true,
    decode: (from: \`\${T}:\${string}\`) => {
      const [table, id] = from.split(":");
      if (!table || !id) {
        throw new Error(\`Invalid RecordId: \${from}\`);
      }
      return new RecordId(table, id);
    },
    encode: (to) => to.toString() as \`\${T}:\${string}\`,
  });

export const recordIdLiteral = <T extends string>(tableName: T) =>
  Schema.TemplateLiteral(
    Schema.Literal(tableName),
    Schema.Literal(":"),
    Schema.String,
  );

export function recordId<T extends string>(tableName: T) {
  return Schema.Union(
    recordIdSchema(tableName),
    stringRecordIdSchema(tableName),
  );
}

`;
        // Generate Effect Schema classes for each table
        for (const table of this.tables) {
            code += table.toEffectSchemaClass() + "\n\n";
        }
        // Generate schema metadata
        code += `// Schema metadata\nexport const SchemaMetadata = {\n`;
        code += `  name: "${this.name}",\n`;
        code += `  version: "${this.version}",\n`;
        if (this.description) {
            code += `  description: "${this.description}",\n`;
        }
        code += `  tables: {\n`;
        for (const table of this.tables) {
            const className = table.name.charAt(0).toUpperCase() + table.name.slice(1);
            code += `    ${table.name}: ${className}.aiHints,\n`;
        }
        code += `  },\n`;
        code += `  tableCount: ${this.getTableCount()},\n`;
        code += `  fieldCount: ${this.getFieldCount()},\n`;
        code += `  indexCount: ${this.getIndexCount()},\n`;
        code += `  eventCount: ${this.getEventCount()}\n`;
        code += `} as const;\n`;
        return code;
    }
    // Parse SurrealQL to create schema (for database introspection)
    static fromSurrealQL(sql) {
        // Basic parser - can be enhanced
        const lines = sql.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        let name = "imported-schema";
        let version = "1.0.0";
        let description;
        const tables = [];
        // Parse schema metadata from comments
        for (const line of lines) {
            if (line.startsWith('-- Schema:')) {
                const match = line.match(/-- Schema:\s*([^\s]+)\s*v?(.+)?/);
                if (match) {
                    name = match[1];
                    if (match[2])
                        version = match[2].trim();
                }
            }
            else if (line.startsWith('--') && !line.includes('Schema:')) {
                description = line.substring(2).trim();
            }
        }
        // Parse table definitions (simplified)
        const tableDefinitions = sql.split(/(?=DEFINE TABLE)/g)
            .filter(def => def.trim().startsWith('DEFINE TABLE'));
        for (const tableDef of tableDefinitions) {
            try {
                const table = SurrealTable.fromSurrealQL(tableDef.trim());
                tables.push(table);
            }
            catch (error) {
                console.warn(`Failed to parse table definition: ${error}`);
            }
        }
        return this.parse({
            name,
            version,
            description,
            tables
        });
    }
    // Generate migration between schema versions
    static generateMigration(from, to) {
        const operations = [];
        // Table-level changes
        const fromTableMap = new Map(from.tables.map(t => [t.name, t]));
        const toTableMap = new Map(to.tables.map(t => [t.name, t]));
        // Removed tables
        for (const [tableName, oldTable] of fromTableMap) {
            if (!toTableMap.has(tableName)) {
                operations.push(`DROP TABLE ${tableName};`);
            }
        }
        // Added or modified tables
        for (const [tableName, newTable] of toTableMap) {
            const oldTable = fromTableMap.get(tableName);
            if (!oldTable) {
                // New table
                operations.push(newTable.toSurrealQL());
            }
            else {
                // Modified table
                const tableDiff = SurrealTable.diff(oldTable, newTable);
                operations.push(...tableDiff);
            }
        }
        // Index changes (simplified)
        const fromIndexes = from.getIndexes();
        const toIndexes = to.getIndexes();
        // Compare indexes by name
        const fromIndexMap = new Map(fromIndexes.map(i => [i.name, i]));
        const toIndexMap = new Map(toIndexes.map(i => [i.name, i]));
        // Removed indexes
        for (const [indexName] of fromIndexMap) {
            if (!toIndexMap.has(indexName)) {
                operations.push(`DROP INDEX ${indexName};`);
            }
        }
        // Added indexes
        for (const [indexName, index] of toIndexMap) {
            if (!fromIndexMap.has(indexName)) {
                let sql = `DEFINE INDEX ${index.name} ON ${index.table} FIELDS ${index.fields.join(", ")}`;
                if (index.unique)
                    sql += " UNIQUE";
                if (index.fulltext)
                    sql += " SEARCH ANALYZER ascii BM25";
                operations.push(sql + ";");
            }
        }
        return operations;
    }
    // Schema comparison
    static compare(schema1, schema2) {
        const result = {
            added: [],
            removed: [],
            modified: [],
            unchanged: []
        };
        const schema1Tables = new Map(schema1.tables.map(t => [t.name, t]));
        const schema2Tables = new Map(schema2.tables.map(t => [t.name, t]));
        // Check tables in schema1
        for (const [tableName, table1] of schema1Tables) {
            const table2 = schema2Tables.get(tableName);
            if (!table2) {
                result.removed.push(`table:${tableName}`);
            }
            else {
                const diff = SurrealTable.diff(table1, table2);
                if (diff.length > 0) {
                    result.modified.push(`table:${tableName}`);
                }
                else {
                    result.unchanged.push(`table:${tableName}`);
                }
            }
        }
        // Check tables in schema2 that are not in schema1
        for (const [tableName] of schema2Tables) {
            if (!schema1Tables.has(tableName)) {
                result.added.push(`table:${tableName}`);
            }
        }
        return result;
    }
}
