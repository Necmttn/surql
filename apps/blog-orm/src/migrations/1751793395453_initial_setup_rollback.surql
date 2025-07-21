-- Rollback Migration: initial_setup
-- Version: 3.0.0
-- Generated: 2025-07-06T09:16:35.453Z

-- Rollback: Create table search_log
DROP TABLE search_log;

-- Rollback: Create table analytics
DROP TABLE analytics;

-- Rollback: Create table post_tag
DROP TABLE post_tag;

-- Rollback: Create table comment
DROP TABLE comment;

-- Rollback: Create table tag
DROP TABLE tag;

-- Rollback: Create table post
DROP TABLE post;

-- Rollback: Create table user
DROP TABLE user;
