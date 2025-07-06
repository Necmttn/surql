import { AITableHints } from "../ai-metadata";
import { type SurrealSchema } from "./enhanced-schema";
import type { SurrealField } from "./improved-field";
declare const SurrealTablePermissions_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => Readonly<A> & {
    readonly _tag: "SurrealTablePermissions";
};
export declare class SurrealTablePermissions extends SurrealTablePermissions_base<{
    readonly select?: string;
    readonly create?: string;
    readonly update?: string;
    readonly delete?: string;
}> {
}
declare const SurrealTableDefinition_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => Readonly<A> & {
    readonly _tag: "SurrealTableDefinition";
};
export declare class SurrealTableDefinition extends SurrealTableDefinition_base<{
    readonly name: string;
    readonly description?: string;
    readonly fields: readonly SurrealField[];
    readonly permissions?: SurrealTablePermissions;
    readonly schemafull?: boolean;
    readonly drop?: boolean;
    readonly view?: {
        readonly fields: readonly string[];
        readonly condition?: string;
    };
    readonly aiHints?: AITableHints;
}> {
}
declare const SurrealTable_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => Readonly<A> & {
    readonly _tag: "SurrealTable";
};
export declare class SurrealTable extends SurrealTable_base<{
    readonly definition: SurrealTableDefinition;
}> {
    static create(name: string, fields?: readonly SurrealField[]): SurrealTable;
    static schemaless(name: string, fields?: readonly SurrealField[]): SurrealTable;
    static view(name: string, fields: readonly string[], condition?: string): SurrealTable;
    description(desc: string): SurrealTable;
    permissions(permissions: Partial<SurrealTablePermissions>): SurrealTable;
    schemafull(): SurrealTable;
    schemaless(): SurrealTable;
    drop(): SurrealTable;
    view(fields: readonly string[], condition?: string): SurrealTable;
    aiHints(hints: Partial<AITableHints>): SurrealTable;
    aiPrimaryKey(field: string): SurrealTable;
    aiTemporalField(field: string): SurrealTable;
    aiUserField(field: string): SurrealTable;
    aiContentFields(fields: readonly string[]): SurrealTable;
    aiRelationships(relationships: readonly string[] | Record<string, string>): SurrealTable;
    aiCommonQueries(queries: readonly string[]): SurrealTable;
    addField(field: SurrealField): SurrealTable;
    addFields(...fields: readonly SurrealField[]): SurrealTable;
    removeField(fieldName: string): SurrealTable;
    updateField(fieldName: string, updater: (field: SurrealField) => SurrealField): SurrealTable;
    getName(): string;
    getFields(): readonly SurrealField[];
    getField(name: string): SurrealField | undefined;
    hasField(name: string): boolean;
    getIdField(): SurrealField | undefined;
    getPermissions(): SurrealTablePermissions | undefined;
    getDescription(): string | undefined;
    isSchemafull(): boolean;
    isView(): boolean;
    isDrop(): boolean;
    toEffectSchema(): SurrealSchema<any>;
    toTypeScript(): string;
    toTypeScriptTypeName(): string;
    toSurrealQL(): string;
    private getTypeScriptType;
}
export {};
//# sourceMappingURL=improved-table.d.ts.map