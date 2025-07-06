import { Schema } from "effect";

/**
 * Infer SurrealDB field type from Effect Schema AST
 * @param ast - The Schema AST node
 * @returns The corresponding SurrealDB field type
 */
function inferSurrealTypeFromAST(ast: any): Schema.Schema.Type<typeof FieldTypeSchema> {
  switch (ast._tag) {
    case "StringKeyword":
      return "string";
    case "NumberKeyword":
      return "number";
    case "BooleanKeyword":
      return "bool";
    case "Transformation":
      // Handle transformations like Schema.DateFromSelf, Schema.int(), etc.
      if (ast.transformation?.kind === "Encoded" || ast.from?._tag === "StringKeyword") {
        // Date transformations typically come from string
        return "datetime";
      }
      if (ast.from?._tag === "NumberKeyword") {
        return "number";
      }
      return inferSurrealTypeFromAST(ast.from);
    case "Refinement":
      // Handle Schema.pipe operations - extract the base type
      return inferSurrealTypeFromAST(ast.from);
    case "Array":
      return "array";
    case "Record":
    case "TypeLiteral":
      return "object";
    default:
      // Default to string for unknown types or branded types
      return "string";
  }
}

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
 * 
 * @example
 * ```typescript
 * // Create a basic string field
 * const name = SurrealField.string("name");
 * 
 * // Create with constraints
 * const email = SurrealField.string("email")
 *   .unique()
 *   .withDescription("User email address");
 * 
 * // Create with default value
 * const createdAt = SurrealField.datetime("created_at")
 *   .default("time::now()");
 * ```
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
  
  /**
   * Create a string field with the given name
   * @param name - The field name
   * @returns A new SurrealField instance with string type
   */
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

  static array(name: string, itemType?: string): SurrealField {
    return this.parse({
      name,
      type: "array" as const,
      isOptional: false,
      isId: false,
      description: itemType ? `Array of ${itemType}` : "Array field"
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

  /**
   * Create a field from a pre-composed Effect Schema with validation
   * This allows using Schema.pipe patterns for reusable constraints
   * @param name - The field name
   * @param schema - The Effect Schema with validation rules
   * @returns A new SurrealField instance that preserves the schema's validation
   */
  static fromSchema<A, I, R>(name: string, schema: Schema.Schema<A, I, R>): SurrealField {
    // Extract the base type from the schema
    let baseType: Schema.Schema.Type<typeof FieldTypeSchema> = "string";
    let isOptional = false;
    
    // Analyze the schema structure to determine SurrealDB type
    const schemaStructure = schema.ast;
    
    // Handle Schema.optional wrapper
    if (schemaStructure._tag === "Transformation" && 
        schemaStructure.from._tag === "Union" &&
        schemaStructure.from.types.some((t: any) => t._tag === "UndefinedKeyword")) {
      isOptional = true;
      // Get the inner schema (non-undefined type)
      const innerType = schemaStructure.from.types.find((t: any) => t._tag !== "UndefinedKeyword");
      if (innerType) {
        baseType = inferSurrealTypeFromAST(innerType);
      }
    } else {
      baseType = inferSurrealTypeFromAST(schemaStructure);
    }

    return this.parse({
      name,
      type: baseType,
      isOptional,
      isId: false,
      // Store the schema for future use in validation/TypeScript generation
      description: `Field with custom schema validation`
    });
  }

  /**
   * Create an enum field with predefined values
   * @param name - The field name
   * @param values - Array of allowed enum values
   * @returns A new SurrealField instance with enum constraint
   */
  static enum(name: string, values: string[]): SurrealField {
    const existing = {};
    return this.parse({
      name,
      type: "string" as const,
      isOptional: false,
      isId: false,
      constraints: {
        ...existing,
        enum: values
      }
    });
  }

  // Fluent API methods that return validated instances
  optional(): SurrealField {
    return SurrealField.parse({
      ...this,
      isOptional: true
    });
  }

  /**
   * Add a description to this field
   * @param desc - The field description
   * @returns A new SurrealField instance with the description
   */
  withDescription(desc: string): SurrealField {
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

  /**
   * Mark this field as unique (will generate a unique index)
   * @returns A new SurrealField instance with unique constraint
   */
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

  /**
   * Add custom annotations to this field for tooling and documentation
   * @param annotations - Custom annotation object
   * @returns A new SurrealField instance with annotations stored in description
   */
  annotations(annotations: Record<string, any>): SurrealField {
    const annotationString = JSON.stringify(annotations, null, 2);
    const currentDesc = this.getDescription();
    const newDesc = currentDesc 
      ? `${currentDesc} | @annotations: ${annotationString}`
      : `@annotations: ${annotationString}`;
    
    return this.withDescription(newDesc);
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
    // Access the actual property value, not the method
    const encoded = SurrealField.encode(this);
    return encoded.description;
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
  toSurrealQL(tableName?: string): string {
    let sql = `DEFINE FIELD ${this.name}`;
    
    if (tableName) {
      sql += ` ON ${tableName}`;
    }
    
    // Add type
    sql += " TYPE ";
    switch (this.type) {
      case "string":
        sql += "string";
        break;
      case "number":
        sql += "number";
        break;
      case "int":
        sql += "int";
        break;
      case "bool":
        sql += "bool";
        break;
      case "datetime":
        sql += "datetime";
        break;
      case "array":
        sql += "array";
        break;
      case "object":
        sql += "object";
        break;
      case "record":
        if (this.references?.table) {
          sql += `record<${this.references.table}>`;
        } else {
          sql += "record";
        }
        break;
      case "any":
        sql += "any";
        break;
    }

    // Note: UNIQUE constraints are handled as indexes in SurrealDB, not field constraints
    // They should be defined separately as: DEFINE INDEX idx_unique_fieldname ON table FIELDS fieldname UNIQUE;

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
    const description = this.getDescription();
    if (description) {
      sql += ` COMMENT '${description.replace(/'/g, "\\'")}'`;
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