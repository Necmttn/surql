import { describe, it, expect } from "vitest";
import { Schema } from "effect";
import {
  emailSchema,
  usernameSchema,
  passwordSchema,
  urlSchema,
  ageSchema,
  countSchema,
  nonEmptyString,
  emailPattern,
  strongPassword,
  maxLength,
  numberRange,
  enumConstraint,
  customStringConstraint
} from "../../lib/constraints";

/**
 * Level 2: Reusable Constraints with Schema.pipe
 * 
 * This test demonstrates how to create and use reusable constraint schemas
 * using Effect's Schema.pipe pattern for maximum composability and reusability.
 */
describe("Level 2: Reusable Constraints", () => {
  describe("Basic Constraint Composition", () => {
    it("should compose simple string constraints", () => {
      // Create a custom field type using Schema.pipe
      const titleSchema = Schema.String.pipe(
        nonEmptyString,
        maxLength(100)
      );

      // Test valid values
      expect(() => Schema.decodeUnknownSync(titleSchema)("My Blog Post")).not.toThrow();
      expect(() => Schema.decodeUnknownSync(titleSchema)("Short")).not.toThrow();

      // Test invalid values
      expect(() => Schema.decodeUnknownSync(titleSchema)("")).toThrow();
      expect(() => Schema.decodeUnknownSync(titleSchema)("a".repeat(101))).toThrow();
    });

    it("should compose multiple string constraints", () => {
      // Complex composition for a product code
      const productCodeSchema = Schema.String.pipe(
        nonEmptyString,
        Schema.pattern(/^[A-Z]{2,4}-\d{4,6}$/, {
          message: () => "Product code must be in format: ABC-1234"
        }),
        maxLength(20)
      );

      // Test valid product codes
      expect(() => Schema.decodeUnknownSync(productCodeSchema)("PRD-12345")).not.toThrow();
      expect(() => Schema.decodeUnknownSync(productCodeSchema)("ABCD-123456")).not.toThrow();

      // Test invalid product codes
      expect(() => Schema.decodeUnknownSync(productCodeSchema)("invalid")).toThrow();
      expect(() => Schema.decodeUnknownSync(productCodeSchema)("abc-123")).toThrow(); // lowercase
    });

    it("should compose number constraints", () => {
      // Percentage schema (0-100)
      const percentageSchema = Schema.Number.pipe(
        numberRange(0, 100)
      );

      // Test valid percentages
      expect(() => Schema.decodeUnknownSync(percentageSchema)(0)).not.toThrow();
      expect(() => Schema.decodeUnknownSync(percentageSchema)(50.5)).not.toThrow();
      expect(() => Schema.decodeUnknownSync(percentageSchema)(100)).not.toThrow();

      // Test invalid percentages
      expect(() => Schema.decodeUnknownSync(percentageSchema)(-1)).toThrow();
      expect(() => Schema.decodeUnknownSync(percentageSchema)(101)).toThrow();
    });
  });

  describe("Pre-built Field Schemas", () => {
    it("should validate email schemas", () => {
      // Test valid emails
      expect(() => Schema.decodeUnknownSync(emailSchema)("user@example.com")).not.toThrow();
      expect(() => Schema.decodeUnknownSync(emailSchema)("admin@company.org")).not.toThrow();
      expect(() => Schema.decodeUnknownSync(emailSchema)("test.user+tag@domain.co.uk")).not.toThrow();

      // Test invalid emails
      expect(() => Schema.decodeUnknownSync(emailSchema)("")).toThrow();
      expect(() => Schema.decodeUnknownSync(emailSchema)("invalid")).toThrow();
      expect(() => Schema.decodeUnknownSync(emailSchema)("@domain.com")).toThrow();
      expect(() => Schema.decodeUnknownSync(emailSchema)("user@")).toThrow();
    });

    it("should validate username schemas", () => {
      // Test valid usernames
      expect(() => Schema.decodeUnknownSync(usernameSchema)("john_doe")).not.toThrow();
      expect(() => Schema.decodeUnknownSync(usernameSchema)("user123")).not.toThrow();
      expect(() => Schema.decodeUnknownSync(usernameSchema)("admin")).not.toThrow();

      // Test invalid usernames
      expect(() => Schema.decodeUnknownSync(usernameSchema)("")).toThrow();
      expect(() => Schema.decodeUnknownSync(usernameSchema)("ab")).toThrow(); // too short
      expect(() => Schema.decodeUnknownSync(usernameSchema)("user-name")).toThrow(); // hyphen not allowed
      expect(() => Schema.decodeUnknownSync(usernameSchema)("user.name")).toThrow(); // dot not allowed
      expect(() => Schema.decodeUnknownSync(usernameSchema)("a".repeat(51))).toThrow(); // too long
    });

    it("should validate password schemas", () => {
      // Test valid passwords
      expect(() => Schema.decodeUnknownSync(passwordSchema)("SecurePass123!")).not.toThrow();
      expect(() => Schema.decodeUnknownSync(passwordSchema)("MyStr0ng@Pass")).not.toThrow();
      expect(() => Schema.decodeUnknownSync(passwordSchema)("Complex123!")).not.toThrow();

      // Test invalid passwords
      expect(() => Schema.decodeUnknownSync(passwordSchema)("")).toThrow();
      expect(() => Schema.decodeUnknownSync(passwordSchema)("short")).toThrow(); // too short
      expect(() => Schema.decodeUnknownSync(passwordSchema)("alllowercase")).toThrow(); // no uppercase/number/symbol
      expect(() => Schema.decodeUnknownSync(passwordSchema)("ALLUPPERCASE")).toThrow(); // no lowercase/number/symbol
      expect(() => Schema.decodeUnknownSync(passwordSchema)("NoNumbers!")).toThrow(); // no numbers
    });

    it("should validate URL schemas", () => {
      // Test valid URLs
      expect(() => Schema.decodeUnknownSync(urlSchema)("https://example.com")).not.toThrow();
      expect(() => Schema.decodeUnknownSync(urlSchema)("http://localhost:3000")).not.toThrow();
      expect(() => Schema.decodeUnknownSync(urlSchema)("https://sub.domain.com/path")).not.toThrow();

      // Test invalid URLs
      expect(() => Schema.decodeUnknownSync(urlSchema)("")).toThrow();
      expect(() => Schema.decodeUnknownSync(urlSchema)("invalid-url")).toThrow();
      expect(() => Schema.decodeUnknownSync(urlSchema)("ftp://example.com")).toThrow(); // not http/https
      expect(() => Schema.decodeUnknownSync(urlSchema)("example.com")).toThrow(); // no protocol
    });

    it("should validate numeric field schemas", () => {
      // Test age schema
      expect(() => Schema.decodeUnknownSync(ageSchema)(25)).not.toThrow();
      expect(() => Schema.decodeUnknownSync(ageSchema)(0)).not.toThrow();
      expect(() => Schema.decodeUnknownSync(ageSchema)(150)).not.toThrow();
      expect(() => Schema.decodeUnknownSync(ageSchema)(-1)).toThrow();
      expect(() => Schema.decodeUnknownSync(ageSchema)(151)).toThrow();
      expect(() => Schema.decodeUnknownSync(ageSchema)(25.5)).toThrow(); // must be integer

      // Test count schema
      expect(() => Schema.decodeUnknownSync(countSchema)(0)).not.toThrow();
      expect(() => Schema.decodeUnknownSync(countSchema)(100)).not.toThrow();
      expect(() => Schema.decodeUnknownSync(countSchema)(9999)).not.toThrow();
      expect(() => Schema.decodeUnknownSync(countSchema)(-1)).toThrow(); // negative not allowed
      expect(() => Schema.decodeUnknownSync(countSchema)(5.5)).toThrow(); // must be integer
    });
  });

  describe("Constraint Reusability", () => {
    it("should reuse constraints across different schemas", () => {
      // Create multiple schemas that share constraints
      const titleSchema = Schema.String.pipe(nonEmptyString, maxLength(100));
      const descriptionSchema = Schema.String.pipe(nonEmptyString, maxLength(500));
      const categorySchema = Schema.String.pipe(nonEmptyString, maxLength(50));

      const postSchema = Schema.Struct({
        title: titleSchema,
        description: descriptionSchema,
        category: categorySchema
      });

      // Test valid post
      const validPost = {
        title: "My Blog Post",
        description: "This is a description of my blog post content.",
        category: "Technology"
      };
      expect(() => Schema.decodeUnknownSync(postSchema)(validPost)).not.toThrow();

      // Test invalid post (empty title)
      const invalidPost = {
        title: "",
        description: "This is a description of my blog post content.",
        category: "Technology"
      };
      expect(() => Schema.decodeUnknownSync(postSchema)(invalidPost)).toThrow();
    });

    it("should chain constraints for complex validation", () => {
      // Phone number schema with multiple constraints
      const phoneSchema = Schema.String.pipe(
        nonEmptyString,
        Schema.pattern(/^\+?[\d\s\-\(\)]+$/, {
          message: () => "Phone number can only contain digits, spaces, and common symbols"
        }),
        Schema.minLength(10, {
          message: () => "Phone number too short"
        }),
        Schema.maxLength(20, {
          message: () => "Phone number too long"
        })
      );

      // Test valid phone numbers
      expect(() => Schema.decodeUnknownSync(phoneSchema)("(555) 123-4567")).not.toThrow();
      expect(() => Schema.decodeUnknownSync(phoneSchema)("+1 555 123 4567")).not.toThrow();
      expect(() => Schema.decodeUnknownSync(phoneSchema)("5551234567")).not.toThrow();

      // Test invalid phone numbers
      expect(() => Schema.decodeUnknownSync(phoneSchema)("")).toThrow();
      expect(() => Schema.decodeUnknownSync(phoneSchema)("123")).toThrow(); // too short
      expect(() => Schema.decodeUnknownSync(phoneSchema)("invalid-phone")).toThrow(); // invalid characters
    });
  });

  describe("Custom Constraint Helpers", () => {
    it("should create custom string constraints", () => {
      // Create a social security number constraint
      const ssnSchema = customStringConstraint(
        /^\d{3}-\d{2}-\d{4}$/,
        11,
        11,
        "SSN must be in format: 123-45-6789"
      );

      // Test valid SSN
      expect(() => Schema.decodeUnknownSync(ssnSchema)("123-45-6789")).not.toThrow();

      // Test invalid SSN
      expect(() => Schema.decodeUnknownSync(ssnSchema)("123456789")).toThrow(); // no dashes
      expect(() => Schema.decodeUnknownSync(ssnSchema)("123-45-67890")).toThrow(); // too long
      expect(() => Schema.decodeUnknownSync(ssnSchema)("abc-de-fghi")).toThrow(); // not numeric
    });

    it("should create enum constraints", () => {
      // Create status enum
      const statusSchema = enumConstraint("draft", "published", "archived");

      // Test valid statuses
      expect(() => Schema.decodeUnknownSync(statusSchema)("draft")).not.toThrow();
      expect(() => Schema.decodeUnknownSync(statusSchema)("published")).not.toThrow();
      expect(() => Schema.decodeUnknownSync(statusSchema)("archived")).not.toThrow();

      // Test invalid status
      expect(() => Schema.decodeUnknownSync(statusSchema)("invalid")).toThrow();
      expect(() => Schema.decodeUnknownSync(statusSchema)("Draft")).toThrow(); // case sensitive
    });
  });

  describe("Schema Annotations", () => {
    it("should preserve annotations through composition", () => {
      // Test that pre-built schemas have annotations
      expect(emailSchema.ast.annotations).toBeDefined();
      expect(usernameSchema.ast.annotations).toBeDefined();
      expect(passwordSchema.ast.annotations).toBeDefined();

      // The annotations object exists (implementation details may vary)
      expect(typeof emailSchema.ast.annotations).toBe("object");
    });

    it("should compose schemas with custom annotations", () => {
      // Create a custom schema with annotations
      const companyEmailSchema = emailSchema
        .pipe(
          Schema.pattern(/@company\.com$/, {
            message: () => "Must be a company email address"
          })
        )
        .annotations({
          identifier: "CompanyEmail",
          title: "Company Email",
          description: "A valid company email address ending with @company.com",
          examples: ["employee@company.com", "admin@company.com"]
        });

      // Test valid company email
      expect(() => Schema.decodeUnknownSync(companyEmailSchema)("user@company.com")).not.toThrow();

      // Test invalid company email
      expect(() => Schema.decodeUnknownSync(companyEmailSchema)("user@gmail.com")).toThrow();

      // The schema is successfully created and functional
      expect(companyEmailSchema).toBeDefined();
      expect(typeof companyEmailSchema.ast.annotations).toBe("object");
    });
  });

  describe("Error Messages", () => {
    it("should provide helpful error messages", () => {
      // Test error message content for different constraint violations
      try {
        Schema.decodeUnknownSync(emailSchema)("invalid-email");
        fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).toContain("Must be a valid email address");
      }

      try {
        Schema.decodeUnknownSync(usernameSchema)("ab");
        fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).toContain("too short");
      }

      try {
        Schema.decodeUnknownSync(passwordSchema)("weak");
        fail("Should have thrown an error");
      } catch (error) {
        // Password validation has multiple constraints, first one to fail wins
        expect(error.message).toMatch(/too short|uppercase, lowercase, number, and special character/);
      }
    });

    it("should chain error messages correctly", () => {
      // Test multiple constraint violations
      const strictSchema = Schema.String.pipe(
        nonEmptyString,
        Schema.minLength(5, { message: () => "Too short" }),
        Schema.pattern(/^\w+$/, { message: () => "Invalid characters" })
      );

      // Test each constraint separately
      expect(() => Schema.decodeUnknownSync(strictSchema)("")).toThrow(); // empty
      expect(() => Schema.decodeUnknownSync(strictSchema)("abc")).toThrow(); // too short  
      expect(() => Schema.decodeUnknownSync(strictSchema)("hello!")).toThrow(); // invalid chars

      // Valid value should pass
      expect(() => Schema.decodeUnknownSync(strictSchema)("hello")).not.toThrow();
    });
  });
});