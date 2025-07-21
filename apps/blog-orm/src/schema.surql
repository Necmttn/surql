-- Blog Management System Schema
-- This demonstrates real-world ORM usage patterns

-- Users table
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD id ON user TYPE record<user>;
DEFINE FIELD email ON user TYPE string;
DEFINE FIELD username ON user TYPE string;
DEFINE FIELD first_name ON user TYPE string;
DEFINE FIELD last_name ON user TYPE string;
DEFINE FIELD bio ON user TYPE string;
DEFINE FIELD avatar_url ON user TYPE string;
DEFINE FIELD role ON user TYPE string DEFAULT 'author';
DEFINE FIELD is_active ON user TYPE bool DEFAULT true;
DEFINE FIELD created_at ON user TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON user TYPE datetime DEFAULT time::now();

-- Unique constraints
DEFINE INDEX idx_user_email ON user FIELDS email UNIQUE;
DEFINE INDEX idx_user_username ON user FIELDS username UNIQUE;

-- Posts table
DEFINE TABLE post SCHEMAFULL;
DEFINE FIELD id ON post TYPE record<post>;
DEFINE FIELD title ON post TYPE string;
DEFINE FIELD slug ON post TYPE string;
DEFINE FIELD content ON post TYPE string;
DEFINE FIELD excerpt ON post TYPE string;
DEFINE FIELD author ON post TYPE record<user>;
DEFINE FIELD status ON post TYPE string DEFAULT 'draft';
DEFINE FIELD featured ON post TYPE bool DEFAULT false;
DEFINE FIELD view_count ON post TYPE int DEFAULT 0;
DEFINE FIELD published_at ON post TYPE datetime;
DEFINE FIELD created_at ON post TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON post TYPE datetime DEFAULT time::now();

-- Post indexes
DEFINE INDEX idx_post_slug ON post FIELDS slug UNIQUE;
DEFINE INDEX idx_post_author ON post FIELDS author;
DEFINE INDEX idx_post_status ON post FIELDS status;
DEFINE INDEX idx_post_published ON post FIELDS published_at;

-- Tags table
DEFINE TABLE tag SCHEMAFULL;
DEFINE FIELD id ON tag TYPE record<tag>;
DEFINE FIELD name ON tag TYPE string;
DEFINE FIELD slug ON tag TYPE string;
DEFINE FIELD description ON tag TYPE string;
DEFINE FIELD color ON tag TYPE string DEFAULT '#6366f1';
DEFINE FIELD post_count ON tag TYPE int DEFAULT 0;
DEFINE FIELD created_at ON tag TYPE datetime DEFAULT time::now();

-- Tag indexes
DEFINE INDEX idx_tag_slug ON tag FIELDS slug UNIQUE;
DEFINE INDEX idx_tag_name ON tag FIELDS name UNIQUE;

-- Comments table
DEFINE TABLE comment SCHEMAFULL;
DEFINE FIELD id ON comment TYPE record<comment>;
DEFINE FIELD content ON comment TYPE string;
DEFINE FIELD author ON comment TYPE record<user>;
DEFINE FIELD post ON comment TYPE record<post>;
DEFINE FIELD parent ON comment TYPE record<comment>;
DEFINE FIELD status ON comment TYPE string DEFAULT 'pending';
DEFINE FIELD created_at ON comment TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON comment TYPE datetime DEFAULT time::now();

-- Comment indexes
DEFINE INDEX idx_comment_post ON comment FIELDS post;
DEFINE INDEX idx_comment_author ON comment FIELDS author;
DEFINE INDEX idx_comment_parent ON comment FIELDS parent;
DEFINE INDEX idx_comment_status ON comment FIELDS status;

-- Post-Tag relationship (many-to-many)
DEFINE TABLE post_tag SCHEMAFULL;
DEFINE FIELD id ON post_tag TYPE record<post_tag>;
DEFINE FIELD post ON post_tag TYPE record<post>;
DEFINE FIELD tag ON post_tag TYPE record<tag>;
DEFINE FIELD created_at ON post_tag TYPE datetime DEFAULT time::now();

-- Post-Tag indexes
DEFINE INDEX idx_post_tag_post ON post_tag FIELDS post;
DEFINE INDEX idx_post_tag_tag ON post_tag FIELDS tag;
DEFINE INDEX idx_post_tag_unique ON post_tag FIELDS post, tag UNIQUE;

-- Analytics table for tracking
DEFINE TABLE analytics SCHEMAFULL;
DEFINE FIELD id ON analytics TYPE record<analytics>;
DEFINE FIELD post ON analytics TYPE record<post>;
DEFINE FIELD event_type ON analytics TYPE string; -- 'view', 'like', 'share'
DEFINE FIELD user_id ON analytics TYPE record<user>;
DEFINE FIELD ip_address ON analytics TYPE string;
DEFINE FIELD user_agent ON analytics TYPE string;
DEFINE FIELD metadata ON analytics TYPE object;
DEFINE FIELD created_at ON analytics TYPE datetime DEFAULT time::now();

-- Analytics indexes
DEFINE INDEX idx_analytics_post ON analytics FIELDS post;
DEFINE INDEX idx_analytics_event ON analytics FIELDS event_type;
DEFINE INDEX idx_analytics_user ON analytics FIELDS user_id;
DEFINE INDEX idx_analytics_created ON analytics FIELDS created_at;