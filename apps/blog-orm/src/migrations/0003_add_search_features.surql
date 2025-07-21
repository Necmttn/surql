-- ================================================
-- Migration: Add Advanced Search Features
-- ================================================
-- This migration adds full-text search without rebuilding existing indexes
-- Demonstrates adding expensive indexes incrementally

-- Add search-related fields to posts (incremental changes)
DEFINE FIELD search_vector ON post TYPE string 
COMMENT 'Computed search vector for full-text search';
DEFINE FIELD reading_time ON post TYPE int DEFAULT 0 
COMMENT 'Estimated reading time in minutes';
DEFINE FIELD word_count ON post TYPE int DEFAULT 0 
COMMENT 'Total word count of the post';

-- Add full-text search index (this is expensive but only runs once)
-- Note: This won't rebuild existing indexes like idx_post_slug, idx_post_author, etc.
DEFINE INDEX idx_post_fulltext ON post FIELDS title, content, excerpt SEARCH ANALYZER simple BM25 HIGHLIGHTS;

-- Add search index for tags (new index, no impact on existing)
DEFINE INDEX idx_tag_search ON tag FIELDS name, description SEARCH ANALYZER simple BM25;

-- Add search tracking table
DEFINE TABLE search_log SCHEMAFULL 
COMMENT 'Search query tracking for analytics';

DEFINE FIELD id ON search_log TYPE record<search_log>;
DEFINE FIELD query ON search_log TYPE string 
COMMENT 'Search query text';
DEFINE FIELD user_id ON search_log TYPE record<user> 
COMMENT 'User who performed the search (if logged in)';
DEFINE FIELD results_count ON search_log TYPE int DEFAULT 0 
COMMENT 'Number of results returned';
DEFINE FIELD clicked_result ON search_log TYPE record<post> 
COMMENT 'Which result was clicked (if any)';
DEFINE FIELD ip_address ON search_log TYPE string 
COMMENT 'IP address of searcher';
DEFINE FIELD created_at ON search_log TYPE datetime DEFAULT time::now() 
COMMENT 'Search timestamp';

-- Search log indexes
DEFINE INDEX idx_search_query ON search_log FIELDS query;
DEFINE INDEX idx_search_user ON search_log FIELDS user_id;
DEFINE INDEX idx_search_created ON search_log FIELDS created_at;

-- Add content categorization fields
DEFINE FIELD category ON post TYPE string DEFAULT 'general' 
COMMENT 'Post category for organization';
DEFINE FIELD difficulty_level ON post TYPE string DEFAULT 'beginner' 
COMMENT 'Content difficulty: beginner, intermediate, advanced';

-- Add category index (won't affect existing post indexes)
DEFINE INDEX idx_post_category ON post FIELDS category;
DEFINE INDEX idx_post_difficulty ON post FIELDS difficulty_level;

-- Add user search preferences
DEFINE FIELD search_preferences ON user TYPE object DEFAULT {} 
COMMENT 'User search and filter preferences';

-- Migration complete - added powerful search features incrementally
-- All existing indexes remain untouched and don't need rebuilding