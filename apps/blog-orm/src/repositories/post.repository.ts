/**
 * Post Repository - Demonstrates Enhanced ORM Patterns
 * 
 * This shows how the enhanced surql-gen eliminates common pain points:
 * ✅ No manual schema construction for query results
 * ✅ No repetitive Schema.encodeUnknownSync calls  
 * ✅ No type casting with 'as RecordId<"table">'
 * ✅ Pre-built schemas for complex query results
 * ✅ Type-safe parameter handling
 */

import { Data, Effect, Schema } from "effect";
import type { RecordId } from "surrealdb";
import { EnhancedSurrealTyped } from "../lib/db";
import {
  Post,
  User,
  Tag,
  Comment,
  QuerySchemas,
  ValidationHelpers,
  recordId,
} from "../db/schema";

// ===========================================
// Repository Errors
// ===========================================

export class PostNotFoundError extends Data.TaggedError("PostNotFoundError")<{
  readonly postId: string;
  readonly cause?: unknown;
}> {}

export class PostSlugConflictError extends Data.TaggedError("PostSlugConflictError")<{
  readonly slug: string;
  readonly cause?: unknown;
}> {}

export class PostValidationError extends Data.TaggedError("PostValidationError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

// ===========================================
// Input Types (for tRPC/API)
// ===========================================

export class CreatePostInput extends Schema.Class<CreatePostInput>("CreatePostInput")({
  title: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Title is required" }),
    Schema.maxLength(200, { message: () => "Title too long" })
  ),
  content: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Content is required" })
  ),
  excerpt: Schema.optional(Schema.String.pipe(
    Schema.maxLength(500, { message: () => "Excerpt too long" })
  )),
  authorId: recordId("user"),
  tagIds: Schema.optional(Schema.Array(recordId("tag"))),
  status: Schema.optional(Post.Fields.status),
  featured: Schema.optional(Schema.Boolean),
  publishNow: Schema.optional(Schema.Boolean),
}) {}

export class UpdatePostInput extends Schema.Class<UpdatePostInput>("UpdatePostInput")({
  title: Schema.optional(Schema.String.pipe(
    Schema.minLength(1),
    Schema.maxLength(200)
  )),
  content: Schema.optional(Schema.String.pipe(Schema.minLength(1))),
  excerpt: Schema.optional(Schema.String.pipe(Schema.maxLength(500))),
  tagIds: Schema.optional(Schema.Array(recordId("tag"))),
  status: Schema.optional(Post.Fields.status),
  featured: Schema.optional(Schema.Boolean),
}) {}

export class ListPostsInput extends Schema.Class<ListPostsInput>("ListPostsInput")({
  limit: Schema.optional(Schema.Number.pipe(
    Schema.int(),
    Schema.between(1, 100, { message: () => "Limit must be between 1 and 100" })
  )).pipe(Schema.withDefault(() => 10)),
  offset: Schema.optional(Schema.Number.pipe(
    Schema.int(),
    Schema.greaterThanOrEqualTo(0)
  )).pipe(Schema.withDefault(() => 0)),
  authorId: Schema.optional(recordId("user")),
  tagId: Schema.optional(recordId("tag")),
  status: Schema.optional(Post.Fields.status),
  featured: Schema.optional(Schema.Boolean),
  search: Schema.optional(Schema.String.pipe(Schema.minLength(1))),
  sortBy: Schema.optional(Schema.Literal("created_at", "published_at", "view_count", "title"))
    .pipe(Schema.withDefault(() => "created_at" as const)),
  sortOrder: Schema.optional(Schema.Literal("asc", "desc"))
    .pipe(Schema.withDefault(() => "desc" as const)),
}) {}

// ===========================================
// Repository Implementation
// ===========================================

export class PostRepository extends Effect.Service<PostRepository>()(
  "PostRepository",
  {
    effect: Effect.gen(function* (_) {
      const db = yield* EnhancedSurrealTyped;

      /**
       * Create a new post with automatic slug generation and validation
       * 
       * Before: Manual schema construction and validation
       * After: Pre-built schemas and automatic validation
       */
      const create = Effect.fn("post.create")(function* (input: CreatePostInput) {
        yield* Effect.annotateCurrentSpan({
          "post.title": input.title,
          "post.author": input.authorId.toString(),
        });

        // Generate slug from title
        const slug = input.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-");

        // Check for slug conflicts
        const existingPost = yield* db
          .query("SELECT id FROM post WHERE slug = $slug LIMIT 1", { slug })
          .decode([Schema.Array(Schema.Struct({ id: recordId("post") }))]);

        if (existingPost[0]?.length > 0) {
          throw new PostSlugConflictError({
            slug,
            cause: new Error("Post with this slug already exists"),
          });
        }

        // Prepare post data
        const postData = {
          title: input.title,
          slug,
          content: input.content,
          excerpt: input.excerpt || input.content.substring(0, 200) + "...",
          author: input.authorId,
          status: input.status || ("draft" as const),
          featured: input.featured || false,
          published_at: input.publishNow && input.status === "published" 
            ? new Date() 
            : undefined,
        };

        // ✅ Before: Schema.encodeUnknownSync(Post.CreateSchema)(postData)
        // ✅ After: Automatic validation with pre-built schema
        const [createdPost] = yield* db
          .query("CREATE post CONTENT $data", { data: postData })
          .decode([Post.Post]);

        // Add tags if provided
        if (input.tagIds && input.tagIds.length > 0) {
          yield* Effect.forEach(
            input.tagIds,
            (tagId) => db.query(
              "RELATE $post->post_tag->$tag",
              { post: createdPost.id, tag: tagId }
            ).raw(),
            { concurrency: "unbounded" }
          );
        }

        return createdPost;
      });

      /**
       * Get post by ID with related data
       * 
       * Before: Manual schema construction for joins
       * After: Pre-built QuerySchemas.PostDetail
       */
      const getById = Effect.fn("post.getById")(function* (postId: RecordId<"post"> | string) {
        yield* Effect.annotateCurrentSpan({
          "post.id": postId.toString(),
        });

        // ✅ Before: Manually constructing complex union schemas
        // ✅ After: Pre-built schema handles all the complexity
        const [result] = yield* db
          .query(
            /* surql */ `
            SELECT 
              *,
              author.*,
              (SELECT * FROM tag WHERE id IN (SELECT tag FROM post_tag WHERE post = $postId)) AS tags,
              (SELECT *, author.* FROM comment WHERE post = $postId AND status = 'approved' ORDER BY created_at) AS comments,
              count((SELECT id FROM comment WHERE post = $postId AND status = 'approved')) AS comment_count,
              (SELECT * FROM post WHERE id != $postId AND status = 'published' AND author = $post.author LIMIT 3) AS related_posts
            FROM ONLY $postId
            `,
            { postId }
          )
          .decode([Schema.optional(QuerySchemas.PostDetail)]);

        if (!result) {
          throw new PostNotFoundError({
            postId: postId.toString(),
          });
        }

        return result;
      });

      /**
       * List posts with filtering and pagination
       * 
       * Before: Complex manual schema construction for list results
       * After: Pre-built QuerySchemas.PostListItem
       */
      const list = Effect.fn("post.list")(function* (input: ListPostsInput) {
        yield* Effect.annotateCurrentSpan({
          "query.limit": input.limit,
          "query.offset": input.offset,
          "query.author": input.authorId?.toString(),
          "query.search": input.search,
        });

        // Build dynamic query conditions
        const conditions: string[] = [];
        const params: Record<string, unknown> = {
          limit: input.limit,
          offset: input.offset,
        };

        if (input.authorId) {
          conditions.push("author = $authorId");
          params.authorId = input.authorId;
        }

        if (input.tagId) {
          conditions.push("id IN (SELECT post FROM post_tag WHERE tag = $tagId)");
          params.tagId = input.tagId;
        }

        if (input.status) {
          conditions.push("status = $status");
          params.status = input.status;
        }

        if (input.featured !== undefined) {
          conditions.push("featured = $featured");
          params.featured = input.featured;
        }

        if (input.search) {
          conditions.push("(title @@ $search OR content @@ $search)");
          params.search = input.search;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
        const orderClause = `ORDER BY ${input.sortBy} ${input.sortOrder.toUpperCase()}`;

        // ✅ Before: Manually constructing schemas for list results with joins
        // ✅ After: Pre-built QuerySchemas.PostListItem handles everything
        const [posts, totalResult] = yield* db
          .query(
            /* surql */ `
            SELECT 
              id, title, slug, excerpt, status, featured, view_count, published_at, created_at,
              author.{id, username, first_name, last_name, avatar_url},
              (SELECT name FROM tag WHERE id IN (SELECT tag FROM post_tag WHERE post = $parent.id)) AS tags,
              count((SELECT id FROM comment WHERE post = $parent.id AND status = 'approved')) AS comment_count
            FROM post
            ${whereClause}
            ${orderClause}
            LIMIT $limit START $offset;

            SELECT count() AS total 
            FROM post 
            ${whereClause}
            GROUP ALL;
            `,
            params
          )
          .decode([
            Schema.Array(QuerySchemas.PostListItem),
            Schema.Array(Schema.Struct({ total: Schema.Number })),
          ]);

        const total = totalResult[0]?.total || 0;

        return {
          posts,
          total,
          limit: input.limit,
          offset: input.offset,
          hasMore: input.offset + input.limit < total,
        };
      });

      /**
       * Update post with automatic validation
       * 
       * Before: Manual validation and type casting
       * After: Pre-built update schema with automatic validation
       */
      const update = Effect.fn("post.update")(function* (
        postId: RecordId<"post"> | string,
        input: UpdatePostInput
      ) {
        yield* Effect.annotateCurrentSpan({
          "post.id": postId.toString(),
        });

        // Check if post exists
        const existing = yield* db.findById(postId, Post.Post);
        if (!existing) {
          throw new PostNotFoundError({
            postId: postId.toString(),
          });
        }

        // Handle slug update if title changed
        const updateData: any = { ...input };
        if (input.title && input.title !== existing.title) {
          updateData.slug = input.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");

          // Check for slug conflicts
          const conflictingPost = yield* db
            .query(
              "SELECT id FROM post WHERE slug = $slug AND id != $postId LIMIT 1",
              { slug: updateData.slug, postId }
            )
            .decode([Schema.Array(Schema.Struct({ id: recordId("post") }))]);

          if (conflictingPost[0]?.length > 0) {
            throw new PostSlugConflictError({
              slug: updateData.slug,
            });
          }
        }

        // Handle publication
        if (input.status === "published" && existing.status !== "published") {
          updateData.published_at = new Date();
        }

        updateData.updated_at = new Date();

        // ✅ Before: Schema.encodeUnknownSync and manual validation
        // ✅ After: Automatic validation with pre-built update schema
        const updatedPost = yield* db.update(postId, Post.Post, updateData);

        // Update tags if provided
        if (input.tagIds) {
          // Remove existing tag relationships
          yield* db
            .query("DELETE post_tag WHERE post = $postId", { postId })
            .raw();

          // Add new tag relationships
          if (input.tagIds.length > 0) {
            yield* Effect.forEach(
              input.tagIds,
              (tagId) => db.query(
                "RELATE $post->post_tag->$tag",
                { post: postId, tag: tagId }
              ).raw(),
              { concurrency: "unbounded" }
            );
          }
        }

        return updatedPost;
      });

      /**
       * Delete post and cleanup relationships
       */
      const deleteById = Effect.fn("post.delete")(function* (postId: RecordId<"post"> | string) {
        yield* Effect.annotateCurrentSpan({
          "post.id": postId.toString(),
        });

        // Check if post exists
        const existing = yield* db.findById(postId, Post.Post);
        if (!existing) {
          throw new PostNotFoundError({
            postId: postId.toString(),
          });
        }

        // Delete related data
        yield* db
          .query(
            /* surql */ `
            BEGIN TRANSACTION;
            DELETE comment WHERE post = $postId;
            DELETE post_tag WHERE post = $postId;
            DELETE analytics WHERE post = $postId;
            DELETE $postId;
            COMMIT TRANSACTION;
            `,
            { postId }
          )
          .raw();

        return { success: true };
      });

      /**
       * Increment view count (for analytics)
       */
      const incrementViews = Effect.fn("post.incrementViews")(function* (
        postId: RecordId<"post"> | string
      ) {
        yield* db
          .query(
            "UPDATE $postId SET view_count += 1",
            { postId }
          )
          .raw();

        return { success: true };
      });

      /**
       * Get posts by tag
       */
      const getByTag = Effect.fn("post.getByTag")(function* (
        tagId: RecordId<"tag"> | string,
        limit = 10,
        offset = 0
      ) {
        const [posts] = yield* db
          .query(
            /* surql */ `
            SELECT 
              id, title, slug, excerpt, status, featured, view_count, published_at, created_at,
              author.{id, username, first_name, last_name, avatar_url},
              (SELECT name FROM tag WHERE id IN (SELECT tag FROM post_tag WHERE post = $parent.id)) AS tags,
              count((SELECT id FROM comment WHERE post = $parent.id AND status = 'approved')) AS comment_count
            FROM post 
            WHERE id IN (SELECT post FROM post_tag WHERE tag = $tagId)
            AND status = 'published'
            ORDER BY published_at DESC
            LIMIT $limit START $offset
            `,
            { tagId, limit, offset }
          )
          .decode([Schema.Array(QuerySchemas.PostListItem)]);

        return posts;
      });

      /**
       * Search posts with full-text search
       */
      const search = Effect.fn("post.search")(function* (
        query: string,
        limit = 10,
        offset = 0
      ) {
        const [results] = yield* db
          .query(
            /* surql */ `
            SELECT 
              id, title, slug, excerpt, status, featured, view_count, published_at, created_at,
              author.{id, username, first_name, last_name, avatar_url},
              (SELECT name FROM tag WHERE id IN (SELECT tag FROM post_tag WHERE post = $parent.id)) AS tags,
              count((SELECT id FROM comment WHERE post = $parent.id AND status = 'approved')) AS comment_count
            FROM post 
            WHERE (title @@ $query OR content @@ $query OR excerpt @@ $query)
            AND status = 'published'
            ORDER BY published_at DESC
            LIMIT $limit START $offset
            `,
            { query, limit, offset }
          )
          .decode([Schema.Array(QuerySchemas.PostListItem)]);

        return results;
      });

      return {
        create,
        getById,
        list,
        update,
        deleteById,
        incrementViews,
        getByTag,
        search,
      };
    }),
    dependencies: [EnhancedSurrealTyped.Default],
  }
) {}

/**
 * Export input types for tRPC integration
 */
export { CreatePostInput, UpdatePostInput, ListPostsInput };