-- ------------------------------
-- SCHEMA DEFINITIONS
-- ------------------------------

OPTION IMPORT;


-- ------------------------------
-- FUNCTIONS
-- ------------------------------

DEFINE FUNCTION fn::get_block_context($block_id: record<block>, $context_depth: option<int>) {
LET $depth = IF type::is::number($context_depth) THEN $context_depth ELSE 3 END;
LET $target_block = (SELECT * FROM ONLY $block_id);
LET $prev_blocks = fn::get_sequential_blocks($block_id, 'backward', $depth).{ id, content, type, props, page };
LET $next_blocks = fn::get_sequential_blocks($block_id, 'forward', $depth).{ id, content, type, props, page };
LET $parent_sections = (SELECT * FROM $block_id<-(hierarchy WHERE relation_type INSIDE ['section', 'subsection'])<-block);
LET $child_content = (SELECT id, content, type, props, page FROM $block_id->hierarchy->block);
LET $parent_block = (SELECT id, content, type, props, page FROM $block_id<-contains<-block);
LET $sibling_blocks = (SELECT id, content, type, props, page FROM $block_id<-contains<-block->contains->block WHERE id != $block_id AND RAW.block_type != 'PageHeader');
RETURN { containment: { parent: $parent_block, siblings: $sibling_blocks }, hierarchical: { child_content: $child_content, parent_sections: $parent_sections }, sequential: { next: $next_blocks, previous: $prev_blocks }, target: $target_block };
} COMMENT 'Retrieves comprehensive context around a target block including sequential flow, hierarchical relationships, and containment structure. Essential for RAG applications requiring rich contextual information. Parameters: block_id (target block), context_depth (optional, defaults to 3 - number of sequential blocks to include). Returns structured object with target block and all contextual relationships.' PERMISSIONS FULL;

DEFINE FUNCTION fn::get_reading_flow($start_block: record<block>, $direction: string, $count: option<int>) {
LET $block_count = IF type::is::number($count) THEN $count ELSE 5 END;
IF $direction = 'forward' {
LET $flow = fn::get_sequential_blocks_with_context($start_block, 'forward', $block_count);
RETURN $flow;
} ELSE IF $direction = 'backward' {
LET $flow = fn::get_sequential_blocks_with_context($start_block, 'backward', $block_count);
RETURN $flow;
} ELSE { RETURN []; };
} COMMENT "Navigates through document reading flow in forward or backward direction with rich contextual information. Essential for sequential reading, pagination, and flow-based navigation. Parameters: start_block (starting point), direction ('forward' or 'backward'), count (optional, defaults to 5 - number of blocks to retrieve). Returns blocks with page info and hierarchy context." PERMISSIONS FULL;

DEFINE FUNCTION fn::get_related_entities($text: string) {
LET $emb = fn::sentence_to_vector($text, 'multilingual-e5-large-instruct');
RETURN (SELECT id, content, enriched_content, ->sources_from->?.{ id, document.{ id, name } } AS sources, vector::similarity::cosine(embedding, $emb) AS score FROM chunk WHERE embedding <|5,50|> $emb ORDER BY score DESC
);
} PERMISSIONS FULL;

DEFINE FUNCTION fn::get_section_content($section_block_id: record<block>, $content_types: option<array<string>>) {
LET $types = IF type::is::array($content_types) THEN $content_types ELSE [] END;
LET $content = (SELECT out[*], relation_type, order, fn::get_sequential_blocks(out.id, 'forward', 3) AS reading_flow FROM hierarchy WHERE in = $section_block_id AND ($types = [] OR relation_type INSIDE $types) ORDER BY order
);
RETURN $content;
} COMMENT 'Retrieves all content within a specific section with optional filtering by content types. Perfect for section-focused RAG retrieval and targeted content analysis. Parameters: section_block_id (parent section), content_types (optional array, defaults to empty array for all types). Returns section content with reading flow context ordered by hierarchy.' PERMISSIONS FULL;

DEFINE FUNCTION fn::get_section_details($section_id: record<block>) {
LET $subsections = (SELECT out[*], order FROM hierarchy WHERE in = $section_id AND relation_type = 'subsection' ORDER BY order
);
LET $content = (SELECT out[*], order FROM hierarchy WHERE in = $section_id AND relation_type INSIDE ['nested_content', 'list_item', 'table_caption', 'figure_caption'] ORDER BY order
);
RETURN { content: $content, subsections: $subsections };
} COMMENT 'Helper function to get detailed subsections and content for a specific section. Can be called separately when detailed section information is needed.' PERMISSIONS FULL;

DEFINE FUNCTION fn::get_sequential_blocks($start_block: record<block>, $direction: string, $depth: option<int>) {
LET $block_depth = IF type::is::number($depth) THEN $depth ELSE 1 END;
IF $block_depth <= 0 { RETURN []; };
LET $relation = IF $direction = 'forward' THEN '->follows->' ELSE '<-follows<-' END;
IF $block_depth = 1 { IF $direction = 'forward' { RETURN (SELECT * FROM $start_block->follows->block LIMIT 1); } ELSE { RETURN (SELECT * FROM $start_block<-follows<-block LIMIT 1); }; } ELSE {
LET $first_step = IF $direction = 'forward' THEN (SELECT * FROM $start_block->follows->block LIMIT 1) ELSE (SELECT * FROM $start_block<-follows<-block LIMIT 1) END;
IF array::len($first_step) > 0 {
LET $rest = fn::get_sequential_blocks($first_step[0].id, $direction, $block_depth - 1);
RETURN array::concat($first_step, $rest);
} ELSE { RETURN []; };
};
} COMMENT 'Helper function for recursive sequential block traversal. Supports both forward and backward directions with depth control. Parameters: start_block, direction, depth (optional, defaults to 1).' PERMISSIONS FULL;

DEFINE FUNCTION fn::get_sequential_blocks_with_context($start_block: record<block>, $direction: string, $depth: option<int>) {
LET $block_depth = IF type::is::number($depth) THEN $depth ELSE 1 END;
IF $block_depth <= 0 { RETURN []; };
IF $block_depth = 1 { IF $direction = 'forward' { RETURN (SELECT *, props.pageSize AS page_info, bbox AS coordinates, (SELECT section_path FROM hierarchy WHERE out = $parent.id LIMIT 1) AS hierarchy_context FROM $start_block->follows->block LIMIT 1); } ELSE { RETURN (SELECT *, props.pageSize AS page_info, bbox AS coordinates, (SELECT section_path FROM hierarchy WHERE out = $parent.id LIMIT 1) AS hierarchy_context FROM $start_block<-follows<-block LIMIT 1); }; } ELSE {
LET $first_step = IF $direction = 'forward' THEN (SELECT *, props.pageSize AS page_info, bbox AS coordinates, (SELECT section_path FROM hierarchy WHERE out = $parent.id LIMIT 1) AS hierarchy_context FROM $start_block->follows->block LIMIT 1) ELSE (SELECT *, props.pageSize AS page_info, bbox AS coordinates, (SELECT section_path FROM hierarchy WHERE out = $parent.id LIMIT 1) AS hierarchy_context FROM $start_block<-follows<-block LIMIT 1) END;
IF array::len($first_step) > 0 {
LET $rest = fn::get_sequential_blocks_with_context($first_step[0].id, $direction, $block_depth - 1);
RETURN array::concat($first_step, $rest);
} ELSE { RETURN []; };
};
} COMMENT 'Helper function for recursive sequential traversal with rich contextual information including page info and hierarchy context. Parameters: start_block, direction, depth (optional, defaults to 1).' PERMISSIONS FULL;

DEFINE FUNCTION fn::record_id_to_string($record_id: record) { RETURN string::concat(meta::tb($record_id), ':', meta::id($record_id)); } PERMISSIONS FULL;

DEFINE FUNCTION fn::search_for_documents($input_vector: array<float>, $threshold: float, $`table`: string) {
LET $context = (SELECT url, title, text, vector::similarity::cosine(content_vector, $input_vector) AS similarity_score FROM meta::tb($table) WHERE content_vector <|1|> $input_vector)[0];
RETURN IF $context.similarity_score > $threshold { type::string((SELECT url, title, text FROM $context)[0]) } ELSE { '' };
} PERMISSIONS FULL;

DEFINE FUNCTION fn::sentence_to_vector($sentence: string, $model: string) {
LET $query_embeddings = (RETURN http::post('http://kubeai.internal.quera.com/openai/v1/embeddings', { input: $sentence, model: $model }).data[0].embedding);
RETURN $query_embeddings;
} PERMISSIONS FULL;


-- ------------------------------
-- ANALYZERS
-- ------------------------------

DEFINE ANALYZER autocomplete FILTERS LOWERCASE,EDGENGRAM(2,10);

DEFINE ANALYZER full_text TOKENIZERS CLASS FILTERS LOWERCASE,ASCII,SNOWBALL(ENGLISH);


-- ------------------------------
-- TABLES
-- ------------------------------

-- ------------------------------
-- TABLE: account
-- ------------------------------

DEFINE TABLE account TYPE ANY SCHEMALESS COMMENT 'better-auth: accounts' PERMISSIONS NONE;

DEFINE FIELD accountId ON account TYPE string COMMENT 'better-auth: accountId oauth origin id' PERMISSIONS FULL;
DEFINE FIELD createdAt ON account TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD id ON account TYPE string PERMISSIONS FULL;
DEFINE FIELD password ON account TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD providerId ON account TYPE string PERMISSIONS FULL;
DEFINE FIELD updatedAt ON account TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD userId ON account TYPE record<user> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;

-- ------------------------------
-- TABLE: block
-- ------------------------------

DEFINE TABLE block TYPE NORMAL SCHEMALESS COMMENT 'Represents a structural block within a document, like a paragraph, heading, or list item.' PERMISSIONS NONE;

DEFINE FIELD bbox ON block TYPE option<object> COMMENT 'Bounding box of the block on its source page.' PERMISSIONS FULL;
DEFINE FIELD bbox.b ON block TYPE number COMMENT 'Bounding box: Bottom coordinate.' PERMISSIONS FULL;
DEFINE FIELD bbox.l ON block TYPE number COMMENT 'Bounding box: Left coordinate.' PERMISSIONS FULL;
DEFINE FIELD bbox.r ON block TYPE number COMMENT 'Bounding box: Right coordinate.' PERMISSIONS FULL;
DEFINE FIELD bbox.t ON block TYPE number COMMENT 'Bounding box: Top coordinate.' PERMISSIONS FULL;
DEFINE FIELD content ON block COMMENT 'The content of the block.' PERMISSIONS FULL;
DEFINE FIELD content[*] ON block PERMISSIONS FULL;
DEFINE FIELD created_at ON block TYPE datetime DEFAULT time::now() COMMENT 'Timestamp when the block record was created.' PERMISSIONS FULL;
DEFINE FIELD document ON block TYPE record<document> COMMENT 'The document this block is part of.' PERMISSIONS FULL;
DEFINE FIELD file ON block TYPE option<record<file>> COMMENT 'The source file this block originates from.' PERMISSIONS FULL;
DEFINE FIELD next ON block TYPE option<record<block>> COMMENT 'The next block in the document.' PERMISSIONS FULL;
DEFINE FIELD page ON block TYPE option<number> COMMENT 'The page number where the block begins.' PERMISSIONS FULL;
DEFINE FIELD parent ON block TYPE option<record<block>> COMMENT 'The parent block in the document.' PERMISSIONS FULL;
DEFINE FIELD prev ON block TYPE option<record<block>> COMMENT 'The previous block in the document.' PERMISSIONS FULL;
DEFINE FIELD props ON block FLEXIBLE TYPE option<object> COMMENT 'Properties specific to the block type (e.g., heading level, URL, page coordinates for PDF navigation).' PERMISSIONS FULL;
DEFINE FIELD raw ON block FLEXIBLE TYPE option<object> COMMENT 'The raw content of the block.' PERMISSIONS FULL;
DEFINE FIELD type ON block TYPE string ASSERT $value INSIDE ['page', 'image', 'heading', 'paragraph', 'text', 'list_group', 'bulletListItem', 'numberedListItem', 'checkListItem', 'table', 'table_cell', 'page_footer', 'page_header', 'table_row', 'group', 'codeBlock', 'math'] COMMENT 'The type of structural block.' PERMISSIONS FULL;
DEFINE FIELD updated_at ON block TYPE datetime DEFAULT time::now() COMMENT 'Timestamp when the block record was last updated.' PERMISSIONS FULL;

-- Indexes
DEFINE INDEX blockDocumentIndex ON block FIELDS document;

-- ------------------------------
-- TABLE: book
-- ------------------------------

DEFINE TABLE book TYPE ANY SCHEMALESS PERMISSIONS NONE;


-- ------------------------------
-- TABLE: chat
-- ------------------------------

DEFINE TABLE chat TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD description ON chat TYPE string PERMISSIONS FULL;
DEFINE FIELD files ON chat TYPE references<file> PERMISSIONS FULL;
DEFINE FIELD is_archived ON chat TYPE bool DEFAULT false PERMISSIONS FULL;
DEFINE FIELD messages ON chat TYPE references<message> PERMISSIONS FULL;
DEFINE FIELD owner ON chat TYPE record<user> PERMISSIONS FULL;
DEFINE FIELD project ON chat TYPE option<record<project>> PERMISSIONS FULL;
DEFINE FIELD started_at ON chat TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD team ON chat TYPE record<team> PERMISSIONS FULL;
DEFINE FIELD title ON chat TYPE string PERMISSIONS FULL;
DEFINE FIELD updated_at ON chat TYPE datetime DEFAULT time::now() PERMISSIONS FULL;

-- Indexes
DEFINE INDEX chatTitleIndex ON chat FIELDS title SEARCH ANALYZER autocomplete BM25(1.2,0.75) DOC_IDS_ORDER 100 DOC_LENGTHS_ORDER 100 POSTINGS_ORDER 100 TERMS_ORDER 100 DOC_IDS_CACHE 100 DOC_LENGTHS_CACHE 100 POSTINGS_CACHE 100 TERMS_CACHE 100 HIGHLIGHTS COMMENT 'Allow full-text search queries on the title of the chat';

-- ------------------------------
-- TABLE: chunk
-- ------------------------------

DEFINE TABLE chunk TYPE NORMAL SCHEMALESS PERMISSIONS NONE;

DEFINE FIELD block_ids ON chunk TYPE array<record<block>> COMMENT 'Array of source blocks this chunk was derived from' PERMISSIONS FULL;
DEFINE FIELD block_ids[*] ON chunk TYPE record<block> PERMISSIONS FULL;
DEFINE FIELD content ON chunk TYPE string PERMISSIONS FULL;
DEFINE FIELD document ON chunk TYPE record<document> COMMENT 'The logical document this chunk belongs to' PERMISSIONS FULL;
DEFINE FIELD embedding ON chunk TYPE option<array<float>> PERMISSIONS FULL;
DEFINE FIELD embedding[*] ON chunk TYPE float PERMISSIONS FULL;
DEFINE FIELD embedding_model ON chunk TYPE option<string> COMMENT 'Model used to generate the embedding' PERMISSIONS FULL;
DEFINE FIELD enriched_content ON chunk TYPE string COMMENT 'The content of the chunk after enrichment' PERMISSIONS FULL;
DEFINE FIELD id ON chunk TYPE string PERMISSIONS FULL;
DEFINE FIELD index ON chunk TYPE number COMMENT 'Sequential index of the chunk in the document' PERMISSIONS FULL;
DEFINE FIELD metadata ON chunk TYPE object COMMENT 'Additional chunk metadata from the chunking process' PERMISSIONS FULL;

-- Indexes
DEFINE INDEX chunkBlockIndex ON chunk FIELDS block;
DEFINE INDEX chunkContentIndex ON chunk FIELDS content SEARCH ANALYZER full_text BM25(1.2,0.75) DOC_IDS_ORDER 100 DOC_LENGTHS_ORDER 100 POSTINGS_ORDER 100 TERMS_ORDER 100 DOC_IDS_CACHE 100 DOC_LENGTHS_CACHE 100 POSTINGS_CACHE 100 TERMS_CACHE 100 HIGHLIGHTS COMMENT 'Allow full-text search on chunk content';
DEFINE INDEX chunkDocumentIndex ON chunk FIELDS document;
DEFINE INDEX chunkEnrichedContentIndex ON chunk FIELDS enriched_content SEARCH ANALYZER full_text BM25(1.2,0.75) DOC_IDS_ORDER 100 DOC_LENGTHS_ORDER 100 POSTINGS_ORDER 100 TERMS_ORDER 100 DOC_IDS_CACHE 100 DOC_LENGTHS_CACHE 100 POSTINGS_CACHE 100 TERMS_CACHE 100 HIGHLIGHTS COMMENT 'Allow full-text search on enriched chunk content';
DEFINE INDEX chunkIndexOrder ON chunk FIELDS document, index;
DEFINE INDEX hnsw_pts ON chunk FIELDS embedding HNSW DIMENSION 1024 DIST COSINE TYPE F64 EFC 150 M 12 M0 24 LM 0.40242960438184466f;

-- ------------------------------
-- TABLE: cites
-- ------------------------------

DEFINE TABLE cites TYPE RELATION IN block OUT block ENFORCED SCHEMALESS COMMENT 'A relation table that tracks citation links between blocks' PERMISSIONS NONE;

DEFINE FIELD anchor_text ON cites TYPE string PERMISSIONS FULL;
DEFINE FIELD href ON cites TYPE string PERMISSIONS FULL;
DEFINE FIELD in ON cites TYPE record<block> PERMISSIONS FULL;
DEFINE FIELD out ON cites TYPE record<block> PERMISSIONS FULL;
DEFINE FIELD target_content ON cites TYPE option<string> PERMISSIONS FULL;

-- ------------------------------
-- TABLE: confluence
-- ------------------------------

DEFINE TABLE confluence TYPE NORMAL SCHEMALESS COMMENT 'Confluence integration' PERMISSIONS NONE;

DEFINE FIELD document ON confluence TYPE option<record<document>> PERMISSIONS FULL;
DEFINE FIELD preferred_document ON confluence TYPE option<record<document>> COMMENT 'Reference to the document record considered the primary/best output for this source entity' PERMISSIONS FULL;

-- ------------------------------
-- TABLE: contains
-- ------------------------------

DEFINE TABLE contains TYPE RELATION IN document | block OUT block SCHEMAFULL COMMENT 'Links a parent block to a child block to represent hierarchy.' PERMISSIONS NONE;

DEFINE FIELD in ON contains TYPE record<document | block> COMMENT 'Parent Block' PERMISSIONS FULL;
DEFINE FIELD order ON contains TYPE number COMMENT 'Order of the child block within its parent' PERMISSIONS FULL;
DEFINE FIELD out ON contains TYPE record<block> COMMENT 'Child Block' PERMISSIONS FULL;

-- ------------------------------
-- TABLE: document
-- ------------------------------

DEFINE TABLE document TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD created_at ON document TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD extracted ON document FLEXIBLE TYPE option<object> COMMENT 'Information extracted from document content' PERMISSIONS FULL;
DEFINE FIELD extracted.authors ON document TYPE array<string> DEFAULT [] COMMENT 'Authors of the document' PERMISSIONS FULL;
DEFINE FIELD extracted.authors[*] ON document TYPE string PERMISSIONS FULL;
DEFINE FIELD extracted.dates ON document TYPE array<string> DEFAULT [] COMMENT 'Dates mentioned in the document' PERMISSIONS FULL;
DEFINE FIELD extracted.dates[*] ON document TYPE string PERMISSIONS FULL;
DEFINE FIELD extracted.keywords ON document TYPE array<string> DEFAULT [] COMMENT 'Keywords extracted from the document' PERMISSIONS FULL;
DEFINE FIELD extracted.keywords[*] ON document TYPE string PERMISSIONS FULL;
DEFINE FIELD extracted.organizations ON document TYPE array<string> DEFAULT [] COMMENT 'Organizations mentioned in the document' PERMISSIONS FULL;
DEFINE FIELD extracted.organizations[*] ON document TYPE string PERMISSIONS FULL;
DEFINE FIELD extracted.people ON document TYPE array<string> DEFAULT [] COMMENT 'People mentioned in the document' PERMISSIONS FULL;
DEFINE FIELD extracted.people[*] ON document TYPE string PERMISSIONS FULL;
DEFINE FIELD extracted.places ON document TYPE array<string> DEFAULT [] COMMENT 'Places mentioned in the document' PERMISSIONS FULL;
DEFINE FIELD extracted.places[*] ON document TYPE string PERMISSIONS FULL;
DEFINE FIELD name ON document TYPE string COMMENT 'Display name or title of the document' PERMISSIONS FULL;
DEFINE FIELD orgSlug ON document VALUE <future> { (SELECT VALUE slug FROM ONLY $this.organization LIMIT 1) } PERMISSIONS FULL;
DEFINE FIELD organization ON document TYPE record<organization> PERMISSIONS FULL;
DEFINE FIELD original_file ON document TYPE option<record<file>> COMMENT 'Link to the file record if source_type is "file"' PERMISSIONS FULL;
DEFINE FIELD original_file_name ON document VALUE <future> { (SELECT VALUE name FROM ONLY $this.original_file LIMIT 1) } PERMISSIONS FULL;
DEFINE FIELD original_last_updated_date ON document TYPE option<datetime> DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD output_paths ON document TYPE option<object> COMMENT 'Paths to various output artifacts from the parser.' PERMISSIONS FULL;
DEFINE FIELD output_paths.artifacts ON document TYPE option<string> COMMENT 'Path to other parser-specific artifacts.' PERMISSIONS FULL;
DEFINE FIELD output_paths.html ON document TYPE option<string> COMMENT 'Path to the HTML output from the parser.' PERMISSIONS FULL;
DEFINE FIELD output_paths.json ON document TYPE option<string> COMMENT 'Path to the JSON output from the parser.' PERMISSIONS FULL;
DEFINE FIELD output_paths.markdown ON document TYPE option<string> COMMENT 'Path to the Markdown output from the parser.' PERMISSIONS FULL;
DEFINE FIELD output_paths.text ON document TYPE option<string> COMMENT 'Path to the plain text output from the parser.' PERMISSIONS FULL;
DEFINE FIELD parser ON document TYPE option<object> COMMENT 'Parser information' PERMISSIONS FULL;
DEFINE FIELD parser.job_id ON document TYPE option<string> COMMENT 'Job ID of the parser' PERMISSIONS FULL;
DEFINE FIELD parser.settings ON document FLEXIBLE TYPE option<object> COMMENT 'Settings used for this parsing process.' PERMISSIONS FULL;
DEFINE FIELD parser.type ON document TYPE option<string> COMMENT 'Identifier for the parser used (e.g., docling, marker_v1).' PERMISSIONS FULL;
DEFINE FIELD parser.version ON document TYPE option<string> COMMENT 'Version of the parser used.' PERMISSIONS FULL;
DEFINE FIELD processed_at ON document TYPE option<datetime> PERMISSIONS FULL;
DEFINE FIELD processing_error ON document TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD processing_status ON document TYPE string DEFAULT 'pending' ASSERT $value INSIDE ['pending', 'processing', 'parsed', 'extracting_metadata', 'extracting_blocks', 'chunking', 'completed', 'failed'] PERMISSIONS FULL;
DEFINE FIELD processing_status_history ON document FLEXIBLE TYPE array<object> DEFAULT [] PERMISSIONS FULL;
DEFINE FIELD processing_status_history[*] ON document FLEXIBLE TYPE object PERMISSIONS FULL;
DEFINE FIELD raw_content ON document TYPE option<string> COMMENT 'Optional raw content before processing' PERMISSIONS FULL;
DEFINE FIELD source ON document TYPE record<file | slack | notion | jira | github | confluence | onedrive | web_page | text_input | note> REFERENCE ON DELETE CASCADE COMMENT 'reference to source file' PERMISSIONS FULL;
DEFINE FIELD source_id ON document TYPE string COMMENT 'Unique identifier within the original source (e.g., file ID, Slack message ts, Notion page ID)' PERMISSIONS FULL;
DEFINE FIELD source_metadata ON document FLEXIBLE TYPE option<object> COMMENT 'Source-specific metadata (e.g., URL, channel, author, parent page)' PERMISSIONS FULL;
DEFINE FIELD source_type ON document TYPE string ASSERT $value INSIDE ['file', 'slack', 'notion', 'jira', 'github', 'confluence', 'onedrive', 'web_page', 'text_input', 'note', 'unknown'] COMMENT 'The type of the original source (e.g., file, slack, notion)' PERMISSIONS FULL;
DEFINE FIELD summary ON document TYPE option<string> COMMENT 'Summary of the document' PERMISSIONS FULL;
DEFINE FIELD team ON document TYPE record<team> PERMISSIONS FULL;
DEFINE FIELD teamSlug ON document VALUE <future> { (SELECT VALUE slug FROM ONLY $this.team LIMIT 1) } PERMISSIONS FULL;
DEFINE FIELD type ON document TYPE option<string> COMMENT 'Type of the document (e.g., report, article, note)' PERMISSIONS FULL;
DEFINE FIELD updated_at ON document TYPE datetime DEFAULT time::now() PERMISSIONS FULL;

-- Indexes
DEFINE INDEX documentNameIndex ON document FIELDS name SEARCH ANALYZER autocomplete BM25(1.2,0.75) DOC_IDS_ORDER 100 DOC_LENGTHS_ORDER 100 POSTINGS_ORDER 100 TERMS_ORDER 100 DOC_IDS_CACHE 100 DOC_LENGTHS_CACHE 100 POSTINGS_CACHE 100 TERMS_CACHE 100 HIGHLIGHTS COMMENT 'Allow full-text search on document name';
DEFINE INDEX documentSourceIndex ON document FIELDS source_type, source_id, organization, parser.type UNIQUE COMMENT 'Ensure uniqueness per source and parser within an organization';
DEFINE INDEX documentSummaryIndex ON document FIELDS summary SEARCH ANALYZER full_text BM25(1.2,0.75) DOC_IDS_ORDER 100 DOC_LENGTHS_ORDER 100 POSTINGS_ORDER 100 TERMS_ORDER 100 DOC_IDS_CACHE 100 DOC_LENGTHS_CACHE 100 POSTINGS_CACHE 100 TERMS_CACHE 100 HIGHLIGHTS COMMENT 'Allow full-text search on document summary';

-- Events
DEFINE EVENT document_status_history ON document WHEN $event = 'UPDATE' AND $before.processing_status != $after.processing_status THEN (UPDATE $value SET processing_status_history += { previous_status: $before.processing_status, status: $after.processing_status, timestamp: time::now() }, updated_at = time::now());
DEFINE EVENT document_status_initial ON document WHEN $event = 'CREATE' THEN (UPDATE $value SET processing_status_history += { previous_status: NONE, status: $after.processing_status, timestamp: time::now() });

-- ------------------------------
-- TABLE: file
-- ------------------------------

DEFINE TABLE file TYPE ANY SCHEMALESS PERMISSIONS NONE;

DEFINE FIELD created_at ON file TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD documents ON file TYPE references<document> PERMISSIONS FULL;
DEFINE FIELD extension ON file TYPE string PERMISSIONS FULL;
DEFINE FIELD file_pages ON file TYPE references<file_page> PERMISSIONS FULL;
DEFINE FIELD name ON file TYPE string PERMISSIONS FULL;
DEFINE FIELD orgSlug ON file VALUE <future> { (SELECT VALUE slug FROM ONLY $this.organization LIMIT 1) } PERMISSIONS FULL;
DEFINE FIELD organization ON file TYPE record<organization> PERMISSIONS FULL;
DEFINE FIELD owningTeam ON file TYPE record<team> PERMISSIONS FULL;
DEFINE FIELD path ON file VALUE string::concat('uploads/', meta::tb(organization.id), ':', meta::id(organization.id), '/', meta::tb(owningTeam.id), ':', meta::id(owningTeam.id), '/', meta::tb(id), ':', meta::id(id), '/', name) PERMISSIONS FULL;
DEFINE FIELD preferred_document ON file TYPE option<record<document>> COMMENT 'Reference to the document record considered the primary/best output for this file' PERMISSIONS FULL;
DEFINE FIELD size ON file TYPE number PERMISSIONS FULL;
DEFINE FIELD status ON file TYPE string DEFAULT 'pending_upload' ASSERT $value INSIDE ['pending_upload', 'uploaded', 'processing', 'completed', 'failed'] PERMISSIONS FULL;
DEFINE FIELD status_history ON file TYPE array<object> DEFAULT [] PERMISSIONS FULL;
DEFINE FIELD status_history[*] ON file TYPE object PERMISSIONS FULL;
DEFINE FIELD teamSlug ON file VALUE <future> { (SELECT VALUE slug FROM ONLY $this.owningTeam LIMIT 1) } PERMISSIONS FULL;
DEFINE FIELD type ON file TYPE string PERMISSIONS FULL;
DEFINE FIELD updated_at ON file TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD uploader ON file TYPE record<user> PERMISSIONS FULL;

-- Events
DEFINE EVENT file_status_history ON file WHEN $event = 'UPDATE' AND $before.status != $after.status THEN (UPDATE $value SET status_history += { previous_status: $before.status, status: $after.status, timestamp: time::now() }, updated_at = time::now());
DEFINE EVENT file_status_initial ON file WHEN $event = 'CREATE' THEN (UPDATE $value SET status_history += { previous_status: NONE, status: $after.status, timestamp: time::now() });

-- ------------------------------
-- TABLE: file_page
-- ------------------------------

DEFINE TABLE file_page TYPE NORMAL SCHEMALESS COMMENT 'While the file is being processed, it is stored in the file_page table' PERMISSIONS NONE;

DEFINE FIELD content ON file_page TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD error_message ON file_page TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD file ON file_page TYPE record<file> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;
DEFINE FIELD image_path ON file_page TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD page_num ON file_page TYPE number DEFAULT 0 PERMISSIONS FULL;
DEFINE FIELD s3_error_path ON file_page TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD s3_input_path ON file_page TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD s3_output_path ON file_page TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD status ON file_page TYPE string DEFAULT 'pending' ASSERT $value INSIDE ['pending', 'processing', 'inference_completed', 'completed', 'failed'] PERMISSIONS FULL;

-- ------------------------------
-- TABLE: follows
-- ------------------------------

DEFINE TABLE follows TYPE RELATION IN block OUT block SCHEMAFULL COMMENT 'Sequential flow relationship between blocks (next/prev in document order).' PERMISSIONS NONE;

DEFINE FIELD in ON follows TYPE record<block> COMMENT 'The preceding block' PERMISSIONS FULL;
DEFINE FIELD out ON follows TYPE record<block> COMMENT 'The following block' PERMISSIONS FULL;

-- Indexes
DEFINE INDEX followsInIndex ON follows FIELDS in;
DEFINE INDEX followsOutIndex ON follows FIELDS out;

-- ------------------------------
-- TABLE: from
-- ------------------------------

DEFINE TABLE from TYPE ANY SCHEMALESS PERMISSIONS NONE;


-- ------------------------------
-- TABLE: github
-- ------------------------------

DEFINE TABLE github TYPE NORMAL SCHEMALESS COMMENT 'Github integration' PERMISSIONS NONE;

DEFINE FIELD document ON github TYPE option<record<document>> PERMISSIONS FULL;
DEFINE FIELD preferred_document ON github TYPE option<record<document>> COMMENT 'Reference to the document record considered the primary/best output for this source entity' PERMISSIONS FULL;

-- ------------------------------
-- TABLE: hierarchy
-- ------------------------------

DEFINE TABLE hierarchy TYPE RELATION IN block OUT block SCHEMAFULL COMMENT 'Tracks semantic hierarchical relationships between blocks for enhanced RAG retrieval.' PERMISSIONS NONE;

DEFINE FIELD in ON hierarchy TYPE record<block> COMMENT 'Parent block in the hierarchy' PERMISSIONS FULL;
DEFINE FIELD level ON hierarchy TYPE option<number> COMMENT 'Hierarchy level (e.g., heading level)' PERMISSIONS FULL;
DEFINE FIELD order ON hierarchy TYPE number COMMENT 'Order within the hierarchical level' PERMISSIONS FULL;
DEFINE FIELD out ON hierarchy TYPE record<block> COMMENT 'Child block in the hierarchy' PERMISSIONS FULL;
DEFINE FIELD relation_type ON hierarchy TYPE string ASSERT $value INSIDE ['section', 'subsection', 'list_item', 'table_content', 'table_caption', 'table_cell', 'table_row', 'figure_content', 'figure_caption', 'nested_content'] COMMENT 'Type of hierarchical relationship' PERMISSIONS FULL;
DEFINE FIELD section_path ON hierarchy TYPE option<object> COMMENT 'Breadcrumb path object (e.g., {"1": "block:xyz", "2": "block:abc"} for hierarchical navigation)' PERMISSIONS FULL;

-- Indexes
DEFINE INDEX hierarchyLevelIndex ON hierarchy FIELDS level, relation_type;

-- ------------------------------
-- TABLE: integration
-- ------------------------------

DEFINE TABLE integration TYPE NORMAL SCHEMAFULL COMMENT 'Stores integration credentials and configurations for teams' PERMISSIONS NONE;

DEFINE FIELD config ON integration FLEXIBLE TYPE object DEFAULT {  } COMMENT 'Non-sensitive configuration (workspace ID, channel preferences, etc.)' PERMISSIONS FULL;
DEFINE FIELD createdAt ON integration TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD credentials ON integration FLEXIBLE TYPE object COMMENT 'Encrypted credentials (API keys, tokens, etc.)' PERMISSIONS FULL;
DEFINE FIELD isActive ON integration TYPE bool DEFAULT true COMMENT 'Whether this integration is active' PERMISSIONS FULL;
DEFINE FIELD lastError ON integration TYPE option<string> COMMENT 'Last error message if status is error' PERMISSIONS FULL;
DEFINE FIELD lastSyncAt ON integration TYPE option<datetime> COMMENT 'Last successful sync timestamp' PERMISSIONS FULL;
DEFINE FIELD name ON integration TYPE string COMMENT 'Display name for this integration instance' PERMISSIONS FULL;
DEFINE FIELD status ON integration TYPE string DEFAULT 'disconnected' ASSERT $value INSIDE ['connected', 'error', 'disconnected', 'expired'] COMMENT 'Current connection status' PERMISSIONS FULL;
DEFINE FIELD team ON integration TYPE record<team> REFERENCE ON DELETE CASCADE COMMENT 'Team that owns this integration' PERMISSIONS FULL;
DEFINE FIELD type ON integration TYPE string ASSERT $value INSIDE ['notion', 'slack', 'github', 'jira', 'confluence', 'onedrive', 'google_drive'] COMMENT 'Type of integration' PERMISSIONS FULL;
DEFINE FIELD updatedAt ON integration TYPE datetime DEFAULT time::now() PERMISSIONS FULL;

-- Indexes
DEFINE INDEX integrationActiveIndex ON integration FIELDS team, type, isActive COMMENT 'Optimize queries for active integrations';
DEFINE INDEX integrationTeamIndex ON integration FIELDS team COMMENT 'Optimize queries by team';
DEFINE INDEX integrationTypeIndex ON integration FIELDS type COMMENT 'Optimize queries by integration type';

-- Events
DEFINE EVENT integration_updated ON integration WHEN $event = 'UPDATE' THEN (UPDATE $value SET updatedAt = time::now());

-- ------------------------------
-- TABLE: invitation
-- ------------------------------

DEFINE TABLE invitation TYPE NORMAL SCHEMALESS COMMENT 'better-auth orgs: invitations' PERMISSIONS NONE;

DEFINE FIELD createdAt ON invitation TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD email ON invitation TYPE string PERMISSIONS FULL;
DEFINE FIELD expiresAt ON invitation TYPE datetime PERMISSIONS FULL;
DEFINE FIELD inviterId ON invitation TYPE record<user> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;
DEFINE FIELD organizationId ON invitation TYPE record<organization> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;
DEFINE FIELD role ON invitation TYPE string PERMISSIONS FULL;
DEFINE FIELD status ON invitation TYPE string PERMISSIONS FULL;
DEFINE FIELD teamId ON invitation TYPE option<record<team>> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;

-- ------------------------------
-- TABLE: jira
-- ------------------------------

DEFINE TABLE jira TYPE NORMAL SCHEMALESS COMMENT 'Jira integration' PERMISSIONS NONE;

DEFINE FIELD document ON jira TYPE option<record<document>> PERMISSIONS FULL;
DEFINE FIELD preferred_document ON jira TYPE option<record<document>> COMMENT 'Reference to the document record considered the primary/best output for this source entity' PERMISSIONS FULL;

-- ------------------------------
-- TABLE: member
-- ------------------------------

DEFINE TABLE member TYPE NORMAL SCHEMALESS COMMENT 'better-auth orgs: members' PERMISSIONS NONE;

DEFINE FIELD createdAt ON member TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD organizationId ON member TYPE record<organization> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;
DEFINE FIELD role ON member TYPE string PERMISSIONS FULL;
DEFINE FIELD teamId ON member TYPE option<record<team>> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;
DEFINE FIELD userId ON member TYPE record<user> REFERENCE ON DELETE IGNORE PERMISSIONS FULL;

-- ------------------------------
-- TABLE: message
-- ------------------------------

DEFINE TABLE message TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD attachments ON message FLEXIBLE TYPE array<object> PERMISSIONS FULL;
DEFINE FIELD attachments[*] ON message FLEXIBLE TYPE object PERMISSIONS FULL;
DEFINE FIELD chat ON message TYPE record<chat> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;
DEFINE FIELD content ON message TYPE string PERMISSIONS FULL;
DEFINE FIELD createdAt ON message TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD parts ON message FLEXIBLE TYPE array<object> PERMISSIONS FULL;
DEFINE FIELD parts[*] ON message FLEXIBLE TYPE object PERMISSIONS FULL;
DEFINE FIELD role ON message TYPE string PERMISSIONS FULL;
DEFINE FIELD user ON message TYPE record<user> REFERENCE ON DELETE IGNORE PERMISSIONS FULL;

-- ------------------------------
-- TABLE: note
-- ------------------------------

DEFINE TABLE note TYPE NORMAL SCHEMALESS PERMISSIONS NONE;

DEFINE FIELD created_at ON note TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD document ON note TYPE option<record<document>> PERMISSIONS FULL;
DEFINE FIELD preferred_document ON note TYPE option<record<document>> COMMENT 'Reference to the document record considered the primary/best output for this source entity' PERMISSIONS FULL;
DEFINE FIELD updated_at ON note TYPE datetime DEFAULT time::now() PERMISSIONS FULL;

-- ------------------------------
-- TABLE: notion
-- ------------------------------

DEFINE TABLE notion TYPE NORMAL SCHEMAFULL COMMENT 'Notion integration - stores pages and databases' PERMISSIONS NONE;

DEFINE FIELD createdAt ON notion TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD document ON notion TYPE option<record<document>> PERMISSIONS FULL;
DEFINE FIELD lastEditedTime ON notion TYPE datetime COMMENT 'Last edited timestamp from Notion' PERMISSIONS FULL;
DEFINE FIELD notionId ON notion TYPE string COMMENT 'Notion resource ID (page or database)' PERMISSIONS FULL;
DEFINE FIELD parentId ON notion TYPE option<string> COMMENT 'Parent page or database ID (for pages)' PERMISSIONS FULL;
DEFINE FIELD parentType ON notion TYPE option<string> ASSERT $value INSIDE ['database', 'page', 'workspace'] COMMENT 'Type of parent container (for pages)' PERMISSIONS FULL;
DEFINE FIELD preferred_document ON notion TYPE option<record<document>> COMMENT 'Reference to the document record considered the primary/best output for this source entity' PERMISSIONS FULL;
DEFINE FIELD properties ON notion FLEXIBLE TYPE object DEFAULT {  } COMMENT 'Notion resource properties/schema' PERMISSIONS FULL;
DEFINE FIELD syncedAt ON notion TYPE datetime DEFAULT time::now() COMMENT 'When this resource was last synced' PERMISSIONS FULL;
DEFINE FIELD teamId ON notion TYPE record<team> REFERENCE ON DELETE CASCADE COMMENT 'Team this resource belongs to' PERMISSIONS FULL;
DEFINE FIELD title ON notion TYPE string COMMENT 'Resource title' PERMISSIONS FULL;
DEFINE FIELD type ON notion TYPE string ASSERT $value INSIDE ['page', 'database'] COMMENT 'Type of Notion resource' PERMISSIONS FULL;
DEFINE FIELD updatedAt ON notion TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD url ON notion TYPE string COMMENT 'Notion resource URL' PERMISSIONS FULL;

-- Indexes
DEFINE INDEX notionLastEditedIndex ON notion FIELDS lastEditedTime, teamId COMMENT 'Optimize sync queries by last edited time';
DEFINE INDEX notionResourceIndex ON notion FIELDS notionId, teamId UNIQUE COMMENT 'Ensure unique Notion resources per team';
DEFINE INDEX notionTitleIndex ON notion FIELDS title SEARCH ANALYZER autocomplete BM25(1.2,0.75) DOC_IDS_ORDER 100 DOC_LENGTHS_ORDER 100 POSTINGS_ORDER 100 TERMS_ORDER 100 DOC_IDS_CACHE 100 DOC_LENGTHS_CACHE 100 POSTINGS_CACHE 100 TERMS_CACHE 100 HIGHLIGHTS COMMENT 'Allow full-text search on resource titles';
DEFINE INDEX notionTypeIndex ON notion FIELDS type, teamId COMMENT 'Optimize queries by resource type';

-- ------------------------------
-- TABLE: notion_blocks
-- ------------------------------

DEFINE TABLE notion_blocks TYPE NORMAL SCHEMALESS COMMENT 'Notion blocks stream data' PERMISSIONS NONE;

DEFINE FIELD created_at ON notion_blocks TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD notion_id ON notion_blocks TYPE string COMMENT 'Notion block ID' PERMISSIONS FULL;
DEFINE FIELD parent_id ON notion_blocks TYPE string COMMENT 'Parent page/database ID' PERMISSIONS FULL;
DEFINE FIELD raw_data ON notion_blocks FLEXIBLE TYPE object COMMENT 'Raw block data from Notion API' PERMISSIONS FULL;
DEFINE FIELD stream_metadata ON notion_blocks FLEXIBLE TYPE object DEFAULT {  } COMMENT 'Stream-specific metadata for sync control' PERMISSIONS FULL;
DEFINE FIELD sync_cursor ON notion_blocks TYPE option<string> COMMENT 'Cursor for incremental sync' PERMISSIONS FULL;
DEFINE FIELD synced_at ON notion_blocks TYPE datetime DEFAULT time::now() COMMENT 'When this record was last synced' PERMISSIONS FULL;
DEFINE FIELD team_id ON notion_blocks TYPE record<team> REFERENCE ON DELETE CASCADE COMMENT 'Team this block belongs to' PERMISSIONS FULL;
DEFINE FIELD updated_at ON notion_blocks TYPE datetime DEFAULT time::now() PERMISSIONS FULL;

-- Indexes
DEFINE INDEX notion_blocks_notion_id_index ON notion_blocks FIELDS notion_id, team_id UNIQUE COMMENT 'Ensure unique blocks per team';
DEFINE INDEX notion_blocks_parent_index ON notion_blocks FIELDS parent_id, team_id COMMENT 'Optimize queries by parent resource';
DEFINE INDEX notion_blocks_stream_index ON notion_blocks FIELDS team_id, sync_cursor COMMENT 'Optimize incremental sync queries';
DEFINE INDEX notion_blocks_synced_at_index ON notion_blocks FIELDS synced_at, team_id COMMENT 'Optimize sync history queries';

-- ------------------------------
-- TABLE: notion_comments
-- ------------------------------

DEFINE TABLE notion_comments TYPE NORMAL SCHEMALESS COMMENT 'Notion comments stream data' PERMISSIONS NONE;

DEFINE FIELD created_at ON notion_comments TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD notion_id ON notion_comments TYPE string COMMENT 'Notion comment ID' PERMISSIONS FULL;
DEFINE FIELD parent_id ON notion_comments TYPE string COMMENT 'Parent page/block ID' PERMISSIONS FULL;
DEFINE FIELD raw_data ON notion_comments FLEXIBLE TYPE object COMMENT 'Raw comment data from Notion API' PERMISSIONS FULL;
DEFINE FIELD stream_metadata ON notion_comments FLEXIBLE TYPE object DEFAULT {  } COMMENT 'Stream-specific metadata for sync control' PERMISSIONS FULL;
DEFINE FIELD sync_cursor ON notion_comments TYPE option<string> COMMENT 'Cursor for incremental sync' PERMISSIONS FULL;
DEFINE FIELD synced_at ON notion_comments TYPE datetime DEFAULT time::now() COMMENT 'When this record was last synced' PERMISSIONS FULL;
DEFINE FIELD team_id ON notion_comments TYPE record<team> REFERENCE ON DELETE CASCADE COMMENT 'Team this comment belongs to' PERMISSIONS FULL;
DEFINE FIELD updated_at ON notion_comments TYPE datetime DEFAULT time::now() PERMISSIONS FULL;

-- Indexes
DEFINE INDEX notion_comments_notion_id_index ON notion_comments FIELDS notion_id, team_id UNIQUE COMMENT 'Ensure unique comments per team';
DEFINE INDEX notion_comments_parent_index ON notion_comments FIELDS parent_id, team_id COMMENT 'Optimize queries by parent resource';
DEFINE INDEX notion_comments_stream_index ON notion_comments FIELDS team_id, sync_cursor COMMENT 'Optimize incremental sync queries';
DEFINE INDEX notion_comments_synced_at_index ON notion_comments FIELDS synced_at, team_id COMMENT 'Optimize sync history queries';

-- ------------------------------
-- TABLE: notion_databases
-- ------------------------------

DEFINE TABLE notion_databases TYPE NORMAL SCHEMALESS COMMENT 'Notion databases' PERMISSIONS NONE;

DEFINE FIELD created_at ON notion_databases TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD notion_id ON notion_databases TYPE string COMMENT 'Notion database ID' PERMISSIONS FULL;
DEFINE FIELD raw_data ON notion_databases FLEXIBLE TYPE object COMMENT 'Raw database data from Notion API' PERMISSIONS FULL;
DEFINE FIELD stream_metadata ON notion_databases FLEXIBLE TYPE object DEFAULT {  } COMMENT 'Stream-specific metadata for sync control' PERMISSIONS FULL;
DEFINE FIELD sync_cursor ON notion_databases TYPE option<string> COMMENT 'Cursor for incremental sync' PERMISSIONS FULL;
DEFINE FIELD synced_at ON notion_databases TYPE datetime DEFAULT time::now() COMMENT 'When this record was last synced' PERMISSIONS FULL;
DEFINE FIELD team_id ON notion_databases TYPE record<team> REFERENCE ON DELETE CASCADE COMMENT 'Team this database belongs to' PERMISSIONS FULL;
DEFINE FIELD updated_at ON notion_databases TYPE datetime DEFAULT time::now() PERMISSIONS FULL;

-- Indexes
DEFINE INDEX notion_databases_notion_id_index ON notion_databases FIELDS notion_id, team_id UNIQUE COMMENT 'Ensure unique databases per team';
DEFINE INDEX notion_databases_stream_index ON notion_databases FIELDS team_id, sync_cursor COMMENT 'Optimize incremental sync queries';
DEFINE INDEX notion_databases_synced_at_index ON notion_databases FIELDS synced_at, team_id COMMENT 'Optimize sync history queries';

-- ------------------------------
-- TABLE: notion_pages
-- ------------------------------

DEFINE TABLE notion_pages TYPE NORMAL SCHEMALESS COMMENT 'Notion pages' PERMISSIONS NONE;

DEFINE FIELD created_at ON notion_pages TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD notion_id ON notion_pages TYPE string COMMENT 'Notion page ID' PERMISSIONS FULL;
DEFINE FIELD raw_data ON notion_pages FLEXIBLE TYPE object COMMENT 'Raw page data from Notion API' PERMISSIONS FULL;
DEFINE FIELD stream_metadata ON notion_pages FLEXIBLE TYPE object DEFAULT {  } COMMENT 'Stream-specific metadata for sync control' PERMISSIONS FULL;
DEFINE FIELD sync_cursor ON notion_pages TYPE option<string> COMMENT 'Cursor for incremental sync' PERMISSIONS FULL;
DEFINE FIELD synced_at ON notion_pages TYPE datetime DEFAULT time::now() COMMENT 'When this record was last synced' PERMISSIONS FULL;
DEFINE FIELD team_id ON notion_pages TYPE record<team> REFERENCE ON DELETE CASCADE COMMENT 'Team this page belongs to' PERMISSIONS FULL;
DEFINE FIELD updated_at ON notion_pages TYPE datetime DEFAULT time::now() PERMISSIONS FULL;

-- Indexes
DEFINE INDEX notion_pages_notion_id_index ON notion_pages FIELDS notion_id, team_id UNIQUE COMMENT 'Ensure unique pages per team';
DEFINE INDEX notion_pages_stream_index ON notion_pages FIELDS team_id, sync_cursor COMMENT 'Optimize incremental sync queries';
DEFINE INDEX notion_pages_synced_at_index ON notion_pages FIELDS synced_at, team_id COMMENT 'Optimize sync history queries';

-- ------------------------------
-- TABLE: notion_stream_state
-- ------------------------------

DEFINE TABLE notion_stream_state TYPE NORMAL SCHEMAFULL COMMENT 'Stream state management for Notion streams' PERMISSIONS NONE;

DEFINE FIELD created_at ON notion_stream_state TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD cursor ON notion_stream_state TYPE option<string> COMMENT 'Current stream cursor for incremental sync' PERMISSIONS FULL;
DEFINE FIELD error_message ON notion_stream_state TYPE option<string> COMMENT 'Error message if sync failed' PERMISSIONS FULL;
DEFINE FIELD last_synced_at ON notion_stream_state TYPE datetime DEFAULT time::now() COMMENT 'Timestamp of last successful sync' PERMISSIONS FULL;
DEFINE FIELD status ON notion_stream_state TYPE string DEFAULT 'idle' ASSERT $value INSIDE ['idle', 'syncing', 'completed', 'failed'] COMMENT 'Current stream sync status' PERMISSIONS FULL;
DEFINE FIELD stream_name ON notion_stream_state TYPE string ASSERT $value INSIDE ['pages', 'databases', 'blocks', 'comments', 'users'] COMMENT 'Name of the stream' PERMISSIONS FULL;
DEFINE FIELD sync_config ON notion_stream_state FLEXIBLE TYPE object DEFAULT {  } COMMENT 'Stream-specific configuration' PERMISSIONS FULL;
DEFINE FIELD team_id ON notion_stream_state TYPE record<team> REFERENCE ON DELETE CASCADE COMMENT 'Team this stream state belongs to' PERMISSIONS FULL;
DEFINE FIELD updated_at ON notion_stream_state TYPE datetime DEFAULT time::now() PERMISSIONS FULL;

-- Indexes
DEFINE INDEX notion_stream_state_status_index ON notion_stream_state FIELDS status, team_id COMMENT 'Optimize queries by sync status';
DEFINE INDEX notion_stream_state_unique ON notion_stream_state FIELDS stream_name, team_id UNIQUE COMMENT 'Ensure unique stream state per team';

-- ------------------------------
-- TABLE: notion_sync_state
-- ------------------------------

DEFINE TABLE notion_sync_state TYPE NORMAL SCHEMAFULL COMMENT 'Tracks sync state for Notion resources per team' PERMISSIONS NONE;

DEFINE FIELD errorMessage ON notion_sync_state TYPE option<string> COMMENT 'Error message if sync failed' PERMISSIONS FULL;
DEFINE FIELD lastSyncedAt ON notion_sync_state TYPE datetime DEFAULT time::now() COMMENT 'Timestamp of last successful sync' PERMISSIONS FULL;
DEFINE FIELD resourceType ON notion_sync_state TYPE string ASSERT $value INSIDE ['database', 'page', 'user'] COMMENT 'Type of Notion resource being synced' PERMISSIONS FULL;
DEFINE FIELD status ON notion_sync_state TYPE string DEFAULT 'idle' ASSERT $value INSIDE ['idle', 'syncing', 'completed', 'failed'] COMMENT 'Current sync status' PERMISSIONS FULL;
DEFINE FIELD syncCursor ON notion_sync_state TYPE option<string> COMMENT 'Pagination cursor for incremental sync' PERMISSIONS FULL;
DEFINE FIELD teamId ON notion_sync_state TYPE record<team> REFERENCE ON DELETE CASCADE COMMENT 'Team this sync state belongs to' PERMISSIONS FULL;
DEFINE FIELD updatedAt ON notion_sync_state TYPE datetime DEFAULT time::now() PERMISSIONS FULL;

-- ------------------------------
-- TABLE: notion_users
-- ------------------------------

DEFINE TABLE notion_users TYPE NORMAL SCHEMALESS COMMENT 'Notion users stream data' PERMISSIONS NONE;

DEFINE FIELD created_at ON notion_users TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD notion_id ON notion_users TYPE string COMMENT 'Notion user ID' PERMISSIONS FULL;
DEFINE FIELD raw_data ON notion_users FLEXIBLE TYPE object COMMENT 'Raw user data from Notion API' PERMISSIONS FULL;
DEFINE FIELD stream_metadata ON notion_users FLEXIBLE TYPE object DEFAULT {  } COMMENT 'Stream-specific metadata for sync control' PERMISSIONS FULL;
DEFINE FIELD sync_cursor ON notion_users TYPE option<string> COMMENT 'Cursor for incremental sync' PERMISSIONS FULL;
DEFINE FIELD synced_at ON notion_users TYPE datetime DEFAULT time::now() COMMENT 'When this record was last synced' PERMISSIONS FULL;
DEFINE FIELD team_id ON notion_users TYPE record<team> REFERENCE ON DELETE CASCADE COMMENT 'Team this user belongs to' PERMISSIONS FULL;
DEFINE FIELD updated_at ON notion_users TYPE datetime DEFAULT time::now() PERMISSIONS FULL;

-- Indexes
DEFINE INDEX notion_users_notion_id_index ON notion_users FIELDS notion_id, team_id UNIQUE COMMENT 'Ensure unique users per team';
DEFINE INDEX notion_users_stream_index ON notion_users FIELDS team_id, sync_cursor COMMENT 'Optimize incremental sync queries';
DEFINE INDEX notion_users_synced_at_index ON notion_users FIELDS synced_at, team_id COMMENT 'Optimize sync history queries';

-- ------------------------------
-- TABLE: onedrive
-- ------------------------------

DEFINE TABLE onedrive TYPE NORMAL SCHEMALESS COMMENT 'OneDrive integration' PERMISSIONS NONE;

DEFINE FIELD document ON onedrive TYPE option<record<document>> PERMISSIONS FULL;
DEFINE FIELD preferred_document ON onedrive TYPE option<record<document>> COMMENT 'Reference to the document record considered the primary/best output for this source entity' PERMISSIONS FULL;

-- ------------------------------
-- TABLE: organization
-- ------------------------------

DEFINE TABLE organization TYPE NORMAL SCHEMALESS COMMENT 'better-auth orgs: organizations' PERMISSIONS NONE;

DEFINE FIELD createdAt ON organization TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD logo ON organization TYPE option<string> COMMENT 'The logo of the organization' PERMISSIONS FULL;
DEFINE FIELD metadata ON organization FLEXIBLE TYPE option<object> COMMENT 'Additional metadata for the organization' PERMISSIONS FULL;
DEFINE FIELD name ON organization TYPE string PERMISSIONS FULL;
DEFINE FIELD slug ON organization TYPE string PERMISSIONS FULL;
DEFINE FIELD updatedAt ON organization TYPE datetime DEFAULT time::now() PERMISSIONS FULL;

-- ------------------------------
-- TABLE: part_of
-- ------------------------------

DEFINE TABLE part_of TYPE RELATION IN chunk OUT document ENFORCED SCHEMALESS COMMENT 'A relation table that links chunks to their parent document' PERMISSIONS NONE;

DEFINE FIELD in ON part_of TYPE record<chunk> PERMISSIONS FULL;
DEFINE FIELD out ON part_of TYPE record<document> PERMISSIONS FULL;

-- ------------------------------
-- TABLE: project
-- ------------------------------

DEFINE TABLE project TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD chats ON project TYPE references<chat> PERMISSIONS FULL;
DEFINE FIELD description ON project TYPE string PERMISSIONS FULL;
DEFINE FIELD name ON project TYPE string PERMISSIONS FULL;
DEFINE FIELD organization ON project TYPE record<organization> PERMISSIONS FULL;
DEFINE FIELD team ON project TYPE record<team> PERMISSIONS FULL;

-- ------------------------------
-- TABLE: session
-- ------------------------------

DEFINE TABLE session TYPE ANY SCHEMALESS COMMENT 'better-auth: sessions' PERMISSIONS NONE;

DEFINE FIELD activeOrganizationId ON session TYPE option<string> COMMENT 'The id of the active organization' PERMISSIONS FULL;
DEFINE FIELD createdAt ON session TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD expiresAt ON session PERMISSIONS FULL;
DEFINE FIELD id ON session TYPE string PERMISSIONS FULL;
DEFINE FIELD ipAddress ON session TYPE string PERMISSIONS FULL;
DEFINE FIELD token ON session TYPE string PERMISSIONS FULL;
DEFINE FIELD updatedAt ON session TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD userId ON session TYPE record<user> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;

-- ------------------------------
-- TABLE: slack
-- ------------------------------

DEFINE TABLE slack TYPE NORMAL SCHEMALESS COMMENT 'Slack integration' PERMISSIONS NONE;

DEFINE FIELD document ON slack TYPE option<record<document>> PERMISSIONS FULL;
DEFINE FIELD preferred_document ON slack TYPE option<record<document>> COMMENT 'Reference to the document record considered the primary/best output for this source entity' PERMISSIONS FULL;

-- ------------------------------
-- TABLE: sources_from
-- ------------------------------

DEFINE TABLE sources_from TYPE RELATION IN chunk OUT block SCHEMAFULL COMMENT 'Links chunks to the source blocks they were derived from for visual grounding and provenance tracking.' PERMISSIONS NONE;

DEFINE FIELD in ON sources_from TYPE record<chunk> COMMENT 'The chunk that was derived from source blocks' PERMISSIONS FULL;
DEFINE FIELD order ON sources_from TYPE option<number> COMMENT 'Order of this block within the chunk (for preserving sequence)' PERMISSIONS FULL;
DEFINE FIELD out ON sources_from TYPE record<block> COMMENT 'The source block that contributed to the chunk' PERMISSIONS FULL;

-- Indexes
DEFINE INDEX sourcesFromBlockIndex ON sources_from FIELDS out;
DEFINE INDEX sourcesFromChunkIndex ON sources_from FIELDS in;

-- ------------------------------
-- TABLE: team
-- ------------------------------

DEFINE TABLE team TYPE NORMAL SCHEMALESS COMMENT 'better-auth orgs: teams' PERMISSIONS NONE;

DEFINE FIELD createdAt ON team TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD default ON team TYPE bool DEFAULT false PERMISSIONS FULL;
DEFINE FIELD isPrivate ON team TYPE bool DEFAULT false PERMISSIONS FULL;
DEFINE FIELD name ON team TYPE string PERMISSIONS FULL;
DEFINE FIELD organizationId ON team TYPE record<organization> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;
DEFINE FIELD slug ON team TYPE string PERMISSIONS FULL;
DEFINE FIELD updatedAt ON team TYPE option<datetime> DEFAULT time::now() PERMISSIONS FULL;

-- Indexes
DEFINE INDEX teamSlugIndex ON team FIELDS slug, organizationId UNIQUE COMMENT 'Ensure that the slug is unique within the organization';

-- ------------------------------
-- TABLE: text_input
-- ------------------------------

DEFINE TABLE text_input TYPE NORMAL SCHEMALESS COMMENT 'Text input integration' PERMISSIONS NONE;

DEFINE FIELD document ON text_input TYPE option<record<document>> PERMISSIONS FULL;
DEFINE FIELD preferred_document ON text_input TYPE option<record<document>> COMMENT 'Reference to the document record considered the primary/best output for this source entity' PERMISSIONS FULL;

-- ------------------------------
-- TABLE: user
-- ------------------------------

DEFINE TABLE user TYPE ANY SCHEMALESS COMMENT 'better-auth: users' PERMISSIONS NONE;

DEFINE FIELD chats ON user TYPE references<chat> PERMISSIONS FULL;
DEFINE FIELD email ON user TYPE string PERMISSIONS FULL;
DEFINE FIELD name ON user TYPE string PERMISSIONS FULL;
DEFINE FIELD organizations ON user TYPE references<member> PERMISSIONS FULL;

-- ------------------------------
-- TABLE: verification
-- ------------------------------

DEFINE TABLE verification TYPE ANY SCHEMALESS PERMISSIONS NONE;


-- ------------------------------
-- TABLE: vote
-- ------------------------------

DEFINE TABLE vote TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD chatId ON vote TYPE record<chat> PERMISSIONS FULL;
DEFINE FIELD createdAt ON vote TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD feedback ON vote TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD isUpvoted ON vote TYPE bool PERMISSIONS FULL;
DEFINE FIELD messageId ON vote TYPE record<message> PERMISSIONS FULL;
DEFINE FIELD reasons ON vote TYPE option<array<string>> PERMISSIONS FULL;
DEFINE FIELD reasons[*] ON vote TYPE string PERMISSIONS FULL;
DEFINE FIELD userId ON vote TYPE record<user> PERMISSIONS FULL;

-- Indexes
DEFINE INDEX voteMessageIdIndex ON vote FIELDS userId, messageId, chatId UNIQUE;

-- ------------------------------
-- TABLE: web_page
-- ------------------------------

DEFINE TABLE web_page TYPE NORMAL SCHEMALESS COMMENT 'Web page integration' PERMISSIONS NONE;

DEFINE FIELD document ON web_page TYPE option<record<document>> PERMISSIONS FULL;
DEFINE FIELD preferred_document ON web_page TYPE option<record<document>> COMMENT 'Reference to the document record considered the primary/best output for this source entity' PERMISSIONS FULL;