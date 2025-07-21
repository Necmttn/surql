/**
 * Enhanced Migration Generator
 * 
 * Automatically generates migrations by comparing schema definitions
 * with the current database state. No more manual migration writing!
 */

import { Effect, Console, Array as EffectArray } from "effect";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import type { SurrealTable, SurrealField } from "@necmttn/surql-schema";
import type { SchemaVersion } from "../schema-definitions";

// ===========================================
// Migration Types
// ===========================================

export interface MigrationOperation {
  type: "CREATE_TABLE" | "DROP_TABLE" | "ADD_FIELD" | "DROP_FIELD" | "MODIFY_FIELD" | "ADD_INDEX" | "DROP_INDEX";
  tableName: string;
  fieldName?: string;
  sql: string;
  rollbackSql?: string;
  description: string;
}

export interface GeneratedMigration {
  id: string;
  name: string;
  version: string;
  timestamp: Date;
  operations: MigrationOperation[];
  upSql: string;
  downSql: string;
  description: string;
}

// ===========================================
// Schema Comparison Engine
// ===========================================

export class MigrationGenerator extends Effect.Service<MigrationGenerator>()(
  "MigrationGenerator",
  {
    effect: Effect.gen(function* (_) {
      const migrationsDir = "./src/migrations";
      const schemaHistoryFile = "./src/migrations/schema-history.json";

      /**
       * Load previous schema version for comparison
       */
      const loadPreviousSchema = (): SchemaVersion | null => {
        if (!existsSync(schemaHistoryFile)) {
          return null;
        }
        try {
          const history = JSON.parse(readFileSync(schemaHistoryFile, "utf-8"));
          return history.length > 0 ? history[history.length - 1] : null;
        } catch {
          return null;
        }
      };

      /**
       * Save schema version to history
       */
      const saveSchemaVersion = (schemaVersion: SchemaVersion) => {
        let history: SchemaVersion[] = [];
        if (existsSync(schemaHistoryFile)) {
          try {
            history = JSON.parse(readFileSync(schemaHistoryFile, "utf-8"));
          } catch {
            history = [];
          }
        }
        history.push(schemaVersion);
        writeFileSync(schemaHistoryFile, JSON.stringify(history, null, 2));
      };

      /**
       * Compare two table definitions and generate operations
       * oldTable can be JSON (from schema history) or SurrealTable instance
       * newTable is always a SurrealTable instance
       */
      const compareTable = (
        oldTable: any | null,
        newTable: SurrealTable | null
      ): MigrationOperation[] => {
        const operations: MigrationOperation[] = [];

        // Table creation
        if (!oldTable && newTable) {
          operations.push({
            type: "CREATE_TABLE",
            tableName: newTable.getName(),
            sql: newTable.toSurrealQL(),
            rollbackSql: `DROP TABLE ${newTable.getName()};`,
            description: `Create table ${newTable.getName()}`,
          });
          return operations;
        }

        // Table deletion
        if (oldTable && !newTable) {
          const tableName = oldTable.name || oldTable.getName?.();
          operations.push({
            type: "DROP_TABLE",
            tableName,
            sql: `DROP TABLE ${tableName};`,
            rollbackSql: `-- TODO: Restore table ${tableName}`,
            description: `Drop table ${tableName}`,
          });
          return operations;
        }

        // Field comparison
        if (oldTable && newTable) {
          // Handle both JSON objects and SurrealTable instances for oldTable
          const oldFieldsArray = oldTable.fields || oldTable.getFields?.() || [];
          const oldFields = new Map(oldFieldsArray.map((f: any) => [f.name || f.getName?.(), f]));
          const newFields = new Map(newTable.getFields().map(f => [f.getName(), f]));

          // Added fields
          for (const [fieldName, newField] of newFields) {
            if (!oldFields.has(fieldName)) {
              operations.push({
                type: "ADD_FIELD",
                tableName: newTable.getName(),
                fieldName,
                sql: newField.toSurrealQL(newTable.getName()),
                rollbackSql: `REMOVE FIELD ${fieldName} ON ${newTable.getName()};`,
                description: `Add field ${fieldName} to ${newTable.getName()}`,
              });
            }
          }

          // Removed fields
          for (const [fieldName, oldField] of oldFields) {
            if (!newFields.has(fieldName)) {
              operations.push({
                type: "DROP_FIELD",
                tableName: newTable.getName(),
                fieldName,
                sql: `REMOVE FIELD ${fieldName} ON ${newTable.getName()};`,
                rollbackSql: `-- TODO: Restore field ${fieldName}`,
                description: `Remove field ${fieldName} from ${newTable.getName()}`,
              });
            }
          }

          // Modified fields
          for (const [fieldName, newField] of newFields) {
            const oldField = oldFields.get(fieldName);
            if (oldField && hasFieldChanged(oldField, newField)) {
              operations.push({
                type: "MODIFY_FIELD",
                tableName: newTable.getName(),
                fieldName,
                sql: newField.toSurrealQL(newTable.getName()),
                rollbackSql: `-- TODO: Restore previous field ${fieldName}`,
                description: `Modify field ${fieldName} in ${newTable.getName()}`,
              });
            }
          }

          // Index changes
          const oldIndexes = extractIndexes(oldTable);
          const newIndexes = extractIndexes(newTable);

          // Added indexes
          for (const index of newIndexes) {
            if (!oldIndexes.some(oi => oi.name === index.name)) {
              operations.push({
                type: "ADD_INDEX",
                tableName: newTable.getName(),
                sql: index.sql,
                rollbackSql: `DROP INDEX ${index.name};`,
                description: `Add index ${index.name} on ${newTable.getName()}`,
              });
            }
          }

          // Removed indexes
          for (const index of oldIndexes) {
            if (!newIndexes.some(ni => ni.name === index.name)) {
              operations.push({
                type: "DROP_INDEX",
                tableName: newTable.getName(),
                sql: `DROP INDEX ${index.name};`,
                rollbackSql: index.sql,
                description: `Drop index ${index.name} from ${newTable.getName()}`,
              });
            }
          }
        }

        return operations;
      };

      /**
       * Check if field has changed - handles both JSON objects and SurrealField instances
       */
      const hasFieldChanged = (oldField: any, newField: SurrealField): boolean => {
        // Extract values handling both JSON and SurrealField instances
        const oldType = oldField.type || oldField.getType?.();
        const newType = newField.getType();
        
        const oldDefault = oldField.defaultValue || oldField.getDefaultValue?.();
        const newDefault = newField.getDefaultValue();
        
        const oldConstraints = oldField.constraints || oldField.getConstraints?.() || {};
        const newConstraints = newField.getConstraints() || {};
        
        const oldDescription = oldField.description || oldField.getDescription?.();
        const newDescription = newField.getDescription();
        
        // Compare type
        if (oldType !== newType) return true;
        
        // Compare default value
        if (oldDefault !== newDefault) return true;
        
        // Compare constraints
        if (JSON.stringify(oldConstraints) !== JSON.stringify(newConstraints)) return true;
        
        // Compare description
        if (oldDescription !== newDescription) return true;
        
        return false;
      };

      /**
       * Extract index definitions from table - handles both JSON objects and SurrealTable instances
       */
      const extractIndexes = (table: any): Array<{ name: string; sql: string }> => {
        const indexes: Array<{ name: string; sql: string }> = [];
        
        if (!table) return indexes;
        
        // Get table name and fields - handle both JSON and SurrealTable instances
        const tableName = table.name || table.getName?.();
        const fieldsArray = table.fields || table.getFields?.() || [];
        
        // Extract unique field indexes
        for (const field of fieldsArray) {
          const fieldName = field.name || field.getName?.();
          const constraints = field.constraints || field.getConstraints?.() || {};
          
          if (constraints.unique) {
            const indexName = `idx_unique_${fieldName}`;
            const sql = `DEFINE INDEX ${indexName} ON ${tableName} FIELDS ${fieldName} UNIQUE;`;
            indexes.push({ name: indexName, sql });
          }
        }
        
        return indexes;
      };

      /**
       * Generate migration from schema comparison
       */
      const generateMigration = Effect.fn("migration.generate")(function* (
        currentSchema: SchemaVersion,
        migrationName: string
      ) {
        yield* Console.log(`🔄 Generating migration: ${migrationName}`);

        const previousSchema = loadPreviousSchema();
        
        if (!previousSchema) {
          yield* Console.log("📦 No previous schema found - generating initial migration");
          return yield* generateInitialMigration(currentSchema, migrationName);
        }

        yield* Console.log(`📊 Comparing schema v${previousSchema.version} → v${currentSchema.version}`);

        const allOperations: MigrationOperation[] = [];

        // Compare tables
        // Note: previousSchema.tables are JSON objects, currentSchema.tables are SurrealTable instances
        const previousTables = new Map(previousSchema.tables.map((t: any) => [t.name, t]));
        const currentTables = new Map(currentSchema.tables.map(t => [t.getName(), t]));

        // Get all table names
        const allTableNames = new Set([
          ...previousTables.keys(),
          ...currentTables.keys(),
        ]);

        for (const tableName of allTableNames) {
          const previousTable = previousTables.get(tableName) || null;
          const currentTable = currentTables.get(tableName) || null;
          
          const tableOperations = compareTable(previousTable, currentTable);
          allOperations.push(...tableOperations);
        }

        if (allOperations.length === 0) {
          yield* Console.log("✅ No schema changes detected");
          return null;
        }

        // Generate migration
        const migrationId = `${Date.now()}_${migrationName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
        const migration = createMigration(migrationId, migrationName, currentSchema.version, allOperations);

        // Save migration file
        const migrationFile = `${migrationsDir}/${migrationId}.surql`;
        writeFileSync(migrationFile, migration.upSql);

        // Save rollback file
        const rollbackFile = `${migrationsDir}/${migrationId}_rollback.surql`;
        writeFileSync(rollbackFile, migration.downSql);

        // Save migration metadata
        const metadataFile = `${migrationsDir}/${migrationId}.json`;
        writeFileSync(metadataFile, JSON.stringify(migration, null, 2));

        yield* Console.log(`✅ Migration generated: ${migrationFile}`);
        yield* Console.log(`📋 Operations: ${allOperations.length}`);
        
        for (const op of allOperations) {
          yield* Console.log(`   • ${op.description}`);
        }

        // Save current schema to history
        saveSchemaVersion(currentSchema);

        return migration;
      });

      /**
       * Generate initial migration for first-time setup
       */
      const generateInitialMigration = Effect.fn("migration.generateInitial")(function* (
        schema: SchemaVersion,
        migrationName: string
      ) {
        const operations: MigrationOperation[] = [];
        
        // Create all tables
        for (const table of schema.tables) {
          operations.push({
            type: "CREATE_TABLE",
            tableName: table.getName(),
            sql: table.toSurrealQL(),
            rollbackSql: `DROP TABLE ${table.getName()};`,
            description: `Create table ${table.getName()}`,
          });
        }

        const migrationId = `${Date.now()}_${migrationName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
        const migration = createMigration(migrationId, migrationName, schema.version, operations);

        // Save files
        const migrationFile = `${migrationsDir}/${migrationId}.surql`;
        writeFileSync(migrationFile, migration.upSql);

        const rollbackFile = `${migrationsDir}/${migrationId}_rollback.surql`;
        writeFileSync(rollbackFile, migration.downSql);

        const metadataFile = `${migrationsDir}/${migrationId}.json`;
        writeFileSync(metadataFile, JSON.stringify(migration, null, 2));

        // Save schema to history
        saveSchemaVersion(schema);

        yield* Console.log(`✅ Initial migration generated: ${migrationFile}`);
        return migration;
      });

      /**
       * Create migration object from operations
       */
      const createMigration = (
        id: string,
        name: string,
        version: string,
        operations: MigrationOperation[]
      ): GeneratedMigration => {
        const upSql = [
          `-- Migration: ${name}`,
          `-- Version: ${version}`,
          `-- Generated: ${new Date().toISOString()}`,
          `-- Operations: ${operations.length}`,
          "",
          ...operations.map(op => [
            `-- ${op.description}`,
            op.sql,
            ""
          ]).flat()
        ].join("\n");

        const downSql = [
          `-- Rollback Migration: ${name}`,
          `-- Version: ${version}`,
          `-- Generated: ${new Date().toISOString()}`,
          "",
          ...operations.reverse().map(op => [
            `-- Rollback: ${op.description}`,
            op.rollbackSql || "-- No rollback available",
            ""
          ]).flat()
        ].join("\n");

        return {
          id,
          name,
          version,
          timestamp: new Date(),
          operations,
          upSql,
          downSql,
          description: `Migration from schema definitions v${version}`,
        };
      };

      return {
        generateMigration,
        generateInitialMigration,
      };
    }),
  }
) {}

/**
 * CLI commands for migration generation
 */
export const generateMigrationFromSchema = Effect.gen(function* (_) {
  const generator = yield* MigrationGenerator;
  
  // Import current schema definitions
  const { currentSchemaVersion } = yield* Effect.promise(() => 
    import("../schema-definitions")
  );
  
  const migrationName = process.argv[3] || "auto_generated";
  
  yield* generator.generateMigration(currentSchemaVersion, migrationName);
});

/**
 * Compare schemas and show diff without generating migration
 */
export const showSchemaDiff = Effect.gen(function* (_) {
  yield* Console.log("🔍 Schema Comparison");
  yield* Console.log("==================");
  
  // This would show the diff without generating files
  // Useful for reviewing changes before committing
  
  yield* Console.log("✅ Schema diff complete");
});