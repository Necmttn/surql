/**
 * @necmttn/surql-schema
 * 
 * Modern, type-safe SurrealDB schema management with Effect.js integration
 */

// Core schema components
export { SurrealField } from "./lib/schema/field";
export { SurrealTable } from "./lib/schema/table";
export { SurrealIndex } from "./lib/schema/index-def";
export { SurrealEvent } from "./lib/schema/event";
export { SurrealSchema } from "./lib/schema/schema";

// Constraint helpers
export {
  // Complete field schemas
  emailSchema,
  usernameSchema,
  passwordSchema,
  urlSchema,
  uuidSchema,
  slugSchema,
  ageSchema,
  countSchema,
  priceSchema,
  timestampSchema,
  
  // Basic constraints
  nonEmptyString,
  emailPattern,
  strongPassword,
  usernamePattern,
  urlPattern,
  uuidPattern,
  
  // Length constraints
  shortString,
  mediumString,
  longString,
  textString,
  minLength,
  maxLength,
  exactLength,
  
  // Number constraints
  positiveNumber,
  nonNegativeNumber,
  integerNumber,
  minNumber,
  maxNumber,
  numberRange,
  
  // Helper functions
  customStringConstraint,
  customNumberConstraint,
  enumConstraint,
  
  // Re-export Schema
  Schema
} from "./lib/constraints";

// Migration and comparison tools (commented out due to Effect API changes)
// export { SchemaComparator } from "./lib/comparison/diff";
// export { MigrationGenerator } from "./lib/migration/generator";
// export { MigrationJournalService } from "./lib/migration/journal";

// AI metadata helpers (commented out due to Effect API changes)
// export {
//   AITableHints,
//   AIFieldHints,
//   AIIndexHints,
//   AIEventHints,
//   AIMetadataGenerator
// } from "./lib/schema/ai-metadata";

// Query builder (commented out due to Effect API changes)
// export { createQueryBuilder } from "./lib/query-builder/builder";

// Schema management service (requires SurrealDB client integration)
// export { SchemaManagementService } from "./lib/management/schema-service";

// Types
export type {
  SurrealFieldType,
  FieldConstraints,
  FieldPermissions,
  FieldReferences
} from "./lib/schema/field";

export type {
  SurrealTableType
} from "./lib/schema/table";

export type {
  SurrealSchemaType
} from "./lib/schema/schema";

export type {
  SurrealIndexType
} from "./lib/schema/index-def";

export type {
  SurrealEventType
} from "./lib/schema/event";

// Migration types
export type {
  SchemaDiff,
  TableDiff,
  FieldDiff,
  IndexDiff,
  EventDiff,
  DiffOperation,
} from "./lib/comparison/diff";

export type { 
  Migration, 
  MigrationStatement 
} from "./lib/migration/generator";

// Version info
export const VERSION = "1.0.0";

// Default export removed to avoid circular dependencies
// Use named imports instead: import { SurrealField, SurrealTable } from '@necmttn/surql-schema'