-- ================================================
-- Initial Schema Migration
-- ================================================
-- This is the baseline schema - all tables and basic indexes
-- Future changes will be incremental migrations

-- Users table
DEFINE TABLE user SCHEMAFULL 
COMMENT 'User accounts for the blog system';

DEFINE FIELD id ON user TYPE record<user>;
DEFINE FIELD email ON user TYPE string 
COMMENT 'User email address - must be unique';
DEFINE FIELD username ON user TYPE string 
COMMENT 'Display username - must be unique';
DEFINE FIELD first_name ON user TYPE string 
COMMENT 'User first name';
DEFINE FIELD last_name ON user TYPE string 
COMMENT 'User last name';
DEFINE FIELD bio ON user TYPE string 
COMMENT 'User biography/description';
DEFINE FIELD avatar_url ON user TYPE string 
COMMENT 'URL to user avatar image';
DEFINE FIELD role ON user TYPE string DEFAULT 'author' 
COMMENT 'User role: author, editor, admin';
DEFINE FIELD is_active ON user TYPE bool DEFAULT true 
COMMENT 'Whether user account is active';
DEFINE FIELD created_at ON user TYPE datetime DEFAULT time::now() 
COMMENT 'Account creation timestamp';
DEFINE FIELD updated_at ON user TYPE datetime DEFAULT time::now() 
COMMENT 'Account last update timestamp';

-- User indexes - these are expensive to rebuild
DEFINE INDEX idx_user_email ON user FIELDS email UNIQUE;
DEFINE INDEX idx_user_username ON user FIELDS username UNIQUE;
DEFINE INDEX idx_user_role ON user FIELDS role;
DEFINE INDEX idx_user_active ON user FIELDS is_active;

-- Posts table
DEFINE TABLE post SCHEMAFULL 
COMMENT 'Blog posts';

DEFINE FIELD id ON post TYPE record<post>;
DEFINE FIELD title ON post TYPE string 
COMMENT 'Post title';
DEFINE FIELD slug ON post TYPE string 
COMMENT 'URL-friendly post identifier';
DEFINE FIELD content ON post TYPE string 
COMMENT 'Post content in markdown format';
DEFINE FIELD excerpt ON post TYPE string 
COMMENT 'Post excerpt for previews';
DEFINE FIELD author ON post TYPE record<user> 
COMMENT 'Post author reference';
DEFINE FIELD status ON post TYPE string DEFAULT 'draft' 
COMMENT 'Post status: draft, published, archived';
DEFINE FIELD featured ON post TYPE bool DEFAULT false 
COMMENT 'Whether post is featured';
DEFINE FIELD view_count ON post TYPE int DEFAULT 0 
COMMENT 'Number of post views';
DEFINE FIELD published_at ON post TYPE datetime 
COMMENT 'Publication timestamp';
DEFINE FIELD created_at ON post TYPE datetime DEFAULT time::now() 
COMMENT 'Post creation timestamp';
DEFINE FIELD updated_at ON post TYPE datetime DEFAULT time::now() 
COMMENT 'Post last update timestamp';

-- Post indexes - critical for performance
DEFINE INDEX idx_post_slug ON post FIELDS slug UNIQUE;
DEFINE INDEX idx_post_author ON post FIELDS author;
DEFINE INDEX idx_post_status ON post FIELDS status;
DEFINE INDEX idx_post_published ON post FIELDS published_at;
DEFINE INDEX idx_post_featured ON post FIELDS featured;

-- Tags table
DEFINE TABLE tag SCHEMAFULL 
COMMENT 'Content tags for categorization';

DEFINE FIELD id ON tag TYPE record<tag>;
DEFINE FIELD name ON tag TYPE string 
COMMENT 'Tag display name';
DEFINE FIELD slug ON tag TYPE string 
COMMENT 'URL-friendly tag identifier';
DEFINE FIELD description ON tag TYPE string 
COMMENT 'Tag description';
DEFINE FIELD color ON tag TYPE string DEFAULT '#6366f1' 
COMMENT 'Tag display color (hex)';
DEFINE FIELD post_count ON tag TYPE int DEFAULT 0 
COMMENT 'Number of posts with this tag';
DEFINE FIELD created_at ON tag TYPE datetime DEFAULT time::now() 
COMMENT 'Tag creation timestamp';

-- Tag indexes
DEFINE INDEX idx_tag_slug ON tag FIELDS slug UNIQUE;
DEFINE INDEX idx_tag_name ON tag FIELDS name UNIQUE;

-- Comments table
DEFINE TABLE comment SCHEMAFULL 
COMMENT 'User comments on posts';

DEFINE FIELD id ON comment TYPE record<comment>;
DEFINE FIELD content ON comment TYPE string 
COMMENT 'Comment content';
DEFINE FIELD author ON comment TYPE record<user> 
COMMENT 'Comment author';
DEFINE FIELD post ON comment TYPE record<post> 
COMMENT 'Post being commented on';
DEFINE FIELD parent ON comment TYPE record<comment> 
COMMENT 'Parent comment for threading';
DEFINE FIELD status ON comment TYPE string DEFAULT 'pending' 
COMMENT 'Moderation status: pending, approved, spam, trash';
DEFINE FIELD created_at ON comment TYPE datetime DEFAULT time::now() 
COMMENT 'Comment creation timestamp';
DEFINE FIELD updated_at ON comment TYPE datetime DEFAULT time::now() 
COMMENT 'Comment last update timestamp';

-- Comment indexes
DEFINE INDEX idx_comment_post ON comment FIELDS post;
DEFINE INDEX idx_comment_author ON comment FIELDS author;
DEFINE INDEX idx_comment_parent ON comment FIELDS parent;
DEFINE INDEX idx_comment_status ON comment FIELDS status;

-- Post-Tag relationship table
DEFINE TABLE post_tag SCHEMAFULL 
COMMENT 'Many-to-many relationship between posts and tags';

DEFINE FIELD id ON post_tag TYPE record<post_tag>;
DEFINE FIELD post ON post_tag TYPE record<post> 
COMMENT 'Post reference';
DEFINE FIELD tag ON post_tag TYPE record<tag> 
COMMENT 'Tag reference';
DEFINE FIELD created_at ON post_tag TYPE datetime DEFAULT time::now() 
COMMENT 'Relationship creation timestamp';

-- Post-Tag indexes
DEFINE INDEX idx_post_tag_post ON post_tag FIELDS post;
DEFINE INDEX idx_post_tag_tag ON post_tag FIELDS tag;
DEFINE INDEX idx_post_tag_unique ON post_tag FIELDS post, tag UNIQUE;