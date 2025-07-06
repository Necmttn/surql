// Main exports for the SurrealDB Code-First Schema library

// Core schema classes (improved versions with Data.taggedClass)
export { SurrealField } from "./lib/schema/improved-field";
export { SurrealTable } from "./lib/schema/improved-table";
export { SurrealIndex } from "./lib/schema/improved-index";
export { SurrealEvent } from "./lib/schema/improved-event";
export { SurrealSchema } from "./lib/schema/improved-registry";

// Enhanced Schema utilities
export {
  recordId,
  surrealString,
  surrealNumber,
  surrealInt,
  surrealBoolean,
  surrealDateTime,
  surrealArray,
  surrealOptional,
  surrealRecord,
  surrealRecordArray,
  getSurrealMetadata,
  hasSurrealMetadata,
  surrealStruct,
  type SurrealMetadata,
  type SurrealSchema as SurrealSchemaType,
  type RecordId,
} from "./lib/schema/enhanced-schema";

// Schema comparison and migration
export { SchemaComparator, SchemaComparisonUtils } from "./lib/comparison/diff";
export { MigrationGenerator } from "./lib/migration/generator";
export type {
  SchemaDiff,
  TableDiff,
  FieldDiff,
  IndexDiff,
  EventDiff,
  DiffOperation,
} from "./lib/comparison/diff";
export type { Migration, MigrationStatement } from "./lib/migration/generator";

// Query builders
export { createQueryBuilder, createQueryBuilders } from "./lib/query-builder/builder";
export {
  createIntegratedQueryBuilder,
  SchemaQueryService,
} from "./lib/query-builder/integration";
export type {
  SelectResult,
  InsertResult,
  UpdateResult,
  DeleteResult,
  SelectQueryBuilder,
  InsertQueryBuilder,
  UpdateQueryBuilder,
  DeleteQueryBuilder,
} from "./lib/query-builder/builder";

// Schema management service
export {
  SchemaManagementService,
  SchemaServiceError,
  SchemaMigrationError,
  SchemaMetadata,
  MigrationRecord,
} from "./lib/management/schema-service";

// Re-export effect and surrealdb types that users might need
export type { Effect } from "effect";
export type { RecordId as SurrealRecordId } from "surrealdb";

// Version info
export const VERSION = "1.0.0";

// Default exports for convenience
export default {
  SurrealField,
  SurrealTable,
  SurrealIndex,
  SurrealEvent,
  SurrealSchema,
  SchemaComparator,
  MigrationGenerator,
  createQueryBuilder,
  SchemaManagementService,
  VERSION,
};
