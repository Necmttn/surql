import { describe, it, expect } from "vitest";
import { Schema, ParseResult } from "effect";
import { SurrealField } from "../../lib/schema/field";
import { SurrealTable } from "../../lib/schema/table";
import {
  emailSchema,
  usernameSchema,
  passwordSchema,
  nonEmptyString,
  maxLength,
  minLength,
  numberRange,
  customStringConstraint,
  enumConstraint
} from "../../lib/constraints";

/**
 * Level 2: Advanced Constraint Composition with Schema.pipe
 * 
 * This test demonstrates sophisticated constraint composition patterns,
 * showing how to build complex validation schemas by combining simpler
 * constraints using Effect's Schema.pipe.
 */
describe("Level 2: Advanced Constraint Composition", () => {
  describe("Multi-layered Constraint Composition", () => {
    it("should compose layered string constraints", () => {
      // Build up a complex product SKU schema layer by layer
      const baseProductCode = Schema.String.pipe(nonEmptyString);
      
      const formattedProductCode = baseProductCode.pipe(
        Schema.pattern(/^[A-Z]{2,4}-[0-9A-Z]{4,8}$/, {
          message: () => "Product code must follow format: AB-1234 or ABCD-12345678"
        })
      );
      
      const lengthValidatedProductCode = formattedProductCode.pipe(
        minLength(7),   // AB-1234 = 7 chars minimum
        maxLength(13)   // ABCD-12345678 = 13 chars maximum
      );

      const productCodeSchema = lengthValidatedProductCode.annotations({
        identifier: "ProductCode",
        title: "Product SKU",
        description: "Unique product identifier following company format",
        examples: ["AB-1234", "PROD-5678", "ABCD-12345678"],
        documentation: "Product codes identify inventory items and must be unique"
      });

      // Test valid product codes
      expect(() => Schema.decodeUnknownSync(productCodeSchema)("AB-1234")).not.toThrow();
      expect(() => Schema.decodeUnknownSync(productCodeSchema)("PROD-5678")).not.toThrow();
      expect(() => Schema.decodeUnknownSync(productCodeSchema)("ABCD-12345678")).not.toThrow();

      // Test invalid product codes
      expect(() => Schema.decodeUnknownSync(productCodeSchema)("")).toThrow();
      expect(() => Schema.decodeUnknownSync(productCodeSchema)("invalid")).toThrow();
      expect(() => Schema.decodeUnknownSync(productCodeSchema)("ab-1234")).toThrow(); // lowercase
      expect(() => Schema.decodeUnknownSync(productCodeSchema)("A-123")).toThrow(); // too short
    });

    it("should compose conditional constraints", () => {
      // Complex user validation that depends on user type
      const baseUserSchema = Schema.Struct({
        username: usernameSchema,
        email: emailSchema,
        userType: enumConstraint("standard", "premium", "admin")
      });

      // Enhanced schema with conditional validation
      const enhancedUserSchema = baseUserSchema.pipe(
        Schema.filter((user) => {
          // Admin users must have specific email domains
          if (user.userType === "admin") {
            return /@(company\.com|admin\.org)$/.test(user.email);
          }
          return true;
        }, {
          message: () => "Admin users must have company or admin email domain"
        }),
        
        Schema.filter((user) => {
          // Premium users must have longer usernames
          if (user.userType === "premium") {
            return user.username.length >= 5;
          }
          return true;
        }, {
          message: () => "Premium users must have usernames of at least 5 characters"
        })
      );

      // Test valid users
      const standardUser = {
        username: "john",
        email: "john@gmail.com",
        userType: "standard" as const
      };
      expect(() => Schema.decodeUnknownSync(enhancedUserSchema)(standardUser)).not.toThrow();

      const adminUser = {
        username: "admin",
        email: "admin@company.com",
        userType: "admin" as const
      };
      expect(() => Schema.decodeUnknownSync(enhancedUserSchema)(adminUser)).not.toThrow();

      // Test invalid users
      const invalidAdmin = {
        username: "admin",
        email: "admin@gmail.com", // Wrong domain for admin
        userType: "admin" as const
      };
      expect(() => Schema.decodeUnknownSync(enhancedUserSchema)(invalidAdmin)).toThrow();

      const invalidPremium = {
        username: "joe", // Too short for premium
        email: "joe@example.com",
        userType: "premium" as const
      };
      expect(() => Schema.decodeUnknownSync(enhancedUserSchema)(invalidPremium)).toThrow();
    });

    it("should compose cross-field validation", () => {
      // Password confirmation schema
      const passwordConfirmationSchema = Schema.Struct({
        password: passwordSchema,
        confirmPassword: Schema.String.pipe(nonEmptyString)
      }).pipe(
        Schema.filter(
          (data) => data.password === data.confirmPassword,
          {
            message: () => "Password and confirmation must match"
          }
        )
      );

      // Date range validation
      const dateRangeSchema = Schema.Struct({
        startDate: Schema.String.pipe(
          Schema.pattern(/^\d{4}-\d{2}-\d{2}$/, {
            message: () => "Date must be in YYYY-MM-DD format"
          })
        ),
        endDate: Schema.String.pipe(
          Schema.pattern(/^\d{4}-\d{2}-\d{2}$/, {
            message: () => "Date must be in YYYY-MM-DD format"
          })
        )
      }).pipe(
        Schema.filter(
          (data) => new Date(data.startDate) <= new Date(data.endDate),
          {
            message: () => "End date must be after start date"
          }
        )
      );

      // Test valid password confirmation
      const validPasswords = {
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!"
      };
      expect(() => Schema.decodeUnknownSync(passwordConfirmationSchema)(validPasswords)).not.toThrow();

      // Test invalid password confirmation
      const invalidPasswords = {
        password: "SecurePass123!",
        confirmPassword: "DifferentPass123!"
      };
      expect(() => Schema.decodeUnknownSync(passwordConfirmationSchema)(invalidPasswords)).toThrow();

      // Test valid date range
      const validDates = {
        startDate: "2024-01-01",
        endDate: "2024-12-31"
      };
      expect(() => Schema.decodeUnknownSync(dateRangeSchema)(validDates)).not.toThrow();

      // Test invalid date range
      const invalidDates = {
        startDate: "2024-12-31",
        endDate: "2024-01-01"
      };
      expect(() => Schema.decodeUnknownSync(dateRangeSchema)(invalidDates)).toThrow();
    });
  });

  describe("Schema Transformation Pipelines", () => {
    it("should create transformation pipelines", () => {
      // Pipeline that cleans and validates phone numbers
      const phoneNumberPipeline = Schema.String
        .pipe(
          // First, clean the input
          Schema.transformOrFail(
            Schema.String,
            {
              strict: false,
              decode: (input, _, ast) => 
                ParseResult.succeed(input.replace(/[\s\-\(\)]/g, "")), // Remove formatting
              encode: (input, _, ast) => ParseResult.succeed(input)
            }
          ),
          // Then validate the cleaned result  
          Schema.pattern(/^\+?[\d]{10,15}$/, {
            message: () => "Phone number must be 10-15 digits, optionally starting with +"
          }),
          // Finally, ensure reasonable length
          minLength(10),
          maxLength(16)
        )
        .annotations({
          identifier: "PhoneNumber",
          title: "Phone Number",
          description: "International phone number with automatic formatting cleanup",
          examples: ["+1234567890", "1234567890"],
          documentation: "Phone numbers are cleaned of formatting and validated for length"
        });

      // Test phone number pipeline
      expect(Schema.decodeUnknownSync(phoneNumberPipeline)("(555) 123-4567")).toBe("5551234567");
      expect(Schema.decodeUnknownSync(phoneNumberPipeline)("+1 555 123 4567")).toBe("+15551234567");
      expect(Schema.decodeUnknownSync(phoneNumberPipeline)("555-123-4567")).toBe("5551234567");

      // Invalid phone numbers should still fail
      expect(() => Schema.decodeUnknownSync(phoneNumberPipeline)("123")).toThrow(); // too short
      expect(() => Schema.decodeUnknownSync(phoneNumberPipeline)("abc-def-ghij")).toThrow(); // not numeric
    });

    it("should create normalization pipelines", () => {
      // Email normalization pipeline
      const normalizedEmailSchema = Schema.String
        .pipe(
          // Normalize to lowercase
          Schema.transformOrFail(
            Schema.String,
            {
              strict: false,
              decode: (input, _, ast) => 
                ParseResult.succeed(input.toLowerCase().trim()),
              encode: (input, _, ast) => ParseResult.succeed(input)
            }
          ),
          // Then apply email validation
          nonEmptyString,
          Schema.pattern(/^[^@]+@[^@]+\.[^@]+$/, {
            message: () => "Must be a valid email address"
          }),
          maxLength(255)
        );

      // Test email normalization
      expect(Schema.decodeUnknownSync(normalizedEmailSchema)(" USER@EXAMPLE.COM ")).toBe("user@example.com");
      expect(Schema.decodeUnknownSync(normalizedEmailSchema)("Test.User@Gmail.Com")).toBe("test.user@gmail.com");

      // Slug normalization pipeline
      const normalizedSlugSchema = Schema.String
        .pipe(
          // Convert to slug format
          Schema.transformOrFail(
            Schema.String,
            {
              strict: false,
              decode: (input, _, ast) => 
                ParseResult.succeed(input
                  .toLowerCase()
                  .trim()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-+|-+$/g, "")), // Remove leading/trailing hyphens
              encode: (input, _, ast) => ParseResult.succeed(input)
            }
          ),
          // Validate slug format
          nonEmptyString,
          Schema.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
            message: () => "Invalid slug format"
          }),
          maxLength(100)
        );

      // Test slug normalization
      expect(Schema.decodeUnknownSync(normalizedSlugSchema)("My Blog Post Title!")).toBe("my-blog-post-title");
      expect(Schema.decodeUnknownSync(normalizedSlugSchema)("  Product Name (Special)  ")).toBe("product-name-special");
      expect(Schema.decodeUnknownSync(normalizedSlugSchema)("Hello, World!")).toBe("hello-world");
    });
  });

  describe("Schema Composition with SurrealField Integration", () => {
    it("should create tables with composed field constraints", () => {
      // Create a user table with advanced field compositions
      const userTable = SurrealTable.create("user")
        .withDescription("User accounts with advanced validation")
        .addFields(
          SurrealField.id("user"),
          
          // Email with composition-based constraints
          SurrealField.string("email")
            .description("Primary email address")
            .unique()
            .pattern("^[^@]+@[^@]+\\.[^@]+$")
            .length(255),
          
          // Username with advanced pattern
          SurrealField.string("username")
            .description("Unique alphanumeric username")
            .unique()
            .pattern("^[a-zA-Z0-9_]{3,50}$")
            .min(3)
            .max(50),
          
          // Password hash field
          SurrealField.string("password_hash")
            .description("Bcrypt hashed password")
            .length(60), // Bcrypt hash length
          
          // Phone with complex validation
          SurrealField.string("phone")
            .description("International phone number")
            .optional()
            .pattern("^\\+?[\\d\\s\\-\\(\\)]{10,20}$")
            .min(10)
            .max(20),
          
          // Profile URL with strict validation
          SurrealField.string("profile_url")
            .description("Public profile URL")
            .optional()
            .pattern("^https://[a-zA-Z0-9][a-zA-Z0-9\\-]*[a-zA-Z0-9]*\\.[a-zA-Z]{2,}(/.*)?$")
            .max(500),
          
          // Account type with enum-like constraint
          SurrealField.string("account_type")
            .description("Type of user account")
            .default("'standard'")
            .assert("$value IN ['standard', 'premium', 'admin', 'moderator']"),
          
          // Age with realistic bounds
          SurrealField.int("age")
            .description("User age in years")
            .optional()
            .min(13) // COPPA compliance
            .max(150),
          
          // Timestamps
          SurrealField.datetime("created_at")
            .description("Account creation timestamp")
            .default("time::now()"),
          
          SurrealField.datetime("updated_at")
            .description("Last profile update")
            .default("time::now()")
        );

      // Validate table structure
      expect(userTable.name).toBe("user");
      expect(userTable.fields).toHaveLength(10);
      
      // Check specific field constraints
      const emailField = userTable.getField("email");
      expect(emailField?.constraints?.unique).toBe(true);
      expect(emailField?.constraints?.pattern).toBe("^[^@]+@[^@]+\\.[^@]+$");
      
      const usernameField = userTable.getField("username");
      expect(usernameField?.constraints?.pattern).toBe("^[a-zA-Z0-9_]{3,50}$");
      expect(usernameField?.constraints?.min).toBe(3);
      expect(usernameField?.constraints?.max).toBe(50);
      
      const accountTypeField = userTable.getField("account_type");
      expect(accountTypeField?.defaultValue).toBe("'standard'");
      expect(accountTypeField?.constraints?.assert).toBe("$value IN ['standard', 'premium', 'admin', 'moderator']");

      // Test SurrealQL generation
      const sql = userTable.toSurrealQL();
      expect(sql).toContain("DEFINE TABLE user SCHEMAFULL");
      expect(sql).toContain("DEFINE FIELD email ON");
      expect(sql).toContain("TYPE string");
      expect(sql).toContain("UNIQUE");
      expect(sql).toContain("ASSERT");
    });

    it("should compose validation schemas for table data", () => {
      // Create validation schemas that match our SurrealField constraints
      const userValidationSchema = Schema.Struct({
        email: emailSchema,
        username: usernameSchema,
        password: passwordSchema, // For input validation
        phone: Schema.optional(
          Schema.String.pipe(
            nonEmptyString,
            Schema.pattern(/^\+?[\d\s\-\(\)]{10,20}$/, {
              message: () => "Invalid phone number format"
            })
          )
        ),
        profile_url: Schema.optional(
          Schema.String.pipe(
            nonEmptyString,
            Schema.pattern(/^https:\/\/[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}(\/.*)?$/, {
              message: () => "Must be a valid HTTPS URL"
            }),
            maxLength(500)
          )
        ),
        account_type: enumConstraint("standard", "premium", "admin", "moderator"),
        age: Schema.optional(
          Schema.Number.pipe(
            Schema.int(),
            numberRange(13, 150)
          )
        )
      });

      // Test valid user data
      const validUser = {
        email: "john@example.com",
        username: "john_doe",
        password: "SecurePass123!",
        phone: "+1 (555) 123-4567",
        profile_url: "https://johndoe.com/profile",
        account_type: "premium",
        age: 30
      };
      expect(() => Schema.decodeUnknownSync(userValidationSchema)(validUser)).not.toThrow();

      // Test invalid user data
      const invalidUser = {
        email: "invalid-email",
        username: "a", // too short
        password: "weak", // doesn't meet strength requirements
        phone: "123", // too short
        profile_url: "http://insecure.com", // not HTTPS
        account_type: "invalid", // not in enum
        age: 200 // too old
      };
      expect(() => Schema.decodeUnknownSync(userValidationSchema)(invalidUser)).toThrow();
    });
  });

  describe("Performance and Optimization", () => {
    it("should demonstrate constraint reuse optimization", () => {
      // Define reusable constraint combinations
      const standardTextConstraints = Schema.String.pipe(
        nonEmptyString,
        maxLength(255)
      );

      const longTextConstraints = Schema.String.pipe(
        nonEmptyString,
        maxLength(2000)
      );

      const codeConstraints = Schema.String.pipe(
        nonEmptyString,
        Schema.pattern(/^[A-Z0-9_-]+$/, {
          message: () => "Code must contain only uppercase letters, numbers, hyphens, and underscores"
        }),
        maxLength(50)
      );

      // Create multiple schemas using the same constraints
      const productSchema = Schema.Struct({
        name: standardTextConstraints,
        description: longTextConstraints,
        sku: codeConstraints
      });

      const categorySchema = Schema.Struct({
        title: standardTextConstraints,
        description: longTextConstraints,
        code: codeConstraints
      });

      // Both schemas share the same validation logic
      const validProduct = {
        name: "Product Name",
        description: "Product description...",
        sku: "PROD-123"
      };

      const validCategory = {
        title: "Category Title",
        description: "Category description...",
        code: "CAT-456"
      };

      expect(() => Schema.decodeUnknownSync(productSchema)(validProduct)).not.toThrow();
      expect(() => Schema.decodeUnknownSync(categorySchema)(validCategory)).not.toThrow();

      // Invalid data fails consistently
      const invalidData = {
        name: "",
        description: "",
        sku: "invalid-code" // lowercase not allowed
      };

      expect(() => Schema.decodeUnknownSync(productSchema)(invalidData)).toThrow();
      expect(() => Schema.decodeUnknownSync(categorySchema)({
        title: "",
        description: "",
        code: "invalid-code"
      })).toThrow();
    });

    it("should show composition vs repetition benefits", () => {
      // Without composition (repetitive)
      const repetitiveSchema = Schema.Struct({
        title: Schema.String.pipe(
          Schema.nonEmptyString({ message: () => "Title cannot be empty" }),
          Schema.maxLength(100, { message: () => "Title too long" })
        ),
        subtitle: Schema.String.pipe(
          Schema.nonEmptyString({ message: () => "Subtitle cannot be empty" }),
          Schema.maxLength(100, { message: () => "Subtitle too long" })
        ),
        category: Schema.String.pipe(
          Schema.nonEmptyString({ message: () => "Category cannot be empty" }),
          Schema.maxLength(100, { message: () => "Category too long" })
        )
      });

      // With composition (reusable)
      const titleConstraints = Schema.String.pipe(
        nonEmptyString,
        maxLength(100)
      );

      const composedSchema = Schema.Struct({
        title: titleConstraints,
        subtitle: titleConstraints,
        category: titleConstraints
      });

      // Both work the same way
      const testData = {
        title: "Valid Title",
        subtitle: "Valid Subtitle", 
        category: "Valid Category"
      };

      expect(() => Schema.decodeUnknownSync(repetitiveSchema)(testData)).not.toThrow();
      expect(() => Schema.decodeUnknownSync(composedSchema)(testData)).not.toThrow();

      // But composed version is more maintainable and consistent
      const invalidData = {
        title: "",
        subtitle: "",
        category: ""
      };

      expect(() => Schema.decodeUnknownSync(repetitiveSchema)(invalidData)).toThrow();
      expect(() => Schema.decodeUnknownSync(composedSchema)(invalidData)).toThrow();
    });
  });
});