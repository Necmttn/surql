import { Schema } from "effect";
declare const FieldTypeSchema: Schema.Literal<["string", "number", "int", "bool", "datetime", "array", "object", "record", "any"]>;
declare const FieldConstraintsSchema: Schema.Struct<{
    min: Schema.optional<typeof Schema.Number>;
    max: Schema.optional<typeof Schema.Number>;
    length: Schema.optional<typeof Schema.Number>;
    pattern: Schema.optional<typeof Schema.String>;
    enum: Schema.optional<Schema.Array$<typeof Schema.String>>;
    unique: Schema.optional<typeof Schema.Boolean>;
    required: Schema.optional<typeof Schema.Boolean>;
    assert: Schema.optional<typeof Schema.String>;
}>;
declare const FieldPermissionsSchema: Schema.Struct<{
    select: Schema.optional<typeof Schema.String>;
    create: Schema.optional<typeof Schema.String>;
    update: Schema.optional<typeof Schema.String>;
    delete: Schema.optional<typeof Schema.String>;
}>;
declare const FieldReferencesSchema: Schema.Struct<{
    table: Schema.filter<typeof Schema.String>;
    field: Schema.optional<typeof Schema.String>;
    onDelete: Schema.optional<Schema.Literal<["CASCADE", "SET NULL", "RESTRICT"]>>;
}>;
declare const SurrealField_base: Schema.Class<SurrealField, {
    name: Schema.filter<typeof Schema.String>;
    type: Schema.Literal<["string", "number", "int", "bool", "datetime", "array", "object", "record", "any"]>;
    constraints: Schema.optional<Schema.Struct<{
        min: Schema.optional<typeof Schema.Number>;
        max: Schema.optional<typeof Schema.Number>;
        length: Schema.optional<typeof Schema.Number>;
        pattern: Schema.optional<typeof Schema.String>;
        enum: Schema.optional<Schema.Array$<typeof Schema.String>>;
        unique: Schema.optional<typeof Schema.Boolean>;
        required: Schema.optional<typeof Schema.Boolean>;
        assert: Schema.optional<typeof Schema.String>;
    }>>;
    permissions: Schema.optional<Schema.Struct<{
        select: Schema.optional<typeof Schema.String>;
        create: Schema.optional<typeof Schema.String>;
        update: Schema.optional<typeof Schema.String>;
        delete: Schema.optional<typeof Schema.String>;
    }>>;
    defaultValue: Schema.optional<typeof Schema.String>;
    description: Schema.optional<typeof Schema.String>;
    isOptional: typeof Schema.Boolean;
    isId: typeof Schema.Boolean;
    references: Schema.optional<Schema.Struct<{
        table: Schema.filter<typeof Schema.String>;
        field: Schema.optional<typeof Schema.String>;
        onDelete: Schema.optional<Schema.Literal<["CASCADE", "SET NULL", "RESTRICT"]>>;
    }>>;
}, Schema.Struct.Encoded<{
    name: Schema.filter<typeof Schema.String>;
    type: Schema.Literal<["string", "number", "int", "bool", "datetime", "array", "object", "record", "any"]>;
    constraints: Schema.optional<Schema.Struct<{
        min: Schema.optional<typeof Schema.Number>;
        max: Schema.optional<typeof Schema.Number>;
        length: Schema.optional<typeof Schema.Number>;
        pattern: Schema.optional<typeof Schema.String>;
        enum: Schema.optional<Schema.Array$<typeof Schema.String>>;
        unique: Schema.optional<typeof Schema.Boolean>;
        required: Schema.optional<typeof Schema.Boolean>;
        assert: Schema.optional<typeof Schema.String>;
    }>>;
    permissions: Schema.optional<Schema.Struct<{
        select: Schema.optional<typeof Schema.String>;
        create: Schema.optional<typeof Schema.String>;
        update: Schema.optional<typeof Schema.String>;
        delete: Schema.optional<typeof Schema.String>;
    }>>;
    defaultValue: Schema.optional<typeof Schema.String>;
    description: Schema.optional<typeof Schema.String>;
    isOptional: typeof Schema.Boolean;
    isId: typeof Schema.Boolean;
    references: Schema.optional<Schema.Struct<{
        table: Schema.filter<typeof Schema.String>;
        field: Schema.optional<typeof Schema.String>;
        onDelete: Schema.optional<Schema.Literal<["CASCADE", "SET NULL", "RESTRICT"]>>;
    }>>;
}>, never, {
    readonly type: "string" | "number" | "object" | "int" | "bool" | "datetime" | "array" | "record" | "any";
} & {
    readonly isOptional: boolean;
} & {
    readonly isId: boolean;
} & {
    readonly name: string;
} & {
    readonly constraints?: {
        readonly min?: number | undefined;
        readonly length?: number | undefined;
        readonly max?: number | undefined;
        readonly pattern?: string | undefined;
        readonly enum?: readonly string[] | undefined;
        readonly unique?: boolean | undefined;
        readonly required?: boolean | undefined;
        readonly assert?: string | undefined;
    } | undefined;
} & {
    readonly permissions?: {
        readonly select?: string | undefined;
        readonly create?: string | undefined;
        readonly update?: string | undefined;
        readonly delete?: string | undefined;
    } | undefined;
} & {
    readonly defaultValue?: string | undefined;
} & {
    readonly description?: string | undefined;
} & {
    readonly references?: {
        readonly table: string;
        readonly field?: string | undefined;
        readonly onDelete?: "CASCADE" | "SET NULL" | "RESTRICT" | undefined;
    } | undefined;
}, {}, {}>;
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
export declare class SurrealField extends SurrealField_base {
    static validate: (u: unknown, overrideOptions?: import("effect/SchemaAST").ParseOptions) => SurrealField;
    static parse: (u: unknown, overrideOptions?: import("effect/SchemaAST").ParseOptions) => SurrealField;
    static safeParse: (u: unknown, overrideOptions?: import("effect/SchemaAST").ParseOptions) => import("effect/Option").Option<SurrealField>;
    static encode: (a: SurrealField, overrideOptions?: import("effect/SchemaAST").ParseOptions) => {
        readonly type: "string" | "number" | "object" | "int" | "bool" | "datetime" | "array" | "record" | "any";
        readonly isOptional: boolean;
        readonly isId: boolean;
        readonly name: string;
        readonly constraints?: {
            readonly min?: number | undefined;
            readonly length?: number | undefined;
            readonly max?: number | undefined;
            readonly pattern?: string | undefined;
            readonly enum?: readonly string[] | undefined;
            readonly unique?: boolean | undefined;
            readonly required?: boolean | undefined;
            readonly assert?: string | undefined;
        } | undefined;
        readonly permissions?: {
            readonly select?: string | undefined;
            readonly create?: string | undefined;
            readonly update?: string | undefined;
            readonly delete?: string | undefined;
        } | undefined;
        readonly defaultValue?: string | undefined;
        readonly description?: string | undefined;
        readonly references?: {
            readonly table: string;
            readonly field?: string | undefined;
            readonly onDelete?: "CASCADE" | "SET NULL" | "RESTRICT" | undefined;
        } | undefined;
    };
    static decode: (i: {
        readonly type: "string" | "number" | "object" | "int" | "bool" | "datetime" | "array" | "record" | "any";
        readonly isOptional: boolean;
        readonly isId: boolean;
        readonly name: string;
        readonly constraints?: {
            readonly min?: number | undefined;
            readonly length?: number | undefined;
            readonly max?: number | undefined;
            readonly pattern?: string | undefined;
            readonly enum?: readonly string[] | undefined;
            readonly unique?: boolean | undefined;
            readonly required?: boolean | undefined;
            readonly assert?: string | undefined;
        } | undefined;
        readonly permissions?: {
            readonly select?: string | undefined;
            readonly create?: string | undefined;
            readonly update?: string | undefined;
            readonly delete?: string | undefined;
        } | undefined;
        readonly defaultValue?: string | undefined;
        readonly description?: string | undefined;
        readonly references?: {
            readonly table: string;
            readonly field?: string | undefined;
            readonly onDelete?: "CASCADE" | "SET NULL" | "RESTRICT" | undefined;
        } | undefined;
    }, overrideOptions?: import("effect/SchemaAST").ParseOptions) => SurrealField;
    /**
     * Create a string field with the given name
     * @param name - The field name
     * @returns A new SurrealField instance with string type
     */
    static string(name: string): SurrealField;
    static number(name: string): SurrealField;
    static int(name: string): SurrealField;
    static boolean(name: string): SurrealField;
    static datetime(name: string): SurrealField;
    static array(name: string, itemType?: string): SurrealField;
    static object(name: string): SurrealField;
    static record(name: string, table: string): SurrealField;
    static id(table: string): SurrealField;
    static any(name: string): SurrealField;
    /**
     * Create a field from a pre-composed Effect Schema with validation
     * This allows using Schema.pipe patterns for reusable constraints
     * @param name - The field name
     * @param schema - The Effect Schema with validation rules
     * @returns A new SurrealField instance that preserves the schema's validation
     */
    static fromSchema<A, I, R>(name: string, schema: Schema.Schema<A, I, R>): SurrealField;
    /**
     * Create an enum field with predefined values
     * @param name - The field name
     * @param values - Array of allowed enum values
     * @returns A new SurrealField instance with enum constraint
     */
    static enum(name: string, values: string[]): SurrealField;
    optional(): SurrealField;
    /**
     * Add a description to this field
     * @param desc - The field description
     * @returns A new SurrealField instance with the description
     */
    withDescription(desc: string): SurrealField;
    default(value: string): SurrealField;
    withConstraints(constraints: Schema.Schema.Type<typeof FieldConstraintsSchema>): SurrealField;
    withPermissions(permissions: Schema.Schema.Type<typeof FieldPermissionsSchema>): SurrealField;
    min(value: number): SurrealField;
    max(value: number): SurrealField;
    length(value: number): SurrealField;
    pattern(regex: string): SurrealField;
    /**
     * Mark this field as unique (will generate a unique index)
     * @returns A new SurrealField instance with unique constraint
     */
    unique(): SurrealField;
    required(): SurrealField;
    assert(assertion: string): SurrealField;
    onDelete(action: "CASCADE" | "SET NULL" | "RESTRICT"): SurrealField;
    getName(): string;
    getType(): Schema.Schema.Type<typeof FieldTypeSchema>;
    getDescription(): string | undefined;
    getDefaultValue(): string | undefined;
    getConstraints(): Schema.Schema.Type<typeof FieldConstraintsSchema> | undefined;
    getReferences(): Schema.Schema.Type<typeof FieldReferencesSchema> | undefined;
    toSurrealQL(tableName?: string): string;
    static fromSurrealQL(sql: string): SurrealField;
    static diff(oldField: SurrealField, newField: SurrealField): string[];
    toEffectSchema(): string;
}
export type SurrealFieldType = Schema.Schema.Type<typeof SurrealField>;
export type FieldConstraints = Schema.Schema.Type<typeof FieldConstraintsSchema>;
export type FieldPermissions = Schema.Schema.Type<typeof FieldPermissionsSchema>;
export type FieldReferences = Schema.Schema.Type<typeof FieldReferencesSchema>;
export {};
//# sourceMappingURL=field.d.ts.map