import { Data, Effect } from "effect";
import type { DiffOperation, SchemaDiff } from "../comparison/diff";
export interface MigrationStatement extends Data.Case {
    readonly _tag: "MigrationStatement";
    readonly type: "table" | "field" | "index" | "event";
    readonly operation: DiffOperation;
    readonly priority: number;
    readonly upSql: string;
    readonly downSql: string;
    readonly description: string;
    readonly tableName?: string;
    readonly dependencies?: readonly string[];
    readonly isBreaking: boolean;
}
export declare const MigrationStatement: Data.Case.Constructor<MigrationStatement, never>;
export interface Migration extends Data.Case {
    readonly _tag: "Migration";
    readonly name: string;
    readonly version: string;
    readonly description: string;
    readonly statements: readonly MigrationStatement[];
    readonly createdAt: Date;
    readonly appliedAt?: Date;
    readonly rolledBackAt?: Date;
}
export declare const Migration: Data.Case.Constructor<Migration, never>;
export declare class MigrationGenerator {
    static generateMigration(diff: SchemaDiff, name?: string, description?: string): Migration;
    private static generateTableStatements;
    private static generateFieldStatements;
    private static generateIndexStatements;
    private static generateEventStatements;
    private static generateTableModificationSql;
    static generateMigrationFile(migration: Migration): string;
    static validateMigration(migration: Migration): Effect.Effect<void, string>;
}
//# sourceMappingURL=generator.d.ts.map