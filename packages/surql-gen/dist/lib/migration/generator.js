import { Data, Effect } from "effect";
export const MigrationStatement = Data.case();
export const Migration = Data.case();
// Migration generator
export class MigrationGenerator {
    static generateMigration(diff, name, description) {
        if (!diff.hasChanges) {
            return Migration({
                name: name ?? `migration_${Date.now()}`,
                version: diff.newSchema.getVersion(),
                description: description ?? "No changes detected",
                statements: [],
                createdAt: new Date(),
            });
        }
        const statements = [];
        // Process table diffs
        for (const tableDiff of diff.tableDiffs) {
            statements.push(...MigrationGenerator.generateTableStatements(tableDiff));
        }
        // Process field diffs
        for (const fieldDiff of diff.fieldDiffs) {
            statements.push(...MigrationGenerator.generateFieldStatements(fieldDiff));
        }
        // Process index diffs
        for (const indexDiff of diff.indexDiffs) {
            statements.push(...MigrationGenerator.generateIndexStatements(indexDiff));
        }
        // Process event diffs
        for (const eventDiff of diff.eventDiffs) {
            statements.push(...MigrationGenerator.generateEventStatements(eventDiff));
        }
        // Sort statements by priority
        const sortedStatements = statements.sort((a, b) => a.priority - b.priority);
        return Migration({
            name: name ?? `migration_${Date.now()}`,
            version: diff.newSchema.getVersion(),
            description: description ??
                `Migration from ${diff.oldSchema.getVersion()} to ${diff.newSchema.getVersion()}`,
            statements: sortedStatements,
            createdAt: new Date(),
        });
    }
    static generateTableStatements(tableDiff) {
        const statements = [];
        switch (tableDiff.operation) {
            case "CREATE":
                if (tableDiff.newTable) {
                    statements.push(MigrationStatement({
                        type: "table",
                        operation: "CREATE",
                        priority: 100, // Tables created early
                        upSql: tableDiff.newTable.toSurrealQL(),
                        downSql: `REMOVE TABLE ${tableDiff.tableName}`,
                        description: `Create table ${tableDiff.tableName}`,
                        tableName: tableDiff.tableName,
                        isBreaking: false,
                    }));
                }
                break;
            case "DROP":
                statements.push(MigrationStatement({
                    type: "table",
                    operation: "DROP",
                    priority: 900, // Tables dropped late
                    upSql: `REMOVE TABLE ${tableDiff.tableName}`,
                    downSql: tableDiff.oldTable?.toSurrealQL() ??
                        `-- Cannot recreate table ${tableDiff.tableName}`,
                    description: `Drop table ${tableDiff.tableName}`,
                    tableName: tableDiff.tableName,
                    isBreaking: true,
                }));
                break;
            case "MODIFY":
                if (tableDiff.oldTable && tableDiff.newTable) {
                    // For table modifications, we need to compare the specific changes
                    const tableUpSql = MigrationGenerator.generateTableModificationSql(tableDiff.oldTable, tableDiff.newTable);
                    const tableDownSql = MigrationGenerator.generateTableModificationSql(tableDiff.newTable, tableDiff.oldTable);
                    statements.push(MigrationStatement({
                        type: "table",
                        operation: "MODIFY",
                        priority: 500,
                        upSql: tableUpSql,
                        downSql: tableDownSql,
                        description: `Modify table ${tableDiff.tableName}`,
                        tableName: tableDiff.tableName,
                        isBreaking: false,
                    }));
                }
                break;
        }
        return statements;
    }
    static generateFieldStatements(fieldDiff) {
        const statements = [];
        switch (fieldDiff.operation) {
            case "CREATE":
                if (fieldDiff.newField) {
                    statements.push(MigrationStatement({
                        type: "field",
                        operation: "CREATE",
                        priority: 200, // Fields created after tables
                        upSql: fieldDiff.newField.toSurrealQL(fieldDiff.tableName),
                        downSql: `REMOVE FIELD ${fieldDiff.fieldName} ON ${fieldDiff.tableName}`,
                        description: `Create field ${fieldDiff.tableName}.${fieldDiff.fieldName}`,
                        tableName: fieldDiff.tableName,
                        dependencies: [fieldDiff.tableName],
                        isBreaking: false,
                    }));
                }
                break;
            case "DROP":
                statements.push(MigrationStatement({
                    type: "field",
                    operation: "DROP",
                    priority: 800, // Fields dropped before tables
                    upSql: `REMOVE FIELD ${fieldDiff.fieldName} ON ${fieldDiff.tableName}`,
                    downSql: fieldDiff.oldField?.toSurrealQL(fieldDiff.tableName) ??
                        `-- Cannot recreate field ${fieldDiff.fieldName}`,
                    description: `Drop field ${fieldDiff.tableName}.${fieldDiff.fieldName}`,
                    tableName: fieldDiff.tableName,
                    isBreaking: true,
                }));
                break;
            case "MODIFY":
                if (fieldDiff.newField) {
                    statements.push(MigrationStatement({
                        type: "field",
                        operation: "MODIFY",
                        priority: 600,
                        upSql: fieldDiff.newField.toSurrealQL(fieldDiff.tableName),
                        downSql: fieldDiff.oldField?.toSurrealQL(fieldDiff.tableName) ??
                            `-- Cannot revert field ${fieldDiff.fieldName}`,
                        description: `Modify field ${fieldDiff.tableName}.${fieldDiff.fieldName}`,
                        tableName: fieldDiff.tableName,
                        isBreaking: false, // Depends on the specific change
                    }));
                }
                break;
        }
        return statements;
    }
    static generateIndexStatements(indexDiff) {
        const statements = [];
        switch (indexDiff.operation) {
            case "CREATE":
                if (indexDiff.newIndex) {
                    statements.push(MigrationStatement({
                        type: "index",
                        operation: "CREATE",
                        priority: 300, // Indexes created after fields
                        upSql: indexDiff.newIndex.toSurrealQL(),
                        downSql: `REMOVE INDEX ${indexDiff.indexName} ON ${indexDiff.tableName}`,
                        description: `Create index ${indexDiff.indexName} on ${indexDiff.tableName}`,
                        tableName: indexDiff.tableName,
                        dependencies: [indexDiff.tableName],
                        isBreaking: false,
                    }));
                }
                break;
            case "DROP":
                statements.push(MigrationStatement({
                    type: "index",
                    operation: "DROP",
                    priority: 700, // Indexes dropped before fields
                    upSql: `REMOVE INDEX ${indexDiff.indexName} ON ${indexDiff.tableName}`,
                    downSql: indexDiff.oldIndex?.toSurrealQL() ??
                        `-- Cannot recreate index ${indexDiff.indexName}`,
                    description: `Drop index ${indexDiff.indexName} on ${indexDiff.tableName}`,
                    tableName: indexDiff.tableName,
                    isBreaking: false, // Index drops are usually safe
                }));
                break;
            case "MODIFY":
                // For index modifications, we typically need to drop and recreate
                if (indexDiff.oldIndex && indexDiff.newIndex) {
                    statements.push(MigrationStatement({
                        type: "index",
                        operation: "DROP",
                        priority: 700,
                        upSql: `REMOVE INDEX ${indexDiff.indexName} ON ${indexDiff.tableName}`,
                        downSql: indexDiff.newIndex.toSurrealQL(),
                        description: `Drop index ${indexDiff.indexName} for modification`,
                        tableName: indexDiff.tableName,
                        isBreaking: false,
                    }), MigrationStatement({
                        type: "index",
                        operation: "CREATE",
                        priority: 701,
                        upSql: indexDiff.newIndex.toSurrealQL(),
                        downSql: `REMOVE INDEX ${indexDiff.indexName} ON ${indexDiff.tableName}`,
                        description: `Recreate index ${indexDiff.indexName} with modifications`,
                        tableName: indexDiff.tableName,
                        dependencies: [indexDiff.tableName],
                        isBreaking: false,
                    }));
                }
                break;
        }
        return statements;
    }
    static generateEventStatements(eventDiff) {
        const statements = [];
        switch (eventDiff.operation) {
            case "CREATE":
                if (eventDiff.newEvent) {
                    statements.push(MigrationStatement({
                        type: "event",
                        operation: "CREATE",
                        priority: 400, // Events created after indexes
                        upSql: eventDiff.newEvent.toSurrealQL(),
                        downSql: `REMOVE EVENT ${eventDiff.eventName} ON ${eventDiff.tableName}`,
                        description: `Create event ${eventDiff.eventName} on ${eventDiff.tableName}`,
                        tableName: eventDiff.tableName,
                        dependencies: [eventDiff.tableName],
                        isBreaking: false,
                    }));
                }
                break;
            case "DROP":
                statements.push(MigrationStatement({
                    type: "event",
                    operation: "DROP",
                    priority: 600, // Events dropped before indexes
                    upSql: `REMOVE EVENT ${eventDiff.eventName} ON ${eventDiff.tableName}`,
                    downSql: eventDiff.oldEvent?.toSurrealQL() ??
                        `-- Cannot recreate event ${eventDiff.eventName}`,
                    description: `Drop event ${eventDiff.eventName} on ${eventDiff.tableName}`,
                    tableName: eventDiff.tableName,
                    isBreaking: false,
                }));
                break;
            case "MODIFY":
                if (eventDiff.newEvent) {
                    statements.push(MigrationStatement({
                        type: "event",
                        operation: "MODIFY",
                        priority: 650,
                        upSql: eventDiff.newEvent.toSurrealQL(),
                        downSql: eventDiff.oldEvent?.toSurrealQL() ??
                            `-- Cannot revert event ${eventDiff.eventName}`,
                        description: `Modify event ${eventDiff.eventName} on ${eventDiff.tableName}`,
                        tableName: eventDiff.tableName,
                        isBreaking: false,
                    }));
                }
                break;
        }
        return statements;
    }
    static generateTableModificationSql(oldTable, newTable) {
        // This is a simplified implementation
        // In a real implementation, you'd need to compare specific table properties
        const parts = [];
        // Check for schema mode changes
        if (oldTable.isSchemaFull() !== newTable.isSchemaFull()) {
            const mode = newTable.isSchemaFull() ? "SCHEMAFULL" : "SCHEMALESS";
            parts.push(`ALTER TABLE ${newTable.getName()} ${mode}`);
        }
        // Check for permission changes
        const oldPerms = oldTable.getPermissions();
        const newPerms = newTable.getPermissions();
        if (oldPerms !== newPerms && newPerms) {
            if (newPerms.select) {
                parts.push(`ALTER TABLE ${newTable.getName()} PERMISSIONS FOR select WHERE ${newPerms.select}`);
            }
            if (newPerms.create) {
                parts.push(`ALTER TABLE ${newTable.getName()} PERMISSIONS FOR create WHERE ${newPerms.create}`);
            }
            if (newPerms.update) {
                parts.push(`ALTER TABLE ${newTable.getName()} PERMISSIONS FOR update WHERE ${newPerms.update}`);
            }
            if (newPerms.delete) {
                parts.push(`ALTER TABLE ${newTable.getName()} PERMISSIONS FOR delete WHERE ${newPerms.delete}`);
            }
        }
        return parts.length > 0
            ? parts.join(";\n")
            : `-- No table modifications for ${newTable.getName()}`;
    }
    // Generate migration file content
    static generateMigrationFile(migration) {
        const parts = [];
        // Header
        parts.push(`-- Migration: ${migration.name}`);
        parts.push(`-- Version: ${migration.version}`);
        parts.push(`-- Description: ${migration.description}`);
        parts.push(`-- Created: ${migration.createdAt.toISOString()}`);
        parts.push("");
        // UP migrations
        parts.push("-- UP");
        parts.push("BEGIN TRANSACTION;");
        parts.push("");
        for (const statement of migration.statements) {
            parts.push(`-- ${statement.description}`);
            if (statement.isBreaking) {
                parts.push("-- WARNING: This is a breaking change!");
            }
            parts.push(statement.upSql);
            parts.push("");
        }
        parts.push("COMMIT TRANSACTION;");
        parts.push("");
        // DOWN migrations
        parts.push("-- DOWN");
        parts.push("BEGIN TRANSACTION;");
        parts.push("");
        // Reverse the order for rollback
        const reverseStatements = [...migration.statements].reverse();
        for (const statement of reverseStatements) {
            parts.push(`-- Rollback: ${statement.description}`);
            parts.push(statement.downSql);
            parts.push("");
        }
        parts.push("COMMIT TRANSACTION;");
        return parts.join("\n");
    }
    // Validate migration for safety
    static validateMigration(migration) {
        return Effect.gen(function* (_) {
            const errors = [];
            // Check for breaking changes
            const breakingStatements = migration.statements.filter((s) => s.isBreaking);
            if (breakingStatements.length > 0) {
                const breakingOps = breakingStatements.map((s) => s.description).join(", ");
                errors.push(`Migration contains breaking changes: ${breakingOps}`);
            }
            // Check for dependency violations
            const tableCreations = new Set(migration.statements
                .filter((s) => s.type === "table" && s.operation === "CREATE")
                .map((s) => s.tableName)
                .filter(Boolean));
            for (const statement of migration.statements) {
                if (statement.dependencies) {
                    for (const dep of statement.dependencies) {
                        if (!tableCreations.has(dep)) {
                            errors.push(`Statement "${statement.description}" depends on table ${dep} which is not created in this migration`);
                        }
                    }
                }
            }
            if (errors.length > 0) {
                return yield* _(Effect.fail(errors.join("; ")));
            }
        });
    }
}
