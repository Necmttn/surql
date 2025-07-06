import { Effect } from "effect";
declare const SchemaServiceError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => import("effect/Cause").YieldableError & {
    readonly _tag: "SchemaServiceError";
} & Readonly<A>;
export declare class SchemaServiceError extends SchemaServiceError_base<{
    readonly cause?: unknown;
    readonly message: string;
    readonly operation?: string;
}> {
}
declare const SchemaMigrationError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => import("effect/Cause").YieldableError & {
    readonly _tag: "SchemaMigrationError";
} & Readonly<A>;
export declare class SchemaMigrationError extends SchemaMigrationError_base<{
    readonly cause?: unknown;
    readonly message: string;
    readonly migration?: string;
}> {
}
declare const SchemaMetadata_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => Readonly<A> & {
    readonly _tag: "SchemaMetadata";
};
export declare class SchemaMetadata extends SchemaMetadata_base<{
    readonly name: string;
    readonly version: string;
    readonly appliedAt: Date;
    readonly checksum: string;
    readonly description?: string;
}> {
}
declare const MigrationRecord_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => Readonly<A> & {
    readonly _tag: "MigrationRecord";
};
export declare class MigrationRecord extends MigrationRecord_base<{
    readonly name: string;
    readonly version: string;
    readonly checksum: string;
    readonly appliedAt: Date;
    readonly rolledBackAt?: Date;
    readonly executionTimeMs: number;
    readonly statements: number;
    readonly isBreaking: boolean;
}> {
}
declare const SchemaManagementService_base: Effect.Service.Class<SchemaManagementService, "SchemaManagementService", {
    readonly effect: Effect.Effect<Record<PropertyKey, any> & {}, any, any>;
}>;
export declare class SchemaManagementService extends SchemaManagementService_base {
}
export {};
//# sourceMappingURL=schema-service.d.ts.map