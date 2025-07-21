-- Migration: initial_setup
-- Version: 3.0.0
-- Generated: 2025-07-06T09:16:35.453Z
-- Operations: 7

-- Create table user
DEFINE TABLE user SCHEMAFULL COMMENT 'User accounts for the blog system';
DEFINE FIELD id ON user TYPE record<user>;
DEFINE FIELD email ON user TYPE string COMMENT 'User email address';
DEFINE FIELD username ON user TYPE string COMMENT 'Unique username';
DEFINE FIELD first_name ON user TYPE string COMMENT 'User first name';
DEFINE FIELD last_name ON user TYPE string COMMENT 'User last name';
DEFINE FIELD bio ON user TYPE string COMMENT 'User biography';
DEFINE FIELD avatar_url ON user TYPE string COMMENT 'User avatar URL';
DEFINE FIELD role ON user TYPE string DEFAULT 'author' COMMENT 'User role';
DEFINE FIELD is_active ON user TYPE bool DEFAULT true COMMENT 'Whether user is active';
DEFINE FIELD created_at ON user TYPE datetime DEFAULT time::now() COMMENT 'Account creation timestamp';
DEFINE FIELD updated_at ON user TYPE datetime DEFAULT time::now() COMMENT 'Account last update timestamp';
DEFINE FIELD social_links ON user TYPE object DEFAULT {} COMMENT 'User social media links';
DEFINE FIELD preferences ON user TYPE object DEFAULT {} COMMENT 'User preferences and settings';
DEFINE INDEX idx_unique_email ON user FIELDS email UNIQUE;
DEFINE INDEX idx_unique_username ON user FIELDS username UNIQUE;

-- Create table post
DEFINE TABLE post SCHEMAFULL COMMENT 'Blog posts';
DEFINE FIELD id ON post TYPE record<post>;
DEFINE FIELD title ON post TYPE string COMMENT 'Post title';
DEFINE FIELD slug ON post TYPE string COMMENT 'URL-friendly post identifier';
DEFINE FIELD content ON post TYPE string COMMENT 'Post content in markdown';
DEFINE FIELD excerpt ON post TYPE string COMMENT 'Post excerpt for previews';
DEFINE FIELD author ON post TYPE record<user> COMMENT 'Post author reference';
DEFINE FIELD status ON post TYPE string DEFAULT 'draft' COMMENT 'Post publication status';
DEFINE FIELD featured ON post TYPE bool DEFAULT false COMMENT 'Whether post is featured';
DEFINE FIELD view_count ON post TYPE int DEFAULT 0 COMMENT 'Number of post views';
DEFINE FIELD published_at ON post TYPE datetime COMMENT 'Publication timestamp';
DEFINE FIELD created_at ON post TYPE datetime DEFAULT time::now() COMMENT 'Post creation timestamp';
DEFINE FIELD updated_at ON post TYPE datetime DEFAULT time::now() COMMENT 'Post last update timestamp';
DEFINE FIELD engagement_score ON post TYPE number DEFAULT 0.0 COMMENT 'Calculated engagement score';
DEFINE FIELD last_viewed ON post TYPE datetime COMMENT 'Last view timestamp';
DEFINE FIELD category ON post TYPE string DEFAULT 'general' COMMENT 'Post category';
DEFINE FIELD reading_time ON post TYPE int DEFAULT 0 COMMENT 'Estimated reading time in minutes';
DEFINE FIELD word_count ON post TYPE int DEFAULT 0 COMMENT 'Total word count';
DEFINE INDEX idx_unique_slug ON post FIELDS slug UNIQUE;

-- Create table tag
DEFINE TABLE tag SCHEMAFULL COMMENT 'Content tags for categorization';
DEFINE FIELD id ON tag TYPE record<tag>;
DEFINE FIELD name ON tag TYPE string COMMENT 'Tag display name';
DEFINE FIELD slug ON tag TYPE string COMMENT 'URL-friendly tag identifier';
DEFINE FIELD description ON tag TYPE string COMMENT 'Tag description';
DEFINE FIELD color ON tag TYPE string DEFAULT '#6366f1' COMMENT 'Tag display color (hex)';
DEFINE FIELD post_count ON tag TYPE int DEFAULT 0 COMMENT 'Number of posts with this tag';
DEFINE FIELD created_at ON tag TYPE datetime DEFAULT time::now() COMMENT 'Tag creation timestamp';
DEFINE INDEX idx_unique_name ON tag FIELDS name UNIQUE;
DEFINE INDEX idx_unique_slug ON tag FIELDS slug UNIQUE;

-- Create table comment
DEFINE TABLE comment SCHEMAFULL COMMENT 'User comments on posts';
DEFINE FIELD id ON comment TYPE record<comment>;
DEFINE FIELD content ON comment TYPE string COMMENT 'Comment content';
DEFINE FIELD author ON comment TYPE record<user> COMMENT 'Comment author';
DEFINE FIELD post ON comment TYPE record<post> COMMENT 'Post being commented on';
DEFINE FIELD parent ON comment TYPE record<comment> COMMENT 'Parent comment for threading';
DEFINE FIELD status ON comment TYPE string DEFAULT 'pending' COMMENT 'Moderation status';
DEFINE FIELD created_at ON comment TYPE datetime DEFAULT time::now() COMMENT 'Comment creation timestamp';
DEFINE FIELD updated_at ON comment TYPE datetime DEFAULT time::now() COMMENT 'Comment last update timestamp';

-- Create table post_tag
DEFINE TABLE post_tag SCHEMAFULL COMMENT 'Many-to-many relationship between posts and tags';
DEFINE FIELD id ON post_tag TYPE record<post_tag>;
DEFINE FIELD post ON post_tag TYPE record<post> COMMENT 'Post reference';
DEFINE FIELD tag ON post_tag TYPE record<tag> COMMENT 'Tag reference';
DEFINE FIELD created_at ON post_tag TYPE datetime DEFAULT time::now() COMMENT 'Relationship creation timestamp';

-- Create table analytics
DEFINE TABLE analytics SCHEMAFULL COMMENT 'Analytics tracking for posts and user interactions';
DEFINE FIELD id ON analytics TYPE record<analytics>;
DEFINE FIELD post ON analytics TYPE record<post> COMMENT 'Post being tracked';
DEFINE FIELD event_type ON analytics TYPE string COMMENT 'Type of analytics event';
DEFINE FIELD user_id ON analytics TYPE record<user> COMMENT 'User who triggered the event';
DEFINE FIELD ip_address ON analytics TYPE string COMMENT 'IP address of visitor';
DEFINE FIELD user_agent ON analytics TYPE string COMMENT 'Browser user agent';
DEFINE FIELD referrer ON analytics TYPE string COMMENT 'Referrer URL';
DEFINE FIELD metadata ON analytics TYPE object DEFAULT {} COMMENT 'Additional event metadata';
DEFINE FIELD created_at ON analytics TYPE datetime DEFAULT time::now() COMMENT 'Event timestamp';

-- Create table search_log
DEFINE TABLE search_log SCHEMAFULL COMMENT 'Search query tracking for analytics';
DEFINE FIELD id ON search_log TYPE record<search_log>;
DEFINE FIELD query ON search_log TYPE string COMMENT 'Search query text';
DEFINE FIELD user_id ON search_log TYPE record<user> COMMENT 'User who performed search';
DEFINE FIELD results_count ON search_log TYPE int DEFAULT 0 COMMENT 'Number of results returned';
DEFINE FIELD clicked_result ON search_log TYPE record<post> COMMENT 'Which result was clicked';
DEFINE FIELD ip_address ON search_log TYPE string COMMENT 'IP address of searcher';
DEFINE FIELD created_at ON search_log TYPE datetime DEFAULT time::now() COMMENT 'Search timestamp';
