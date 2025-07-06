import { Schema } from "effect";

// Field type enum schema
const FieldTypeSchema = Schema.Literal(
  "string",
  "number", 
  "int",
  "bool",
  "datetime",
  "array",
  "object", 
  "record",
  "any"
);

// Field constraints schema
const FieldConstraintsSchema = Schema.Struct({
  min: Schema.optional(Schema.Number),
  max: Schema.optional(Schema.Number),
  length: Schema.optional(Schema.Number),
  pattern: Schema.optional(Schema.String),
  enum: Schema.optional(Schema.Array(Schema.String)),
  unique: Schema.optional(Schema.Boolean),
  required: Schema.optional(Schema.Boolean),
  assert: Schema.optional(Schema.String)
});

// Field permissions schema
const FieldPermissionsSchema = Schema.Struct({
  select: Schema.optional(Schema.String),
  create: Schema.optional(Schema.String),
  update: Schema.optional(Schema.String),
  delete: Schema.optional(Schema.String)
});

// Field references schema (for record types)
const FieldReferencesSchema = Schema.Struct({
  table: Schema.String.pipe(Schema.minLength(1)),
  field: Schema.optional(Schema.String),
  onDelete: Schema.optional(Schema.Literal("CASCADE", "SET NULL", "RESTRICT"))
});

/**
 * SurrealField as Schema.Class - batteries included field definition
 * 
 * This class provides:
 * - Built-in validation via Schema.Class
 * - Automatic encoding/decoding
 * - Fluent API that maintains validation
 * - Self-serialization to SurrealQL
 * - Migration generation via comparison
 */
export class SurrealField extends Schema.Class<SurrealField>("SurrealField")({
  name: Schema.String.pipe(Schema.minLength(1)),
  type: FieldTypeSchema,
  constraints: Schema.optional(FieldConstraintsSchema),
  permissions: Schema.optional(FieldPermissionsSchema),
  defaultValue: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  isOptional: Schema.Boolean,
  isId: Schema.Boolean,
  references: Schema.optional(FieldReferencesSchema)
}) {
  // Built-in validation methods from Schema.Class
  static validate = Schema.decodeUnknownSync(this);
  static parse = Schema.decodeUnknownSync(this);
  static safeParse = Schema.decodeUnknownOption(this);
  
  // Built-in encoding/decoding
  static encode = Schema.encodeSync(this);
  static decode = Schema.decodeSync(this);

  // Static factory methods with automatic validation
  static string(name: string): SurrealField {
    return this.parse({
      name,
      type: "string" as const,
      isOptional: false,
      isId: false
    });
  }

  static number(name: string): SurrealField {
    return this.parse({
      name,
      type: "number" as const,
      isOptional: false,
      isId: false
    });
  }

  static int(name: string): SurrealField {
    return this.parse({
      name,
      type: "int" as const,
      isOptional: false,
      isId: false
    });
  }

  static boolean(name: string): SurrealField {
    return this.parse({
      name,
      type: "bool" as const,
      isOptional: false,
      isId: false
    });
  }

  static datetime(name: string): SurrealField {
    return this.parse({
      name,
      type: "datetime" as const,
      isOptional: false,
      isId: false
    });
  }

  static array(name: string): SurrealField {
    return this.parse({
      name,
      type: "array" as const,
      isOptional: false,
      isId: false
    });
  }

  static object(name: string): SurrealField {
    return this.parse({
      name,
      type: "object" as const,
      isOptional: false,
      isId: false
    });
  }

  static record(name: string, table: string): SurrealField {
    return this.parse({
      name,
      type: "record" as const,
      isOptional: false,
      isId: false,
      references: { table }
    });
  }

  static id(table: string): SurrealField {
    return this.parse({
      name: "id",
      type: "record" as const,
      isOptional: false,
      isId: true,
      references: { table }
    });
  }

  static any(name: string): SurrealField {
    return this.parse({
      name,
      type: "any" as const,
      isOptional: false,
      isId: false
    });
  }

  // Fluent API methods that return validated instances
  optional(): SurrealField {
    return SurrealField.parse({
      ...this,
      isOptional: true
    });
  }

  description(desc: string): SurrealField {
    return SurrealField.parse({
      ...this,
      description: desc
    });
  }

  default(value: string): SurrealField {
    return SurrealField.parse({
      ...this,
      defaultValue: value
    });
  }

  withConstraints(constraints: Schema.Schema.Type<typeof FieldConstraintsSchema>): SurrealField {
    return SurrealField.parse({
      ...this,
      constraints
    });
  }

  withPermissions(permissions: Schema.Schema.Type<typeof FieldPermissionsSchema>): SurrealField {
    return SurrealField.parse({
      ...this,
      permissions
    });
  }

  // Constraint helper methods
  min(value: number): SurrealField {
    const existing = this.constraints ?? {};
    return this.withConstraints({
      ...existing,
      min: value
    });
  }

  max(value: number): SurrealField {
    const existing = this.constraints ?? {};
    return this.withConstraints({
      ...existing,
      max: value
    });
  }

  length(value: number): SurrealField {
    const existing = this.constraints ?? {};
    return this.withConstraints({
      ...existing,
      length: value
    });
  }

  pattern(regex: string): SurrealField {
    const existing = this.constraints ?? {};
    return this.withConstraints({
      ...existing,
      pattern: regex
    });
  }

  unique(): SurrealField {
    const existing = this.constraints ?? {};
    return this.withConstraints({
      ...existing,
      unique: true
    });
  }

  required(): SurrealField {
    const existing = this.constraints ?? {};
    return this.withConstraints({
      ...existing,
      required: true
    });
  }

  assert(assertion: string): SurrealField {
    const existing = this.constraints ?? {};
    return this.withConstraints({
      ...existing,
      assert: assertion
    });
  }

  onDelete(action: "CASCADE" | "SET NULL" | "RESTRICT"): SurrealField {
    if (!this.references) {
      throw new Error("onDelete can only be used with record references");
    }

    return SurrealField.parse({
      ...this,
      references: {
        ...this.references,
        onDelete: action
      }
    });
  }

  // Helper methods
  getName(): string {
    return this.name;
  }

  getType(): Schema.Schema.Type<typeof FieldTypeSchema> {
    return this.type;
  }

  getDescription(): string | undefined {
    return this.description;
  }

  getDefaultValue(): string | undefined {
    return this.defaultValue;
  }

  getConstraints(): Schema.Schema.Type<typeof FieldConstraintsSchema> | undefined {
    return this.constraints;
  }

  getReferences(): Schema.Schema.Type<typeof FieldReferencesSchema> | undefined {
    return this.references;
  }

  // Self-serialization to SurrealQL
  toSurrealQL(): string {
    let sql = `DEFINE FIELD ${this.name} ON `;
    
    // Add type
    switch (this.type) {
      case "string":
        sql += "TYPE string";
        break;
      case "number":
        sql += "TYPE number";
        break;
      case "int":
        sql += "TYPE int";
        break;
      case "bool":
        sql += "TYPE bool";
        break;
      case "datetime":
        sql += "TYPE datetime";
        break;
      case "array":
        sql += "TYPE array";
        break;
      case "object":
        sql += "TYPE object";
        break;
      case "record":
        if (this.references?.table) {
          sql += `TYPE record<${this.references.table}>`;
        } else {
          sql += "TYPE record";
        }
        break;
      case "any":
        sql += "TYPE any";
        break;
    }

    // Add constraints
    if (this.constraints?.unique) {
      sql += " UNIQUE";
    }

    // Add default value
    if (this.defaultValue) {
      sql += ` DEFAULT ${this.defaultValue}`;
    }

    // Add assert constraint
    if (this.constraints?.assert) {
      sql += ` ASSERT ${this.constraints.assert}`;
    }

    // Add permissions
    if (this.permissions) {
      if (this.permissions.select) sql += ` PERMISSIONS FOR select WHERE ${this.permissions.select}`;
      if (this.permissions.create) sql += ` PERMISSIONS FOR create WHERE ${this.permissions.create}`;
      if (this.permissions.update) sql += ` PERMISSIONS FOR update WHERE ${this.permissions.update}`;
      if (this.permissions.delete) sql += ` PERMISSIONS FOR delete WHERE ${this.permissions.delete}`;
    }

    // Add description as comment
    if (this.description) {
      const desc = String(this.description);
      sql += ` COMMENT '${desc.replace(/'/g, "\\'")}'`;
    }

    return sql + ";";
  }

  // Parse SurrealQL back to SurrealField (for database introspection)
  static fromSurrealQL(sql: string): SurrealField {
    // Basic parser - can be enhanced
    const nameMatch = sql.match(/DEFINE FIELD (\w+)/);
    const typeMatch = sql.match(/TYPE (\w+)(?:<([^>]+)>)?/);
    const defaultMatch = sql.match(/DEFAULT ([^,\s;]+)/);
    const commentMatch = sql.match(/COMMENT '([^']+)'/);
    const uniqueMatch = sql.includes("UNIQUE");
    
    if (!nameMatch || !typeMatch) {
      throw new Error(`Invalid SurrealQL field definition: ${sql}`);
    }

    const name = nameMatch[1];
    const type = typeMatch[1] as Schema.Schema.Type<typeof FieldTypeSchema>;
    const recordTable = typeMatch[2]; // For record<table> types
    
    return this.parse({
      name,
      type,
      isOptional: false,
      isId: name === "id",
      defaultValue: defaultMatch?.[1],
      description: commentMatch?.[1],
      constraints: uniqueMatch ? { unique: true } : undefined,
      references: recordTable ? { table: recordTable } : undefined
    });
  }

  // Generate migration operation when comparing fields
  static diff(oldField: SurrealField, newField: SurrealField): string[] {
    const operations: string[] = [];

    // Field name change
    if (oldField.name !== newField.name) {
      operations.push(`ALTER FIELD ${oldField.name} RENAME TO ${newField.name}`);
    }

    // Type change
    if (oldField.type !== newField.type) {
      operations.push(`ALTER FIELD ${newField.name} TYPE ${newField.type}`);
    }

    // Default value change
    if (oldField.defaultValue !== newField.defaultValue) {
      if (newField.defaultValue) {
        operations.push(`ALTER FIELD ${newField.name} DEFAULT ${newField.defaultValue}`);
      } else {
        operations.push(`ALTER FIELD ${newField.name} REMOVE DEFAULT`);
      }
    }

    // Constraint changes
    const oldUnique = oldField.constraints?.unique ?? false;
    const newUnique = newField.constraints?.unique ?? false;
    if (oldUnique !== newUnique) {
      if (newUnique) {
        operations.push(`ALTER FIELD ${newField.name} ADD UNIQUE`);
      } else {
        operations.push(`ALTER FIELD ${newField.name} REMOVE UNIQUE`);
      }
    }

    return operations;
  }

  // Generate Effect Schema for TypeScript generation
  toEffectSchema(): string {
    let schema: string;

    switch (this.type) {
      case "string":
        schema = "Schema.String";
        break;
      case "number":
        schema = "Schema.Number";
        break;
      case "int":
        schema = "Schema.Number.pipe(Schema.int())";
        break;
      case "bool":
        schema = "Schema.Boolean";
        break;
      case "datetime":
        schema = "Schema.DateFromSelf";
        break;
      case "array":
        schema = "Schema.Array(Schema.Unknown)";
        break;
      case "object":
        schema = "Schema.Unknown";
        break;
      case "record":
        if (this.references?.table) {
          schema = `recordId("${this.references.table}")`;
        } else {
          schema = "Schema.instanceOf(RecordId)";
        }
        break;
      case "any":
        schema = "Schema.Any";
        break;
    }

    // Add constraints as pipe operations
    if (this.constraints?.min !== undefined) {
      schema += `.pipe(Schema.greaterThanOrEqualTo(${this.constraints.min}))`;
    }
    if (this.constraints?.max !== undefined) {
      schema += `.pipe(Schema.lessThanOrEqualTo(${this.constraints.max}))`;
    }
    if (this.constraints?.length !== undefined) {
      schema += `.pipe(Schema.minLength(${this.constraints.length}))`;
    }
    if (this.constraints?.pattern) {
      schema += `.pipe(Schema.pattern(new RegExp("${this.constraints.pattern}")))`;
    }

    // Add annotations
    const annotations: string[] = [];
    if (this.description) {
      const desc = String(this.description);
      annotations.push(`description: "${desc.replace(/"/g, '\\"')}"`);
    }
    if (this.defaultValue) {
      const defaultVal = String(this.defaultValue);
      annotations.push(`surrealDefault: "${defaultVal}"`);
    }

    if (annotations.length > 0) {
      schema += `.annotations({ ${annotations.join(", ")} })`;
    }

    // Make optional if needed
    if (this.isOptional) {
      schema = `Schema.optional(${schema})`;
    }

    return schema;
  }
}

// Export types for TypeScript integration
export type SurrealFieldType = Schema.Schema.Type<typeof SurrealField>;
export type FieldConstraints = Schema.Schema.Type<typeof FieldConstraintsSchema>;
export type FieldPermissions = Schema.Schema.Type<typeof FieldPermissionsSchema>;
export type FieldReferences = Schema.Schema.Type<typeof FieldReferencesSchema>;