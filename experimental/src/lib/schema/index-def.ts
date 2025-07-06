import { Schema } from "effect";

// Index type schema
const IndexTypeSchema = Schema.optional(Schema.Literal("UNIQUE", "SEARCH", "MTREE"));

/**
 * SurrealIndex as Schema.Class - self-validating index definitions
 * 
 * This class provides:
 * - Built-in validation via Schema.Class
 * - Automatic encoding/decoding  
 * - Fluent API for index configuration
 * - SurrealQL generation
 * - Migration support
 */
export class SurrealIndex extends Schema.Class<SurrealIndex>("SurrealIndex")({
  name: Schema.String.pipe(Schema.minLength(1)),
  table: Schema.String.pipe(Schema.minLength(1)),
  fields: Schema.Array(Schema.String.pipe(Schema.minLength(1))).pipe(Schema.minItems(1)),
  type: IndexTypeSchema,
  unique: Schema.optional(Schema.Boolean),
  fulltext: Schema.optional(Schema.Boolean),
  condition: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String)
}) {
  // Built-in validation methods from Schema.Class
  static validate = Schema.decodeUnknownSync(this);
  static parse = Schema.decodeUnknownSync(this);
  static safeParse = Schema.decodeUnknownOption(this);
  
  // Built-in encoding/decoding
  static encode = Schema.encodeSync(this);
  static decode = Schema.decodeSync(this);

  // Static factory methods with automatic validation
  static create(name: string, table: string, fields: string[]): SurrealIndex {
    return this.parse({
      name,
      table,
      fields
    });
  }

  static unique(name: string, table: string, fields: string[]): SurrealIndex {
    return this.parse({
      name,
      table,
      fields,
      unique: true
    });
  }

  static search(name: string, table: string, fields: string[]): SurrealIndex {
    return this.parse({
      name,
      table,
      fields,
      type: "SEARCH"
    });
  }

  static mtree(name: string, table: string, field: string): SurrealIndex {
    return this.parse({
      name,
      table,
      fields: [field],
      type: "MTREE"
    });
  }

  // Fluent API methods that return validated instances
  makeUnique(): SurrealIndex {
    return SurrealIndex.parse({
      ...this,
      unique: true
    });
  }

  makeSearch(): SurrealIndex {
    return SurrealIndex.parse({
      ...this,
      type: "SEARCH"
    });
  }

  makeMtree(): SurrealIndex {
    return SurrealIndex.parse({
      ...this,
      type: "MTREE"
    });
  }

  withCondition(condition: string): SurrealIndex {
    return SurrealIndex.parse({
      ...this,
      condition
    });
  }

  withDescription(description: string): SurrealIndex {
    return SurrealIndex.parse({
      ...this,
      description
    });
  }

  // Helper methods
  getName(): string {
    return this.name;
  }

  getTable(): string {
    return this.table;
  }

  getFields(): readonly string[] {
    return this.fields;
  }

  getType(): Schema.Schema.Type<typeof IndexTypeSchema> {
    return this.type;
  }

  isUnique(): boolean {
    return this.unique === true || this.type === "UNIQUE";
  }

  isSearch(): boolean {
    return this.type === "SEARCH";
  }

  isMtree(): boolean {
    return this.type === "MTREE";
  }

  getCondition(): string | undefined {
    return this.condition;
  }

  getDescription(): string | undefined {
    return this.description;
  }

  // Generate SurrealQL index definition
  toSurrealQL(): string {
    let sql = `DEFINE INDEX ${this.name} ON ${this.table} FIELDS ${this.fields.join(", ")}`;
    
    if (this.isUnique()) {
      sql += " UNIQUE";
    }
    
    if (this.type === "SEARCH") {
      sql += " SEARCH ANALYZER ascii BM25";
    }
    
    if (this.condition) {
      sql += ` WHERE ${this.condition}`;
    }
    
    if (this.description) {
      sql += ` COMMENT '${this.description}'`;
    }
    
    return sql + ";";
  }

  // Parse SurrealQL to create index (basic parser)
  static fromSurrealQL(sql: string): SurrealIndex {
    const trimmed = sql.trim().replace(/;$/, "");
    
    // Extract basic components first
    const defineMatch = trimmed.match(/^DEFINE\s+INDEX\s+(\w+)\s+ON\s+(\w+)\s+FIELDS\s+(.+)$/i);
    if (!defineMatch) {
      throw new Error(`Invalid index definition: ${sql}`);
    }
    
    const [, name, table, remainder] = defineMatch;
    
    // Parse the remainder to extract fields and optional parts
    let fieldsStr = remainder;
    let unique = false;
    let condition: string | undefined;
    let description: string | undefined;
    
    // Check for UNIQUE (can appear anywhere after FIELDS)
    if (fieldsStr.includes(" UNIQUE")) {
      unique = true;
      fieldsStr = fieldsStr.replace(/\s+UNIQUE/i, "");
    }
    
    // Check for WHERE clause
    const whereMatch = fieldsStr.match(/(.+?)\s+WHERE\s+(.+?)(?:\s+COMMENT|$)/i);
    if (whereMatch) {
      fieldsStr = whereMatch[1];
      condition = whereMatch[2];
    }
    
    // Check for COMMENT
    const commentMatch = remainder.match(/COMMENT\s+'([^']*)'/i);
    if (commentMatch) {
      description = commentMatch[1];
      // Remove comment from fieldsStr if it's still there
      fieldsStr = fieldsStr.replace(/\s+COMMENT\s+'[^']*'/i, "");
    }
    
    const fields = fieldsStr.split(",").map(f => f.trim()).filter(f => f.length > 0);
    
    return this.parse({
      name,
      table,
      fields,
      unique,
      condition: condition?.trim(),
      description: description?.trim()
    });
  }

  // Generate migration operations
  static diff(oldIndex: SurrealIndex, newIndex: SurrealIndex): string[] {
    const operations: string[] = [];
    
    // If name changed, it's a drop + create
    if (oldIndex.name !== newIndex.name) {
      operations.push(`REMOVE INDEX ${oldIndex.name} ON ${oldIndex.table};`);
      operations.push(newIndex.toSurrealQL());
      return operations;
    }
    
    // If table changed, it's a drop + create
    if (oldIndex.table !== newIndex.table) {
      operations.push(`REMOVE INDEX ${oldIndex.name} ON ${oldIndex.table};`);
      operations.push(newIndex.toSurrealQL());
      return operations;
    }
    
    // If fields changed, it's a drop + create
    const oldFields = [...oldIndex.fields].sort();
    const newFields = [...newIndex.fields].sort();
    if (oldFields.join(",") !== newFields.join(",")) {
      operations.push(`REMOVE INDEX ${oldIndex.name} ON ${oldIndex.table};`);
      operations.push(newIndex.toSurrealQL());
      return operations;
    }
    
    // If any other property changed, replace the index
    if (
      oldIndex.type !== newIndex.type ||
      oldIndex.unique !== newIndex.unique ||
      oldIndex.condition !== newIndex.condition ||
      oldIndex.description !== newIndex.description
    ) {
      operations.push(`REMOVE INDEX ${oldIndex.name} ON ${oldIndex.table};`);
      operations.push(newIndex.toSurrealQL());
    }
    
    return operations;
  }
}

// Export types for TypeScript integration
export type SurrealIndexType = Schema.Schema.Type<typeof SurrealIndex>;
export type IndexType = Schema.Schema.Type<typeof IndexTypeSchema>;