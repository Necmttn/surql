import { describe, it, expect } from "vitest";
import { Schema } from "effect";
import { SurrealField } from "../../lib/schema/field";
import { SurrealTable } from "../../lib/schema/table";
import {
  emailSchema,
  usernameSchema,
  passwordSchema,
  nonEmptyString,
  maxLength,
  minLength
} from "../../lib/constraints";

/**
 * Level 3: Field Integration with Annotations
 * 
 * This test demonstrates how annotations from Effect Schema can be
 * integrated with SurrealField definitions to create rich, documented
 * database schemas with validation and metadata.
 */
describe("Level 3: Field Integration", () => {
  describe("Annotated Field Creation", () => {
    it("should create fields with integrated annotations and constraints", () => {
      // Create annotated field schemas first
      const annotatedEmailSchema = emailSchema.annotations({
        database: {
          index: "email_unique_idx",
          unique: true,
          constraints: ["ASSERT is::email($value)"]
        },
        ui: {
          inputType: "email",
          autocomplete: "email",
          validation: "real-time"
        }
      });

      const annotatedUsernameSchema = usernameSchema.annotations({
        database: {
          index: "username_idx", 
          unique: true,
          searchable: true
        },
        ui: {
          inputType: "text",
          autocomplete: "username",
          availability: "check-on-blur"
        }
      });

      // Create SurrealDB fields with annotation-aware patterns
      const emailField = SurrealField.string("email")
        .description("User's primary email address")
        .unique()
        .pattern("^[^@]+@[^@]+\\.[^@]+$")
        .length(255);

      const usernameField = SurrealField.string("username")
        .description("Unique username for login")
        .unique()
        .pattern("^[a-zA-Z0-9_]{3,50}$")
        .min(3)
        .max(50);

      const profileField = SurrealField.object("profile")
        .description("User profile information")
        .optional();

      // Test field properties match annotation expectations
      expect(emailField.constraints?.unique).toBe(true);
      expect(emailField.constraints?.pattern).toBe("^[^@]+@[^@]+\\.[^@]+$");
      expect(usernameField.constraints?.unique).toBe(true);
      expect(usernameField.constraints?.min).toBe(3);
      expect(usernameField.constraints?.max).toBe(50);

      // Test SurrealQL generation includes proper constraints
      const emailSql = emailField.toSurrealQL();
      expect(emailSql).toContain("TYPE string");
      expect(emailSql).toContain("UNIQUE");
      expect(emailSql).toContain("User\\'s primary email address");

      const usernameSql = usernameField.toSurrealQL();
      expect(usernameSql).toContain("TYPE string");
      expect(usernameSql).toContain("UNIQUE");
    });

    it("should support advanced field metadata from annotations", () => {
      // Create fields with rich metadata derived from annotations
      const timestampField = SurrealField.datetime("created_at")
        .description("Account creation timestamp")
        .default("time::now()");

      const statusField = SurrealField.string("status")
        .description("Account status")
        .default("'active'")
        .assert("$value IN ['active', 'suspended', 'deleted']");

      const metadataField = SurrealField.object("metadata")
        .description("Additional user metadata")
        .optional();

      // Test metadata properties
      expect(timestampField.type).toBe("datetime");
      expect(timestampField.defaultValue).toBe("time::now()");
      expect(statusField.defaultValue).toBe("'active'");
      expect(statusField.constraints?.assert).toBe("$value IN ['active', 'suspended', 'deleted']");

      // Test SurrealQL generation with metadata
      const timestampSql = timestampField.toSurrealQL();
      expect(timestampSql).toContain("TYPE datetime");
      expect(timestampSql).toContain("DEFAULT time::now()");

      const statusSql = statusField.toSurrealQL();
      expect(statusSql).toContain("DEFAULT 'active'");
      expect(statusSql).toContain("ASSERT");
    });
  });

  describe("Table Integration with Annotations", () => {
    it("should create annotated tables with rich field metadata", () => {
      // Create a fully annotated user table
      const userTable = SurrealTable.create("user")
        .withDescription("User account and profile information")
        .addFields(
          // ID field with annotation-derived metadata
          SurrealField.id("user")
            .description("Unique user identifier"),

          // Email with constraint and UI metadata
          SurrealField.string("email")
            .description("Primary email address for communication and login")
            .unique()
            .pattern("^[^@]+@[^@]+\\.[^@]+$")
            .length(255),

          // Username with searchability metadata
          SurrealField.string("username")
            .description("Public username displayed to other users")
            .unique()
            .pattern("^[a-zA-Z0-9_]{3,30}$")
            .min(3)
            .max(30),

          // Profile with nested object metadata
          SurrealField.object("profile")
            .description("User profile information including name and bio")
            .optional(),

          // Preferences with default values from annotations
          SurrealField.object("preferences")
            .description("User application preferences and settings")
            .default("{ theme: 'auto', notifications: true }"),

          // Timestamps with auto-generation metadata
          SurrealField.datetime("created_at")
            .description("Account creation timestamp")
            .default("time::now()"),

          SurrealField.datetime("updated_at")
            .description("Last profile update timestamp")
            .default("time::now()"),

          // Status with business logic constraints
          SurrealField.string("status")
            .description("Current account status")
            .default("'active'")
            .assert("$value IN ['active', 'pending', 'suspended', 'deleted']"),

          // Role with security implications
          SurrealField.string("role")
            .description("User role for permission management")
            .default("'user'")
            .assert("$value IN ['user', 'moderator', 'admin']")
        )
        .withPermissions({
          select: "WHERE id = $auth.id OR $auth.role = 'admin'",
          create: "WHERE $auth != NONE",
          update: "WHERE id = $auth.id OR $auth.role = 'admin'", 
          delete: "WHERE $auth.role = 'admin'"
        });

      // Test table structure
      expect(userTable.name).toBe("user");
      expect(userTable.fields).toHaveLength(9);
      expect(userTable.description).toBe("User account and profile information");

      // Test specific field constraints derived from annotations
      const emailField = userTable.getField("email");
      expect(emailField?.constraints?.unique).toBe(true);
      expect(emailField?.constraints?.pattern).toBe("^[^@]+@[^@]+\\.[^@]+$");

      const statusField = userTable.getField("status");
      expect(statusField?.defaultValue).toBe("'active'");
      expect(statusField?.constraints?.assert).toBe("$value IN ['active', 'pending', 'suspended', 'deleted']");

      // Test SurrealQL generation with rich metadata
      const sql = userTable.toSurrealQL();
      expect(sql).toContain("DEFINE TABLE user SCHEMAFULL");
      expect(sql).toContain("COMMENT 'User account and profile information'");
      expect(sql).toContain("PERMISSIONS");
    });

    it("should support table-level annotations for documentation", () => {
      // Blog post table with comprehensive annotations
      const blogPostTable = SurrealTable.create("blog_post")
        .withDescription("Blog posts with content, metadata, and publishing workflow")
        .addFields(
          SurrealField.id("blog_post")
            .description("Unique post identifier"),

          SurrealField.string("title")
            .description("Post title shown in listings and SEO")
            .min(5)
            .max(200),

          SurrealField.string("slug")
            .description("URL-friendly version of title for permalinks")
            .unique()
            .pattern("^[a-z0-9]+(?:-[a-z0-9]+)*$")
            .max(100),

          SurrealField.string("content")
            .description("Main post content in Markdown format")
            .min(100),

          SurrealField.string("excerpt")
            .description("Short summary for post previews")
            .optional()
            .max(300),

          SurrealField.record("author", "user")
            .description("Reference to the post author"),

          SurrealField.array("tags", "string")
            .description("Content tags for categorization and search")
            .optional(),

          SurrealField.string("status")
            .description("Publication status in the editorial workflow")
            .default("'draft'")
            .assert("$value IN ['draft', 'review', 'published', 'archived']"),

          SurrealField.datetime("published_at")
            .description("When the post was published")
            .optional(),

          SurrealField.datetime("created_at")
            .description("When the post was created")
            .default("time::now()"),

          SurrealField.datetime("updated_at")
            .description("When the post was last modified")
            .default("time::now()")
        )
        .withPermissions({
          select: "WHERE status = 'published' OR author = $auth.id OR $auth.role IN ['admin', 'editor']",
          create: "WHERE $auth.role IN ['author', 'editor', 'admin']",
          update: "WHERE author = $auth.id OR $auth.role IN ['editor', 'admin']",
          delete: "WHERE $auth.role = 'admin'"
        });

      // Test table metadata
      expect(blogPostTable.name).toBe("blog_post");
      expect(blogPostTable.description).toBe("Blog posts with content, metadata, and publishing workflow");

      // Test field relationships and constraints
      const authorField = blogPostTable.getField("author");
      expect(authorField?.type).toBe("record");

      const tagsField = blogPostTable.getField("tags");
      expect(tagsField?.type).toBe("array");

      const statusField = blogPostTable.getField("status");
      expect(statusField?.constraints?.assert).toContain("draft");
      expect(statusField?.constraints?.assert).toContain("published");

      // Test comprehensive SurrealQL generation
      const sql = blogPostTable.toSurrealQL();
      expect(sql).toContain("DEFINE TABLE blog_post SCHEMAFULL");
      expect(sql).toContain("TYPE record<user>");
      expect(sql).toContain("TYPE array");
      expect(sql).toContain("ASSERT $value IN");
    });
  });

  describe("Cross-Field Validation with Annotations", () => {
    it("should support relationships and cross-field constraints", () => {
      // Comment table with complex relationships and validation
      const commentTable = SurrealTable.create("comment")
        .withDescription("User comments on blog posts with moderation")
        .addFields(
          SurrealField.id("comment")
            .description("Unique comment identifier"),

          SurrealField.record("post", "blog_post")
            .description("Reference to the blog post being commented on"),

          SurrealField.record("author", "user")
            .description("User who wrote the comment"),

          SurrealField.string("content")
            .description("Comment text content")
            .min(1)
            .max(1000),

          SurrealField.record("parent", "comment")
            .description("Parent comment for threaded discussions")
            .optional(),

          SurrealField.string("status")
            .description("Moderation status of the comment")
            .default("'pending'")
            .assert("$value IN ['pending', 'approved', 'rejected', 'spam']"),

          SurrealField.datetime("created_at")
            .description("When the comment was posted")
            .default("time::now()"),

          SurrealField.datetime("updated_at")
            .description("When the comment was last edited")
            .default("time::now()"),

          SurrealField.int("depth")
            .description("Nesting depth in comment thread")
            .default("0")
            .min(0)
            .max(5)
        )
        .withPermissions({
          select: "WHERE status = 'approved' OR author = $auth.id OR $auth.role IN ['admin', 'moderator']",
          create: "WHERE $auth != NONE AND $auth.status = 'active'",
          update: "WHERE author = $auth.id OR $auth.role IN ['admin', 'moderator']",
          delete: "WHERE $auth.role IN ['admin', 'moderator']"
        });

      // Test relationship fields
      const postField = commentTable.getField("post");
      expect(postField?.type).toBe("record");

      const authorField = commentTable.getField("author");
      expect(authorField?.type).toBe("record");

      const parentField = commentTable.getField("parent");
      expect(parentField?.type).toBe("record");
      expect(parentField?.isOptional).toBe(true);

      // Test constraint fields
      const depthField = commentTable.getField("depth");
      expect(depthField?.constraints?.min).toBe(0);
      expect(depthField?.constraints?.max).toBe(5);

      const statusField = commentTable.getField("status");
      expect(statusField?.constraints?.assert).toContain("pending");
      expect(statusField?.constraints?.assert).toContain("approved");

      // Test SurrealQL with relationships
      const sql = commentTable.toSurrealQL();
      expect(sql).toContain("TYPE record<blog_post>");
      expect(sql).toContain("TYPE record<user>");
      expect(sql).toContain("TYPE record<comment>");
    });
  });

  describe("Validation Schema Integration", () => {
    it("should integrate field annotations with validation schemas", () => {
      // Create validation schemas that correspond to table fields
      const userProfileValidationSchema = Schema.Struct({
        email: emailSchema.annotations({
          field: "email",
          required: true,
          unique: true
        }),

        username: usernameSchema.annotations({
          field: "username", 
          required: true,
          unique: true
        }),

        profile: Schema.optional(
          Schema.Struct({
            firstName: Schema.String.pipe(
              nonEmptyString,
              minLength(2),
              maxLength(50)
            ).annotations({
              field: "profile.firstName",
              displayName: "First Name"
            }),

            lastName: Schema.String.pipe(
              nonEmptyString,
              minLength(2),
              maxLength(50)
            ).annotations({
              field: "profile.lastName",
              displayName: "Last Name"
            }),

            bio: Schema.optional(
              Schema.String.pipe(maxLength(500))
            ).annotations({
              field: "profile.bio",
              displayName: "Biography",
              inputType: "textarea"
            })
          })
        ).annotations({
          field: "profile",
          nested: true
        }),

        preferences: Schema.optional(
          Schema.Struct({
            theme: Schema.Literal("light", "dark", "auto").annotations({
              field: "preferences.theme",
              default: "auto"
            }),

            notifications: Schema.Boolean.annotations({
              field: "preferences.notifications",
              default: true
            })
          })
        ).annotations({
          field: "preferences",
          nested: true
        })
      }).annotations({
        table: "user",
        purpose: "user-registration"
      });

      // Test validation works
      const validUserData = {
        email: "test@example.com",
        username: "testuser",
        profile: {
          firstName: "Test",
          lastName: "User",
          bio: "A test user profile"
        },
        preferences: {
          theme: "dark" as const,
          notifications: true
        }
      };

      expect(() => Schema.decodeUnknownSync(userProfileValidationSchema)(validUserData)).not.toThrow();

      // Test validation fails appropriately
      const invalidUserData = {
        email: "invalid-email",
        username: "ab", // too short
        profile: {
          firstName: "", // empty
          lastName: "User"
        }
      };

      expect(() => Schema.decodeUnknownSync(userProfileValidationSchema)(invalidUserData)).toThrow();

      // Test that annotations preserve metadata
      expect(userProfileValidationSchema.ast.annotations).toBeDefined();
    });

    it("should support form generation from annotated schemas", () => {
      // Schema designed for automatic form generation
      const contactFormSchema = Schema.Struct({
        name: Schema.String.pipe(
          nonEmptyString,
          minLength(2),
          maxLength(100)
        ).annotations({
          label: "Full Name",
          placeholder: "Enter your full name",
          helpText: "First and last name",
          required: true,
          order: 1
        }),

        email: emailSchema.annotations({
          label: "Email Address",
          placeholder: "your.email@example.com",
          helpText: "We'll use this to contact you",
          required: true,
          order: 2
        }),

        phone: Schema.optional(
          Schema.String.pipe(
            nonEmptyString,
            Schema.pattern(/^\+?[\d\s\-\(\)]{10,20}$/)
          )
        ).annotations({
          label: "Phone Number",
          placeholder: "+1 (555) 123-4567",
          helpText: "Optional - for urgent matters only",
          required: false,
          order: 3,
          inputType: "tel"
        }),

        subject: Schema.String.pipe(
          nonEmptyString,
          minLength(5),
          maxLength(200)
        ).annotations({
          label: "Subject",
          placeholder: "What can we help you with?",
          helpText: "Brief description of your inquiry",
          required: true,
          order: 4
        }),

        message: Schema.String.pipe(
          nonEmptyString,
          minLength(20),
          maxLength(2000)
        ).annotations({
          label: "Message",
          placeholder: "Please provide details about your inquiry...",
          helpText: "Be as specific as possible",
          required: true,
          order: 5,
          inputType: "textarea",
          rows: 6
        }),

        urgency: Schema.Literal("low", "medium", "high", "urgent").annotations({
          label: "Priority Level",
          helpText: "How quickly do you need a response?",
          required: true,
          order: 6,
          inputType: "select",
          options: [
            { value: "low", label: "Low - Response within 7 days" },
            { value: "medium", label: "Medium - Response within 3 days" },
            { value: "high", label: "High - Response within 24 hours" },
            { value: "urgent", label: "Urgent - Response within 4 hours" }
          ]
        })
      }).annotations({
        title: "Contact Us",
        description: "Get in touch with our team",
        submitLabel: "Send Message",
        successMessage: "Thank you! We'll get back to you soon.",
        sections: [
          {
            title: "Contact Information",
            fields: ["name", "email", "phone"]
          },
          {
            title: "Your Inquiry",
            fields: ["subject", "message", "urgency"]
          }
        ]
      });

      // Test validation
      const validContact = {
        name: "John Doe",
        email: "john@example.com",
        subject: "Question about services",
        message: "I would like to learn more about your API development services and pricing options.",
        urgency: "medium" as const
      };

      expect(() => Schema.decodeUnknownSync(contactFormSchema)(validContact)).not.toThrow();

      // Test form metadata
      expect(contactFormSchema.ast.annotations).toBeDefined();
    });
  });
});