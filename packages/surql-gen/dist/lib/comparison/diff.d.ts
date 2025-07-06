import { Data } from "effect";
import type { SurrealEvent } from "../schema/event";
import type { SurrealField } from "../schema/field";
import type { SurrealIndex } from "../schema/index-def";
import type { SurrealSchema } from "../schema/schema";
import type { SurrealTable } from "../schema/table";
export type DiffOperation = "CREATE" | "DROP" | "MODIFY";
export interface BaseDiff extends Data.Case {
    readonly operation: DiffOperation;
    readonly description: string;
}
export interface TableDiff extends BaseDiff {
    readonly _tag: "TableDiff";
    readonly tableName: string;
    readonly oldTable?: SurrealTable;
    readonly newTable?: SurrealTable;
}
export declare const TableDiff: Data.Case.Constructor<TableDiff, never>;
export interface FieldDiff extends BaseDiff {
    readonly _tag: "FieldDiff";
    readonly tableName: string;
    readonly fieldName: string;
    readonly oldField?: SurrealField;
    readonly newField?: SurrealField;
}
export declare const FieldDiff: Data.Case.Constructor<FieldDiff, never>;
export interface IndexDiff extends BaseDiff {
    readonly _tag: "IndexDiff";
    readonly indexName: string;
    readonly tableName: string;
    readonly oldIndex?: SurrealIndex;
    readonly newIndex?: SurrealIndex;
}
export declare const IndexDiff: Data.Case.Constructor<IndexDiff, never>;
export interface EventDiff extends BaseDiff {
    readonly _tag: "EventDiff";
    readonly eventName: string;
    readonly tableName: string;
    readonly oldEvent?: SurrealEvent;
    readonly newEvent?: SurrealEvent;
}
export declare const EventDiff: Data.Case.Constructor<EventDiff, never>;
export interface SchemaDiff extends Data.Case {
    readonly _tag: "SchemaDiff";
    readonly oldSchema: SurrealSchema;
    readonly newSchema: SurrealSchema;
    readonly tableDiffs: readonly TableDiff[];
    readonly fieldDiffs: readonly FieldDiff[];
    readonly indexDiffs: readonly IndexDiff[];
    readonly eventDiffs: readonly EventDiff[];
    readonly hasChanges: boolean;
}
export declare const SchemaDiff: Data.Case.Constructor<SchemaDiff, never>;
export declare class SchemaComparator {
    static compare(oldSchema: SurrealSchema, newSchema: SurrealSchema): SchemaDiff;
    private static compareTablesStructural;
    private static hasTableChanges;
    private static hasFieldChanges;
    private static hasIndexChanges;
    private static hasEventChanges;
    private static compareFields;
    private static compareIndexes;
    private static compareEvents;
}
export declare const SchemaComparisonUtils: {
    schemasEqual(schema1: SurrealSchema, schema2: SurrealSchema): boolean;
    getSummary(diff: SchemaDiff): string;
    getChangesByOperation(diff: SchemaDiff, operation: DiffOperation): {
        tables: TableDiff[];
        fields: FieldDiff[];
        indexes: IndexDiff[];
        events: EventDiff[];
    };
    hasBreakingChanges(diff: SchemaDiff): boolean;
    hasOnlySafeChanges(diff: SchemaDiff): boolean;
};
//# sourceMappingURL=diff.d.ts.map