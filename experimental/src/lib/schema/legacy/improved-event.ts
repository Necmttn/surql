import { Data } from "effect";

// SurrealDB event types
export type SurrealEventType = "CREATE" | "UPDATE" | "DELETE";

// SurrealDB event definition using Data.taggedClass
export class SurrealEventDefinition extends Data.TaggedClass("SurrealEventDefinition")<{
  readonly name: string;
  readonly table: string;
  readonly type: SurrealEventType;
  readonly condition?: string;
  readonly then: string;
  readonly description?: string;
  readonly drop?: boolean;
}> {}

// Improved SurrealEvent using Data.taggedClass
export class SurrealEvent extends Data.TaggedClass("SurrealEvent")<{
  readonly definition: SurrealEventDefinition;
}> {
  // Static factory methods
  static create(name: string, table: string, type: SurrealEventType, then: string): SurrealEvent {
    return new SurrealEvent({
      definition: new SurrealEventDefinition({
        name,
        table,
        type,
        then,
      }),
    });
  }

  static onCreate(name: string, table: string, then: string): SurrealEvent {
    return new SurrealEvent({
      definition: new SurrealEventDefinition({
        name,
        table,
        type: "CREATE",
        then,
      }),
    });
  }

  static onUpdate(name: string, table: string, then: string): SurrealEvent {
    return new SurrealEvent({
      definition: new SurrealEventDefinition({
        name,
        table,
        type: "UPDATE",
        then,
      }),
    });
  }

  static onDelete(name: string, table: string, then: string): SurrealEvent {
    return new SurrealEvent({
      definition: new SurrealEventDefinition({
        name,
        table,
        type: "DELETE",
        then,
      }),
    });
  }

  // Fluent API methods - all return new instances due to immutability
  condition(condition: string): SurrealEvent {
    return new SurrealEvent({
      definition: new SurrealEventDefinition({
        ...this.definition,
        condition,
      }),
    });
  }

  description(desc: string): SurrealEvent {
    return new SurrealEvent({
      definition: new SurrealEventDefinition({
        ...this.definition,
        description: desc,
      }),
    });
  }

  drop(): SurrealEvent {
    return new SurrealEvent({
      definition: new SurrealEventDefinition({
        ...this.definition,
        drop: true,
      }),
    });
  }

  // Helper methods
  getName(): string {
    return this.definition.name;
  }

  getTable(): string {
    return this.definition.table;
  }

  getType(): SurrealEventType {
    return this.definition.type;
  }

  getCondition(): string | undefined {
    return this.definition.condition;
  }

  getThen(): string {
    return this.definition.then;
  }

  getDescription(): string | undefined {
    return this.definition.description;
  }

  isDrop(): boolean {
    return this.definition.drop ?? false;
  }

  // Generate SurrealQL event definition
  toSurrealQL(): string {
    if (this.definition.drop) {
      return `REMOVE EVENT ${this.definition.name} ON ${this.definition.table}`;
    }

    const parts: string[] = [];

    parts.push(`DEFINE EVENT ${this.definition.name} ON ${this.definition.table}`);
    parts.push(`WHEN ${this.definition.type}`);

    if (this.definition.condition) {
      parts.push(`WHERE ${this.definition.condition}`);
    }

    parts.push(`THEN ${this.definition.then}`);

    if (this.definition.description) {
      parts.push(`COMMENT "${this.definition.description}"`);
    }

    return parts.join(" ");
  }
}
