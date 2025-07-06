import { Schema } from "effect";

// Event timing schema
const EventTimingSchema = Schema.Literal("BEFORE", "AFTER");

// Event action schema  
const EventActionSchema = Schema.Literal("CREATE", "UPDATE", "DELETE");

/**
 * SurrealEvent as Schema.Class - self-validating event definitions
 * 
 * This class provides:
 * - Built-in validation via Schema.Class
 * - Automatic encoding/decoding
 * - Fluent API for event configuration
 * - SurrealQL generation
 * - Migration support
 */
export class SurrealEvent extends Schema.Class<SurrealEvent>("SurrealEvent")({
  name: Schema.String.pipe(Schema.minLength(1)),
  table: Schema.String.pipe(Schema.minLength(1)),
  when: EventTimingSchema,
  action: EventActionSchema,
  condition: Schema.optional(Schema.String),
  then: Schema.String.pipe(Schema.minLength(1)),
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
  static create(
    name: string,
    table: string,
    when: Schema.Schema.Type<typeof EventTimingSchema>,
    action: Schema.Schema.Type<typeof EventActionSchema>,
    then: string
  ): SurrealEvent {
    return this.parse({
      name,
      table,
      when,
      action,
      then
    });
  }

  static onCreate(name: string, table: string, then: string): SurrealEvent {
    return this.create(name, table, "AFTER", "CREATE", then);
  }

  static onUpdate(name: string, table: string, then: string): SurrealEvent {
    return this.create(name, table, "AFTER", "UPDATE", then);
  }

  static onDelete(name: string, table: string, then: string): SurrealEvent {
    return this.create(name, table, "AFTER", "DELETE", then);
  }

  static beforeCreate(name: string, table: string, then: string): SurrealEvent {
    return this.create(name, table, "BEFORE", "CREATE", then);
  }

  static beforeUpdate(name: string, table: string, then: string): SurrealEvent {
    return this.create(name, table, "BEFORE", "UPDATE", then);
  }

  static beforeDelete(name: string, table: string, then: string): SurrealEvent {
    return this.create(name, table, "BEFORE", "DELETE", then);
  }

  // Fluent API methods that return validated instances
  withCondition(condition: string): SurrealEvent {
    return SurrealEvent.parse({
      ...this,
      condition
    });
  }

  withDescription(description: string): SurrealEvent {
    return SurrealEvent.parse({
      ...this,
      description
    });
  }

  withThen(then: string): SurrealEvent {
    return SurrealEvent.parse({
      ...this,
      then
    });
  }

  // Helper methods
  getName(): string {
    return this.name;
  }

  getTable(): string {
    return this.table;
  }

  getTiming(): Schema.Schema.Type<typeof EventTimingSchema> {
    return this.when;
  }

  getAction(): Schema.Schema.Type<typeof EventActionSchema> {
    return this.action;
  }

  getCondition(): string | undefined {
    return this.condition;
  }

  getThen(): string {
    return this.then;
  }

  getDescription(): string | undefined {
    return this.description;
  }

  // Generate SurrealQL event definition
  toSurrealQL(): string {
    let sql = `DEFINE EVENT ${this.name} ON TABLE ${this.table} WHEN ${this.when} ${this.action}`;
    
    if (this.condition) {
      sql += ` WHERE ${this.condition}`;
    }
    
    sql += ` THEN ${this.then}`;
    
    if (this.description) {
      sql += ` COMMENT '${this.description}'`;
    }
    
    return sql + ";";
  }

  // Parse SurrealQL to create event (basic parser)
  static fromSurrealQL(sql: string): SurrealEvent {
    const trimmed = sql.trim().replace(/;$/, "");
    
    // Match: DEFINE EVENT name ON TABLE table WHEN timing action [WHERE condition] THEN statement [COMMENT 'description']
    const match = trimmed.match(
      /^DEFINE EVENT\s+(\w+)\s+ON\s+TABLE\s+(\w+)\s+WHEN\s+(BEFORE|AFTER)\s+(CREATE|UPDATE|DELETE)(?:\s+WHERE\s+(.+?))?(?:\s+THEN\s+(.+?))?(?:\s+COMMENT\s+'([^']*)')?$/i
    );
    
    if (!match) {
      throw new Error(`Invalid event definition: ${sql}`);
    }
    
    const [, name, table, when, action, condition, then, description] = match;
    
    return this.parse({
      name,
      table,
      when: when.toUpperCase() as Schema.Schema.Type<typeof EventTimingSchema>,
      action: action.toUpperCase() as Schema.Schema.Type<typeof EventActionSchema>,
      condition: condition?.trim(),
      then: then?.trim() || "",
      description: description?.trim()
    });
  }

  // Generate migration operations
  static diff(oldEvent: SurrealEvent, newEvent: SurrealEvent): string[] {
    const operations: string[] = [];
    
    // If name changed, it's a drop + create
    if (oldEvent.name !== newEvent.name) {
      operations.push(`REMOVE EVENT ${oldEvent.name} ON ${oldEvent.table};`);
      operations.push(newEvent.toSurrealQL());
      return operations;
    }
    
    // If table changed, it's a drop + create
    if (oldEvent.table !== newEvent.table) {
      operations.push(`REMOVE EVENT ${oldEvent.name} ON ${oldEvent.table};`);
      operations.push(newEvent.toSurrealQL());
      return operations;
    }
    
    // If any other property changed, replace the event
    if (
      oldEvent.when !== newEvent.when ||
      oldEvent.action !== newEvent.action ||
      oldEvent.condition !== newEvent.condition ||
      oldEvent.then !== newEvent.then ||
      oldEvent.description !== newEvent.description
    ) {
      operations.push(`REMOVE EVENT ${oldEvent.name} ON ${oldEvent.table};`);
      operations.push(newEvent.toSurrealQL());
    }
    
    return operations;
  }
}

// Export types for TypeScript integration
export type SurrealEventType = Schema.Schema.Type<typeof SurrealEvent>;
export type EventTiming = Schema.Schema.Type<typeof EventTimingSchema>;
export type EventAction = Schema.Schema.Type<typeof EventActionSchema>;