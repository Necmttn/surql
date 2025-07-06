import { Data, Schema } from "effect";
// Using Data.taggedClass for better Effect integration
export class SurrealFieldConstraints extends Data.TaggedClass("SurrealFieldConstraints") {
}
export class SurrealFieldPermissions extends Data.TaggedClass("SurrealFieldPermissions") {
}
export class SurrealFieldDefinition extends Data.TaggedClass("SurrealFieldDefinition") {
}
// Improved SurrealField using Data.taggedClass
export class SurrealField extends Data.TaggedClass("SurrealField") {
    // Static factory methods with cleaner API
    static string(name) {
        return new SurrealField({
            definition: new SurrealFieldDefinition({
                name,
                type: "string",
                schema: Schema.String,
                isOptional: false,
                isId: false,
            }),
        });
    }
    static number(name) {
        return new SurrealField({
            definition: new SurrealFieldDefinition({
                name,
                type: "number",
                schema: Schema.Number,
                isOptional: false,
                isId: false,
            }),
        });
    }
    static int(name) {
        return new SurrealField({
            definition: new SurrealFieldDefinition({
                name,
                type: "int",
                schema: Schema.Number.pipe(Schema.int()),
                isOptional: false,
                isId: false,
            }),
        });
    }
    static boolean(name) {
        return new SurrealField({
            definition: new SurrealFieldDefinition({
                name,
                type: "bool",
                schema: Schema.Boolean,
                isOptional: false,
                isId: false,
            }),
        });
    }
    static datetime(name) {
        return new SurrealField({
            definition: new SurrealFieldDefinition({
                name,
                type: "datetime",
                schema: Schema.DateFromSelf,
                isOptional: false,
                isId: false,
            }),
        });
    }
    static array(name, itemSchema) {
        return new SurrealField({
            definition: new SurrealFieldDefinition({
                name,
                type: "array",
                schema: Schema.Array(itemSchema),
                isOptional: false,
                isId: false,
            }),
        });
    }
    static record(name, tableName) {
        return new SurrealField({
            definition: new SurrealFieldDefinition({
                name,
                type: "record",
                schema: Schema.String.pipe(Schema.pattern(/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/), Schema.brand(`RecordId<${tableName}>`)),
                isOptional: false,
                isId: false,
                references: { table: tableName },
            }),
        });
    }
    static id(tableName) {
        return new SurrealField({
            definition: new SurrealFieldDefinition({
                name: "id",
                type: "record",
                schema: Schema.String.pipe(Schema.pattern(/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/), Schema.brand(`RecordId<${tableName}>`)),
                isOptional: false,
                isId: true,
                references: { table: tableName },
            }),
        });
    }
    // Fluent API methods - now return new instances due to immutability
    optional() {
        return new SurrealField({
            definition: new SurrealFieldDefinition({
                ...this.definition,
                isOptional: true,
                schema: Schema.optional(this.definition.schema),
            }),
        });
    }
    default(value) {
        return new SurrealField({
            definition: new SurrealFieldDefinition({
                ...this.definition,
                defaultValue: value,
            }),
        });
    }
    description(desc) {
        return new SurrealField({
            definition: new SurrealFieldDefinition({
                ...this.definition,
                description: desc,
            }),
        });
    }
    constraints(constraints) {
        return new SurrealField({
            definition: new SurrealFieldDefinition({
                ...this.definition,
                constraints: new SurrealFieldConstraints(constraints),
            }),
        });
    }
    permissions(permissions) {
        return new SurrealField({
            definition: new SurrealFieldDefinition({
                ...this.definition,
                permissions: new SurrealFieldPermissions(permissions),
            }),
        });
    }
    min(value) {
        const existing = this.definition.constraints ?? new SurrealFieldConstraints({});
        return this.constraints({
            ...existing,
            min: value,
        });
    }
    max(value) {
        const existing = this.definition.constraints ?? new SurrealFieldConstraints({});
        return this.constraints({
            ...existing,
            max: value,
        });
    }
    length(value) {
        const existing = this.definition.constraints ?? new SurrealFieldConstraints({});
        return this.constraints({
            ...existing,
            length: value,
        });
    }
    pattern(regex) {
        const existing = this.definition.constraints ?? new SurrealFieldConstraints({});
        return this.constraints({
            ...existing,
            pattern: regex,
        });
    }
    unique() {
        const existing = this.definition.constraints ?? new SurrealFieldConstraints({});
        return this.constraints({
            ...existing,
            unique: true,
        });
    }
    required() {
        const existing = this.definition.constraints ?? new SurrealFieldConstraints({});
        return this.constraints({
            ...existing,
            required: true,
        });
    }
    assert(assertion) {
        const existing = this.definition.constraints ?? new SurrealFieldConstraints({});
        return this.constraints({
            ...existing,
            assert: assertion,
        });
    }
    onDelete(action) {
        if (!this.definition.references) {
            throw new Error("onDelete can only be used with record references");
        }
        return new SurrealField({
            definition: new SurrealFieldDefinition({
                ...this.definition,
                references: {
                    ...this.definition.references,
                    onDelete: action,
                },
            }),
        });
    }
    // Helper methods - now work with immutable data
    getName() {
        return this.definition.name;
    }
    getType() {
        return this.definition.type;
    }
    getSchema() {
        return this.definition.schema;
    }
    isOptionalField() {
        return this.definition.isOptional;
    }
    isIdField() {
        return this.definition.isId;
    }
    getConstraints() {
        return this.definition.constraints;
    }
    getPermissions() {
        return this.definition.permissions;
    }
    getDefaultValue() {
        return this.definition.defaultValue;
    }
    getDescription() {
        return this.definition.description;
    }
    getReferences() {
        return this.definition.references;
    }
    // Generate SurrealQL field definition
    toSurrealQL(tableName) {
        const parts = [];
        parts.push(`DEFINE FIELD ${this.definition.name} ON ${tableName}`);
        // Add type
        let typeStr = this.definition.type;
        if (this.definition.references && this.definition.type === "record") {
            typeStr = `record<${this.definition.references.table}>`;
        }
        if (this.definition.isOptional) {
            typeStr = `option<${typeStr}>`;
        }
        parts.push(`TYPE ${typeStr}`);
        // Add constraints
        if (this.definition.constraints) {
            const constraints = this.definition.constraints;
            if (constraints.assert) {
                parts.push(`ASSERT ${constraints.assert}`);
            }
            if (constraints.unique) {
                parts.push("UNIQUE");
            }
        }
        // Add default value
        if (this.definition.defaultValue) {
            parts.push(`DEFAULT ${this.definition.defaultValue}`);
        }
        // Add permissions
        if (this.definition.permissions) {
            const perms = this.definition.permissions;
            if (perms.select)
                parts.push(`PERMISSIONS FOR select WHERE ${perms.select}`);
            if (perms.create)
                parts.push(`PERMISSIONS FOR create WHERE ${perms.create}`);
            if (perms.update)
                parts.push(`PERMISSIONS FOR update WHERE ${perms.update}`);
            if (perms.delete)
                parts.push(`PERMISSIONS FOR delete WHERE ${perms.delete}`);
        }
        // Add description as comment
        if (this.definition.description) {
            parts.push(`COMMENT "${this.definition.description}"`);
        }
        return parts.join(" ");
    }
}
