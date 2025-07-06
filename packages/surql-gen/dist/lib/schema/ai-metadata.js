import { Data, Effect } from "effect";
export class AITableHints extends Data.TaggedClass("AITableHints") {
}
export class AIFieldHints extends Data.TaggedClass("AIFieldHints") {
}
export class AIIndexHints extends Data.TaggedClass("AIIndexHints") {
}
export class AIEventHints extends Data.TaggedClass("AIEventHints") {
}
// AI metadata generator service
export class AIMetadataGenerator extends Effect.Service()("AIMetadataGenerator", {
    effect: Effect.gen(function* () {
        // Generate structured comment with AI metadata
        const generateTableComment = (description, hints) => {
            const aiHintsJson = JSON.stringify(hints, null, 0);
            return `${description} | @ai-hints: ${aiHintsJson}`;
        };
        const generateFieldComment = (description, hints) => {
            if (!hints)
                return description;
            const aiHintsJson = JSON.stringify(hints, null, 0);
            return `${description} | @ai-context: ${aiHintsJson}`;
        };
        const generateIndexComment = (description, hints) => {
            if (!hints)
                return description;
            const aiHintsJson = JSON.stringify(hints, null, 0);
            return `${description} | @ai-index: ${aiHintsJson}`;
        };
        const generateEventComment = (description, hints) => {
            if (!hints)
                return description;
            const aiHintsJson = JSON.stringify(hints, null, 0);
            return `${description} | @ai-event: ${aiHintsJson}`;
        };
        // Generate AI discovery schema
        const generateAIDiscoverySchema = (tableName, hints) => {
            return {
                table_name: tableName,
                purpose: hints.primary_key
                    ? `Primary entity identified by ${hints.primary_key}`
                    : "Data entity",
                common_queries: hints.common_queries || [],
                temporal_fields: hints.temporal_field ? [hints.temporal_field] : [],
                user_fields: hints.user_field ? [hints.user_field] : [],
                content_fields: hints.content_fields || [],
                relationships: hints.relationships || {},
                common_filters: hints.common_filters || [],
                query_patterns: hints.query_patterns || [],
            };
        };
        // Generate helper functions for AI agents
        const generateAIHelperFunction = (tableName, hints) => {
            const functionName = `fn::ai_get_${tableName}_info`;
            let functionBody = `{
  LET $table_info = (INFO FOR TABLE ${tableName} STRUCTURE);
  
  RETURN {
    table: "${tableName}",
    primary_key: "${hints.primary_key || "id"}",`;
            if (hints.temporal_field) {
                functionBody += `
    temporal_field: "${hints.temporal_field}",`;
            }
            if (hints.user_field) {
                functionBody += `
    user_field: "${hints.user_field}",`;
            }
            if (hints.content_fields && hints.content_fields.length > 0) {
                functionBody += `
    content_fields: [${hints.content_fields.map((f) => `"${f}"`).join(", ")}],`;
            }
            if (hints.relationships) {
                functionBody += `
    relationships: ${JSON.stringify(hints.relationships)},`;
            }
            functionBody += `
    structure: $table_info
  };
}`;
            return {
                name: functionName,
                body: functionBody,
                comment: `AI helper function for ${tableName} table metadata and structure discovery`,
            };
        };
        // Generate universal event tracking for AI
        const generateUniversalEventTracking = (tableName, hints) => {
            const eventName = `track_${tableName}_activity`;
            let eventBody = `(
  CREATE universal_event SET
    event_type = $event,
    source_type = "${tableName}",
    source_id = ($after.id ?? $before.id),
    occurred_at = time::now(),`;
            if (hints.user_field) {
                eventBody += `
    actor = $after.${hints.user_field} ?? $before.${hints.user_field},`;
            }
            if (hints.content_fields && hints.content_fields.length > 0) {
                eventBody += `
    content_summary = {
      ${hints.content_fields.map((field) => `${field}: $after.${field} ?? $before.${field}`).join(",\n      ")}
    },`;
            }
            eventBody += `
    metadata = {
      table: "${tableName}",
      change_type: $event,
      timestamp: time::now()
    }
)`;
            return {
                name: eventName,
                body: eventBody,
                when: '$event IN ["CREATE", "UPDATE", "DELETE"]',
                comment: `Universal activity tracking for ${tableName} | @ai-purpose: cross-table timeline queries`,
            };
        };
        // Generate AI query patterns documentation
        const generateQueryPatternsDocumentation = (tableName, hints) => {
            const patterns = [];
            // Basic patterns
            patterns.push(`SELECT * FROM ${tableName} WHERE ${hints.primary_key || "id"} = $id`);
            if (hints.temporal_field) {
                patterns.push(`SELECT * FROM ${tableName} WHERE ${hints.temporal_field} > $date ORDER BY ${hints.temporal_field} DESC`);
            }
            if (hints.user_field) {
                patterns.push(`SELECT * FROM ${tableName} WHERE ${hints.user_field} = $user_id`);
            }
            if (hints.content_fields && hints.content_fields.length > 0) {
                const searchFields = hints.content_fields.join(", ");
                patterns.push(`SELECT * FROM ${tableName} WHERE ${searchFields} CONTAINS $search_term`);
            }
            // Add custom query patterns
            if (hints.query_patterns) {
                patterns.push(...hints.query_patterns);
            }
            return patterns;
        };
        // Generate complete AI-friendly schema documentation
        const generateAISchemaDocumentation = (tableName, hints) => {
            const documentation = {
                table_overview: {
                    name: tableName,
                    purpose: hints.primary_key
                        ? `Primary entity identified by ${hints.primary_key}`
                        : "Data entity",
                    ai_accessibility: "High - optimized for AI agent queries",
                },
                query_guidance: {
                    primary_access: hints.primary_key || "id",
                    temporal_queries: hints.temporal_field || null,
                    user_queries: hints.user_field || null,
                    content_search: hints.content_fields || [],
                    relationship_navigation: hints.relationships || {},
                },
                common_patterns: generateQueryPatternsDocumentation(tableName, hints),
                ai_functions: generateAIHelperFunction(tableName, hints),
                event_tracking: generateUniversalEventTracking(tableName, hints),
            };
            return documentation;
        };
        return {
            generateTableComment,
            generateFieldComment,
            generateIndexComment,
            generateEventComment,
            generateAIDiscoverySchema,
            generateAIHelperFunction,
            generateUniversalEventTracking,
            generateQueryPatternsDocumentation,
            generateAISchemaDocumentation,
        };
    }),
}) {
}
