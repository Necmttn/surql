import { Data, Effect, Equal } from "effect";
import type { SurrealEvent } from "../schema/event";
import type { SurrealField } from "../schema/field";
import type { SurrealIndex } from "../schema/index-def";
import type { SurrealSchema } from "../schema/schema";
import type { SurrealTable } from "../schema/table";

// Diff operation types
export type DiffOperation = "CREATE" | "DROP" | "MODIFY";

// Base diff interface
export interface BaseDiff extends Data.Case {
  readonly operation: DiffOperation;
  readonly description: string;
}

// Table diffs
export interface TableDiff extends BaseDiff {
  readonly _tag: "TableDiff";
  readonly tableName: string;
  readonly oldTable?: SurrealTable;
  readonly newTable?: SurrealTable;
}

export const TableDiff = Data.case<TableDiff>();

// Field diffs
export interface FieldDiff extends BaseDiff {
  readonly _tag: "FieldDiff";
  readonly tableName: string;
  readonly fieldName: string;
  readonly oldField?: SurrealField;
  readonly newField?: SurrealField;
}

export const FieldDiff = Data.case<FieldDiff>();

// Index diffs
export interface IndexDiff extends BaseDiff {
  readonly _tag: "IndexDiff";
  readonly indexName: string;
  readonly tableName: string;
  readonly oldIndex?: SurrealIndex;
  readonly newIndex?: SurrealIndex;
}

export const IndexDiff = Data.case<IndexDiff>();

// Event diffs
export interface EventDiff extends BaseDiff {
  readonly _tag: "EventDiff";
  readonly eventName: string;
  readonly tableName: string;
  readonly oldEvent?: SurrealEvent;
  readonly newEvent?: SurrealEvent;
}

export const EventDiff = Data.case<EventDiff>();

// Schema diff result
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

export const SchemaDiff = Data.case<SchemaDiff>();

// Schema comparison engine
export class SchemaComparator {
  static compare(oldSchema: SurrealSchema, newSchema: SurrealSchema): SchemaDiff {
    const tableDiffs = SchemaComparator.compareTablesStructural(oldSchema, newSchema);
    const fieldDiffs = SchemaComparator.compareFields(oldSchema, newSchema);
    const indexDiffs = SchemaComparator.compareIndexes(oldSchema, newSchema);
    const eventDiffs = SchemaComparator.compareEvents(oldSchema, newSchema);

    const hasChanges =
      tableDiffs.length > 0 ||
      fieldDiffs.length > 0 ||
      indexDiffs.length > 0 ||
      eventDiffs.length > 0;

    return SchemaDiff({
      oldSchema,
      newSchema,
      tableDiffs,
      fieldDiffs,
      indexDiffs,
      eventDiffs,
      hasChanges,
    });
  }

  private static compareTablesStructural(
    oldSchema: SurrealSchema,
    newSchema: SurrealSchema
  ): readonly TableDiff[] {
    const diffs: TableDiff[] = [];
    const oldTables = new Map(oldSchema.getTables().map((t) => [t.getName(), t]));
    const newTables = new Map(newSchema.getTables().map((t) => [t.getName(), t]));

    // Find dropped tables
    for (const [tableName, oldTable] of oldTables) {
      if (!newTables.has(tableName)) {
        diffs.push(
          TableDiff({
            operation: "DROP",
            tableName,
            oldTable,
            description: `Drop table ${tableName}`,
          })
        );
      }
    }

    // Find created tables
    for (const [tableName, newTable] of newTables) {
      if (!oldTables.has(tableName)) {
        diffs.push(
          TableDiff({
            operation: "CREATE",
            tableName,
            newTable,
            description: `Create table ${tableName}`,
          })
        );
      }
    }

    // Find modified tables (using structural comparison)
    for (const [tableName, newTable] of newTables) {
      const oldTable = oldTables.get(tableName);
      if (oldTable && SchemaComparator.hasTableChanges(oldTable, newTable)) {
        diffs.push(
          TableDiff({
            operation: "MODIFY",
            tableName,
            oldTable,
            newTable,
            description: `Modify table ${tableName}`,
          })
        );
      }
    }

    return diffs;
  }

  private static hasTableChanges(oldTable: SurrealTable, newTable: SurrealTable): boolean {
    // Compare basic properties
    if (oldTable.getName() !== newTable.getName()) return true;
    if (oldTable.isSchemaFull() !== newTable.isSchemaFull()) return true;
    if (oldTable.isView() !== newTable.isView()) return true;
    if (oldTable.drop !== newTable.drop) return true;
    if (oldTable.getDescription() !== newTable.getDescription()) return true;

    // Compare AI metadata
    const oldHints = oldTable.getAiHints();
    const newHints = newTable.getAiHints();

    if (oldHints?.primary_key !== newHints?.primary_key) return true;
    if (oldHints?.temporal_field !== newHints?.temporal_field) return true;
    if (oldHints?.user_field !== newHints?.user_field) return true;
    if (JSON.stringify(oldHints?.content_fields) !== JSON.stringify(newHints?.content_fields))
      return true;
    if (JSON.stringify(oldHints?.common_queries) !== JSON.stringify(newHints?.common_queries))
      return true;
    if (JSON.stringify(oldHints?.relationships) !== JSON.stringify(newHints?.relationships))
      return true;

    // Compare fields count
    if (oldTable.getFields().length !== newTable.getFields().length) return true;

    // Compare field names and types
    const oldFields = new Map(oldTable.getFields().map((f) => [f.getName(), f]));
    const newFields = new Map(newTable.getFields().map((f) => [f.getName(), f]));

    for (const [fieldName, oldField] of oldFields) {
      const newField = newFields.get(fieldName);
      if (!newField) return true;
      if (SchemaComparator.hasFieldChanges(oldField, newField)) return true;
    }

    for (const [fieldName] of newFields) {
      if (!oldFields.has(fieldName)) return true;
    }

    return false;
  }

  private static hasFieldChanges(oldField: SurrealField, newField: SurrealField): boolean {
    if (oldField.getName() !== newField.getName()) return true;
    if (oldField.getType() !== newField.getType()) return true;
    if (oldField.isOptional !== newField.isOptional) return true;
    if (oldField.isId !== newField.isId) return true;
    if (oldField.getDefaultValue() !== newField.getDefaultValue()) return true;
    if (oldField.getDescription() !== newField.getDescription()) return true;

    // Compare constraints
    const oldConstraints = oldField.getConstraints();
    const newConstraints = newField.getConstraints();

    if (oldConstraints?.unique !== newConstraints?.unique) return true;
    if (oldConstraints?.pattern !== newConstraints?.pattern) return true;
    if (oldConstraints?.length !== newConstraints?.length) return true;
    if (oldConstraints?.min !== newConstraints?.min) return true;
    if (oldConstraints?.max !== newConstraints?.max) return true;

    return false;
  }

  private static hasIndexChanges(oldIndex: SurrealIndex, newIndex: SurrealIndex): boolean {
    if (oldIndex.getName() !== newIndex.getName()) return true;
    if (oldIndex.getTable() !== newIndex.getTable()) return true;
    if (oldIndex.getType() !== newIndex.getType()) return true;
    if (JSON.stringify(oldIndex.getFields()) !== JSON.stringify(newIndex.getFields())) return true;
    if (oldIndex.unique !== newIndex.unique) return true;
    if (oldIndex.fulltext !== newIndex.fulltext) return true;
    if (oldIndex.getCondition() !== newIndex.getCondition()) return true;
    if (oldIndex.getDescription() !== newIndex.getDescription()) return true;

    return false;
  }

  private static hasEventChanges(oldEvent: SurrealEvent, newEvent: SurrealEvent): boolean {
    if (oldEvent.getName() !== newEvent.getName()) return true;
    if (oldEvent.getTable() !== newEvent.getTable()) return true;
    if (oldEvent.getTiming() !== newEvent.getTiming()) return true;
    if (oldEvent.getAction() !== newEvent.getAction()) return true;
    if (oldEvent.getCondition() !== newEvent.getCondition()) return true;
    if (oldEvent.getThen() !== newEvent.getThen()) return true;
    if (oldEvent.getDescription() !== newEvent.getDescription()) return true;

    return false;
  }

  private static compareFields(
    oldSchema: SurrealSchema,
    newSchema: SurrealSchema
  ): readonly FieldDiff[] {
    const diffs: FieldDiff[] = [];
    const commonTableNames = new Set([...oldSchema.getTableNames(), ...newSchema.getTableNames()]);

    for (const tableName of commonTableNames) {
      const oldTable = oldSchema.getTable(tableName);
      const newTable = newSchema.getTable(tableName);

      // Skip if either table doesn't exist (handled by table diffs)
      if (!oldTable || !newTable) {
        continue;
      }

      const oldFields = new Map(oldTable.getFields().map((f) => [f.getName(), f]));
      const newFields = new Map(newTable.getFields().map((f) => [f.getName(), f]));

      // Find dropped fields
      for (const [fieldName, oldField] of oldFields) {
        if (!newFields.has(fieldName)) {
          diffs.push(
            FieldDiff({
              operation: "DROP",
              tableName,
              fieldName,
              oldField,
              description: `Drop field ${tableName}.${fieldName}`,
            })
          );
        }
      }

      // Find created fields
      for (const [fieldName, newField] of newFields) {
        if (!oldFields.has(fieldName)) {
          diffs.push(
            FieldDiff({
              operation: "CREATE",
              tableName,
              fieldName,
              newField,
              description: `Create field ${tableName}.${fieldName}`,
            })
          );
        }
      }

      // Find modified fields (using structural comparison)
      for (const [fieldName, newField] of newFields) {
        const oldField = oldFields.get(fieldName);
        if (oldField && SchemaComparator.hasFieldChanges(oldField, newField)) {
          diffs.push(
            FieldDiff({
              operation: "MODIFY",
              tableName,
              fieldName,
              oldField,
              newField,
              description: `Modify field ${tableName}.${fieldName}`,
            })
          );
        }
      }
    }

    return diffs;
  }

  private static compareIndexes(
    oldSchema: SurrealSchema,
    newSchema: SurrealSchema
  ): readonly IndexDiff[] {
    const diffs: IndexDiff[] = [];
    const oldIndexes = new Map(oldSchema.getIndexes().map((i) => [i.getName(), i]));
    const newIndexes = new Map(newSchema.getIndexes().map((i) => [i.getName(), i]));

    // Find dropped indexes
    for (const [indexName, oldIndex] of oldIndexes) {
      if (!newIndexes.has(indexName)) {
        diffs.push(
          IndexDiff({
            operation: "DROP",
            indexName,
            tableName: oldIndex.getTable(),
            oldIndex,
            description: `Drop index ${indexName} on ${oldIndex.getTable()}`,
          })
        );
      }
    }

    // Find created indexes
    for (const [indexName, newIndex] of newIndexes) {
      if (!oldIndexes.has(indexName)) {
        diffs.push(
          IndexDiff({
            operation: "CREATE",
            indexName,
            tableName: newIndex.getTable(),
            newIndex,
            description: `Create index ${indexName} on ${newIndex.getTable()}`,
          })
        );
      }
    }

    // Find modified indexes (using structural comparison)
    for (const [indexName, newIndex] of newIndexes) {
      const oldIndex = oldIndexes.get(indexName);
      if (oldIndex && SchemaComparator.hasIndexChanges(oldIndex, newIndex)) {
        diffs.push(
          IndexDiff({
            operation: "MODIFY",
            indexName,
            tableName: newIndex.getTable(),
            oldIndex,
            newIndex,
            description: `Modify index ${indexName} on ${newIndex.getTable()}`,
          })
        );
      }
    }

    return diffs;
  }

  private static compareEvents(
    oldSchema: SurrealSchema,
    newSchema: SurrealSchema
  ): readonly EventDiff[] {
    const diffs: EventDiff[] = [];
    const oldEvents = new Map(oldSchema.getEvents().map((e) => [e.getName(), e]));
    const newEvents = new Map(newSchema.getEvents().map((e) => [e.getName(), e]));

    // Find dropped events
    for (const [eventName, oldEvent] of oldEvents) {
      if (!newEvents.has(eventName)) {
        diffs.push(
          EventDiff({
            operation: "DROP",
            eventName,
            tableName: oldEvent.getTable(),
            oldEvent,
            description: `Drop event ${eventName} on ${oldEvent.getTable()}`,
          })
        );
      }
    }

    // Find created events
    for (const [eventName, newEvent] of newEvents) {
      if (!oldEvents.has(eventName)) {
        diffs.push(
          EventDiff({
            operation: "CREATE",
            eventName,
            tableName: newEvent.getTable(),
            newEvent,
            description: `Create event ${eventName} on ${newEvent.getTable()}`,
          })
        );
      }
    }

    // Find modified events (using structural comparison)
    for (const [eventName, newEvent] of newEvents) {
      const oldEvent = oldEvents.get(eventName);
      if (oldEvent && SchemaComparator.hasEventChanges(oldEvent, newEvent)) {
        diffs.push(
          EventDiff({
            operation: "MODIFY",
            eventName,
            tableName: newEvent.getTable(),
            oldEvent,
            newEvent,
            description: `Modify event ${eventName} on ${newEvent.getTable()}`,
          })
        );
      }
    }

    return diffs;
  }
}

// Helper functions for working with diffs
export const SchemaComparisonUtils = {
  // Check if schemas are equal
  schemasEqual(schema1: SurrealSchema, schema2: SurrealSchema): boolean {
    return Equal.equals(schema1.registry, schema2.registry);
  },

  // Get summary of changes
  getSummary(diff: SchemaDiff): string {
    const summaryParts: string[] = [];

    if (diff.tableDiffs.length > 0) {
      summaryParts.push(`${diff.tableDiffs.length} table changes`);
    }

    if (diff.fieldDiffs.length > 0) {
      summaryParts.push(`${diff.fieldDiffs.length} field changes`);
    }

    if (diff.indexDiffs.length > 0) {
      summaryParts.push(`${diff.indexDiffs.length} index changes`);
    }

    if (diff.eventDiffs.length > 0) {
      summaryParts.push(`${diff.eventDiffs.length} event changes`);
    }

    return summaryParts.length > 0 ? summaryParts.join(", ") : "No changes detected";
  },

  // Get changes by operation type
  getChangesByOperation(diff: SchemaDiff, operation: DiffOperation) {
    return {
      tables: diff.tableDiffs.filter((d) => d.operation === operation),
      fields: diff.fieldDiffs.filter((d) => d.operation === operation),
      indexes: diff.indexDiffs.filter((d) => d.operation === operation),
      events: diff.eventDiffs.filter((d) => d.operation === operation),
    };
  },

  // Check if diff has breaking changes
  hasBreakingChanges(diff: SchemaDiff): boolean {
    // Dropped tables, fields, indexes, or events are potentially breaking
    const drops = this.getChangesByOperation(diff, "DROP");
    return drops.tables.length > 0 || drops.fields.length > 0;
  },

  // Check if diff has only safe changes
  hasOnlySafeChanges(diff: SchemaDiff): boolean {
    // Only creates and non-breaking modifications are safe
    return !this.hasBreakingChanges(diff);
  },
};
