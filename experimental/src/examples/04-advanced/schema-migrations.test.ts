import { describe, it, expect } from "vitest";
import { Schema } from "effect";
import { SurrealField } from "../../lib/schema/field";
import { SurrealTable } from "../../lib/schema/table";
import {
  emailSchema,
  usernameSchema,
  nonEmptyString,
  maxLength,
  minLength
} from "../../lib/constraints";

/**
 * Level 4: Schema Migrations and Evolution
 * 
 * This test demonstrates advanced patterns for managing schema changes over time,
 * including versioning, migration paths, and backward compatibility.
 */
describe("Level 4: Schema Migrations", () => {
  describe("Schema Versioning", () => {
    it("should support version-aware schemas", () => {
      // Version 1.0 - Initial user schema
      const UserV1 = Schema.Struct({
        id: Schema.String,
        name: Schema.String.pipe(nonEmptyString, maxLength(100)),
        email: emailSchema
      }).annotations({
        version: "1.0",
        created: "2024-01-01",
        description: "Initial user schema with combined name field"
      });

      // Version 1.1 - Added optional phone field
      const UserV1_1 = Schema.Struct({
        id: Schema.String,
        name: Schema.String.pipe(nonEmptyString, maxLength(100)),
        email: emailSchema,
        phone: Schema.optional(
          Schema.String.pipe(
            nonEmptyString,
            Schema.pattern(/^\+?[\d\s\-\(\)]{10,20}$/)
          )
        )
      }).annotations({
        version: "1.1",
        created: "2024-02-01",
        description: "Added optional phone field",
        migratesFrom: ["1.0"],
        migrationDescription: "Non-breaking change: added optional phone field"
      });

      // Version 2.0 - Breaking change: split name into firstName/lastName
      const UserV2 = Schema.Struct({
        id: Schema.String,
        firstName: Schema.String.pipe(nonEmptyString, maxLength(50)),
        lastName: Schema.String.pipe(nonEmptyString, maxLength(50)),
        email: emailSchema,
        phone: Schema.optional(
          Schema.String.pipe(
            nonEmptyString,
            Schema.pattern(/^\+?[\d\s\-\(\)]{10,20}$/)
          )
        )
      }).annotations({
        version: "2.0",
        created: "2024-06-01",
        description: "Breaking change: split name into firstName and lastName",
        migratesFrom: ["1.1", "1.0"],
        breaking: true,
        migrationDescription: "Split name field into firstName and lastName"
      });

      // Test version annotations
      expect(UserV1.ast.annotations.version).toBe("1.0");
      expect(UserV1_1.ast.annotations.version).toBe("1.1");
      expect(UserV2.ast.annotations.version).toBe("2.0");
      expect(UserV2.ast.annotations.breaking).toBe(true);

      // Test schemas still validate correctly
      const v1Data = {
        id: "user-1",
        name: "John Doe",
        email: "john@example.com"
      };
      expect(() => Schema.decodeUnknownSync(UserV1)(v1Data)).not.toThrow();

      const v2Data = {
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+1 555 123 4567"
      };
      expect(() => Schema.decodeUnknownSync(UserV2)(v2Data)).not.toThrow();
    });

    it("should track schema compatibility", () => {
      // Base schema for blog posts
      const BlogPostV1 = Schema.Struct({
        id: Schema.String,
        title: Schema.String.pipe(nonEmptyString, maxLength(200)),
        content: Schema.String.pipe(nonEmptyString),
        authorId: Schema.String,
        createdAt: Schema.String
      }).annotations({
        version: "1.0",
        tableName: "blog_post",
        compatibility: {
          readFrom: ["1.0"],
          writeTo: ["1.0"]
        }
      });

      // V1.1 - Added tags (backward compatible)
      const BlogPostV1_1 = Schema.Struct({
        id: Schema.String,
        title: Schema.String.pipe(nonEmptyString, maxLength(200)),
        content: Schema.String.pipe(nonEmptyString),
        authorId: Schema.String,
        tags: Schema.optional(Schema.Array(Schema.String)),
        createdAt: Schema.String
      }).annotations({
        version: "1.1",
        tableName: "blog_post",
        compatibility: {
          readFrom: ["1.0", "1.1"],
          writeTo: ["1.1"],
          backwardCompatible: true
        },
        migration: {
          from: "1.0",
          addFields: ["tags"],
          defaultValues: { tags: [] }
        }
      });

      // V2.0 - Breaking change: author is now object reference
      const BlogPostV2 = Schema.Struct({
        id: Schema.String,
        title: Schema.String.pipe(nonEmptyString, maxLength(200)),
        content: Schema.String.pipe(nonEmptyString),
        author: Schema.Struct({
          id: Schema.String,
          name: Schema.String,
          email: Schema.String
        }),
        tags: Schema.optional(Schema.Array(Schema.String)),
        metadata: Schema.Struct({
          createdAt: Schema.String,
          updatedAt: Schema.String,
          publishedAt: Schema.optional(Schema.String)
        })
      }).annotations({
        version: "2.0",
        tableName: "blog_post",
        compatibility: {
          readFrom: ["2.0"],
          writeTo: ["2.0"],
          backwardCompatible: false
        },
        migration: {
          from: "1.1",
          breaking: true,
          requiresDataTransform: true,
          transformations: [
            "authorId -> author.id (requires user lookup)",
            "createdAt -> metadata.createdAt",
            "add metadata.updatedAt = createdAt"
          ]
        }
      });

      // Test compatibility metadata
      expect(BlogPostV1_1.ast.annotations.compatibility.backwardCompatible).toBe(true);
      expect(BlogPostV2.ast.annotations.compatibility.backwardCompatible).toBe(false);
      expect(BlogPostV2.ast.annotations.migration.breaking).toBe(true);

      // Test schemas validate
      const v1Data = {
        id: "post-1",
        title: "My First Post",
        content: "This is the content of my first blog post.",
        authorId: "user-123",
        createdAt: "2024-01-15T10:00:00Z"
      };
      expect(() => Schema.decodeUnknownSync(BlogPostV1)(v1Data)).not.toThrow();

      const v2Data = {
        id: "post-1",
        title: "My First Post",
        content: "This is the content of my first blog post.",
        author: {
          id: "user-123",
          name: "John Doe",
          email: "john@example.com"
        },
        tags: ["tech", "tutorial"],
        metadata: {
          createdAt: "2024-01-15T10:00:00Z",
          updatedAt: "2024-01-15T10:00:00Z"
        }
      };
      expect(() => Schema.decodeUnknownSync(BlogPostV2)(v2Data)).not.toThrow();
    });
  });

  describe("Migration Transformations", () => {
    it("should support data transformation functions", () => {
      // Original user schema
      const UserV1 = Schema.Struct({
        id: Schema.String,
        fullName: Schema.String,
        email: Schema.String,
        settings: Schema.String // JSON string
      }).annotations({
        version: "1.0"
      });

      // Migrated user schema
      const UserV2 = Schema.Struct({
        id: Schema.String,
        firstName: Schema.String,
        lastName: Schema.String,
        email: Schema.String,
        settings: Schema.Struct({
          theme: Schema.Literal("light", "dark", "auto"),
          notifications: Schema.Boolean,
          language: Schema.String
        })
      }).annotations({
        version: "2.0"
      });

      // Migration function
      const migrateUserV1toV2 = (v1Data: any) => {
        const nameParts = v1Data.fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        let settings;
        try {
          settings = JSON.parse(v1Data.settings);
        } catch {
          settings = {
            theme: "light" as const,
            notifications: true,
            language: "en"
          };
        }

        return {
          id: v1Data.id,
          firstName,
          lastName,
          email: v1Data.email,
          settings: {
            theme: settings.theme || "light" as const,
            notifications: settings.notifications ?? true,
            language: settings.language || "en"
          }
        };
      };

      // Test migration
      const v1User = {
        id: "user-123",
        fullName: "John Doe",
        email: "john@example.com",
        settings: JSON.stringify({
          theme: "dark",
          notifications: false,
          language: "en"
        })
      };

      const migratedUser = migrateUserV1toV2(v1User);
      
      // Validate original data against V1
      expect(() => Schema.decodeUnknownSync(UserV1)(v1User)).not.toThrow();
      
      // Validate migrated data against V2
      expect(() => Schema.decodeUnknownSync(UserV2)(migratedUser)).not.toThrow();
      
      // Check migration results
      expect(migratedUser.firstName).toBe("John");
      expect(migratedUser.lastName).toBe("Doe");
      expect(migratedUser.settings.theme).toBe("dark");
      expect(migratedUser.settings.notifications).toBe(false);
    });

    it("should support complex relationship migrations", () => {
      // V1: Simple foreign key reference
      const CommentV1 = Schema.Struct({
        id: Schema.String,
        postId: Schema.String,
        authorId: Schema.String,
        content: Schema.String,
        createdAt: Schema.String
      }).annotations({
        version: "1.0",
        relationships: {
          post: { type: "belongs_to", table: "blog_post", key: "postId" },
          author: { type: "belongs_to", table: "user", key: "authorId" }
        }
      });

      // V2: Embedded relationship data for denormalization
      const CommentV2 = Schema.Struct({
        id: Schema.String,
        post: Schema.Struct({
          id: Schema.String,
          title: Schema.String,
          slug: Schema.String
        }),
        author: Schema.Struct({
          id: Schema.String,
          username: Schema.String,
          displayName: Schema.String
        }),
        content: Schema.String,
        metadata: Schema.Struct({
          createdAt: Schema.String,
          editedAt: Schema.optional(Schema.String),
          likes: Schema.Number,
          replies: Schema.Number
        })
      }).annotations({
        version: "2.0",
        relationships: {
          post: { type: "embedded", denormalized: true },
          author: { type: "embedded", denormalized: true }
        },
        migration: {
          requiresLookup: true,
          lookupTables: ["blog_post", "user"],
          computedFields: ["metadata.likes", "metadata.replies"]
        }
      });

      // Simulate migration with lookups
      const migrateCommentV1toV2 = (
        v1Comment: any,
        postLookup: any,
        authorLookup: any,
        statsLookup: any
      ) => {
        return {
          id: v1Comment.id,
          post: {
            id: postLookup.id,
            title: postLookup.title,
            slug: postLookup.slug
          },
          author: {
            id: authorLookup.id,
            username: authorLookup.username,
            displayName: authorLookup.displayName
          },
          content: v1Comment.content,
          metadata: {
            createdAt: v1Comment.createdAt,
            likes: statsLookup.likes || 0,
            replies: statsLookup.replies || 0
          }
        };
      };

      // Test data
      const v1Comment = {
        id: "comment-1",
        postId: "post-123",
        authorId: "user-456",
        content: "Great post!",
        createdAt: "2024-01-15T10:30:00Z"
      };

      const postData = {
        id: "post-123",
        title: "Understanding Migrations",
        slug: "understanding-migrations"
      };

      const authorData = {
        id: "user-456",
        username: "johndoe",
        displayName: "John Doe"
      };

      const statsData = {
        likes: 5,
        replies: 2
      };

      const v2Comment = migrateCommentV1toV2(v1Comment, postData, authorData, statsData);

      // Validate schemas
      expect(() => Schema.decodeUnknownSync(CommentV1)(v1Comment)).not.toThrow();
      expect(() => Schema.decodeUnknownSync(CommentV2)(v2Comment)).not.toThrow();

      // Check migration results
      expect(v2Comment.post.title).toBe("Understanding Migrations");
      expect(v2Comment.author.displayName).toBe("John Doe");
      expect(v2Comment.metadata.likes).toBe(5);
    });
  });

  describe("SurrealDB Table Migrations", () => {
    it("should generate migration SQL for table changes", () => {
      // Original table definition
      const userTableV1 = SurrealTable.create("user")
        .withDescription("User accounts - Version 1.0")
        .addFields(
          SurrealField.id("user"),
          SurrealField.string("name").description("Full name").max(100),
          SurrealField.string("email").description("Email address").unique(),
          SurrealField.datetime("created_at").default("time::now()")
        );

      // Migrated table definition
      const userTableV2 = SurrealTable.create("user")
        .withDescription("User accounts - Version 2.0")
        .addFields(
          SurrealField.id("user"),
          SurrealField.string("first_name").description("First name").max(50),
          SurrealField.string("last_name").description("Last name").max(50),
          SurrealField.string("email").description("Email address").unique(),
          SurrealField.string("username").description("Unique username").unique(),
          SurrealField.object("profile").description("User profile data").optional(),
          SurrealField.datetime("created_at").default("time::now()"),
          SurrealField.datetime("updated_at").default("time::now()")
        );

      // Helper to generate migration SQL (simulated)
      const generateMigrationSQL = (fromTable: any, toTable: any) => {
        const migrations = [];
        
        // Add new fields
        migrations.push("-- Add new fields");
        migrations.push("DEFINE FIELD first_name ON user TYPE string;");
        migrations.push("DEFINE FIELD last_name ON user TYPE string;");
        migrations.push("DEFINE FIELD username ON user TYPE string UNIQUE;");
        migrations.push("DEFINE FIELD profile ON user TYPE object;");
        migrations.push("DEFINE FIELD updated_at ON user TYPE datetime DEFAULT time::now();");
        
        // Data migration
        migrations.push("-- Migrate existing data");
        migrations.push("UPDATE user SET first_name = string::split(name, ' ')[0];");
        migrations.push("UPDATE user SET last_name = array::join(array::slice(string::split(name, ' '), 1), ' ');");
        migrations.push("UPDATE user SET username = string::lowercase(string::replace(name, ' ', '_'));");
        migrations.push("UPDATE user SET updated_at = created_at;");
        
        // Remove old fields
        migrations.push("-- Remove deprecated fields");
        migrations.push("REMOVE FIELD name ON user;");
        
        return migrations.join("\n");
      };

      const migrationSQL = generateMigrationSQL(userTableV1, userTableV2);
      
      // Test SQL generation
      expect(migrationSQL).toContain("DEFINE FIELD first_name");
      expect(migrationSQL).toContain("DEFINE FIELD last_name");
      expect(migrationSQL).toContain("DEFINE FIELD username");
      expect(migrationSQL).toContain("UPDATE user SET first_name");
      expect(migrationSQL).toContain("REMOVE FIELD name");

      // Test table structures
      expect(userTableV1.fields).toHaveLength(4);
      expect(userTableV2.fields).toHaveLength(8);
      
      const v1NameField = userTableV1.getField("name");
      expect(v1NameField?.name).toBe("name");
      
      const v2FirstNameField = userTableV2.getField("first_name");
      expect(v2FirstNameField?.name).toBe("first_name");
    });

    it("should support rollback migrations", () => {
      // Migration with rollback support
      const createMigrationWithRollback = (name: string, up: string[], down: string[]) => {
        return {
          name,
          timestamp: new Date().toISOString(),
          up,
          down,
          applied: false
        };
      };

      const addProfileFieldMigration = createMigrationWithRollback(
        "add_user_profile_field",
        [
          "DEFINE FIELD profile ON user TYPE object;",
          "DEFINE FIELD bio ON user TYPE string;",
          "UPDATE user SET profile = { bio: '' } WHERE profile IS NONE;"
        ],
        [
          "REMOVE FIELD bio ON user;",
          "REMOVE FIELD profile ON user;"
        ]
      );

      const splitNameFieldMigration = createMigrationWithRollback(
        "split_user_name_field",
        [
          "DEFINE FIELD first_name ON user TYPE string;",
          "DEFINE FIELD last_name ON user TYPE string;",
          "UPDATE user SET first_name = string::split(name, ' ')[0];",
          "UPDATE user SET last_name = array::join(array::slice(string::split(name, ' '), 1), ' ');",
          "REMOVE FIELD name ON user;"
        ],
        [
          "DEFINE FIELD name ON user TYPE string;",
          "UPDATE user SET name = string::concat(first_name, ' ', last_name);",
          "REMOVE FIELD first_name ON user;",
          "REMOVE FIELD last_name ON user;"
        ]
      );

      // Test migration structure
      expect(addProfileFieldMigration.up).toHaveLength(3);
      expect(addProfileFieldMigration.down).toHaveLength(2);
      expect(splitNameFieldMigration.up.some(sql => sql.includes("DEFINE FIELD first_name"))).toBe(true);
      expect(splitNameFieldMigration.down.some(sql => sql.includes("DEFINE FIELD name"))).toBe(true);

      // Test rollback SQL generation
      const rollbackSQL = splitNameFieldMigration.down.join("\n");
      expect(rollbackSQL).toContain("DEFINE FIELD name");
      expect(rollbackSQL).toContain("string::concat(first_name, ' ', last_name)");
      expect(rollbackSQL).toContain("REMOVE FIELD first_name");
    });
  });

  describe("Schema Registry and Versioning", () => {
    it("should manage schema registry with versions", () => {
      // Schema registry to track all versions
      class SchemaRegistry {
        private schemas = new Map<string, Map<string, any>>();

        register(tableName: string, version: string, schema: any) {
          if (!this.schemas.has(tableName)) {
            this.schemas.set(tableName, new Map());
          }
          this.schemas.get(tableName)!.set(version, schema);
        }

        getSchema(tableName: string, version: string) {
          return this.schemas.get(tableName)?.get(version);
        }

        getLatestSchema(tableName: string) {
          const tableSchemas = this.schemas.get(tableName);
          if (!tableSchemas) return null;
          
          const versions = Array.from(tableSchemas.keys()).sort();
          const latestVersion = versions[versions.length - 1];
          return tableSchemas.get(latestVersion);
        }

        getAllVersions(tableName: string) {
          const tableSchemas = this.schemas.get(tableName);
          return tableSchemas ? Array.from(tableSchemas.keys()).sort() : [];
        }

        canMigrate(tableName: string, fromVersion: string, toVersion: string) {
          const fromSchema = this.getSchema(tableName, fromVersion);
          const toSchema = this.getSchema(tableName, toVersion);
          
          if (!fromSchema || !toSchema) return false;
          
          const migratesFrom = toSchema.ast.annotations?.migratesFrom;
          return migratesFrom?.includes(fromVersion) ?? false;
        }
      }

      const registry = new SchemaRegistry();

      // Register user schemas
      const UserV1 = Schema.Struct({
        id: Schema.String,
        name: Schema.String,
        email: Schema.String
      }).annotations({ version: "1.0" });

      const UserV2 = Schema.Struct({
        id: Schema.String,
        firstName: Schema.String,
        lastName: Schema.String,
        email: Schema.String
      }).annotations({ 
        version: "2.0",
        migratesFrom: ["1.0"] 
      });

      const UserV2_1 = Schema.Struct({
        id: Schema.String,
        firstName: Schema.String,
        lastName: Schema.String,
        email: Schema.String,
        phone: Schema.optional(Schema.String)
      }).annotations({ 
        version: "2.1",
        migratesFrom: ["2.0"] 
      });

      registry.register("user", "1.0", UserV1);
      registry.register("user", "2.0", UserV2);
      registry.register("user", "2.1", UserV2_1);

      // Test registry operations
      expect(registry.getAllVersions("user")).toEqual(["1.0", "2.0", "2.1"]);
      
      const latestUser = registry.getLatestSchema("user");
      expect(latestUser.ast.annotations.version).toBe("2.1");

      expect(registry.canMigrate("user", "1.0", "2.0")).toBe(true);
      expect(registry.canMigrate("user", "2.0", "2.1")).toBe(true);
      expect(registry.canMigrate("user", "1.0", "2.1")).toBe(false); // No direct path

      const userV1Schema = registry.getSchema("user", "1.0");
      expect(userV1Schema.ast.annotations.version).toBe("1.0");
    });

    it("should support environment-specific schemas", () => {
      // Environment-aware schema registry
      class EnvironmentSchemaRegistry {
        private environments = new Map<string, Map<string, any>>();

        register(environment: string, tableName: string, schema: any) {
          if (!this.environments.has(environment)) {
            this.environments.set(environment, new Map());
          }
          this.environments.get(environment)!.set(tableName, schema);
        }

        getSchema(environment: string, tableName: string) {
          return this.environments.get(environment)?.get(tableName);
        }

        getEnvironments() {
          return Array.from(this.environments.keys());
        }

        compareSchemas(table: string, env1: string, env2: string) {
          const schema1 = this.getSchema(env1, table);
          const schema2 = this.getSchema(env2, table);
          
          if (!schema1 || !schema2) return null;
          
          return {
            version1: schema1.ast.annotations?.version,
            version2: schema2.ast.annotations?.version,
            compatible: schema1.ast.annotations?.version === schema2.ast.annotations?.version
          };
        }
      }

      const envRegistry = new EnvironmentSchemaRegistry();

      // Production schema (stable)
      const UserProd = Schema.Struct({
        id: Schema.String,
        firstName: Schema.String,
        lastName: Schema.String,
        email: Schema.String
      }).annotations({ 
        version: "2.0",
        environment: "production",
        stable: true
      });

      // Staging schema (with new features)
      const UserStaging = Schema.Struct({
        id: Schema.String,
        firstName: Schema.String,
        lastName: Schema.String,
        email: Schema.String,
        phone: Schema.optional(Schema.String),
        preferences: Schema.optional(Schema.Struct({
          theme: Schema.String,
          notifications: Schema.Boolean
        }))
      }).annotations({ 
        version: "2.1",
        environment: "staging",
        experimental: true
      });

      // Development schema (bleeding edge)
      const UserDev = Schema.Struct({
        id: Schema.String,
        firstName: Schema.String,
        lastName: Schema.String,
        email: Schema.String,
        phone: Schema.optional(Schema.String),
        preferences: Schema.optional(Schema.Struct({
          theme: Schema.String,
          notifications: Schema.Boolean,
          language: Schema.String
        })),
        socialProfiles: Schema.optional(Schema.Array(Schema.Struct({
          platform: Schema.String,
          username: Schema.String
        })))
      }).annotations({ 
        version: "3.0-dev",
        environment: "development",
        experimental: true
      });

      envRegistry.register("production", "user", UserProd);
      envRegistry.register("staging", "user", UserStaging);
      envRegistry.register("development", "user", UserDev);

      // Test environment registry
      expect(envRegistry.getEnvironments()).toEqual(
        expect.arrayContaining(["production", "staging", "development"])
      );

      const comparison = envRegistry.compareSchemas("user", "production", "staging");
      expect(comparison?.version1).toBe("2.0");
      expect(comparison?.version2).toBe("2.1");
      expect(comparison?.compatible).toBe(false);

      const prodSchema = envRegistry.getSchema("production", "user");
      expect(prodSchema.ast.annotations.stable).toBe(true);

      const devSchema = envRegistry.getSchema("development", "user");
      expect(devSchema.ast.annotations.version).toBe("3.0-dev");
    });
  });
});