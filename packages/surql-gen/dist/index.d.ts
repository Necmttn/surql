/**
 * @necmttn/surql-schema
 *
 * Modern, type-safe SurrealDB schema management with Effect.js integration
 */
export { SurrealField } from "./lib/schema/field";
export { SurrealTable } from "./lib/schema/table";
export { SurrealIndex } from "./lib/schema/index-def";
export { SurrealEvent } from "./lib/schema/event";
export { SurrealSchema } from "./lib/schema/schema";
export { emailSchema, usernameSchema, passwordSchema, urlSchema, uuidSchema, slugSchema, ageSchema, countSchema, priceSchema, timestampSchema, nonEmptyString, emailPattern, strongPassword, usernamePattern, urlPattern, uuidPattern, shortString, mediumString, longString, textString, minLength, maxLength, exactLength, positiveNumber, nonNegativeNumber, integerNumber, minNumber, maxNumber, numberRange, customStringConstraint, customNumberConstraint, enumConstraint, Schema } from "./lib/constraints";
export type { SurrealFieldType, FieldConstraints, FieldPermissions, FieldReferences } from "./lib/schema/field";
export type { SurrealTableType } from "./lib/schema/table";
export type { SurrealSchemaType } from "./lib/schema/schema";
export type { SurrealIndexType } from "./lib/schema/index-def";
export type { SurrealEventType } from "./lib/schema/event";
export type { SchemaDiff, TableDiff, FieldDiff, IndexDiff, EventDiff, DiffOperation, } from "./lib/comparison/diff";
export type { Migration, MigrationStatement } from "./lib/migration/generator";
export declare const VERSION = "1.0.0";
//# sourceMappingURL=index.d.ts.map