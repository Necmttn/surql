import { Schema } from "effect";
import { SurrealField } from "./field";

// AI Table Hints schema - simplified version for now
const AITableHintsSchema = Schema.Struct({
  primary_key: Schema.optional(Schema.String),
  temporal_field: Schema.optional(Schema.String),
  user_field: Schema.optional(Schema.String),
  content_fields: Schema.optional(Schema.Array(Schema.String)),
  common_queries: Schema.optional(Schema.Array(Schema.String)),
  relationships: Schema.optional(Schema.Unknown), // Use Unknown for flexible object structure
  security_level: Schema.optional(Schema.String)
});

// Table permissions schema
const TablePermissionsSchema = Schema.Struct({
  select: Schema.optional(Schema.String),
  create: Schema.optional(Schema.String),
  update: Schema.optional(Schema.String),
  delete: Schema.optional(Schema.String)
});

// Table view schema (for view definitions)
const TableViewSchema = Schema.Struct({
  fields: Schema.Array(Schema.String),
  condition: Schema.optional(Schema.String)
});

/**
 * SurrealTable as Schema.Class - batteries included table definition
 * 
 * This class provides:
 * - Built-in validation via Schema.Class
 * - Automatic encoding/decoding
 * - Fluent API that maintains validation
 * - Self-serialization to SurrealQL
 * - Migration generation via comparison
 * - AI metadata integration
 */
export class SurrealTable extends Schema.Class<SurrealTable>("SurrealTable")({
  name: Schema.String.pipe(Schema.minLength(1)),
  description: Schema.optional(Schema.String),
  fields: Schema.Array(SurrealField),
  permissions: Schema.optional(TablePermissionsSchema),
  schemafull: Schema.Boolean,
  drop: Schema.optional(Schema.Boolean),
  view: Schema.optional(TableViewSchema),
  aiHints: Schema.optional(AITableHintsSchema)
}) {
  // Built-in validation methods from Schema.Class
  static validate = Schema.decodeUnknownSync(this);
  static parse = Schema.decodeUnknownSync(this);
  static safeParse = Schema.decodeUnknownOption(this);
  
  // Built-in encoding/decoding
  static encode = Schema.encodeSync(this);
  static decode = Schema.decodeSync(this);

  // Static factory methods with automatic validation
  static create(name: string, fields: readonly SurrealField[] = []): SurrealTable {
    return this.parse({
      name,
      fields: [...fields],
      schemafull: true
    });
  }

  static schemaless(name: string, fields: readonly SurrealField[] = []): SurrealTable {
    return this.parse({
      name,
      fields: [...fields],
      schemafull: false
    });
  }

  static view(name: string, viewFields: readonly string[], condition?: string): SurrealTable {
    return this.parse({
      name,
      fields: [],
      schemafull: true,
      view: {
        fields: [...viewFields],
        condition
      }
    });
  }

  // Fluent API methods that return validated instances
  withDescription(desc: string): SurrealTable {
    return SurrealTable.parse({
      ...this,
      description: desc
    });
  }

  addField(field: SurrealField): SurrealTable {
    return SurrealTable.parse({
      ...this,
      fields: [...this.fields, field]
    });
  }

  addFields(...fields: SurrealField[]): SurrealTable {
    return SurrealTable.parse({
      ...this,
      fields: [...this.fields, ...fields]
    });
  }

  removeField(fieldName: string): SurrealTable {
    return SurrealTable.parse({
      ...this,
      fields: this.fields.filter(f => f.name !== fieldName)
    });
  }

  updateField(fieldName: string, updater: (field: SurrealField) => SurrealField): SurrealTable {
    return SurrealTable.parse({
      ...this,
      fields: this.fields.map(f => f.name === fieldName ? updater(f) : f)
    });
  }

  withPermissions(permissions: Schema.Schema.Type<typeof TablePermissionsSchema>): SurrealTable {
    return SurrealTable.parse({
      ...this,
      permissions
    });
  }

  schemafullMode(): SurrealTable {
    return SurrealTable.parse({
      ...this,
      schemafull: true
    });
  }

  schemalessMode(): SurrealTable {
    return SurrealTable.parse({
      ...this,
      schemafull: false
    });
  }

  // AI metadata methods
  withAiHints(hints: Schema.Schema.Type<typeof AITableHintsSchema>): SurrealTable {
    return SurrealTable.parse({
      ...this,
      aiHints: hints
    });
  }

  aiPrimaryKey(field: string): SurrealTable {
    const existingHints = this.aiHints ?? {};
    return this.withAiHints({
      ...existingHints,
      primary_key: field
    });
  }

  aiTemporalField(field: string): SurrealTable {
    const existingHints = this.aiHints ?? {};
    return this.withAiHints({
      ...existingHints,
      temporal_field: field
    });
  }

  aiUserField(field: string): SurrealTable {
    const existingHints = this.aiHints ?? {};
    return this.withAiHints({
      ...existingHints,
      user_field: field
    });
  }

  aiContentFields(fields: readonly string[]): SurrealTable {
    const existingHints = this.aiHints ?? {};
    return this.withAiHints({
      ...existingHints,
      content_fields: [...fields]
    });
  }

  aiCommonQueries(queries: readonly string[]): SurrealTable {
    const existingHints = this.aiHints ?? {};
    return this.withAiHints({
      ...existingHints,
      common_queries: [...queries]
    });
  }

  aiRelationships(relationships: Record<string, string>): SurrealTable {
    const existingHints = this.aiHints ?? {};
    return this.withAiHints({
      ...existingHints,
      relationships
    });
  }

  aiSecurityLevel(level: string): SurrealTable {
    const existingHints = this.aiHints ?? {};
    return this.withAiHints({
      ...existingHints,
      security_level: level
    });
  }

  // Helper methods
  getName(): string {
    return this.name;
  }

  getDescription(): string | undefined {
    return this.description;
  }

  getFields(): readonly SurrealField[] {
    return this.fields;
  }

  getField(name: string): SurrealField | undefined {
    return this.fields.find(f => f.name === name);
  }

  hasField(name: string): boolean {
    return this.fields.some(f => f.name === name);
  }

  getPermissions(): Schema.Schema.Type<typeof TablePermissionsSchema> | undefined {
    return this.permissions;
  }

  isSchemaFull(): boolean {
    return this.schemafull;
  }

  isView(): boolean {
    return this.view !== undefined;
  }

  getView(): Schema.Schema.Type<typeof TableViewSchema> | undefined {
    return this.view;
  }

  getAiHints(): Schema.Schema.Type<typeof AITableHintsSchema> | undefined {
    return this.aiHints;
  }

  // Self-serialization to SurrealQL
  toSurrealQL(): string {
    let sql = `DEFINE TABLE ${this.name}`;

    // Add table type
    if (this.isView() && this.view) {
      sql += ` AS SELECT ${this.view.fields.join(", ")} FROM ${this.name}`;
      if (this.view.condition) {
        sql += ` WHERE ${this.view.condition}`;
      }
    } else {
      if (!this.schemafull) {
        sql += " SCHEMALESS";
      } else {
        sql += " SCHEMAFULL";
      }
    }

    // Add permissions
    if (this.permissions) {
      if (this.permissions.select) sql += ` PERMISSIONS FOR select WHERE ${this.permissions.select}`;
      if (this.permissions.create) sql += ` PERMISSIONS FOR create WHERE ${this.permissions.create}`;
      if (this.permissions.update) sql += ` PERMISSIONS FOR update WHERE ${this.permissions.update}`;
      if (this.permissions.delete) sql += ` PERMISSIONS FOR delete WHERE ${this.permissions.delete}`;
    }

    // Add description and AI hints as comment
    if (this.description || this.aiHints) {
      let comment = this.description || "";
      
      if (this.aiHints) {
        const aiHintsJson = JSON.stringify(this.aiHints);
        if (comment) {
          comment += ` | @ai-hints: ${aiHintsJson}`;
        } else {
          comment = `@ai-hints: ${aiHintsJson}`;
        }
      }
      
      if (comment) {
        const escapedComment = comment.replace(/'/g, "\\'");
        sql += ` COMMENT '${escapedComment}'`;
      }
    }

    sql += ";";

    // Add field definitions
    if (!this.isView()) {
      for (const field of this.fields) {
        sql += "\n" + field.toSurrealQL().replace(/;$/, ` ON ${this.name};`);
      }
    }

    return sql;
  }

  // Parse SurrealQL back to SurrealTable (for database introspection)
  static fromSurrealQL(sql: string): SurrealTable {
    // Basic parser - can be enhanced
    const tableMatch = sql.match(/DEFINE TABLE (\w+)/);
    const schemalessMatch = sql.includes("SCHEMALESS");
    const schemafullMatch = sql.includes("SCHEMAFULL");
    const commentMatch = sql.match(/COMMENT '([^']+)'/);
    
    if (!tableMatch) {
      throw new Error(`Invalid SurrealQL table definition: ${sql}`);
    }

    const name = tableMatch[1];
    let description: string | undefined;
    let aiHints: Schema.Schema.Type<typeof AITableHintsSchema> | undefined;

    // Parse comment for description and AI hints
    if (commentMatch) {
      const comment = commentMatch[1];
      const aiHintsMatch = comment.match(/@ai-hints:\s*({.*})/);
      
      if (aiHintsMatch) {
        try {
          aiHints = JSON.parse(aiHintsMatch[1]);
          description = comment.split(" | @ai-hints:")[0].trim() || undefined;
        } catch (e) {
          description = comment;
        }
      } else {
        description = comment;
      }
    }

    return this.parse({
      name,
      description,
      fields: [], // Fields would be parsed separately
      schemafull: schemafullMatch || !schemalessMatch,
      aiHints
    });
  }

  // Generate migration operation when comparing tables
  static diff(oldTable: SurrealTable, newTable: SurrealTable): string[] {
    const operations: string[] = [];

    // Table name change
    if (oldTable.name !== newTable.name) {
      operations.push(`ALTER TABLE ${oldTable.name} RENAME TO ${newTable.name}`);
    }

    // Schema mode change
    if (oldTable.schemafull !== newTable.schemafull) {
      if (newTable.schemafull) {
        operations.push(`ALTER TABLE ${newTable.name} SCHEMAFULL`);
      } else {
        operations.push(`ALTER TABLE ${newTable.name} SCHEMALESS`);
      }
    }

    // Field changes
    const oldFieldMap = new Map(oldTable.fields.map(f => [f.name, f]));
    const newFieldMap = new Map(newTable.fields.map(f => [f.name, f]));

    // Removed fields
    for (const [fieldName, oldField] of oldFieldMap) {
      if (!newFieldMap.has(fieldName)) {
        operations.push(`REMOVE FIELD ${fieldName} ON ${newTable.name}`);
      }
    }

    // Added or modified fields
    for (const [fieldName, newField] of newFieldMap) {
      const oldField = oldFieldMap.get(fieldName);
      
      if (!oldField) {
        // New field
        operations.push(newField.toSurrealQL().replace(/;$/, ` ON ${newTable.name};`));
      } else {
        // Modified field
        const fieldDiff = SurrealField.diff(oldField, newField);
        operations.push(...fieldDiff.map(op => op.replace(` ${fieldName}`, ` ${fieldName} ON ${newTable.name}`)));
      }
    }

    return operations;
  }

  // Generate Effect Schema class code
  toEffectSchemaClass(): string {
    const className = this.name.charAt(0).toUpperCase() + this.name.slice(1);
    
    // Generate field schemas
    const fieldSchemas = this.fields.map(field => {
      return `  ${field.name}: ${field.toEffectSchema()}`;
    }).join(",\n");

    // Generate AI hints object
    const aiHintsCode = this.aiHints ? 
      `  static readonly aiHints = ${JSON.stringify(this.aiHints, null, 2)} as const;` : 
      '';

    // Generate query methods from common queries
    const queryMethods = this.aiHints?.common_queries?.map(query => {
      const methodName = query.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
      return `  static ${methodName}() {\n    return \`SELECT * FROM ${this.name} WHERE /* TODO: implement ${query} */\`;\n  }`;
    }).join('\n\n') || '';

    return `
export namespace ${className} {
  export const Fields = {
${fieldSchemas}
  };

  export class ${className} extends Schema.Class<${className}>("${className}")({
    ...Fields,
  }) {
    static readonly tableName = "${this.name}" as const;
${aiHintsCode}
    
    // Built-in validation methods
    static validate = Schema.decodeUnknownSync(this);
    static parse = Schema.decodeUnknownSync(this);
  }

  export type Type = Schema.Schema.Type<typeof ${className}>;

  export const update = Schema.Struct({
    ...Object.fromEntries(
      Object.entries(Fields).map(([key, schema]) => [
        key,
        Schema.optional(schema as Schema.Any),
      ]),
    ),
    id: recordId("${this.name}"),
  });

${queryMethods ? `  // AI-generated query methods\n${queryMethods}` : ''}
}`;
  }

  // Generate TypeScript interface
  toTypeScriptInterface(): string {
    const className = this.name.charAt(0).toUpperCase() + this.name.slice(1);
    
    const fields = this.fields.map(field => {
      let type: string;
      
      switch (field.type) {
        case "string":
          type = "string";
          break;
        case "number":
        case "int":
          type = "number";
          break;
        case "bool":
          type = "boolean";
          break;
        case "datetime":
          type = "Date";
          break;
        case "array":
          type = "unknown[]";
          break;
        case "object":
          type = "unknown";
          break;
        case "record":
          if (field.references?.table) {
            type = `RecordId<"${field.references.table}">`;
          } else {
            type = "RecordId";
          }
          break;
        case "any":
          type = "unknown";
          break;
        default:
          type = "unknown";
      }

      if (field.isOptional) {
        type = `${type} | undefined`;
      }

      return `  ${field.name}: ${type};`;
    }).join('\n');

    return `export interface ${className} {\n${fields}\n}`;
  }
}

// Export types for TypeScript integration
export type SurrealTableType = Schema.Schema.Type<typeof SurrealTable>;
export type TablePermissions = Schema.Schema.Type<typeof TablePermissionsSchema>;
export type TableView = Schema.Schema.Type<typeof TableViewSchema>;
export type AITableHints = Schema.Schema.Type<typeof AITableHintsSchema>;