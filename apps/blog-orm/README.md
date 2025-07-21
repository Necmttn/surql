# Blog ORM - Automatic Migration Generation

This demonstrates a **next-generation** approach to schema management using `@necmttn/surql-schema` as a proper ORM with **automatic migration generation** from TypeScript schema definitions.

## 🚀 Revolutionary Approach: Schema-First Development

### ❌ Before: Manual Migration Hell
```bash
# Traditional approaches - BAD for production
surrealdb import schema.surql        # Rebuilds ALL indexes
# OR
nano migration_001.sql               # Manual SQL writing
```

**Problems:**
- ⚠️ **Manual migration writing** - error-prone and time-consuming
- ⚠️ **Rebuilds ALL indexes** even if unchanged (expensive!)
- ⚠️ **No change tracking** - can't see what actually changed
- ⚠️ **Inconsistent migrations** - different developers write different SQL
- ⚠️ **Schema drift** - TypeScript types don't match database

### ✅ After: Automatic Migration Generation
```bash
# Next-generation approach - AMAZING for production
npm run migrate:generate my_feature  # Auto-generates migrations from schema changes
npm run db:apply                     # Apply only what changed
npm run db:rollback                  # Rollback specific changes
```

**Benefits:**
- ✅ **Auto-generated migrations** from TypeScript schema definitions
- ✅ **Zero index rebuilds** for new fields - only new indexes are built
- ✅ **Type-safe schema definitions** - single source of truth
- ✅ **Automatic rollback generation** - every migration is reversible
- ✅ **Clear change tracking** - see exactly what changed
- ✅ **Team collaboration** - consistent migrations across developers
- ✅ **Zero downtime** for most schema changes
- ✅ **Development confidence** - iterate fearlessly

## 🏗️ Architecture Overview

### Enhanced Library Features

This project demonstrates enhanced patterns that solve common ORM pain points:

1. **❌ Manual Schema Construction** → **✅ Pre-built Query Schemas**
2. **❌ Repetitive `Schema.encodeUnknownSync`** → **✅ Automatic Validation**
3. **❌ Type Casting `as RecordId<"table">`** → **✅ Type-Safe Helpers**
4. **❌ Complex Union Types for Joins** → **✅ Generated Join Schemas**

### Migration System

```
src/migrations/
├── 0001_initial_schema.surql     # Baseline schema
├── 0002_add_analytics.surql      # Incremental: adds analytics
├── 0003_add_search_features.surql # Incremental: adds search
├── history.json                  # Migration tracking
└── current-schema.surql          # Current DB state
```

## 🚀 Quick Start

### 1. Development Workflow

```bash
# Start development with migration checks
npm run db:dev

# Check current migration status
npm run db:status

# Apply any pending migrations
npm run db:apply
```

### 2. Making Schema Changes

Instead of editing a monolithic `schema.surql`, create incremental migrations:

```bash
# Example: Add a new feature without touching existing indexes
npm run examples:add-column

# Example: Add search index without rebuilding existing ones  
npm run examples:add-index
```

### 3. Production Deployment

```bash
# Safe production deployment
npm run db:deploy
```

## 📊 Migration Examples

### Example 1: Adding Analytics (No Downtime)

**Migration:** `0002_add_analytics.surql`

```sql
-- ✅ Adds new table - no impact on existing tables
DEFINE TABLE analytics SCHEMAFULL;
DEFINE FIELD post ON analytics TYPE record<post>;
-- ... new fields ...

-- ✅ Adds new indexes - existing indexes untouched
DEFINE INDEX idx_analytics_post ON analytics FIELDS post;

-- ✅ Adds new fields to existing table - no index rebuild
DEFINE FIELD engagement_score ON post TYPE float DEFAULT 0.0;

-- ✅ Adds new index - doesn't rebuild idx_post_slug, etc.
DEFINE INDEX idx_post_engagement ON post FIELDS engagement_score;
```

**Result:** Analytics tracking added with **zero downtime**. Existing post queries continue working with existing indexes.

### Example 2: Adding Search (Targeted Index Build)

**Migration:** `0003_add_search_features.surql`

```sql
-- ✅ Only builds the new search index
DEFINE INDEX idx_post_fulltext ON post FIELDS title, content, excerpt SEARCH ANALYZER simple BM25;

-- ✅ Existing indexes (idx_post_slug, idx_post_author) remain untouched
```

**Result:** Powerful full-text search added. Only the new search index is built - existing post indexes stay fast.

## 🔧 Enhanced ORM Patterns

### Before vs After: Repository Code

#### ❌ Before: Manual Schema Construction

```typescript
// Pain point: Manual schema construction for every query
const [posts, totalResult] = yield* db
  .query(/* complex query */)
  .decode([
    // 😰 Manual schema construction every time
    Schema.Array(Schema.Struct({
      ...Post.Post.fields,
      author: Schema.Struct({
        id: User.Fields.id,
        username: User.Fields.username,
        // ... manual field mapping
      }),
      tags: Schema.Array(Schema.Struct({
        // ... more manual mapping
      })),
      comment_count: Schema.Number,
    })),
    Schema.Array(Schema.Struct({ total: Schema.Number })),
  ]);

// 😰 Manual validation everywhere
const validated = Schema.encodeUnknownSync(Post.CreateSchema)(data);

// 😰 Type casting required
const postId = input.postId as RecordId<"post">;
```

#### ✅ After: Pre-built Schemas

```typescript
// 🎉 Pre-built schemas for common query patterns
const [posts, totalResult] = yield* db
  .query(/* complex query */)
  .decode([
    Schema.Array(QuerySchemas.PostListItem), // ✅ Pre-built!
    Schema.Array(Schema.Struct({ total: Schema.Number })),
  ]);

// 🎉 Automatic validation with enhanced client
const createdPost = yield* db.create("post", Post.Post, postData);

// 🎉 Type-safe helpers eliminate casting
const postId = RecordIdHelpers.postId(input.postId); // ✅ Type-safe!
```

### Pre-built Query Schemas

The enhanced library generates schemas for common query patterns:

```typescript
// ✅ Generated automatically from your schema
export namespace QuerySchemas {
  // List views with populated relationships
  export const PostListItem = Schema.Struct({
    id: Post.Fields.id,
    title: Post.Fields.title,
    author: User.PublicSchema,           // ✅ Populated author
    tags: Schema.Array(Tag.Tag),         // ✅ Populated tags  
    comment_count: Schema.Number,        // ✅ Computed fields
  });

  // Detail views with full relationships
  export const PostDetail = Schema.Struct({
    ...Post.Fields,
    author: User.PublicSchema,
    tags: Schema.Array(Tag.Tag),
    comments: Schema.Array(Comment.WithAuthorSchema),
    related_posts: Schema.Array(PostListItem),
  });

  // Search results with scoring
  export const SearchResult = Schema.Union(
    Schema.Struct({
      type: Schema.Literal("post"),
      item: PostListItem,
      score: Schema.Number,
    }),
    // ... other search result types
  );
}
```

### Validation Helpers

```typescript
// ✅ Generated validation helpers
export namespace ValidationHelpers {
  export const validateCreatePost = (data: unknown) =>
    Schema.decodeUnknownSync(Post.CreateSchema)(data);

  export const validateUpdatePost = (data: unknown) =>
    Schema.decodeUnknownSync(Post.UpdateSchema)(data);
    
  // Generic validator factory
  export const createValidator = <T>(schema: Schema.Schema<T>) => 
    (data: unknown) => Schema.decodeUnknownSync(schema)(data);
}
```

### Type-Safe RecordId Helpers

```typescript
// ✅ No more casting!
export namespace RecordIdHelpers {
  export const postId = (id: string) => 
    recordId("post").pipe(Schema.decode(`post:${id}`));
    
  export const userId = (id: string) => 
    recordId("user").pipe(Schema.decode(`user:${id}`));
}
```

## 📋 Available Commands

### Database Operations
```bash
npm run db:status           # Show migration status
npm run db:apply            # Apply pending migrations  
npm run db:rollback         # Rollback last migration
npm run db:export           # Export current schema
npm run db:dev              # Development workflow
npm run db:deploy           # Production deployment
```

### Schema Operations
```bash
npm run schema:generate     # Generate TypeScript from schema
npm run schema:export       # Export schema from database
npm run schema:diff         # Compare schema files
npm run schema:exec         # Execute SQL file
```

### Examples
```bash
npm run examples:add-column # Demo: add column safely
npm run examples:add-index  # Demo: add index safely
```

## 🎓 Migration Best Practices

### ✅ DO: Incremental Changes
```sql
-- Good: Add new field without affecting existing indexes
DEFINE FIELD new_field ON existing_table TYPE string DEFAULT '';

-- Good: Add new index without rebuilding existing ones
DEFINE INDEX idx_new_field ON existing_table FIELDS new_field;
```

### ❌ DON'T: Mass Changes
```sql
-- Bad: This would rebuild ALL indexes
DROP TABLE existing_table;
DEFINE TABLE existing_table SCHEMAFULL;
-- ... redefine everything
```

### ✅ DO: Test Migrations
```bash
# Always test on staging first
npm run db:apply              # Apply migration
npm run db:rollback           # Test rollback
npm run db:apply              # Apply again
```

## 🏭 Production Deployment

### Staging Environment
```bash
# 1. Deploy to staging
git pull origin main
npm run db:status             # Review pending migrations
npm run db:apply              # Apply migrations
npm run test                  # Run tests
```

### Production Environment
```bash
# 2. Deploy to production
npm run db:status             # Confirm what will be applied
npm run db:deploy             # Production deployment
npm run db:status             # Verify all applied
```

### Rollback Plan
```bash
# If something goes wrong
npm run db:rollback           # Rollback last migration
npm run db:status             # Verify rollback
```

## 🎯 Key Benefits Achieved

### 🚀 Performance
- **No unnecessary index rebuilds** - only new indexes are built
- **Zero downtime** for most schema changes
- **Parallel deployments** possible with migration locks

### 🛡️ Safety  
- **Rollback capability** for all changes
- **Change tracking** with full audit trail
- **Test in staging** before production

### 👨‍💻 Developer Experience
- **Iterate fearlessly** - migrations are tracked
- **Clear change history** - see what changed when
- **Automatic validation** - no manual schema construction

### 🔧 ORM Benefits
- **Type-safe queries** with pre-built schemas
- **Automatic validation** eliminates boilerplate
- **Relationship handling** with populated schemas
- **Error handling** with proper Effect error types

This demonstrates how `@necmttn/surql-schema` can work as a proper ORM while maintaining SurrealDB's query power and solving real production problems!