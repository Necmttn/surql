-- ------------------------------
-- SCHEMA DEFINITIONS
-- ------------------------------

OPTION IMPORT;


-- ------------------------------
-- FUNCTIONS
-- ------------------------------

DEFINE FUNCTION fn::sentence_to_vector($sentence: string) {
LET $query_embeddings = (RETURN http::post('http://ollama-api-r0gwks4kow0ws4gck4oow844:11434/api/embeddings', { model: 'nomic-embed-text', prompt: $sentence }).embedding);
RETURN $query_embeddings;
} PERMISSIONS FULL;


-- ------------------------------
-- ANALYZERS
-- ------------------------------

DEFINE ANALYZER autocomplete FILTERS LOWERCASE,EDGENGRAM(2,10);

DEFINE ANALYZER full_text TOKENIZERS CLASS FILTERS LOWERCASE,EDGENGRAM(2,10),ASCII,SNOWBALL(ENGLISH);


-- ------------------------------
-- TABLES
-- ------------------------------

-- ------------------------------
-- TABLE: account
-- ------------------------------

DEFINE TABLE account TYPE ANY SCHEMALESS COMMENT 'better-auth: accounts' PERMISSIONS NONE;

DEFINE FIELD accountId ON account TYPE record<user> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;
DEFINE FIELD createdAt ON account TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD id ON account TYPE string PERMISSIONS FULL;
DEFINE FIELD password ON account TYPE string PERMISSIONS FULL;
DEFINE FIELD providerId ON account TYPE string PERMISSIONS FULL;
DEFINE FIELD updatedAt ON account TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD userId ON account TYPE record<user> REFERENCE ON DELETE CASCADE PERMISSIONS FULL;

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

DEFINE FIELD content ON chunk TYPE string PERMISSIONS FULL;
DEFINE FIELD document ON chunk TYPE record<document> COMMENT 'The logical document this chunk belongs to' PERMISSIONS FULL;
DEFINE FIELD embedding ON chunk TYPE option<array<float>> VALUE fn::sentence_to_vector(content) PERMISSIONS FULL;
DEFINE FIELD embedding[*] ON chunk TYPE float PERMISSIONS FULL;
DEFINE FIELD end ON chunk TYPE number PERMISSIONS FULL;
DEFINE FIELD enriched_text ON chunk TYPE string PERMISSIONS FULL;
DEFINE FIELD file ON chunk TYPE option<record<file>> COMMENT 'Link to the original file record, if the document source was a file' PERMISSIONS FULL;
DEFINE FIELD id ON chunk TYPE string PERMISSIONS FULL;
DEFINE FIELD important_kwd ON chunk TYPE array<string> PERMISSIONS FULL;
DEFINE FIELD important_kwd[*] ON chunk TYPE string PERMISSIONS FULL;
DEFINE FIELD question_kwd ON chunk TYPE array<string> PERMISSIONS FULL;
DEFINE FIELD question_kwd[*] ON chunk TYPE string PERMISSIONS FULL;
DEFINE FIELD start ON chunk TYPE number PERMISSIONS FULL;

-- Indexes
DEFINE INDEX chunkDocumentIndex ON chunk FIELDS document;

-- ------------------------------
-- TABLE: document
-- ------------------------------

DEFINE TABLE document TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD authors ON document TYPE array<string> COMMENT 'Authors of the document' PERMISSIONS FULL;
DEFINE FIELD authors[*] ON document TYPE string PERMISSIONS FULL;
DEFINE FIELD created_at ON document TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD keywords ON document TYPE array<string> COMMENT 'Keywords extracted from the document' PERMISSIONS FULL;
DEFINE FIELD keywords[*] ON document TYPE string PERMISSIONS FULL;
DEFINE FIELD name ON document TYPE string COMMENT 'Display name or title of the document' PERMISSIONS FULL;
DEFINE FIELD organization ON document TYPE record<organization> PERMISSIONS FULL;
DEFINE FIELD original_file ON document TYPE option<record<file>> COMMENT 'Link to the file record if source_type is "file"' PERMISSIONS FULL;
DEFINE FIELD original_last_updated_date ON document TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD processed_at ON document TYPE option<datetime> PERMISSIONS FULL;
DEFINE FIELD processed_content_uri ON document TYPE option<string> COMMENT 'URI/Path to the processed content (e.g., Docling JSON) in object storage (S3)' PERMISSIONS FULL;
DEFINE FIELD processing_error ON document TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD processing_status ON document TYPE string DEFAULT 'pending' ASSERT $value INSIDE ['pending', 'processing', 'completed', 'failed'] PERMISSIONS FULL;
DEFINE FIELD raw_content ON document TYPE option<string> COMMENT 'Optional raw content before processing' PERMISSIONS FULL;
DEFINE FIELD source_id ON document TYPE string COMMENT 'Unique identifier within the original source (e.g., file ID, Slack message ts, Notion page ID)' PERMISSIONS FULL;
DEFINE FIELD source_metadata ON document FLEXIBLE TYPE option<object> COMMENT 'Source-specific metadata (e.g., URL, channel, author, parent page)' PERMISSIONS FULL;
DEFINE FIELD source_type ON document TYPE string ASSERT $value INSIDE ['file', 'slack', 'notion', 'jira', 'github', 'confluence', 'onedrive', 'web_page', 'text_input', 'unknown'] COMMENT 'The type of the original source (e.g., file, slack, notion)' PERMISSIONS FULL;
DEFINE FIELD summary ON document TYPE option<string> COMMENT 'Summary of the document' PERMISSIONS FULL;
DEFINE FIELD team ON document TYPE record<team> PERMISSIONS FULL;
DEFINE FIELD updated_at ON document TYPE datetime DEFAULT time::now() PERMISSIONS FULL;

-- Indexes
DEFINE INDEX documentNameIndex ON document FIELDS name SEARCH ANALYZER autocomplete BM25(1.2,0.75) DOC_IDS_ORDER 100 DOC_LENGTHS_ORDER 100 POSTINGS_ORDER 100 TERMS_ORDER 100 DOC_IDS_CACHE 100 DOC_LENGTHS_CACHE 100 POSTINGS_CACHE 100 TERMS_CACHE 100 HIGHLIGHTS COMMENT 'Allow full-text search on document name';
DEFINE INDEX documentSourceIndex ON document FIELDS source_type, source_id, organization UNIQUE COMMENT 'Ensure uniqueness per source within an organization';

-- ------------------------------
-- TABLE: file
-- ------------------------------

DEFINE TABLE file TYPE ANY SCHEMALESS PERMISSIONS NONE;

DEFINE FIELD created_at ON file TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD document_paths ON file TYPE option<object> PERMISSIONS FULL;
DEFINE FIELD document_paths.artifacts ON file TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD document_paths.html ON file TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD document_paths.json ON file TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD document_paths.markdown ON file TYPE option<string> PERMISSIONS FULL;
DEFINE FIELD extension ON file TYPE string PERMISSIONS FULL;
DEFINE FIELD file_pages ON file TYPE references<file_page> PERMISSIONS FULL;
DEFINE FIELD name ON file TYPE string PERMISSIONS FULL;
DEFINE FIELD orgSlug ON file VALUE <future> { (SELECT VALUE slug FROM ONLY $this.organization LIMIT 1) } PERMISSIONS FULL;
DEFINE FIELD organization ON file TYPE record<organization> PERMISSIONS FULL;
DEFINE FIELD owningTeam ON file TYPE record<team> PERMISSIONS FULL;
DEFINE FIELD path ON file VALUE string::concat('uploads/', meta::tb(organization.id), ':', meta::id(organization.id), '/', meta::tb(owningTeam.id), ':', meta::id(owningTeam.id), '/', meta::tb(id), ':', meta::id(id), '/', name) PERMISSIONS FULL;
DEFINE FIELD size ON file TYPE number PERMISSIONS FULL;
DEFINE FIELD status ON file TYPE string DEFAULT 'pending' ASSERT $value INSIDE ['pending', 'processing', 'batch_processing', 'waiting_for_batches', 'merging_docling', 'chunking', 'completed', 'failed'] PERMISSIONS FULL;
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
-- TABLE: post
-- ------------------------------

DEFINE TABLE post TYPE ANY SCHEMALESS PERMISSIONS NONE;


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
-- TABLE: user
-- ------------------------------

DEFINE TABLE user TYPE ANY SCHEMALESS COMMENT 'better-auth: users' PERMISSIONS NONE;

DEFINE FIELD chats ON user TYPE references<chat> PERMISSIONS FULL;
DEFINE FIELD organizations ON user TYPE references<member> PERMISSIONS FULL;

-- ------------------------------
-- TABLE: vote
-- ------------------------------

DEFINE TABLE vote TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD chatId ON vote TYPE record<chat> PERMISSIONS FULL;
DEFINE FIELD isUpvoted ON vote TYPE bool PERMISSIONS FULL;
DEFINE FIELD messageId ON vote TYPE record<message> PERMISSIONS FULL;