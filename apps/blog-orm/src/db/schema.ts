/**
 * ⚠️ AUTO-GENERATED FILE ⚠️
 * Enhanced schema generation demonstrating improved ORM patterns
 * 
 * This file shows how surql-gen should generate schemas to reduce:
 * - Manual schema construction for query results
 * - Repetitive validation with Schema.encodeUnknownSync
 * - Type casting with 'as RecordId<"table">'
 * - Complex union types for joined queries
 */

import { Schema } from "effect";
import { RecordId, StringRecordId } from "surrealdb";

// ===========================================
// RecordId Helpers (Enhanced)
// ===========================================

export const recordIdSchema = <T extends string>(tableName: T) =>
  Schema.transform(
    Schema.TemplateLiteral(Schema.Literal(tableName), Schema.Literal(":"), Schema.String),
    Schema.instanceOf(RecordId),
    {
      strict: true,
      decode: (from: `${T}:${string}`) => {
        const [table, id] = from.split(":");
        if (!table || !id) {
          throw new Error(`Invalid RecordId: ${from}`);
        }
        return new RecordId(table, id);
      },
      encode: (to) => to.toString() as `${T}:${string}`,
    }
  );

export const stringRecordIdSchema = <T extends string>(tableName: T) =>
  Schema.transform(
    Schema.TemplateLiteral(Schema.Literal(tableName), Schema.Literal(":"), Schema.String),
    Schema.instanceOf(StringRecordId),
    {
      strict: true,
      decode: (from: `${T}:${string}`) => new StringRecordId(from),
      encode: (to) => to.toString() as `${T}:${string}`,
    }
  );

export function recordId<T extends string>(tableName: T) {
  return Schema.Union(recordIdSchema(tableName), stringRecordIdSchema(tableName));
}

// ===========================================
// User Schema and Helpers
// ===========================================

export namespace User {
  export const Fields = {
    id: recordId("user"),
    email: Schema.String.annotations({
      description: "User email address",
      jsonSchema: { format: "email" },
    }),
    username: Schema.String.annotations({
      description: "Unique username",
      jsonSchema: { minLength: 3, maxLength: 30 },
    }),
    first_name: Schema.String.annotations({
      description: "User first name",
    }),
    last_name: Schema.String.annotations({
      description: "User last name", 
    }),
    bio: Schema.String.annotations({
      description: "User biography",
    }),
    avatar_url: Schema.String.annotations({
      description: "User avatar URL",
      jsonSchema: { format: "uri" },
    }),
    role: Schema.Literal("author", "editor", "admin").annotations({
      description: "User role",
      surrealDefault: "'author'",
    }),
    is_active: Schema.Boolean.annotations({
      description: "Whether user is active",
      surrealDefault: "true",
    }),
    created_at: Schema.DateFromSelf.annotations({
      description: "User creation timestamp",
      surrealDefault: "time::now()",
    }),
    updated_at: Schema.DateFromSelf.annotations({
      description: "User last update timestamp",
      surrealDefault: "time::now()",
    }),
  };

  export class User extends Schema.Class<User>("User")({
    ...Fields,
  }) {
    static readonly tableName = "user" as const;
  }

  export type Type = Schema.Schema.Type<typeof User>;

  // Enhanced: Pre-built schemas for common operations
  export const CreateSchema = Schema.Struct({
    email: Fields.email,
    username: Fields.username,
    first_name: Fields.first_name,
    last_name: Fields.last_name,
    bio: Schema.optional(Fields.bio),
    avatar_url: Schema.optional(Fields.avatar_url),
    role: Schema.optional(Fields.role),
  });

  export const UpdateSchema = Schema.partial(
    Schema.omit(User, "id", "created_at")
  );

  export const PublicSchema = Schema.pick(
    User,
    "id",
    "username", 
    "first_name",
    "last_name",
    "bio",
    "avatar_url",
    "created_at"
  );

  // Enhanced: Query result schemas for common joins
  export const WithPostCountSchema = Schema.Struct({
    ...Fields,
    post_count: Schema.Number,
  });

  export const WithLatestPostSchema = Schema.Struct({
    ...Fields,
    latest_post: Schema.optional(Schema.lazy(() => Post.Post)),
  });
}

// ===========================================
// Post Schema and Helpers
// ===========================================

export namespace Post {
  export const Fields = {
    id: recordId("post"),
    title: Schema.String.annotations({
      description: "Post title",
      jsonSchema: { minLength: 1, maxLength: 200 },
    }),
    slug: Schema.String.annotations({
      description: "URL-friendly post identifier",
      jsonSchema: { pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
    }),
    content: Schema.String.annotations({
      description: "Post content in markdown",
    }),
    excerpt: Schema.String.annotations({
      description: "Post excerpt/summary",
      jsonSchema: { maxLength: 500 },
    }),
    author: recordId("user"),
    status: Schema.Literal("draft", "published", "archived").annotations({
      description: "Post publication status",
      surrealDefault: "'draft'",
    }),
    featured: Schema.Boolean.annotations({
      description: "Whether post is featured",
      surrealDefault: "false",
    }),
    view_count: Schema.Number.annotations({
      description: "Number of views",
      surrealDefault: "0",
    }),
    published_at: Schema.optional(Schema.DateFromSelf).annotations({
      description: "Publication timestamp",
    }),
    created_at: Schema.DateFromSelf.annotations({
      description: "Post creation timestamp",
      surrealDefault: "time::now()",
    }),
    updated_at: Schema.DateFromSelf.annotations({
      description: "Post last update timestamp",
      surrealDefault: "time::now()",
    }),
  };

  export class Post extends Schema.Class<Post>("Post")({
    ...Fields,
  }) {
    static readonly tableName = "post" as const;
  }

  export type Type = Schema.Schema.Type<typeof Post>;

  // Enhanced: Pre-built schemas for common operations
  export const CreateSchema = Schema.Struct({
    title: Fields.title,
    slug: Fields.slug,
    content: Fields.content,
    excerpt: Fields.excerpt,
    author: Fields.author,
    status: Schema.optional(Fields.status),
    featured: Schema.optional(Fields.featured),
  });

  export const UpdateSchema = Schema.partial(
    Schema.omit(Post, "id", "author", "created_at")
  );

  export const PublishedSchema = Schema.Struct({
    ...Fields,
    status: Schema.Literal("published"),
    published_at: Schema.DateFromSelf,
  });

  // Enhanced: Query result schemas for common joins
  export const WithAuthorSchema = Schema.Struct({
    ...Fields,
    author: User.User, // Populated author instead of just ID
  });

  export const WithTagsSchema = Schema.Struct({
    ...Fields,
    tags: Schema.Array(Schema.lazy(() => Tag.Tag)),
  });

  export const WithAuthorAndTagsSchema = Schema.Struct({
    ...Fields,
    author: User.User,
    tags: Schema.Array(Schema.lazy(() => Tag.Tag)),
  });

  export const WithCommentsSchema = Schema.Struct({
    ...Fields,
    comments: Schema.Array(Schema.lazy(() => Comment.Comment)),
    comment_count: Schema.Number,
  });

  // Enhanced: List/pagination schemas
  export const ListItemSchema = Schema.Struct({
    ...Schema.pick(Post, "id", "title", "slug", "excerpt", "status", "featured", "view_count", "published_at", "created_at").fields,
    author: User.PublicSchema,
    tags: Schema.Array(Tag.Fields.name),
    comment_count: Schema.Number,
  });
}

// ===========================================
// Tag Schema and Helpers  
// ===========================================

export namespace Tag {
  export const Fields = {
    id: recordId("tag"),
    name: Schema.String.annotations({
      description: "Tag name",
      jsonSchema: { minLength: 1, maxLength: 50 },
    }),
    slug: Schema.String.annotations({
      description: "URL-friendly tag identifier",
    }),
    description: Schema.String.annotations({
      description: "Tag description",
    }),
    color: Schema.String.annotations({
      description: "Tag color (hex)",
      surrealDefault: "'#6366f1'",
      jsonSchema: { pattern: "^#[0-9a-fA-F]{6}$" },
    }),
    post_count: Schema.Number.annotations({
      description: "Number of posts with this tag",
      surrealDefault: "0",
    }),
    created_at: Schema.DateFromSelf.annotations({
      description: "Tag creation timestamp",
      surrealDefault: "time::now()",
    }),
  };

  export class Tag extends Schema.Class<Tag>("Tag")({
    ...Fields,
  }) {
    static readonly tableName = "tag" as const;
  }

  export type Type = Schema.Schema.Type<typeof Tag>;

  export const CreateSchema = Schema.Struct({
    name: Fields.name,
    slug: Fields.slug,
    description: Schema.optional(Fields.description),
    color: Schema.optional(Fields.color),
  });

  export const UpdateSchema = Schema.partial(
    Schema.omit(Tag, "id", "post_count", "created_at")
  );

  // Enhanced: With relationships
  export const WithPostsSchema = Schema.Struct({
    ...Fields,
    posts: Schema.Array(Post.Post),
  });
}

// ===========================================
// Comment Schema and Helpers
// ===========================================

export namespace Comment {
  export const Fields = {
    id: recordId("comment"),
    content: Schema.String.annotations({
      description: "Comment content",
      jsonSchema: { minLength: 1, maxLength: 2000 },
    }),
    author: recordId("user"),
    post: recordId("post"),
    parent: Schema.optional(recordId("comment")).annotations({
      description: "Parent comment for threading",
    }),
    status: Schema.Literal("pending", "approved", "spam", "trash").annotations({
      description: "Comment moderation status",
      surrealDefault: "'pending'",
    }),
    created_at: Schema.DateFromSelf.annotations({
      description: "Comment creation timestamp",
      surrealDefault: "time::now()",
    }),
    updated_at: Schema.DateFromSelf.annotations({
      description: "Comment last update timestamp",
      surrealDefault: "time::now()",
    }),
  };

  export class Comment extends Schema.Class<Comment>("Comment")({
    ...Fields,
  }) {
    static readonly tableName = "comment" as const;
  }

  export type Type = Schema.Schema.Type<typeof Comment>;

  export const CreateSchema = Schema.Struct({
    content: Fields.content,
    author: Fields.author,
    post: Fields.post,
    parent: Schema.optional(Fields.parent),
  });

  export const UpdateSchema = Schema.partial(
    Schema.pick(Comment, "content", "status")
  );

  // Enhanced: With relationships populated
  export const WithAuthorSchema = Schema.Struct({
    ...Fields,
    author: User.PublicSchema,
  });

  export const WithRepliesSchema = Schema.Struct({
    ...Fields,
    replies: Schema.Array(Schema.lazy(() => Comment)),
    reply_count: Schema.Number,
  });

  export const ThreadSchema = Schema.Struct({
    ...Fields,
    author: User.PublicSchema,
    replies: Schema.Array(Schema.lazy(() => ThreadSchema)),
    reply_count: Schema.Number,
  });
}

// ===========================================
// Analytics Schema
// ===========================================

export namespace Analytics {
  export const Fields = {
    id: recordId("analytics"),
    post: recordId("post"),
    event_type: Schema.Literal("view", "like", "share").annotations({
      description: "Type of analytics event",
    }),
    user_id: Schema.optional(recordId("user")).annotations({
      description: "User who triggered the event (if logged in)",
    }),
    ip_address: Schema.String.annotations({
      description: "IP address of the visitor",
    }),
    user_agent: Schema.String.annotations({
      description: "Browser user agent",
    }),
    metadata: Schema.Record(Schema.String, Schema.Unknown).annotations({
      description: "Additional event metadata",
    }),
    created_at: Schema.DateFromSelf.annotations({
      description: "Event timestamp",
      surrealDefault: "time::now()",
    }),
  };

  export class Analytics extends Schema.Class<Analytics>("Analytics")({
    ...Fields,
  }) {
    static readonly tableName = "analytics" as const;
  }

  export type Type = Schema.Schema.Type<typeof Analytics>;

  export const CreateSchema = Schema.Struct({
    post: Fields.post,
    event_type: Fields.event_type,
    user_id: Schema.optional(Fields.user_id),
    ip_address: Fields.ip_address,
    user_agent: Fields.user_agent,
    metadata: Schema.optional(Fields.metadata),
  });
}

// ===========================================
// Enhanced Query Helpers (What surql-gen should generate)
// ===========================================

/**
 * Pre-built query result schemas for common operations
 * This eliminates the need to manually construct schemas in repositories
 */
export namespace QuerySchemas {
  // User queries
  export const UserWithStats = Schema.Struct({
    ...User.Fields,
    post_count: Schema.Number,
    comment_count: Schema.Number,
    latest_post_date: Schema.optional(Schema.DateFromSelf),
  });

  // Post queries  
  export const PostListItem = Schema.Struct({
    id: Post.Fields.id,
    title: Post.Fields.title,
    slug: Post.Fields.slug,
    excerpt: Post.Fields.excerpt,
    status: Post.Fields.status,
    featured: Post.Fields.featured,
    view_count: Post.Fields.view_count,
    published_at: Post.Fields.published_at,
    created_at: Post.Fields.created_at,
    author: Schema.Struct({
      id: User.Fields.id,
      username: User.Fields.username,
      first_name: User.Fields.first_name,
      last_name: User.Fields.last_name,
      avatar_url: User.Fields.avatar_url,
    }),
    tags: Schema.Array(Schema.Struct({
      id: Tag.Fields.id,
      name: Tag.Fields.name,
      slug: Tag.Fields.slug,
      color: Tag.Fields.color,
    })),
    comment_count: Schema.Number,
  });

  export const PostDetail = Schema.Struct({
    ...Post.Fields,
    author: User.PublicSchema,
    tags: Schema.Array(Tag.Tag),
    comments: Schema.Array(Comment.WithAuthorSchema),
    comment_count: Schema.Number,
    related_posts: Schema.Array(PostListItem),
  });

  // Comment queries
  export const CommentThread = Schema.Struct({
    ...Comment.Fields,
    author: User.PublicSchema,
    replies: Schema.Array(Schema.lazy(() => CommentThread)),
    reply_count: Schema.Number,
  });

  // Search results
  export const SearchResult = Schema.Union(
    Schema.Struct({
      type: Schema.Literal("post"),
      item: PostListItem,
      score: Schema.Number,
    }),
    Schema.Struct({
      type: Schema.Literal("user"),
      item: User.PublicSchema,
      score: Schema.Number,
    }),
    Schema.Struct({
      type: Schema.Literal("tag"),
      item: Tag.Tag,
      score: Schema.Number,
    })
  );

  // Analytics aggregations
  export const PostAnalytics = Schema.Struct({
    post_id: Post.Fields.id,
    total_views: Schema.Number,
    unique_views: Schema.Number,
    total_likes: Schema.Number,
    total_shares: Schema.Number,
    views_by_day: Schema.Array(Schema.Struct({
      date: Schema.DateFromSelf,
      views: Schema.Number,
    })),
  });
}

/**
 * Validation helpers to reduce Schema.encodeUnknownSync boilerplate
 */
export namespace ValidationHelpers {
  export const validateUser = (data: unknown) =>
    Schema.decodeUnknownSync(User.User)(data);

  export const validatePost = (data: unknown) =>
    Schema.decodeUnknownSync(Post.Post)(data);

  export const validateCreatePost = (data: unknown) =>
    Schema.decodeUnknownSync(Post.CreateSchema)(data);

  export const validateUpdatePost = (data: unknown) =>
    Schema.decodeUnknownSync(Post.UpdateSchema)(data);

  export const validateTag = (data: unknown) =>
    Schema.decodeUnknownSync(Tag.Tag)(data);

  export const validateComment = (data: unknown) =>
    Schema.decodeUnknownSync(Comment.Comment)(data);

  // Generic validator factory
  export const createValidator = <T>(schema: Schema.Schema<T>) => (data: unknown) =>
    Schema.decodeUnknownSync(schema)(data);
}

/**
 * Type-safe RecordId helpers to eliminate casting
 */
export namespace RecordIdHelpers {
  export const userId = (id: string) => recordId("user").pipe(
    Schema.decode(`user:${id}`)
  );

  export const postId = (id: string) => recordId("post").pipe(
    Schema.decode(`post:${id}`)
  );

  export const tagId = (id: string) => recordId("tag").pipe(
    Schema.decode(`tag:${id}`)
  );

  export const commentId = (id: string) => recordId("comment").pipe(
    Schema.decode(`comment:${id}`)
  );

  // Generic RecordId creator
  export const createRecordId = <T extends string>(table: T) => (id: string) =>
    recordId(table).pipe(Schema.decode(`${table}:${id}`));
}

/**
 * Export all schemas for easy importing
 */
export {
  User,
  Post, 
  Tag,
  Comment,
  Analytics,
  QuerySchemas,
  ValidationHelpers,
  RecordIdHelpers,
};