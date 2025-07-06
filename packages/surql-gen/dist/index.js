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
emailSchema, usernameSchema, passwordSchema, urlSchema, uuidSchema, slugSchema, ageSchema, countSchema, priceSchema, timestampSchema, 
// Basic constraints
nonEmptyString, emailPattern, strongPassword, usernamePattern, urlPattern, uuidPattern, 
// Length constraints
shortString, mediumString, longString, textString, minLength, maxLength, exactLength, 
// Number constraints
positiveNumber, nonNegativeNumber, integerNumber, minNumber, maxNumber, numberRange, 
// Helper functions
customStringConstraint, customNumberConstraint, enumConstraint, 
// Re-export Schema
Schema } from "./lib/constraints";
// Version info
export const VERSION = "1.0.0";
// Default export removed to avoid circular dependencies
// Use named imports instead: import { SurrealField, SurrealTable } from '@necmttn/surql-schema'
