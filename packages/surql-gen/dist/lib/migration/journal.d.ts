import { Data, Effect } from "effect";
export interface MigrationEntry extends Data.TaggedClass<"MigrationEntry"> {
    readonly idx: number;
    readonly version: string;
    readonly when: number;
    readonly tag: string;
    readonly breakpoints: boolean;
    readonly description?: string;
    readonly author?: string;
}
declare const MigrationEntry_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => Readonly<A> & {
    readonly _tag: "MigrationEntry";
};
export declare class MigrationEntry extends MigrationEntry_base<{
    readonly idx: number;
    readonly version: string;
    readonly when: number;
    readonly tag: string;
    readonly breakpoints: boolean;
    readonly description?: string;
    readonly author?: string;
}> {
}
declare const MigrationJournal_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => Readonly<A> & {
    readonly _tag: "MigrationJournal";
};
export declare class MigrationJournal extends MigrationJournal_base<{
    readonly version: string;
    readonly dialect: "surrealdb";
    readonly entries: readonly MigrationEntry[];
}> {
}
declare const MigrationSnapshot_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => Readonly<A> & {
    readonly _tag: "MigrationSnapshot";
};
export declare class MigrationSnapshot extends MigrationSnapshot_base<{
    readonly version: string;
    readonly timestamp: number;
    readonly tables: Record<string, any>;
    readonly indexes: Record<string, any>;
    readonly events: Record<string, any>;
    readonly functions: Record<string, any>;
    readonly _meta: {
        readonly generator: string;
        readonly version: string;
    };
}> {
}
declare const MigrationJournalService_base: Effect.Service.Class<MigrationJournalService, "MigrationJournalService", {
    readonly effect: Effect.Effect<{
        readonly ensureDirectoryStructure: Effect.Effect<string | undefined, never, never>;
        readonly loadJournal: Effect.Effect<MigrationJournal, never, never>;
        readonly saveJournal: (journal: MigrationJournal) => Effect.Effect<void, never, never>;
        readonly addMigration: (journal: MigrationJournal, tag: string, description?: string, author?: string) => MigrationJournal;
        readonly generateMigrationTag: (description: string) => string;
        readonly createSnapshot: (tables: Record<string, any>, indexes?: Record<string, any>, events?: Record<string, any>, functions?: Record<string, any>) => MigrationSnapshot;
        readonly saveSnapshot: (snapshot: MigrationSnapshot, tag: string) => Effect.Effect<void, never, never>;
        readonly loadSnapshot: (tag: string) => Effect.Effect<MigrationSnapshot | undefined, never, never>;
        readonly getLatestMigration: (journal: MigrationJournal) => MigrationEntry | undefined;
        readonly createMigrationFiles: (tag: string, upSql: string, downSql: string, snapshot: MigrationSnapshot) => Effect.Effect<void, never, never>;
    }, never, never>;
}>;
export declare class MigrationJournalService extends MigrationJournalService_base {
}
export {};
//# sourceMappingURL=journal.d.ts.map