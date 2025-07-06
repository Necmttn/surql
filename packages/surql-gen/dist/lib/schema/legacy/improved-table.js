import { Data } from "effect";
import { AITableHints } from "../ai-metadata";
import { surrealStruct } from "./enhanced-schema";
// SurrealDB table permissions using Data.taggedClass
export class SurrealTablePermissions extends Data.TaggedClass("SurrealTablePermissions") {
}
// SurrealDB table definition using Data.taggedClass
export class SurrealTableDefinition extends Data.TaggedClass("SurrealTableDefinition") {
}
// Improved SurrealTable using Data.taggedClass
export class SurrealTable extends Data.TaggedClass("SurrealTable") {
    // Static factory methods
    static create(name, fields = []) {
        return new SurrealTable({
            definition: new SurrealTableDefinition({
                name,
                fields,
                schemafull: true,
            }),
        });
    }
    static schemaless(name, fields = []) {
        return new SurrealTable({
            definition: new SurrealTableDefinition({
                name,
                fields,
                schemafull: false,
            }),
        });
    }
    static view(name, fields, condition) {
        return new SurrealTable({
            definition: new SurrealTableDefinition({
                name,
                fields: [],
                view: {
                    fields,
                    condition,
                },
            }),
        });
    }
    // Fluent API methods - all return new instances due to immutability
    description(desc) {
        return new SurrealTable({
            definition: new SurrealTableDefinition({
                ...this.definition,
                description: desc,
            }),
        });
    }
    permissions(permissions) {
        return new SurrealTable({
            definition: new SurrealTableDefinition({
                ...this.definition,
                permissions: new SurrealTablePermissions(permissions),
            }),
        });
    }
    schemafull() {
        return new SurrealTable({
            definition: new SurrealTableDefinition({
                ...this.definition,
                schemafull: true,
            }),
        });
    }
    schemaless() {
        return new SurrealTable({
            definition: new SurrealTableDefinition({
                ...this.definition,
                schemafull: false,
            }),
        });
    }
    drop() {
        return new SurrealTable({
            definition: new SurrealTableDefinition({
                ...this.definition,
                drop: true,
            }),
        });
    }
    view(fields, condition) {
        return new SurrealTable({
            definition: new SurrealTableDefinition({
                ...this.definition,
                view: {
                    fields,
                    condition,
                },
            }),
        });
    }
    // AI metadata methods
    aiHints(hints) {
        return new SurrealTable({
            definition: new SurrealTableDefinition({
                ...this.definition,
                aiHints: new AITableHints(hints),
            }),
        });
    }
    aiPrimaryKey(field) {
        const existingHints = this.definition.aiHints || new AITableHints({});
        return this.aiHints({
            ...existingHints,
            primary_key: field,
        });
    }
    aiTemporalField(field) {
        const existingHints = this.definition.aiHints || new AITableHints({});
        return this.aiHints({
            ...existingHints,
            temporal_field: field,
        });
    }
    aiUserField(field) {
        const existingHints = this.definition.aiHints || new AITableHints({});
        return this.aiHints({
            ...existingHints,
            user_field: field,
        });
    }
    aiContentFields(fields) {
        const existingHints = this.definition.aiHints || new AITableHints({});
        return this.aiHints({
            ...existingHints,
            content_fields: fields,
        });
    }
    aiRelationships(relationships) {
        const existingHints = this.definition.aiHints || new AITableHints({});
        return this.aiHints({
            ...existingHints,
            relationships,
        });
    }
    aiCommonQueries(queries) {
        const existingHints = this.definition.aiHints || new AITableHints({});
        return this.aiHints({
            ...existingHints,
            common_queries: queries,
        });
    }
    // Field management methods
    addField(field) {
        const newFields = [...this.definition.fields, field];
        return new SurrealTable({
            definition: new SurrealTableDefinition({
                ...this.definition,
                fields: newFields,
            }),
        });
    }
    addFields(...fields) {
        const newFields = [...this.definition.fields, ...fields];
        return new SurrealTable({
            definition: new SurrealTableDefinition({
                ...this.definition,
                fields: newFields,
            }),
        });
    }
    removeField(fieldName) {
        const newFields = this.definition.fields.filter((f) => f.definition.name !== fieldName);
        return new SurrealTable({
            definition: new SurrealTableDefinition({
                ...this.definition,
                fields: newFields,
            }),
        });
    }
    updateField(fieldName, updater) {
        const newFields = this.definition.fields.map((f) => f.definition.name === fieldName ? updater(f) : f);
        return new SurrealTable({
            definition: new SurrealTableDefinition({
                ...this.definition,
                fields: newFields,
            }),
        });
    }
    // Helper methods
    getName() {
        return this.definition.name;
    }
    getFields() {
        return this.definition.fields;
    }
    getField(name) {
        return this.definition.fields.find((f) => f.definition.name === name);
    }
    hasField(name) {
        return this.definition.fields.some((f) => f.definition.name === name);
    }
    getIdField() {
        return this.definition.fields.find((f) => f.definition.isId);
    }
    getPermissions() {
        return this.definition.permissions;
    }
    getDescription() {
        return this.definition.description;
    }
    isSchemafull() {
        return this.definition.schemafull ?? true;
    }
    isView() {
        return this.definition.view !== undefined;
    }
    isDrop() {
        return this.definition.drop ?? false;
    }
    // Generate Effect.Schema from table definition
    toEffectSchema() {
        const fieldSchemas = {};
        for (const field of this.definition.fields) {
            fieldSchemas[field.definition.name] = field.definition.schema;
        }
        return surrealStruct(fieldSchemas, {
            tableName: this.definition.name,
        });
    }
    // Generate TypeScript type string
    toTypeScript() {
        const fieldTypes = [];
        for (const field of this.definition.fields) {
            const fieldName = field.definition.name;
            let fieldType = this.getTypeScriptType(field);
            if (field.definition.isOptional) {
                fieldType = `${fieldType} | undefined`;
            }
            fieldTypes.push(`  ${fieldName}: ${fieldType};`);
        }
        const typeName = this.toTypeScriptTypeName();
        return `export interface ${typeName} {\n${fieldTypes.join("\n")}\n}`;
    }
    toTypeScriptTypeName() {
        return this.definition.name
            .split("_")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join("");
    }
    // Generate SurrealQL table definition
    toSurrealQL() {
        const parts = [];
        if (this.definition.drop) {
            parts.push(`REMOVE TABLE ${this.definition.name}`);
            return parts.join("; ");
        }
        // Table definition
        const tableDefParts = [`DEFINE TABLE ${this.definition.name}`];
        if (this.definition.drop) {
            tableDefParts.push("DROP");
        }
        if (this.definition.schemafull !== undefined) {
            tableDefParts.push(this.definition.schemafull ? "SCHEMAFULL" : "SCHEMALESS");
        }
        if (this.definition.view) {
            const viewFields = this.definition.view.fields.join(", ");
            tableDefParts.push(`AS SELECT ${viewFields} FROM ${this.definition.name}`);
            if (this.definition.view.condition) {
                tableDefParts.push(`WHERE ${this.definition.view.condition}`);
            }
        }
        if (this.definition.permissions) {
            const perms = this.definition.permissions;
            if (perms.select)
                tableDefParts.push(`PERMISSIONS FOR select WHERE ${perms.select}`);
            if (perms.create)
                tableDefParts.push(`PERMISSIONS FOR create WHERE ${perms.create}`);
            if (perms.update)
                tableDefParts.push(`PERMISSIONS FOR update WHERE ${perms.update}`);
            if (perms.delete)
                tableDefParts.push(`PERMISSIONS FOR delete WHERE ${perms.delete}`);
        }
        if (this.definition.description || this.definition.aiHints) {
            if (this.definition.aiHints) {
                const aiHintsJson = JSON.stringify(this.definition.aiHints, null, 0);
                const comment = `${this.definition.description || `${this.definition.name} table`} | @ai-hints: ${aiHintsJson}`;
                tableDefParts.push(`COMMENT "${comment}"`);
            }
            else if (this.definition.description) {
                tableDefParts.push(`COMMENT "${this.definition.description}"`);
            }
        }
        parts.push(tableDefParts.join(" "));
        // Field definitions
        for (const field of this.definition.fields) {
            parts.push(field.toSurrealQL(this.definition.name));
        }
        return parts.join(";\n");
    }
    // Private helper methods
    getTypeScriptType(field) {
        const fieldType = field.definition.type;
        switch (fieldType) {
            case "string":
                return "string";
            case "number":
                return "number";
            case "int":
                return "number";
            case "bool":
                return "boolean";
            case "datetime":
                return "Date";
            case "array":
                return "any[]";
            case "object":
                return "Record<string, any>";
            case "record":
                if (field.definition.references) {
                    return `RecordId<"${field.definition.references.table}">`;
                }
                return "string";
            case "any":
                return "any";
            default:
                return "any";
        }
    }
}
