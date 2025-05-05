-- ------------------------------
-- SCHEMA DEFINITIONS
-- ------------------------------

OPTION IMPORT;


-- ------------------------------
-- FUNCTIONS
-- ------------------------------

DEFINE FUNCTION OVERWRITE fn::sentence_to_vector($sentence: string) {
LET $query_embeddings = (RETURN http::post('http://ollama-api-r0gwks4kow0ws4gck4oow844:11434/api/embeddings', { model: 'nomic-embed-text', prompt: $sentence }).embedding);
RETURN $query_embeddings;
} PERMISSIONS FULL;


-- ------------------------------
-- ANALYZERS
-- ------------------------------

DEFINE ANALYZER OVERWRITE autocomplete FILTERS LOWERCASE,EDGENGRAM(2,10);

DEFINE ANALYZER OVERWRITE full_text TOKENIZERS CLASS FILTERS LOWERCASE,EDGENGRAM(2,10),ASCII,SNOWBALL(ENGLISH);


-- ------------------------------
-- TABLES
-- ------------------------------

-- ------------------------------
-- TABLE: account
-- ------------------------------

DEFINE TABLE OVERWRITE account TYPE ANY SCHEMALESS COMMENT 'better-auth: accounts' PERMISSIONS NONE;

DEFINE FIELD OVERWRITE accountId ON account TYPE record<user> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;
DEFINE FIELD OVERWRITE createdAt ON account TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE id ON account TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE password ON account TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE providerId ON account TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE updatedAt ON account TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE userId ON account TYPE record<user> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;

-- ------------------------------
-- TABLE: chat
-- ------------------------------

DEFINE TABLE OVERWRITE chat TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD OVERWRITE description ON chat TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE files ON chat TYPE references<file> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE is_archived ON chat TYPE bool DEFAULT false PERMISSIONS FULL;
DEFINE FIELD OVERWRITE messages ON chat TYPE references<message> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE owner ON chat TYPE record<user> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE project ON chat TYPE option<record<project>> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE started_at ON chat TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE team ON chat TYPE record<team> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE title ON chat TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE updated_at ON chat TYPE datetime DEFAULT time::now() PERMISSIONS FULL;

-- Indexes
DEFINE INDEX OVERWRITE chatTitleIndex ON chat FIELDS title SEARCH ANALYZER autocomplete BM25(1.2,0.75) DOC_IDS_ORDER 100 DOC_LENGTHS_ORDER 100 POSTINGS_ORDER 100 TERMS_ORDER 100 DOC_IDS_CACHE 100 DOC_LENGTHS_CACHE 100 POSTINGS_CACHE 100 TERMS_CACHE 100 HIGHLIGHTS COMMENT 'Allow full-text search queries on the title of the chat';

-- ------------------------------
-- TABLE: chunk
-- ------------------------------

DEFINE TABLE OVERWRITE chunk TYPE NORMAL SCHEMALESS PERMISSIONS NONE;

DEFINE FIELD OVERWRITE content ON chunk TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE document ON chunk TYPE record<document> COMMENT 'The logical document this chunk belongs to' PERMISSIONS FULL;
DEFINE FIELD OVERWRITE embedding ON chunk TYPE option<array<float>> VALUE fn::sentence_to_vector(content) PERMISSIONS FULL;
DEFINE FIELD OVERWRITE embedding[*] ON chunk TYPE float PERMISSIONS FULL;
DEFINE FIELD OVERWRITE end ON chunk TYPE number PERMISSIONS FULL;
DEFINE FIELD OVERWRITE enriched_text ON chunk TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE file ON chunk TYPE option<record<file>> COMMENT 'Link to the original file record, if the document source was a file' PERMISSIONS FULL;
DEFINE FIELD OVERWRITE id ON chunk TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE important_kwd ON chunk TYPE array<string> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE important_kwd[*] ON chunk TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE question_kwd ON chunk TYPE array<string> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE question_kwd[*] ON chunk TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE start ON chunk TYPE number PERMISSIONS FULL;

-- Indexes
DEFINE INDEX OVERWRITE chunkDocumentIndex ON chunk FIELDS document;

-- ------------------------------
-- TABLE: confluence
-- ------------------------------

DEFINE TABLE OVERWRITE confluence TYPE NORMAL SCHEMALESS COMMENT 'Confluence integration' PERMISSIONS NONE;

DEFINE FIELD OVERWRITE document ON confluence TYPE record<document> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;

-- ------------------------------
-- TABLE: document
-- ------------------------------

DEFINE TABLE OVERWRITE document TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD OVERWRITE authors ON document TYPE array<string> COMMENT 'Authors of the document' PERMISSIONS FULL;
DEFINE FIELD OVERWRITE authors[*] ON document TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE created_at ON document TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE dates ON document TYPE array<string> COMMENT 'Dates extracted from the document' PERMISSIONS FULL;
DEFINE FIELD OVERWRITE dates[*] ON document TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE keywords ON document TYPE array<string> COMMENT 'Keywords extracted from the document' PERMISSIONS FULL;
DEFINE FIELD OVERWRITE keywords[*] ON document TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE name ON document TYPE string COMMENT 'Display name or title of the document' PERMISSIONS FULL;
DEFINE FIELD OVERWRITE organization ON document TYPE record<organization> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE organizations ON document TYPE array<string> COMMENT 'Organizations extracted from the document' PERMISSIONS FULL;
DEFINE FIELD OVERWRITE organizations[*] ON document TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE original_file ON document TYPE option<record<file>> COMMENT 'Link to the file record if source_type is "file"' PERMISSIONS FULL;
DEFINE FIELD OVERWRITE original_last_updated_date ON document TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE people ON document TYPE array<string> COMMENT 'People extracted from the document' PERMISSIONS FULL;
DEFINE FIELD OVERWRITE people[*] ON document TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE places ON document TYPE array<string> COMMENT 'Places extracted from the document' PERMISSIONS FULL;
DEFINE FIELD OVERWRITE places[*] ON document TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE processed_at ON document TYPE option<datetime> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE processed_content_uri ON document TYPE option<string> COMMENT 'URI/Path to the processed content (e.g., Docling JSON) in object storage (S3)' PERMISSIONS FULL;
DEFINE FIELD OVERWRITE processing_error ON document TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE processing_status ON document TYPE string DEFAULT 'pending' ASSERT $value INSIDE ['pending', 'processing', 'completed', 'failed'] PERMISSIONS FULL;
DEFINE FIELD OVERWRITE raw_content ON document TYPE option<string> COMMENT 'Optional raw content before processing' PERMISSIONS FULL;
DEFINE FIELD OVERWRITE source ON document TYPE references COMMENT 'reference to source file' PERMISSIONS FULL;
DEFINE FIELD OVERWRITE source_id ON document TYPE string COMMENT 'Unique identifier within the original source (e.g., file ID, Slack message ts, Notion page ID)' PERMISSIONS FULL;
DEFINE FIELD OVERWRITE source_metadata ON document FLEXIBLE TYPE option<object> COMMENT 'Source-specific metadata (e.g., URL, channel, author, parent page)' PERMISSIONS FULL;
DEFINE FIELD OVERWRITE source_type ON document TYPE string ASSERT $value INSIDE ['file', 'slack', 'notion', 'jira', 'github', 'confluence', 'onedrive', 'web_page', 'text_input', 'unknown'] COMMENT 'The type of the original source (e.g., file, slack, notion)' PERMISSIONS FULL;
DEFINE FIELD OVERWRITE summary ON document TYPE option<string> COMMENT 'Summary of the document' PERMISSIONS FULL;
DEFINE FIELD OVERWRITE team ON document TYPE record<team> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE updated_at ON document TYPE datetime DEFAULT time::now() PERMISSIONS FULL;

-- Indexes
DEFINE INDEX OVERWRITE documentNameIndex ON document FIELDS name SEARCH ANALYZER autocomplete BM25(1.2,0.75) DOC_IDS_ORDER 100 DOC_LENGTHS_ORDER 100 POSTINGS_ORDER 100 TERMS_ORDER 100 DOC_IDS_CACHE 100 DOC_LENGTHS_CACHE 100 POSTINGS_CACHE 100 TERMS_CACHE 100 HIGHLIGHTS COMMENT 'Allow full-text search on document name';
DEFINE INDEX OVERWRITE documentSourceIndex ON document FIELDS source_type, source_id, organization UNIQUE COMMENT 'Ensure uniqueness per source within an organization';

-- ------------------------------
-- TABLE: file
-- ------------------------------

DEFINE TABLE OVERWRITE file TYPE ANY SCHEMALESS PERMISSIONS NONE;

DEFINE FIELD OVERWRITE created_at ON file TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE document ON file TYPE record<document> REFERENCE ON DELETE IGNORE COMMENT 'The document record that this file belongs to' PERMISSIONS FULL;
DEFINE FIELD OVERWRITE document_paths ON file TYPE option<object> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE document_paths.artifacts ON file TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE document_paths.html ON file TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE document_paths.json ON file TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE document_paths.markdown ON file TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE extension ON file TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE file_pages ON file TYPE references<file_page> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE name ON file TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE orgSlug ON file VALUE <future> { (SELECT VALUE slug FROM ONLY $this.organization LIMIT 1) } PERMISSIONS FULL;
DEFINE FIELD OVERWRITE organization ON file TYPE record<organization> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE owningTeam ON file TYPE record<team> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE path ON file VALUE string::concat('uploads/', meta::tb(organization.id), ':', meta::id(organization.id), '/', meta::tb(owningTeam.id), ':', meta::id(owningTeam.id), '/', meta::tb(id), ':', meta::id(id), '/', name) PERMISSIONS FULL;
DEFINE FIELD OVERWRITE size ON file TYPE number PERMISSIONS FULL;
DEFINE FIELD OVERWRITE status ON file TYPE string DEFAULT 'pending' ASSERT $value INSIDE ['pending', 'processing', 'batch_processing', 'waiting_for_batches', 'merging_docling', 'chunking', 'completed', 'failed'] PERMISSIONS FULL;
DEFINE FIELD OVERWRITE status_history ON file TYPE array<object> DEFAULT [] PERMISSIONS FULL;
DEFINE FIELD OVERWRITE status_history[*] ON file TYPE object PERMISSIONS FULL;
DEFINE FIELD OVERWRITE teamSlug ON file VALUE <future> { (SELECT VALUE slug FROM ONLY $this.owningTeam LIMIT 1) } PERMISSIONS FULL;
DEFINE FIELD OVERWRITE type ON file TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE updated_at ON file TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE uploader ON file TYPE record<user> PERMISSIONS FULL;

-- Events
DEFINE EVENT OVERWRITE file_status_history ON file WHEN $event = 'UPDATE' AND $before.status != $after.status THEN (UPDATE $value SET status_history += { previous_status: $before.status, status: $after.status, timestamp: time::now() }, updated_at = time::now());
DEFINE EVENT OVERWRITE file_status_initial ON file WHEN $event = 'CREATE' THEN (UPDATE $value SET status_history += { previous_status: NONE, status: $after.status, timestamp: time::now() });

-- ------------------------------
-- TABLE: file_page
-- ------------------------------

DEFINE TABLE OVERWRITE file_page TYPE NORMAL SCHEMALESS COMMENT 'While the file is being processed, it is stored in the file_page table' PERMISSIONS NONE;

DEFINE FIELD OVERWRITE content ON file_page TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE error_message ON file_page TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE file ON file_page TYPE record<file> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;
DEFINE FIELD OVERWRITE image_path ON file_page TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE page_num ON file_page TYPE number DEFAULT 0 PERMISSIONS FULL;
DEFINE FIELD OVERWRITE s3_error_path ON file_page TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE s3_input_path ON file_page TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE s3_output_path ON file_page TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE status ON file_page TYPE string DEFAULT 'pending' ASSERT $value INSIDE ['pending', 'processing', 'inference_completed', 'completed', 'failed'] PERMISSIONS FULL;

-- ------------------------------
-- TABLE: github
-- ------------------------------

DEFINE TABLE OVERWRITE github TYPE NORMAL SCHEMALESS COMMENT 'Github integration' PERMISSIONS NONE;

DEFINE FIELD OVERWRITE document ON github TYPE record<document> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;

-- ------------------------------
-- TABLE: invitation
-- ------------------------------

DEFINE TABLE OVERWRITE invitation TYPE NORMAL SCHEMALESS COMMENT 'better-auth orgs: invitations' PERMISSIONS NONE;

DEFINE FIELD OVERWRITE createdAt ON invitation TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE email ON invitation TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE expiresAt ON invitation TYPE datetime PERMISSIONS FULL;
DEFINE FIELD OVERWRITE inviterId ON invitation TYPE record<user> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;
DEFINE FIELD OVERWRITE organizationId ON invitation TYPE record<organization> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;
DEFINE FIELD OVERWRITE role ON invitation TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE status ON invitation TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE teamId ON invitation TYPE option<record<team>> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;

-- ------------------------------
-- TABLE: jira
-- ------------------------------

DEFINE TABLE OVERWRITE jira TYPE NORMAL SCHEMALESS COMMENT 'Jira integration' PERMISSIONS NONE;

DEFINE FIELD OVERWRITE document ON jira TYPE record<document> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;

-- ------------------------------
-- TABLE: member
-- ------------------------------

DEFINE TABLE OVERWRITE member TYPE NORMAL SCHEMALESS COMMENT 'better-auth orgs: members' PERMISSIONS NONE;

DEFINE FIELD OVERWRITE createdAt ON member TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE organizationId ON member TYPE record<organization> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;
DEFINE FIELD OVERWRITE role ON member TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE teamId ON member TYPE option<record<team>> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;
DEFINE FIELD OVERWRITE userId ON member TYPE record<user> REFERENCE ON DELETE IGNORE PERMISSIONS FULL;

-- ------------------------------
-- TABLE: message
-- ------------------------------

DEFINE TABLE OVERWRITE message TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD OVERWRITE attachments ON message FLEXIBLE TYPE array<object> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE attachments[*] ON message FLEXIBLE TYPE object PERMISSIONS FULL;
DEFINE FIELD OVERWRITE chat ON message TYPE record<chat> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;
DEFINE FIELD OVERWRITE content ON message TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE createdAt ON message TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE parts ON message FLEXIBLE TYPE array<object> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE parts[*] ON message FLEXIBLE TYPE object PERMISSIONS FULL;
DEFINE FIELD OVERWRITE role ON message TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE user ON message TYPE record<user> REFERENCE ON DELETE IGNORE PERMISSIONS FULL;

-- ------------------------------
-- TABLE: notion
-- ------------------------------

DEFINE TABLE OVERWRITE notion TYPE NORMAL SCHEMALESS COMMENT 'Notion integration' PERMISSIONS NONE;

DEFINE FIELD OVERWRITE document ON notion TYPE record<document> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;

-- ------------------------------
-- TABLE: organization
-- ------------------------------

DEFINE TABLE OVERWRITE organization TYPE NORMAL SCHEMALESS COMMENT 'better-auth orgs: organizations' PERMISSIONS NONE;

DEFINE FIELD OVERWRITE createdAt ON organization TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE logo ON organization TYPE option<string> COMMENT 'The logo of the organization' PERMISSIONS FULL;
DEFINE FIELD OVERWRITE metadata ON organization FLEXIBLE TYPE option<object> COMMENT 'Additional metadata for the organization' PERMISSIONS FULL;
DEFINE FIELD OVERWRITE name ON organization TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE slug ON organization TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE updatedAt ON organization TYPE datetime DEFAULT time::now() PERMISSIONS FULL;

-- ------------------------------
-- TABLE: post
-- ------------------------------

DEFINE TABLE OVERWRITE post TYPE ANY SCHEMALESS PERMISSIONS NONE;


-- ------------------------------
-- TABLE: project
-- ------------------------------

DEFINE TABLE OVERWRITE project TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD OVERWRITE chats ON project TYPE references<chat> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE description ON project TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE name ON project TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE organization ON project TYPE record<organization> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE team ON project TYPE record<team> PERMISSIONS FULL;

-- ------------------------------
-- TABLE: session
-- ------------------------------

DEFINE TABLE OVERWRITE session TYPE ANY SCHEMALESS COMMENT 'better-auth: sessions' PERMISSIONS NONE;

DEFINE FIELD OVERWRITE activeOrganizationId ON session TYPE option<string> COMMENT 'The id of the active organization' PERMISSIONS FULL;
DEFINE FIELD OVERWRITE createdAt ON session TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE expiresAt ON session PERMISSIONS FULL;
DEFINE FIELD OVERWRITE id ON session TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE ipAddress ON session TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE token ON session TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE updatedAt ON session TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE userId ON session TYPE record<user> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;

-- ------------------------------
-- TABLE: slack
-- ------------------------------

DEFINE TABLE OVERWRITE slack TYPE NORMAL SCHEMALESS COMMENT 'Slack integration' PERMISSIONS NONE;

DEFINE FIELD OVERWRITE document ON slack TYPE record<document> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;

-- ------------------------------
-- TABLE: team
-- ------------------------------

DEFINE TABLE OVERWRITE team TYPE NORMAL SCHEMALESS COMMENT 'better-auth orgs: teams' PERMISSIONS NONE;

DEFINE FIELD OVERWRITE createdAt ON team TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD OVERWRITE default ON team TYPE bool DEFAULT false PERMISSIONS FULL;
DEFINE FIELD OVERWRITE isPrivate ON team TYPE bool DEFAULT false PERMISSIONS FULL;
DEFINE FIELD OVERWRITE name ON team TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE organizationId ON team TYPE record<organization> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;
DEFINE FIELD OVERWRITE slug ON team TYPE string PERMISSIONS FULL;
DEFINE FIELD OVERWRITE updatedAt ON team TYPE option<datetime> DEFAULT time::now() PERMISSIONS FULL;

-- Indexes
DEFINE INDEX OVERWRITE teamSlugIndex ON team FIELDS slug, organizationId UNIQUE COMMENT 'Ensure that the slug is unique within the organization';

-- ------------------------------
-- TABLE: text_input
-- ------------------------------

DEFINE TABLE OVERWRITE text_input TYPE NORMAL SCHEMALESS COMMENT 'Text input integration' PERMISSIONS NONE;

DEFINE FIELD OVERWRITE document ON text_input TYPE record<document> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;

-- ------------------------------
-- TABLE: user
-- ------------------------------

DEFINE TABLE OVERWRITE user TYPE ANY SCHEMALESS COMMENT 'better-auth: users' PERMISSIONS NONE;

DEFINE FIELD OVERWRITE chats ON user TYPE references<chat> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE organizations ON user TYPE references<member> PERMISSIONS FULL;

-- ------------------------------
-- TABLE: vote
-- ------------------------------

DEFINE TABLE OVERWRITE vote TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD OVERWRITE chatId ON vote TYPE record<chat> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE isUpvoted ON vote TYPE bool PERMISSIONS FULL;
DEFINE FIELD OVERWRITE messageId ON vote TYPE record<message> PERMISSIONS FULL;

-- ------------------------------
-- TABLE: web_page
-- ------------------------------

DEFINE TABLE OVERWRITE web_page TYPE NORMAL SCHEMALESS COMMENT 'Web page integration' PERMISSIONS NONE;

DEFINE FIELD OVERWRITE document ON web_page TYPE record<document> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;