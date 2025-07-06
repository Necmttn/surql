export type SurrealEventType = "CREATE" | "UPDATE" | "DELETE";
declare const SurrealEventDefinition_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => Readonly<A> & {
    readonly _tag: "SurrealEventDefinition";
};
export declare class SurrealEventDefinition extends SurrealEventDefinition_base<{
    readonly name: string;
    readonly table: string;
    readonly type: SurrealEventType;
    readonly condition?: string;
    readonly then: string;
    readonly description?: string;
    readonly drop?: boolean;
}> {
}
declare const SurrealEvent_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => Readonly<A> & {
    readonly _tag: "SurrealEvent";
};
export declare class SurrealEvent extends SurrealEvent_base<{
    readonly definition: SurrealEventDefinition;
}> {
    static create(name: string, table: string, type: SurrealEventType, then: string): SurrealEvent;
    static onCreate(name: string, table: string, then: string): SurrealEvent;
    static onUpdate(name: string, table: string, then: string): SurrealEvent;
    static onDelete(name: string, table: string, then: string): SurrealEvent;
    condition(condition: string): SurrealEvent;
    description(desc: string): SurrealEvent;
    drop(): SurrealEvent;
    getName(): string;
    getTable(): string;
    getType(): SurrealEventType;
    getCondition(): string | undefined;
    getThen(): string;
    getDescription(): string | undefined;
    isDrop(): boolean;
    toSurrealQL(): string;
}
export {};
//# sourceMappingURL=improved-event.d.ts.map