import { type SurrealSchema } from "./enhanced-schema";
declare const SurrealFieldConstraints_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => Readonly<A> & {
    readonly _tag: "SurrealFieldConstraints";
};
export declare class SurrealFieldConstraints extends SurrealFieldConstraints_base<{
    readonly min?: number;
    readonly max?: number;
    readonly length?: number;
    readonly pattern?: string;
    readonly enum?: readonly string[];
    readonly unique?: boolean;
    readonly required?: boolean;
    readonly assert?: string;
}> {
}
declare const SurrealFieldPermissions_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => Readonly<A> & {
    readonly _tag: "SurrealFieldPermissions";
};
export declare class SurrealFieldPermissions extends SurrealFieldPermissions_base<{
    readonly select?: string;
    readonly create?: string;
    readonly update?: string;
    readonly delete?: string;
}> {
}
declare const SurrealFieldDefinition_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => Readonly<A> & {
    readonly _tag: "SurrealFieldDefinition";
};
export declare class SurrealFieldDefinition extends SurrealFieldDefinition_base<{
    readonly name: string;
    readonly type: "string" | "number" | "int" | "bool" | "datetime" | "array" | "object" | "record" | "any";
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
}> {
}
declare const SurrealField_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => Readonly<A> & {
    readonly _tag: "SurrealField";
};
export declare class SurrealField extends SurrealField_base<{
    readonly definition: SurrealFieldDefinition;
}> {
    static string(name: string): SurrealField;
    static number(name: string): SurrealField;
    static int(name: string): SurrealField;
    static boolean(name: string): SurrealField;
    static datetime(name: string): SurrealField;
    static array<A>(name: string, itemSchema: SurrealSchema<A>): SurrealField;
    static record<T extends string>(name: string, tableName: T): SurrealField;
    static id<T extends string>(tableName: T): SurrealField;
    optional(): SurrealField;
    default(value: string): SurrealField;
    description(desc: string): SurrealField;
    constraints(constraints: Partial<SurrealFieldConstraints>): SurrealField;
    permissions(permissions: Partial<SurrealFieldPermissions>): SurrealField;
    min(value: number): SurrealField;
    max(value: number): SurrealField;
    length(value: number): SurrealField;
    pattern(regex: string): SurrealField;
    unique(): SurrealField;
    required(): SurrealField;
    assert(assertion: string): SurrealField;
    onDelete(action: "CASCADE" | "SET NULL" | "RESTRICT"): SurrealField;
    getName(): string;
    getType(): SurrealFieldDefinition["type"];
    getSchema(): SurrealSchema<any, any>;
    isOptionalField(): boolean;
    isIdField(): boolean;
    getConstraints(): SurrealFieldConstraints | undefined;
    getPermissions(): SurrealFieldPermissions | undefined;
    getDefaultValue(): string | undefined;
    getDescription(): string | undefined;
    getReferences(): SurrealFieldDefinition["references"];
    toSurrealQL(tableName: string): string;
}
export {};
//# sourceMappingURL=improved-field.d.ts.map