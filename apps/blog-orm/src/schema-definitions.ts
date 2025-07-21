/**
 * Schema Definitions - Source of Truth
 * 
 * This file defines schemas using surql-schema classes.
 * The migration generator will compare this with the database state
 * and automatically generate migration SQL.
 */

import { Schema } from "effect";
import { SurrealTable, SurrealField } from "@necmttn/surql-schema";

// ===========================================
// Schema Definitions (Version-Controlled)
// ===========================================

/**
 * User table definition
 */
export const userTable = SurrealTable.create("user", [
  SurrealField.id("user"),
  
  SurrealField.string("email")
    .unique()
    .withDescription("User email address"),
    
  SurrealField.string("username")
    .unique() 
    .withDescription("Unique username"),
    
  SurrealField.string("first_name")
    .withDescription("User first name"),
    
  SurrealField.string("last_name")
    .withDescription("User last name"),
    
  SurrealField.string("bio")
    .optional()
    .withDescription("User biography"),
    
  SurrealField.string("avatar_url")
    .optional()
    .withDescription("User avatar URL"),
    
  SurrealField.enum("role", ["author", "editor", "admin"])
    .default("'author'")
    .withDescription("User role"),
    
  SurrealField.boolean("is_active")
    .default("true")
    .withDescription("Whether user is active"),
    
  SurrealField.datetime("created_at")
    .default("time::now()")
    .withDescription("Account creation timestamp"),
    
  SurrealField.datetime("updated_at")
    .default("time::now()")
    .withDescription("Account last update timestamp"),
    
  // New fields added in v2 (these will generate migrations)
  SurrealField.object("social_links")
    .default("{}")
    .withDescription("User social media links"),
    
  SurrealField.object("preferences")
    .default("{}")
    .withDescription("User preferences and settings"),
    
  // New field added in v3.1 for testing incremental migration
  SurrealField.string("phone_number")
    .optional()
    .withDescription("User phone number for notifications"),
    
]).withDescription("User accounts for the blog system");

/**
 * Post table definition
 */
export const postTable = SurrealTable.create("post", [
  SurrealField.id("post"),
  
  SurrealField.string("title")
    .withDescription("Post title"),
    
  SurrealField.string("slug")
    .unique()
    .withDescription("URL-friendly post identifier"),
    
  SurrealField.string("content")
    .withDescription("Post content in markdown"),
    
  SurrealField.string("excerpt")
    .withDescription("Post excerpt for previews"),
    
  SurrealField.record("author", "user")
    .withDescription("Post author reference"),
    
  SurrealField.enum("status", ["draft", "published", "archived"])
    .default("'draft'")
    .withDescription("Post publication status"),
    
  SurrealField.boolean("featured")
    .default("false")
    .withDescription("Whether post is featured"),
    
  SurrealField.int("view_count")
    .default("0")
    .withDescription("Number of post views"),
    
  SurrealField.datetime("published_at")
    .optional()
    .withDescription("Publication timestamp"),
    
  SurrealField.datetime("created_at")
    .default("time::now()")
    .withDescription("Post creation timestamp"),
    
  SurrealField.datetime("updated_at")
    .default("time::now()")
    .withDescription("Post last update timestamp"),
    
  // New fields added in v2 (will generate migrations)
  SurrealField.number("engagement_score")
    .default("0.0")
    .withDescription("Calculated engagement score"),
    
  SurrealField.datetime("last_viewed")
    .optional()
    .withDescription("Last view timestamp"),
    
  SurrealField.string("category")
    .default("'general'")
    .withDescription("Post category"),
    
  SurrealField.int("reading_time")
    .default("0")
    .withDescription("Estimated reading time in minutes"),
    
  SurrealField.int("word_count")
    .default("0")
    .withDescription("Total word count"),
    
]).withDescription("Blog posts");

/**
 * Tag table definition
 */
export const tagTable = SurrealTable.create("tag", [
  SurrealField.id("tag"),
  
  SurrealField.string("name")
    .unique()
    .withDescription("Tag display name"),
    
  SurrealField.string("slug")
    .unique()
    .withDescription("URL-friendly tag identifier"),
    
  SurrealField.string("description")
    .optional()
    .withDescription("Tag description"),
    
  SurrealField.string("color")
    .default("'#6366f1'")
    .withDescription("Tag display color (hex)"),
    
  SurrealField.int("post_count")
    .default("0")
    .withDescription("Number of posts with this tag"),
    
  SurrealField.datetime("created_at")
    .default("time::now()")
    .withDescription("Tag creation timestamp"),
    
]).withDescription("Content tags for categorization");

/**
 * Comment table definition
 */
export const commentTable = SurrealTable.create("comment", [
  SurrealField.id("comment"),
  
  SurrealField.string("content")
    .withDescription("Comment content"),
    
  SurrealField.record("author", "user")
    .withDescription("Comment author"),
    
  SurrealField.record("post", "post")
    .withDescription("Post being commented on"),
    
  SurrealField.record("parent", "comment")
    .optional()
    .withDescription("Parent comment for threading"),
    
  SurrealField.enum("status", ["pending", "approved", "spam", "trash"])
    .default("'pending'")
    .withDescription("Moderation status"),
    
  SurrealField.datetime("created_at")
    .default("time::now()")
    .withDescription("Comment creation timestamp"),
    
  SurrealField.datetime("updated_at")
    .default("time::now()")
    .withDescription("Comment last update timestamp"),
    
]).withDescription("User comments on posts");

/**
 * Post-Tag relationship table
 */
export const postTagTable = SurrealTable.create("post_tag", [
  SurrealField.id("post_tag"),
  
  SurrealField.record("post", "post")
    .withDescription("Post reference"),
    
  SurrealField.record("tag", "tag")
    .withDescription("Tag reference"),
    
  SurrealField.datetime("created_at")
    .default("time::now()")
    .withDescription("Relationship creation timestamp"),
    
]).withDescription("Many-to-many relationship between posts and tags");

/**
 * Analytics table (new in v2 - will generate creation migration)
 */
export const analyticsTable = SurrealTable.create("analytics", [
  SurrealField.id("analytics"),
  
  SurrealField.record("post", "post")
    .withDescription("Post being tracked"),
    
  SurrealField.enum("event_type", ["view", "like", "share", "comment"])
    .withDescription("Type of analytics event"),
    
  SurrealField.record("user_id", "user")
    .optional()
    .withDescription("User who triggered the event"),
    
  SurrealField.string("ip_address")
    .withDescription("IP address of visitor"),
    
  SurrealField.string("user_agent")
    .withDescription("Browser user agent"),
    
  SurrealField.string("referrer")
    .optional()
    .withDescription("Referrer URL"),
    
  SurrealField.object("metadata")
    .default("{}")
    .withDescription("Additional event metadata"),
    
  SurrealField.datetime("created_at")
    .default("time::now()")
    .withDescription("Event timestamp"),
    
]).withDescription("Analytics tracking for posts and user interactions");

/**
 * Search log table (new in v3 - will generate creation migration)
 */
export const searchLogTable = SurrealTable.create("search_log", [
  SurrealField.id("search_log"),
  
  SurrealField.string("query")
    .withDescription("Search query text"),
    
  SurrealField.record("user_id", "user")
    .optional()
    .withDescription("User who performed search"),
    
  SurrealField.int("results_count")
    .default("0")
    .withDescription("Number of results returned"),
    
  SurrealField.record("clicked_result", "post")
    .optional()
    .withDescription("Which result was clicked"),
    
  SurrealField.string("ip_address")
    .withDescription("IP address of searcher"),
    
  SurrealField.datetime("created_at")
    .default("time::now()")
    .withDescription("Search timestamp"),
    
]).withDescription("Search query tracking for analytics");

// ===========================================
// Schema Collection for Migration Generation
// ===========================================

/**
 * All table definitions - this is what the migration generator uses
 */
export const allTables = [
  userTable,
  postTable,
  tagTable,
  commentTable,
  postTagTable,
  analyticsTable,
  searchLogTable,
];

/**
 * Schema versioning for migration tracking
 */
export const SCHEMA_VERSION = "3.1.0";

/**
 * Migration metadata
 */
export interface SchemaVersion {
  version: string;
  tables: typeof allTables;
  timestamp: Date;
  description: string;
}

/**
 * Current schema version for migration generation
 */
export const currentSchemaVersion: SchemaVersion = {
  version: SCHEMA_VERSION,
  tables: allTables,
  timestamp: new Date(),
  description: "Blog system with analytics and search features",
};