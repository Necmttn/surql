import { Data, Effect } from "effect";
export interface AITableHints extends Data.TaggedClass<"AITableHints"> {
    readonly primary_key?: string;
    readonly temporal_field?: string;
    readonly user_field?: string;
    readonly content_fields?: readonly string[];
    readonly common_queries?: readonly string[];
    readonly relationships?: readonly string[] | Record<string, string>;
    readonly common_filters?: readonly string[];
    readonly unique_features?: Record<string, string>;
    readonly query_patterns?: readonly string[];
}
declare const AITableHints_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => Readonly<A> & {
    readonly _tag: "AITableHints";
};
export declare class AITableHints extends AITableHints_base<{
    readonly primary_key?: string;
    readonly temporal_field?: string;
    readonly user_field?: string;
    readonly content_fields?: readonly string[];
    readonly common_queries?: readonly string[];
    readonly relationships?: readonly string[] | Record<string, string>;
    readonly common_filters?: readonly string[];
    readonly unique_features?: Record<string, string>;
    readonly query_patterns?: readonly string[];
}> {
}
export interface AIFieldHints extends Data.TaggedClass<"AIFieldHints"> {
    readonly searchable?: boolean;
    readonly content?: boolean;
    readonly temporal?: boolean;
    readonly user_reference?: boolean;
    readonly relationship_target?: string;
    readonly validation_rules?: readonly string[];
    readonly common_operations?: readonly string[];
}
declare const AIFieldHints_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => Readonly<A> & {
    readonly _tag: "AIFieldHints";
};
export declare class AIFieldHints extends AIFieldHints_base<{
    readonly searchable?: boolean;
    readonly content?: boolean;
    readonly temporal?: boolean;
    readonly user_reference?: boolean;
    readonly relationship_target?: string;
    readonly validation_rules?: readonly string[];
    readonly common_operations?: readonly string[];
}> {
}
declare const AIIndexHints_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => Readonly<A> & {
    readonly _tag: "AIIndexHints";
};
export declare class AIIndexHints extends AIIndexHints_base<{
    readonly purpose?: string;
    readonly query_type?: "lookup" | "search" | "range" | "relationship";
    readonly performance_impact?: "low" | "medium" | "high";
    readonly suggested_queries?: readonly string[];
}> {
}
declare const AIEventHints_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => Readonly<A> & {
    readonly _tag: "AIEventHints";
};
export declare class AIEventHints extends AIEventHints_base<{
    readonly purpose?: string;
    readonly trigger_conditions?: readonly string[];
    readonly side_effects?: readonly string[];
    readonly performance_notes?: string;
}> {
}
declare const AIMetadataGenerator_base: Effect.Service.Class<AIMetadataGenerator, "AIMetadataGenerator", {
    readonly effect: Effect.Effect<{
        readonly generateTableComment: (description: string, hints: AITableHints) => string;
        readonly generateFieldComment: (description: string, hints?: AIFieldHints) => string;
        readonly generateIndexComment: (description: string, hints?: AIIndexHints) => string;
        readonly generateEventComment: (description: string, hints?: AIEventHints) => string;
        readonly generateAIDiscoverySchema: (tableName: string, hints: AITableHints) => {
            table_name: string;
            purpose: string;
            common_queries: readonly string[];
            temporal_fields: string[];
            user_fields: string[];
            content_fields: readonly string[];
            relationships: readonly string[] | Record<string, string>;
            common_filters: readonly string[];
            query_patterns: readonly string[];
        };
        readonly generateAIHelperFunction: (tableName: string, hints: AITableHints) => {
            name: string;
            body: string;
            comment: string;
        };
        readonly generateUniversalEventTracking: (tableName: string, hints: AITableHints) => {
            name: string;
            body: string;
            when: string;
            comment: string;
        };
        readonly generateQueryPatternsDocumentation: (tableName: string, hints: AITableHints) => string[];
        readonly generateAISchemaDocumentation: (tableName: string, hints: AITableHints) => {
            table_overview: {
                name: string;
                purpose: string;
                ai_accessibility: string;
            };
            query_guidance: {
                primary_access: string;
                temporal_queries: string | null;
                user_queries: string | null;
                content_search: readonly string[];
                relationship_navigation: readonly string[] | Record<string, string>;
            };
            common_patterns: string[];
            ai_functions: {
                name: string;
                body: string;
                comment: string;
            };
            event_tracking: {
                name: string;
                body: string;
                when: string;
                comment: string;
            };
        };
    }, never, never>;
}>;
export declare class AIMetadataGenerator extends AIMetadataGenerator_base {
}
export {};
//# sourceMappingURL=ai-metadata.d.ts.map