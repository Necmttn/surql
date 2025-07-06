import { Data, Schema } from "effect";
import { type SurrealSchema } from "./enhanced-schema";

// Using Data.taggedClass for better Effect integration
export class SurrealFieldConstraints extends Data.TaggedClass(
  "SurrealFieldConstraints",
)<{
  readonly min?: number;
  readonly max?: number;
  readonly length?: number;
  readonly pattern?: string;
  readonly enum?: readonly string[];
  readonly unique?: boolean;
  readonly required?: boolean;
  readonly assert?: string;
}> {}

export class SurrealFieldPermissions extends Data.TaggedClass(
  "SurrealFieldPermissions",
)<{
  readonly select?: string;
  readonly create?: string;
  readonly update?: string;
  readonly delete?: string;
}> {}

export class SurrealFieldDefinition extends Data.TaggedClass(
  "SurrealFieldDefinition",
)<{
  readonly name: string;
  readonly type:
    | "string"
    | "number"
    | "int"
    | "bool"
    | "datetime"
    | "array"
    | "object"
    | "record"
    | "any";
  readonly schema: SurrealSchema<any, any>;
  readonly constraints?: SurrealFieldConstraints;
  readonly permissions?: SurrealFieldPermissions;
  readonly defaultValue?: string;
  readonly description?: string;
  readonly isOptional: boolean;
  readonly isId: boolean;
  readonly references?: {
    readonly table: string;
    readonly field?: string;
    readonly onDelete?: "CASCADE" | "SET NULL" | "RESTRICT";
  };
}> {}

// Improved SurrealField using Data.taggedClass
export class SurrealField extends Data.TaggedClass("SurrealField")<{
  readonly definition: SurrealFieldDefinition;
}> {
  // Static factory methods with cleaner API
  static string(name: string) {
    return new SurrealField({
      definition: new SurrealFieldDefinition({
        name,
        type: "string",
        schema: Schema.String as SurrealSchema<string>,
        isOptional: false,
        isId: false,
      }),
    });
  }

  static number(name: string) {
    return new SurrealField({
      definition: new SurrealFieldDefinition({
        name,
        type: "number",
        schema: Schema.Number as SurrealSchema<number>,
        isOptional: false,
        isId: false,
      }),
    });
  }

  static int(name: string) {
    return new SurrealField({
      definition: new SurrealFieldDefinition({
        name,
        type: "int",
        schema: Schema.Number.pipe(Schema.int()) as SurrealSchema<number>,
        isOptional: false,
        isId: false,
      }),
    });
  }

  static boolean(name: string) {
    return new SurrealField({
      definition: new SurrealFieldDefinition({
        name,
        type: "bool",
        schema: Schema.Boolean as SurrealSchema<boolean>,
        isOptional: false,
        isId: false,
      }),
    });
  }

  static datetime(name: string) {
    return new SurrealField({
      definition: new SurrealFieldDefinition({
        name,
        type: "datetime",
        schema: Schema.DateFromSelf as SurrealSchema<Date>,
        isOptional: false,
        isId: false,
      }),
    });
  }

  static array<A>(name: string, itemSchema: SurrealSchema<A>) {
    return new SurrealField({
      definition: new SurrealFieldDefinition({
        name,
        type: "array",
        schema: Schema.Array(itemSchema) as SurrealSchema<readonly A[]>,
        isOptional: false,
        isId: false,
      }),
    });
  }

  static record<T extends string>(name: string, tableName: T) {
    return new SurrealField({
      definition: new SurrealFieldDefinition({
        name,
        type: "record",
        schema: Schema.String.pipe(
          Schema.pattern(/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/),
          Schema.brand(`RecordId<${tableName}>`),
        ) as SurrealSchema<any>,
        isOptional: false,
        isId: false,
        references: { table: tableName },
      }),
    });
  }

  static id<T extends string>(tableName: T) {
    return new SurrealField({
      definition: new SurrealFieldDefinition({
        name: "id",
        type: "record",
        schema: Schema.String.pipe(
          Schema.pattern(/^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/),
          Schema.brand(`RecordId<${tableName}>`),
        ) as SurrealSchema<any>,
        isOptional: false,
        isId: true,
        references: { table: tableName },
      }),
    });
  }

  // Fluent API methods - now return new instances due to immutability
  optional(): SurrealField {
    return new SurrealField({
      definition: new SurrealFieldDefinition({
        ...this.definition,
        isOptional: true,
        schema: Schema.optional(this.definition.schema) as SurrealSchema<any>,
      }),
    });
  }

  default(value: string): SurrealField {
    return new SurrealField({
      definition: new SurrealFieldDefinition({
        ...this.definition,
        defaultValue: value,
      }),
    });
  }

  description(desc: string): SurrealField {
    return new SurrealField({
      definition: new SurrealFieldDefinition({
        ...this.definition,
        description: desc,
      }),
    });
  }

  constraints(constraints: Partial<SurrealFieldConstraints>): SurrealField {
    return new SurrealField({
      definition: new SurrealFieldDefinition({
        ...this.definition,
        constraints: new SurrealFieldConstraints(constraints),
      }),
    });
  }

  permissions(permissions: Partial<SurrealFieldPermissions>): SurrealField {
    return new SurrealField({
      definition: new SurrealFieldDefinition({
        ...this.definition,
        permissions: new SurrealFieldPermissions(permissions),
      }),
    });
  }

  min(value: number): SurrealField {
    const existing =
      this.definition.constraints ?? new SurrealFieldConstraints({});
    return this.constraints({
      ...existing,
      min: value,
    });
  }

  max(value: number): SurrealField {
    const existing =
      this.definition.constraints ?? new SurrealFieldConstraints({});
    return this.constraints({
      ...existing,
      max: value,
    });
  }

  length(value: number): SurrealField {
    const existing =
      this.definition.constraints ?? new SurrealFieldConstraints({});
    return this.constraints({
      ...existing,
      length: value,
    });
  }

  pattern(regex: string): SurrealField {
    const existing =
      this.definition.constraints ?? new SurrealFieldConstraints({});
    return this.constraints({
      ...existing,
      pattern: regex,
    });
  }

  unique(): SurrealField {
    const existing =
      this.definition.constraints ?? new SurrealFieldConstraints({});
    return this.constraints({
      ...existing,
      unique: true,
    });
  }

  required(): SurrealField {
    const existing =
      this.definition.constraints ?? new SurrealFieldConstraints({});
    return this.constraints({
      ...existing,
      required: true,
    });
  }

  assert(assertion: string): SurrealField {
    const existing =
      this.definition.constraints ?? new SurrealFieldConstraints({});
    return this.constraints({
      ...existing,
      assert: assertion,
    });
  }

  onDelete(action: "CASCADE" | "SET NULL" | "RESTRICT"): SurrealField {
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
  getName(): string {
    return this.definition.name;
  }

  getType(): SurrealFieldDefinition["type"] {
    return this.definition.type;
  }

  getSchema(): SurrealSchema<any, any> {
    return this.definition.schema;
  }

  isOptionalField(): boolean {
    return this.definition.isOptional;
  }

  isIdField(): boolean {
    return this.definition.isId;
  }

  getConstraints(): SurrealFieldConstraints | undefined {
    return this.definition.constraints;
  }

  getPermissions(): SurrealFieldPermissions | undefined {
    return this.definition.permissions;
  }

  getDefaultValue(): string | undefined {
    return this.definition.defaultValue;
  }

  getDescription(): string | undefined {
    return this.definition.description;
  }

  getReferences(): SurrealFieldDefinition["references"] {
    return this.definition.references;
  }

  // Generate SurrealQL field definition
  toSurrealQL(tableName: string): string {
    const parts: string[] = [];

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
