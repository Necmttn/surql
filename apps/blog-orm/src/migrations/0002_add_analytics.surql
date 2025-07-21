-- ================================================
-- Migration: Add Analytics Tracking
-- ================================================
-- This migration adds analytics without touching existing indexes
-- Demonstrates incremental schema changes

-- Analytics table for tracking user interactions
DEFINE TABLE analytics SCHEMAFULL 
COMMENT 'Analytics tracking for posts and user interactions';

DEFINE FIELD id ON analytics TYPE record<analytics>;
DEFINE FIELD post ON analytics TYPE record<post> 
COMMENT 'Post being tracked';
DEFINE FIELD event_type ON analytics TYPE string 
COMMENT 'Event type: view, like, share, comment';
DEFINE FIELD user_id ON analytics TYPE record<user> 
COMMENT 'User who triggered the event (if logged in)';
DEFINE FIELD ip_address ON analytics TYPE string 
COMMENT 'IP address of the visitor';
DEFINE FIELD user_agent ON analytics TYPE string 
COMMENT 'Browser user agent string';
DEFINE FIELD referrer ON analytics TYPE string 
COMMENT 'Referrer URL';
DEFINE FIELD metadata ON analytics TYPE object DEFAULT {} 
COMMENT 'Additional event metadata as JSON';
DEFINE FIELD created_at ON analytics TYPE datetime DEFAULT time::now() 
COMMENT 'Event timestamp';

-- Analytics indexes (new indexes, won't affect existing ones)
DEFINE INDEX idx_analytics_post ON analytics FIELDS post;
DEFINE INDEX idx_analytics_event ON analytics FIELDS event_type;
DEFINE INDEX idx_analytics_user ON analytics FIELDS user_id;
DEFINE INDEX idx_analytics_created ON analytics FIELDS created_at;

-- Add analytics fields to existing post table (incremental changes)
DEFINE FIELD engagement_score ON post TYPE float DEFAULT 0.0 
COMMENT 'Calculated engagement score based on analytics';
DEFINE FIELD last_viewed ON post TYPE datetime 
COMMENT 'Timestamp of last view';

-- Add new index for engagement (won't rebuild existing post indexes)
DEFINE INDEX idx_post_engagement ON post FIELDS engagement_score;

-- Add social sharing fields to user (incremental changes)
DEFINE FIELD social_links ON user TYPE object DEFAULT {} 
COMMENT 'User social media links as JSON object';
DEFINE FIELD preferences ON user TYPE object DEFAULT {} 
COMMENT 'User preferences and settings';

-- Migration complete - only added new tables/fields/indexes
-- Existing indexes (idx_post_slug, idx_user_email, etc.) remain untouched