import { Schema } from "effect";
declare const EventTimingSchema: Schema.Literal<["BEFORE", "AFTER"]>;
declare const EventActionSchema: Schema.Literal<["CREATE", "UPDATE", "DELETE"]>;
declare const SurrealEvent_base: Schema.Class<SurrealEvent, {
    name: Schema.filter<typeof Schema.String>;
    table: Schema.filter<typeof Schema.String>;
    when: Schema.Literal<["BEFORE", "AFTER"]>;
    action: Schema.Literal<["CREATE", "UPDATE", "DELETE"]>;
    condition: Schema.optional<typeof Schema.String>;
    then: Schema.filter<typeof Schema.String>;
    description: Schema.optional<typeof Schema.String>;
}, Schema.Struct.Encoded<{
    name: Schema.filter<typeof Schema.String>;
    table: Schema.filter<typeof Schema.String>;
    when: Schema.Literal<["BEFORE", "AFTER"]>;
    action: Schema.Literal<["CREATE", "UPDATE", "DELETE"]>;
    condition: Schema.optional<typeof Schema.String>;
    then: Schema.filter<typeof Schema.String>;
    description: Schema.optional<typeof Schema.String>;
}>, never, {
    readonly table: string;
} & {
    readonly name: string;
} & {
    readonly description?: string | undefined;
} & {
    readonly then: string;
} & {
    readonly condition?: string | undefined;
} & {
    readonly when: "BEFORE" | "AFTER";
} & {
    readonly action: "CREATE" | "UPDATE" | "DELETE";
}, {}, {}>;
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
export declare class SurrealEvent extends SurrealEvent_base {
    static validate: (u: unknown, overrideOptions?: import("effect/SchemaAST").ParseOptions) => SurrealEvent;
    static parse: (u: unknown, overrideOptions?: import("effect/SchemaAST").ParseOptions) => SurrealEvent;
    static safeParse: (u: unknown, overrideOptions?: import("effect/SchemaAST").ParseOptions) => import("effect/Option").Option<SurrealEvent>;
    static encode: (a: SurrealEvent, overrideOptions?: import("effect/SchemaAST").ParseOptions) => {
        readonly table: string;
        readonly name: string;
        readonly then: string;
        readonly when: "BEFORE" | "AFTER";
        readonly action: "CREATE" | "UPDATE" | "DELETE";
        readonly description?: string | undefined;
        readonly condition?: string | undefined;
    };
    static decode: (i: {
        readonly table: string;
        readonly name: string;
        readonly then: string;
        readonly when: "BEFORE" | "AFTER";
        readonly action: "CREATE" | "UPDATE" | "DELETE";
        readonly description?: string | undefined;
        readonly condition?: string | undefined;
    }, overrideOptions?: import("effect/SchemaAST").ParseOptions) => SurrealEvent;
    static create(name: string, table: string, when: Schema.Schema.Type<typeof EventTimingSchema>, action: Schema.Schema.Type<typeof EventActionSchema>, then: string): SurrealEvent;
    static onCreate(name: string, table: string, then: string): SurrealEvent;
    static onUpdate(name: string, table: string, then: string): SurrealEvent;
    static onDelete(name: string, table: string, then: string): SurrealEvent;
    static beforeCreate(name: string, table: string, then: string): SurrealEvent;
    static beforeUpdate(name: string, table: string, then: string): SurrealEvent;
    static beforeDelete(name: string, table: string, then: string): SurrealEvent;
    withCondition(condition: string): SurrealEvent;
    withDescription(description: string): SurrealEvent;
    withThen(then: string): SurrealEvent;
    getName(): string;
    getTable(): string;
    getTiming(): Schema.Schema.Type<typeof EventTimingSchema>;
    getAction(): Schema.Schema.Type<typeof EventActionSchema>;
    getCondition(): string | undefined;
    getThen(): string;
    getDescription(): string | undefined;
    toSurrealQL(): string;
    static fromSurrealQL(sql: string): SurrealEvent;
    static diff(oldEvent: SurrealEvent, newEvent: SurrealEvent): string[];
}
export type SurrealEventType = Schema.Schema.Type<typeof SurrealEvent>;
export type EventTiming = Schema.Schema.Type<typeof EventTimingSchema>;
export type EventAction = Schema.Schema.Type<typeof EventActionSchema>;
export {};
//# sourceMappingURL=event.d.ts.map