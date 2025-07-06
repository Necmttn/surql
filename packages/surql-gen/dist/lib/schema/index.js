// v2.0 Schema.Class Architecture - Main Exports
// This is the primary entry point for the new Schema.Class-based implementation
export { SurrealField } from "./field";
export { SurrealTable } from "./table";
export { SurrealSchema } from "./schema";
export { SurrealEvent } from "./event";
export { SurrealIndex } from "./index-def";
// Re-export AI metadata types
export { AIFieldHints, AITableHints } from "./ai-metadata";
// Legacy exports for backward compatibility
export { SurrealEvent as LegacySurrealEvent } from "./legacy/improved-event";
export { SurrealField as LegacySurrealField } from "./legacy/improved-field";
export { SurrealIndex as LegacySurrealIndex } from "./legacy/improved-index";
export { SurrealSchema as LegacySurrealSchema } from "./legacy/improved-registry";
export { SurrealTable as LegacySurrealTable } from "./legacy/improved-table";
