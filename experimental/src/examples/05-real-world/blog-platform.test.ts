import { describe, expect, it } from "vitest";
import { Schema } from "effect";
import { SurrealField } from "../../lib/schema/field";
import { SurrealTable } from "../../lib/schema/table";
import { SurrealSchema } from "../../lib/schema/schema";
import { SurrealIndex } from "../../lib/schema/index-def";
import { SurrealEvent } from "../../lib/schema/event";
import { SchemaComparator } from "../../lib/comparison/diff";
import { MigrationGenerator } from "../../lib/migration/generator";

// Import reusable constraints from Level 2
import {
  emailSchema,
  slugSchema,
  urlSchema,
} from "../../lib/constraints";

describe("Level 5: Blog Platform", () => {
  describe("Complete Blog Platform Schema", () => {
    it("should create a comprehensive blog platform schema", () => {
      // Define blog-specific constraints
      const blogConstraints = {
        postStatus: Schema.Literal("draft", "published", "archived", "scheduled")
          .annotations({
            title: "Post Status",
            description: "Publishing status of blog post",
          }),

        commentStatus: Schema.Literal("pending", "approved", "spam", "trash")
          .annotations({
            title: "Comment Status",
            description: "Moderation status of comment",
          }),

        userRole: Schema.Literal("admin", "editor", "author", "subscriber")
          .annotations({
            title: "User Role",
            description: "User permission level in the blog system",
          }),

        contentType: Schema.Literal("post", "page", "media")
          .annotations({
            title: "Content Type",
            description: "Type of content being managed",
          }),
      };

      // User table with role-based permissions
      const userTable = SurrealTable.create("user", [
        SurrealField.id("user"),
        SurrealField.string("username").unique().description("Unique username for login"),
        SurrealField.string("email").unique().description("User email address"),
        SurrealField.string("display_name").description("Public display name"),
        SurrealField.string("bio").optional().description("User biography"),
        SurrealField.string("avatar_url").optional().description("Profile avatar image"),
        SurrealField.string("website").optional().description("Personal website URL"),
        SurrealField.string("role").default("'subscriber'").description("User role and permissions"),
        SurrealField.boolean("is_active").default("true").description("Account status"),
        SurrealField.boolean("email_verified").default("false").description("Email verification status"),
        SurrealField.datetime("created_at").default("time::now()").description("Account creation time"),
        SurrealField.datetime("updated_at").default("time::now()").description("Last profile update"),
        SurrealField.datetime("last_login").optional().description("Last login timestamp"),
      ])
        .withDescription("Blog users with role-based permissions")
        .aiPrimaryKey("username")
        .aiTemporalField("created_at")
        .aiContentFields(["username", "display_name", "bio"])
        .aiCommonQueries([
          "find user by username",
          "find user by email",
          "get users by role",
          "get active authors",
          "users created in date range",
        ]);

      // Category table for content organization
      const categoryTable = SurrealTable.create("category", [
        SurrealField.id("category"),
        SurrealField.string("name").unique().description("Category name"),
        SurrealField.string("slug").unique().description("URL-friendly category identifier"),
        SurrealField.string("description").optional().description("Category description"),
        SurrealField.record("parent", "category").optional().description("Parent category for hierarchy"),
        SurrealField.string("color").optional().description("Category display color"),
        SurrealField.string("icon").optional().description("Category icon"),
        SurrealField.boolean("is_active").default("true").description("Category visibility"),
        SurrealField.int("post_count").default("0").description("Number of posts in category"),
        SurrealField.int("sort_order").default("0").description("Display sort order"),
        SurrealField.datetime("created_at").default("time::now()").description("Category creation time"),
      ])
        .withDescription("Hierarchical content categories")
        .aiPrimaryKey("slug")
        .aiContentFields(["name", "description"])
        .aiCommonQueries([
          "find category by slug",
          "get active categories",
          "category hierarchy",
          "categories by post count",
        ]);

      // Tag table for flexible content tagging
      const tagTable = SurrealTable.create("tag", [
        SurrealField.id("tag"),
        SurrealField.string("name").unique().description("Tag name"),
        SurrealField.string("slug").unique().description("URL-friendly tag identifier"),
        SurrealField.string("description").optional().description("Tag description"),
        SurrealField.string("color").optional().description("Tag display color"),
        SurrealField.int("usage_count").default("0").description("Number of posts using this tag"),
        SurrealField.datetime("created_at").default("time::now()").description("Tag creation time"),
      ])
        .withDescription("Content tags for flexible organization")
        .aiPrimaryKey("slug")
        .aiContentFields(["name", "description"])
        .aiCommonQueries([
          "find tag by slug",
          "popular tags by usage",
          "tags for search suggestions",
        ]);

      // Post table with rich content management
      const postTable = SurrealTable.create("post", [
        SurrealField.id("post"),
        SurrealField.string("title").description("Post title"),
        SurrealField.string("slug").unique().description("URL-friendly post identifier"),
        SurrealField.string("excerpt").optional().description("Post summary/excerpt"),
        SurrealField.string("content").description("Post content body"),
        SurrealField.string("content_format").default("'markdown'").description("Content format (markdown, html, etc.)"),
        SurrealField.record("author", "user").description("Post author"),
        SurrealField.record("category", "category").optional().description("Primary category"),
        SurrealField.array("tags").optional().description("Associated tag IDs"),
        SurrealField.string("status").default("'draft'").description("Publishing status"),
        SurrealField.string("featured_image").optional().description("Featured image URL"),
        SurrealField.boolean("is_featured").default("false").description("Featured post status"),
        SurrealField.boolean("allow_comments").default("true").description("Enable comments on post"),
        SurrealField.int("view_count").default("0").description("Post view counter"),
        SurrealField.int("comment_count").default("0").description("Number of approved comments"),
        SurrealField.int("like_count").default("0").description("Number of likes"),
        SurrealField.string("meta_title").optional().description("SEO meta title"),
        SurrealField.string("meta_description").optional().description("SEO meta description"),
        SurrealField.array("meta_keywords").optional().description("SEO keywords"),
        SurrealField.datetime("created_at").default("time::now()").description("Post creation time"),
        SurrealField.datetime("updated_at").default("time::now()").description("Last post update"),
        SurrealField.datetime("published_at").optional().description("Post publication time"),
        SurrealField.datetime("scheduled_at").optional().description("Scheduled publication time"),
      ])
        .withDescription("Blog posts with comprehensive metadata")
        .aiPrimaryKey("slug")
        .aiUserField("author")
        .aiTemporalField("published_at")
        .aiContentFields(["title", "excerpt", "content", "meta_description"])
        .aiCommonQueries([
          "find post by slug",
          "posts by author",
          "posts by category",
          "posts by tag",
          "published posts",
          "featured posts",
          "posts by date range",
          "popular posts by views",
          "search posts by content",
        ])
        .aiRelationships({
          author: "user via author field",
          category: "category via category field",
          comments: "comment via post_id",
          tags: "tag via tags array",
        });

      // Comment table for reader engagement
      const commentTable = SurrealTable.create("comment", [
        SurrealField.id("comment"),
        SurrealField.record("post", "post").description("Parent post"),
        SurrealField.record("parent", "comment").optional().description("Parent comment for threading"),
        SurrealField.record("author", "user").optional().description("Registered user author"),
        SurrealField.string("author_name").optional().description("Guest author name"),
        SurrealField.string("author_email").optional().description("Guest author email"),
        SurrealField.string("author_url").optional().description("Guest author website"),
        SurrealField.string("content").description("Comment content"),
        SurrealField.string("status").default("'pending'").description("Moderation status"),
        SurrealField.string("ip_address").optional().description("Author IP address"),
        SurrealField.string("user_agent").optional().description("Author browser info"),
        SurrealField.int("like_count").default("0").description("Comment likes"),
        SurrealField.boolean("is_spam").default("false").description("Spam detection flag"),
        SurrealField.datetime("created_at").default("time::now()").description("Comment creation time"),
        SurrealField.datetime("updated_at").default("time::now()").description("Last comment update"),
      ])
        .withDescription("Post comments with threading and moderation")
        .aiPrimaryKey("id")
        .aiContentFields(["content", "author_name"])
        .aiCommonQueries([
          "comments for post",
          "comments by user",
          "comments awaiting moderation",
          "comment thread",
          "recent comments",
          "spam comments",
        ])
        .aiRelationships({
          post: "post via post field",
          author: "user via author field",
          parent: "comment via parent field",
          replies: "comment via parent_id",
        });

      // Media table for asset management
      const mediaTable = SurrealTable.create("media", [
        SurrealField.id("media"),
        SurrealField.string("filename").description("Original filename"),
        SurrealField.string("stored_filename").unique().description("Stored filename with path"),
        SurrealField.string("title").optional().description("Media title"),
        SurrealField.string("alt_text").optional().description("Alternative text for accessibility"),
        SurrealField.string("caption").optional().description("Media caption"),
        SurrealField.string("description").optional().description("Media description"),
        SurrealField.string("mime_type").description("File MIME type"),
        SurrealField.int("file_size").description("File size in bytes"),
        SurrealField.int("width").optional().description("Image width in pixels"),
        SurrealField.int("height").optional().description("Image height in pixels"),
        SurrealField.record("uploaded_by", "user").description("User who uploaded the media"),
        SurrealField.array("used_in_posts").optional().description("Posts using this media"),
        SurrealField.datetime("created_at").default("time::now()").description("Upload time"),
      ])
        .withDescription("Media asset management")
        .aiPrimaryKey("stored_filename")
        .aiUserField("uploaded_by")
        .aiContentFields(["title", "alt_text", "caption", "description"])
        .aiCommonQueries([
          "media by user",
          "media by type",
          "unused media",
          "media used in post",
          "recent uploads",
        ]);

      // Assemble the complete blog platform schema
      const blogSchema = SurrealSchema.create("blog_platform", "1.0.0")
        .withDescription("Complete blog platform with users, posts, comments, and media")
        .addTable(userTable)
        .addTable(categoryTable)
        .addTable(tagTable)
        .addTable(postTable)
        .addTable(commentTable)
        .addTable(mediaTable)
        // User and authentication indexes
        .addIndex(SurrealIndex.unique("idx_user_username", "user", ["username"]))
        .addIndex(SurrealIndex.unique("idx_user_email", "user", ["email"]))
        .addIndex(SurrealIndex.create("idx_user_role_active", "user", ["role", "is_active"]))
        // Category hierarchy indexes
        .addIndex(SurrealIndex.unique("idx_category_slug", "category", ["slug"]))
        .addIndex(SurrealIndex.create("idx_category_parent", "category", ["parent", "sort_order"]))
        .addIndex(SurrealIndex.create("idx_category_active", "category", ["is_active", "post_count"]))
        // Tag indexes
        .addIndex(SurrealIndex.unique("idx_tag_slug", "tag", ["slug"]))
        .addIndex(SurrealIndex.create("idx_tag_usage", "tag", ["usage_count"]))
        // Post discovery and SEO indexes
        .addIndex(SurrealIndex.unique("idx_post_slug", "post", ["slug"]))
        .addIndex(SurrealIndex.create("idx_post_author_status", "post", ["author", "status"]))
        .addIndex(SurrealIndex.create("idx_post_category_status", "post", ["category", "status"]))
        .addIndex(SurrealIndex.create("idx_post_status_published", "post", ["status", "published_at"]))
        .addIndex(SurrealIndex.create("idx_post_featured", "post", ["is_featured", "published_at"]))
        .addIndex(SurrealIndex.create("idx_post_views", "post", ["view_count", "published_at"]))
        .addIndex(SurrealIndex.search("idx_post_search", "post", ["title", "excerpt", "content"]))
        // Comment moderation indexes
        .addIndex(SurrealIndex.create("idx_comment_post_status", "comment", ["post", "status"]))
        .addIndex(SurrealIndex.create("idx_comment_author", "comment", ["author", "created_at"]))
        .addIndex(SurrealIndex.create("idx_comment_moderation", "comment", ["status", "created_at"]))
        .addIndex(SurrealIndex.create("idx_comment_parent", "comment", ["parent", "created_at"]))
        // Media management indexes
        .addIndex(SurrealIndex.unique("idx_media_stored_filename", "media", ["stored_filename"]))
        .addIndex(SurrealIndex.create("idx_media_uploader", "media", ["uploaded_by", "created_at"]))
        .addIndex(SurrealIndex.create("idx_media_type", "media", ["mime_type", "created_at"]))
        // Business logic events
        .addEvent(
          SurrealEvent.onCreate("increment_post_count", "post", `
            IF $after.status = 'published' THEN
              UPDATE $after.category SET post_count += 1
            END
          `).withDescription("Increment category post count when post is published")
        )
        .addEvent(
          SurrealEvent.onUpdate("update_post_counts", "post", `
            IF $before.status != $after.status THEN
              IF $before.status = 'published' AND $before.category THEN
                UPDATE $before.category SET post_count -= 1
              END;
              IF $after.status = 'published' AND $after.category THEN
                UPDATE $after.category SET post_count += 1
              END
            END
          `).withDescription("Update category post counts when post status changes")
        )
        .addEvent(
          SurrealEvent.onCreate("increment_comment_count", "comment", `
            IF $after.status = 'approved' THEN
              UPDATE $after.post SET comment_count += 1
            END
          `).withDescription("Increment post comment count when comment is approved")
        )
        .addEvent(
          SurrealEvent.onUpdate("update_comment_counts", "comment", `
            IF $before.status != $after.status THEN
              IF $before.status = 'approved' THEN
                UPDATE $after.post SET comment_count -= 1
              END;
              IF $after.status = 'approved' THEN
                UPDATE $after.post SET comment_count += 1
              END
            END
          `).withDescription("Update post comment counts when comment status changes")
        )
        .addEvent(
          SurrealEvent.onCreate("update_tag_usage", "post", `
            IF $after.tags AND count($after.tags) > 0 THEN
              FOR $tag_id IN $after.tags {
                UPDATE $tag_id SET usage_count += 1
              }
            END
          `).withDescription("Increment tag usage counts when post uses tags")
        );

      // Validate schema structure
      expect(blogSchema.getTables()).toHaveLength(6);
      expect(blogSchema.getIndexes()).toHaveLength(22);
      expect(blogSchema.getEvents()).toHaveLength(5);

      // Verify table relationships
      const postTable_verified = blogSchema.getTable("post");
      expect(postTable_verified?.getField("author")?.getType()).toBe("record");
      expect(postTable_verified?.getField("category")?.getType()).toBe("record");

      const commentTable_verified = blogSchema.getTable("comment");
      expect(commentTable_verified?.getField("post")?.getType()).toBe("record");
      expect(commentTable_verified?.getField("parent")?.getType()).toBe("record");

      // Verify AI metadata
      expect(postTable_verified?.getAiHints()?.primary_key).toBe("slug");
      expect(postTable_verified?.getAiHints()?.user_field).toBe("author");
      expect(postTable_verified?.getAiHints()?.temporal_field).toBe("published_at");
      expect(postTable_verified?.getAiHints()?.content_fields).toContain("title");

      // Test schema generation capabilities
      const typescript = blogSchema.toTypeScript();
      expect(typescript).toContain("export interface User");
      expect(typescript).toContain("export interface Post");
      expect(typescript).toContain("export interface Comment");

      const surrealql = blogSchema.toSurrealQL();
      expect(surrealql).toContain("DEFINE TABLE user");
      expect(surrealql).toContain("DEFINE TABLE post");
      expect(surrealql).toContain("DEFINE INDEX idx_post_search");
      expect(surrealql).toContain("DEFINE EVENT increment_post_count");
    });
  });

  describe("Multi-tenant Blog Architecture", () => {
    it("should support multi-tenant blog platform", () => {
      // Site table for multi-tenant support
      const siteTable = SurrealTable.create("site", [
        SurrealField.id("site"),
        SurrealField.string("name").description("Site name"),
        SurrealField.string("domain").unique().description("Site domain"),
        SurrealField.string("subdomain").unique().optional().description("Subdomain prefix"),
        SurrealField.string("title").description("Site title"),
        SurrealField.string("description").optional().description("Site description"),
        SurrealField.string("logo").optional().description("Site logo URL"),
        SurrealField.record("owner", "user").description("Site owner"),
        SurrealField.object("theme_settings").optional().description("Theme configuration"),
        SurrealField.object("seo_settings").optional().description("SEO configuration"),
        SurrealField.boolean("is_active").default("true").description("Site status"),
        SurrealField.datetime("created_at").default("time::now()").description("Site creation time"),
      ])
        .withDescription("Multi-tenant site management");

      // Enhanced user table with site membership
      const multiTenantUserTable = SurrealTable.create("site_user", [
        SurrealField.id("site_user"),
        SurrealField.record("site", "site").description("Site membership"),
        SurrealField.record("user", "user").description("User account"),
        SurrealField.string("role").description("Role within this site"),
        SurrealField.boolean("is_active").default("true").description("Membership status"),
        SurrealField.datetime("joined_at").default("time::now()").description("Site join time"),
      ])
        .withDescription("User membership in multi-tenant sites");

      // Site-scoped content
      const multiTenantPostTable = SurrealTable.create("site_post", [
        SurrealField.id("site_post"),
        SurrealField.record("site", "site").description("Site this post belongs to"),
        SurrealField.string("title").description("Post title"),
        SurrealField.string("slug").description("URL-friendly post identifier"),
        SurrealField.string("content").description("Post content"),
        SurrealField.record("author", "user").description("Post author"),
        SurrealField.string("status").default("'draft'").description("Publishing status"),
        SurrealField.datetime("created_at").default("time::now()").description("Post creation time"),
      ])
        .withDescription("Site-scoped blog posts");

      const multiTenantSchema = SurrealSchema.create("multi_tenant_blog", "1.0.0")
        .addTable(siteTable)
        .addTable(multiTenantUserTable)
        .addTable(multiTenantPostTable)
        // Multi-tenant indexes
        .addIndex(SurrealIndex.unique("idx_site_domain", "site", ["domain"]))
        .addIndex(SurrealIndex.unique("idx_site_subdomain", "site", ["subdomain"]))
        .addIndex(SurrealIndex.unique("idx_site_user_membership", "site_user", ["site", "user"]))
        .addIndex(SurrealIndex.unique("idx_site_post_slug", "site_post", ["site", "slug"]))
        .addIndex(SurrealIndex.create("idx_site_post_author", "site_post", ["site", "author"]));

      expect(multiTenantSchema.getTables()).toHaveLength(3);
      expect(multiTenantSchema.getIndexes()).toHaveLength(5);

      // Verify unique constraints for multi-tenancy
      const domainIndex = multiTenantSchema.getIndexes()?.find(i => i.getName() === "idx_site_domain");
      expect(domainIndex?.isUnique()).toBe(true);

      const slugIndex = multiTenantSchema.getIndexes()?.find(i => i.getName() === "idx_site_post_slug");
      expect(slugIndex?.isUnique()).toBe(true);
      expect(slugIndex?.getFields()).toEqual(["site", "slug"]);
    });
  });

  describe("Content Workflow Management", () => {
    it("should support editorial workflows", () => {
      // Workflow state management
      const workflowStates = [
        "draft", "review", "revision", "approved", "scheduled", "published", "archived"
      ];

      const workflowTable = SurrealTable.create("post_workflow", [
        SurrealField.id("post_workflow"),
        SurrealField.record("post", "post").description("Post in workflow"),
        SurrealField.string("current_state").description("Current workflow state"),
        SurrealField.string("previous_state").optional().description("Previous workflow state"),
        SurrealField.record("assigned_editor", "user").optional().description("Assigned editor"),
        SurrealField.record("reviewer", "user").optional().description("Current reviewer"),
        SurrealField.string("notes").optional().description("Editorial notes"),
        SurrealField.datetime("state_changed_at").default("time::now()").description("Last state change"),
        SurrealField.datetime("deadline").optional().description("Review/publish deadline"),
      ])
        .withDescription("Editorial workflow management");

      // Workflow history for audit trail
      const workflowHistoryTable = SurrealTable.create("workflow_history", [
        SurrealField.id("workflow_history"),
        SurrealField.record("post", "post").description("Post being tracked"),
        SurrealField.string("from_state").optional().description("Previous state"),
        SurrealField.string("to_state").description("New state"),
        SurrealField.record("changed_by", "user").description("User who made the change"),
        SurrealField.string("notes").optional().description("Change notes"),
        SurrealField.datetime("changed_at").default("time::now()").description("Change timestamp"),
      ])
        .withDescription("Workflow state change history");

      const workflowSchema = SurrealSchema.create("editorial_workflow", "1.0.0")
        .addTable(workflowTable)
        .addTable(workflowHistoryTable)
        .addIndex(SurrealIndex.create("idx_workflow_state", "post_workflow", ["current_state", "state_changed_at"]))
        .addIndex(SurrealIndex.create("idx_workflow_editor", "post_workflow", ["assigned_editor"]))
        .addIndex(SurrealIndex.create("idx_workflow_deadline", "post_workflow", ["deadline"]))
        .addIndex(SurrealIndex.create("idx_history_post", "workflow_history", ["post", "changed_at"]))
        .addEvent(
          SurrealEvent.onUpdate("track_workflow_changes", "post_workflow", `
            IF $before.current_state != $after.current_state THEN
              CREATE workflow_history SET
                post = $after.post,
                from_state = $before.current_state,
                to_state = $after.current_state,
                changed_by = $auth.id,
                changed_at = time::now()
            END
          `).withDescription("Track workflow state changes in history")
        );

      expect(workflowSchema.getTables()).toHaveLength(2);
      expect(workflowSchema.getEvents()).toHaveLength(1);

      // Verify workflow constraints
      const workflowStatesConstraint = SurrealField.string("current_state")
        .assert(`$value IN [${workflowStates.map(s => `'${s}'`).join(", ")}]`);
      
      expect(workflowStatesConstraint.getConstraints()?.assert).toContain("IN ['draft'");
    });
  });

  describe("Performance and Caching Strategy", () => {
    it("should optimize for blog platform query patterns", () => {
      let schema = SurrealSchema.create("blog_performance", "1.0.0");

      // Blog-specific performance indexes
      const blogIndexes = [
        // Homepage and listing queries
        SurrealIndex.create("idx_posts_homepage", "post", ["status", "is_featured", "published_at"]),
        SurrealIndex.create("idx_posts_by_category", "post", ["category", "status", "published_at"]),
        SurrealIndex.create("idx_posts_by_author", "post", ["author", "status", "published_at"]),
        
        // Search and discovery
        SurrealIndex.search("idx_posts_fulltext", "post", ["title", "excerpt", "content"]),
        SurrealIndex.create("idx_posts_tags", "post", ["tags", "status"]),
        
        // Analytics and reporting
        SurrealIndex.create("idx_posts_popular", "post", ["view_count", "published_at"]),
        SurrealIndex.create("idx_posts_engagement", "post", ["comment_count", "like_count"]),
        
        // Comment moderation
        SurrealIndex.create("idx_comments_moderation", "comment", ["status", "created_at"]),
        SurrealIndex.create("idx_comments_threading", "comment", ["post", "parent", "created_at"]),
        
        // User activity
        SurrealIndex.create("idx_users_activity", "user", ["last_login", "role"]),
      ];

      blogIndexes.forEach(index => {
        schema = schema.addIndex(index);
      });

      expect(schema.getIndexes()).toHaveLength(blogIndexes.length);

      // Verify search index for content discovery
      const searchIndex = schema.getIndexes()?.find(i => i.getName() === "idx_posts_fulltext");
      expect(searchIndex?.isSearch()).toBe(true);

      // Verify composite indexes for common queries
      const homepageIndex = schema.getIndexes()?.find(i => i.getName() === "idx_posts_homepage");
      expect(homepageIndex?.getFields()).toEqual(["status", "is_featured", "published_at"]);
    });
  });

  describe("Schema Evolution and Migration", () => {
    it("should handle blog platform schema evolution", () => {
      // V1: Basic blog schema
      const v1Schema = SurrealSchema.create("blog", "1.0.0")
        .addTable(
          SurrealTable.create("post", [
            SurrealField.id("post"),
            SurrealField.string("title"),
            SurrealField.string("content"),
            SurrealField.record("author", "user"),
            SurrealField.string("status").default("'draft'"),
            SurrealField.datetime("created_at").default("time::now()"),
          ])
        )
        .addTable(
          SurrealTable.create("user", [
            SurrealField.id("user"),
            SurrealField.string("username").unique(),
            SurrealField.string("email").unique(),
            SurrealField.datetime("created_at").default("time::now()"),
          ])
        );

      // V2: Add categories, tags, and SEO features
      const v2Schema = SurrealSchema.create("blog", "2.0.0")
        .addTable(
          SurrealTable.create("post", [
            SurrealField.id("post"),
            SurrealField.string("title"),
            SurrealField.string("slug").unique(), // New field
            SurrealField.string("excerpt").optional(), // New field
            SurrealField.string("content"),
            SurrealField.record("author", "user"),
            SurrealField.record("category", "category").optional(), // New field
            SurrealField.array("tags").optional(), // New field
            SurrealField.string("status").default("'draft'"),
            SurrealField.string("meta_title").optional(), // New field
            SurrealField.string("meta_description").optional(), // New field
            SurrealField.int("view_count").default("0"), // New field
            SurrealField.datetime("created_at").default("time::now()"),
            SurrealField.datetime("published_at").optional(), // New field
          ])
        )
        .addTable(
          SurrealTable.create("user", [
            SurrealField.id("user"),
            SurrealField.string("username").unique(),
            SurrealField.string("email").unique(),
            SurrealField.string("display_name"), // New field
            SurrealField.string("bio").optional(), // New field
            SurrealField.string("role").default("'subscriber'"), // New field
            SurrealField.datetime("created_at").default("time::now()"),
          ])
        )
        .addTable( // New table
          SurrealTable.create("category", [
            SurrealField.id("category"),
            SurrealField.string("name").unique(),
            SurrealField.string("slug").unique(),
            SurrealField.string("description").optional(),
            SurrealField.datetime("created_at").default("time::now()"),
          ])
        );

      // Generate migration
      const diff = SchemaComparator.compare(v1Schema, v2Schema);
      expect(diff.hasChanges).toBe(true);

      const migration = MigrationGenerator.generateMigration(
        diff,
        "add_categories_and_seo",
        "Add categories, tags, and SEO enhancements"
      );

      expect(migration.statements.length).toBeGreaterThan(0);

      // Verify migration includes new table creation
      const tableCreations = migration.statements.filter(s => s.type === "table" && s.operation === "CREATE");
      expect(tableCreations.some(s => s.description.includes("category"))).toBe(true);

      // Verify migration includes field additions
      const fieldCreations = migration.statements.filter(s => s.type === "field" && s.operation === "CREATE");
      expect(fieldCreations.length).toBeGreaterThan(8); // Multiple new fields added

      // Test migration SQL generation
      const migrationSQL = MigrationGenerator.generateMigrationFile(migration);
      expect(migrationSQL).toContain("-- UP");
      expect(migrationSQL).toContain("-- DOWN");
      expect(migrationSQL).toContain("DEFINE");
    });
  });
});