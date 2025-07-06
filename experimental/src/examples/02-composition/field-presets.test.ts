import { describe, it, expect } from "vitest";
import { Schema } from "effect";
import { SurrealField } from "../../lib/schema/field";
import {
  emailSchema,
  usernameSchema,
  passwordSchema,
  urlSchema,
  ageSchema,
  countSchema,
  slugSchema,
  timestampSchema,
  nonEmptyString,
  maxLength,
  numberRange
} from "../../lib/constraints";

/**
 * Level 2: Field Presets with Schema.pipe Composition
 * 
 * This test demonstrates how to create reusable field presets that combine
 * our SurrealField factory methods with Schema.pipe constraint compositions.
 * This provides both the SurrealDB field structure AND the validation logic.
 */
describe("Level 2: Field Presets", () => {
  describe("Enhanced Field Factory Methods", () => {
    it("should create preset email fields", () => {
      // Email field with built-in validation
      const emailField = SurrealField.string("email")
        .description("User email address")
        .unique();

      // Validate the field structure
      expect(emailField.name).toBe("email");
      expect(emailField.type).toBe("string");
      expect(emailField.constraints?.unique).toBe(true);
      expect(SurrealField.encode(emailField).description).toBe("User email address");

      // The field itself doesn't validate data (that's for the schema)
      // But we can test that it represents the correct structure
      expect(emailField.toSurrealQL()).toContain("TYPE string");
      expect(emailField.toSurrealQL()).toContain("UNIQUE");
      expect(emailField.toSurrealQL()).toContain("COMMENT 'User email address'");
    });

    it("should create preset username fields", () => {
      const usernameField = SurrealField.string("username")
        .description("Unique alphanumeric username")
        .unique()
        .length(50);

      expect(usernameField.name).toBe("username");
      expect(usernameField.constraints?.unique).toBe(true);
      expect(usernameField.constraints?.length).toBe(50);
      
      const sql = usernameField.toSurrealQL();
      expect(sql).toContain("TYPE string");
      expect(sql).toContain("UNIQUE");
    });

    it("should create preset password fields", () => {
      const passwordField = SurrealField.string("password_hash")
        .description("Hashed password for authentication")
        .length(128); // For hashed passwords

      expect(passwordField.name).toBe("password_hash");
      expect(passwordField.constraints?.length).toBe(128);
      expect(SurrealField.encode(passwordField).description).toBe("Hashed password for authentication");
    });

    it("should create preset URL fields", () => {
      const avatarField = SurrealField.string("avatar_url")
        .description("User profile picture URL")
        .optional()
        .pattern("^https?://.*");

      expect(avatarField.name).toBe("avatar_url");
      expect(avatarField.isOptional).toBe(true);
      expect(avatarField.constraints?.pattern).toBe("^https?://.*");
    });
  });

  describe("Composable Field Builders", () => {
    it("should compose multiple constraints on string fields", () => {
      // Blog post title with multiple constraints
      const titleField = SurrealField.string("title")
        .description("Blog post title")
        .min(5)        // minimum length
        .max(100)      // maximum length  
        .pattern("^[a-zA-Z0-9\\s\\-_.,!?]+$"); // allowed characters

      expect(titleField.constraints?.min).toBe(5);
      expect(titleField.constraints?.max).toBe(100);
      expect(titleField.constraints?.pattern).toBe("^[a-zA-Z0-9\\s\\-_.,!?]+$");

      const sql = titleField.toSurrealQL();
      expect(sql).toContain("TYPE string");
    });

    it("should compose numeric field constraints", () => {
      // Age field with range validation
      const ageField = SurrealField.int("age")
        .description("User age in years")
        .min(0)
        .max(150);

      expect(ageField.type).toBe("int");
      expect(ageField.constraints?.min).toBe(0);
      expect(ageField.constraints?.max).toBe(150);

      // Price field with precision
      const priceField = SurrealField.number("price")
        .description("Product price in USD")
        .min(0)
        .max(999999.99);

      expect(priceField.type).toBe("number");
      expect(priceField.constraints?.min).toBe(0);
      expect(priceField.constraints?.max).toBe(999999.99);
    });

    it("should create enum-like fields with assert constraints", () => {
      // Status field with limited values
      const statusField = SurrealField.string("status")
        .description("Post publication status")
        .default("'draft'")
        .assert("$value IN ['draft', 'published', 'archived']");

      expect(statusField.defaultValue).toBe("'draft'");
      expect(statusField.constraints?.assert).toBe("$value IN ['draft', 'published', 'archived']");

      const sql = statusField.toSurrealQL();
      expect(sql).toContain("DEFAULT 'draft'");
      expect(sql).toContain("ASSERT $value IN ['draft', 'published', 'archived']");
    });
  });

  describe("Field Preset Factory Functions", () => {
    // Helper functions that create commonly used field patterns
    const createEmailField = (name: string, required: boolean = true) => {
      const field = SurrealField.string(name)
        .description("Email address")
        .pattern("^[^@]+@[^@]+\\.[^@]+$")
        .length(255)
        .unique();

      return required ? field : field.optional();
    };

    const createUsernameField = (name: string) => {
      return SurrealField.string(name)
        .description("Unique username")
        .pattern("^[a-zA-Z0-9_]+$")
        .min(3)
        .max(50)
        .unique();
    };

    const createTimestampField = (name: string, autoDefault: boolean = true) => {
      const field = SurrealField.datetime(name)
        .description(`Timestamp for ${name}`);

      return autoDefault ? field.default("time::now()") : field;
    };

    const createSlugField = (name: string) => {
      return SurrealField.string(name)
        .description("URL-friendly identifier")
        .pattern("^[a-z0-9]+(?:-[a-z0-9]+)*$")
        .min(1)
        .max(100)
        .unique();
    };

    it("should use email field factory", () => {
      const requiredEmail = createEmailField("email");
      const optionalEmail = createEmailField("backup_email", false);

      expect(requiredEmail.isOptional).toBe(false);
      expect(requiredEmail.constraints?.unique).toBe(true);
      expect(requiredEmail.constraints?.pattern).toBe("^[^@]+@[^@]+\\.[^@]+$");

      expect(optionalEmail.isOptional).toBe(true);
      expect(optionalEmail.constraints?.unique).toBe(true);
    });

    it("should use username field factory", () => {
      const username = createUsernameField("username");

      expect(username.constraints?.pattern).toBe("^[a-zA-Z0-9_]+$");
      expect(username.constraints?.min).toBe(3);
      expect(username.constraints?.max).toBe(50);
      expect(username.constraints?.unique).toBe(true);
    });

    it("should use timestamp field factory", () => {
      const createdAt = createTimestampField("created_at");
      const updatedAt = createTimestampField("updated_at", false);

      expect(createdAt.type).toBe("datetime");
      expect(createdAt.defaultValue).toBe("time::now()");

      expect(updatedAt.type).toBe("datetime");
      expect(updatedAt.defaultValue).toBeUndefined();
    });

    it("should use slug field factory", () => {
      const slug = createSlugField("slug");

      expect(slug.constraints?.pattern).toBe("^[a-z0-9]+(?:-[a-z0-9]+)*$");
      expect(slug.constraints?.min).toBe(1);
      expect(slug.constraints?.max).toBe(100);
      expect(slug.constraints?.unique).toBe(true);
    });
  });

  describe("Complex Field Compositions", () => {
    it("should create social media profile fields", () => {
      // Twitter handle
      const twitterField = SurrealField.string("twitter_handle")
        .description("Twitter username (without @)")
        .optional()
        .pattern("^[a-zA-Z0-9_]{1,15}$")
        .min(1)
        .max(15);

      // LinkedIn URL
      const linkedinField = SurrealField.string("linkedin_url")
        .description("LinkedIn profile URL")
        .optional()
        .pattern("^https://www\\.linkedin\\.com/in/[a-zA-Z0-9\\-]+/?$")
        .max(200);

      // GitHub username
      const githubField = SurrealField.string("github_username")
        .description("GitHub username")
        .optional()
        .pattern("^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$")
        .max(39);

      expect(twitterField.constraints?.pattern).toBe("^[a-zA-Z0-9_]{1,15}$");
      expect(linkedinField.constraints?.pattern).toBe("^https://www\\.linkedin\\.com/in/[a-zA-Z0-9\\-]+/?$");
      expect(githubField.constraints?.pattern).toBe("^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$");
    });

    it("should create financial fields", () => {
      // Currency amount
      const amountField = SurrealField.number("amount")
        .description("Monetary amount")
        .min(0)
        .max(999999999.99);

      // Currency code (ISO 4217)
      const currencyField = SurrealField.string("currency")
        .description("3-letter currency code")
        .pattern("^[A-Z]{3}$")
        .length(3)
        .default("'USD'");

      // Tax rate percentage
      const taxRateField = SurrealField.number("tax_rate")
        .description("Tax rate as percentage")
        .min(0)
        .max(100)
        .default("0");

      expect(amountField.constraints?.min).toBe(0);
      expect(currencyField.constraints?.pattern).toBe("^[A-Z]{3}$");
      expect(currencyField.constraints?.length).toBe(3);
      expect(taxRateField.constraints?.max).toBe(100);
    });

    it("should create geolocation fields", () => {
      // Latitude
      const latField = SurrealField.number("latitude")
        .description("Geographic latitude coordinate")
        .min(-90)
        .max(90);

      // Longitude  
      const lngField = SurrealField.number("longitude")
        .description("Geographic longitude coordinate")
        .min(-180)
        .max(180);

      // Country code (ISO 3166-1 alpha-2)
      const countryField = SurrealField.string("country_code")
        .description("2-letter country code")
        .pattern("^[A-Z]{2}$")
        .length(2);

      // Postal code (flexible pattern)
      const postalField = SurrealField.string("postal_code")
        .description("Postal/ZIP code")
        .pattern("^[A-Za-z0-9\\s\\-]{3,10}$")
        .min(3)
        .max(10);

      expect(latField.constraints?.min).toBe(-90);
      expect(latField.constraints?.max).toBe(90);
      expect(lngField.constraints?.min).toBe(-180);
      expect(lngField.constraints?.max).toBe(180);
      expect(countryField.constraints?.pattern).toBe("^[A-Z]{2}$");
      expect(postalField.constraints?.pattern).toBe("^[A-Za-z0-9\\s\\-]{3,10}$");
    });
  });

  describe("Validation Integration", () => {
    it("should demonstrate field + schema validation workflow", () => {
      // Create field with SurrealDB constraints
      const emailField = SurrealField.string("email")
        .description("User email address")
        .unique()
        .pattern("^[^@]+@[^@]+\\.[^@]+$")
        .length(255);

      // Create corresponding Effect schema for validation
      const emailValidationSchema = emailSchema;

      // Test the field structure
      expect(emailField.name).toBe("email");
      expect(emailField.constraints?.unique).toBe(true);
      expect(emailField.constraints?.pattern).toBe("^[^@]+@[^@]+\\.[^@]+$");

      // Test the validation schema
      expect(() => Schema.decodeUnknownSync(emailValidationSchema)("user@example.com")).not.toThrow();
      expect(() => Schema.decodeUnknownSync(emailValidationSchema)("invalid-email")).toThrow();

      // The field generates correct SurrealQL
      const sql = emailField.toSurrealQL();
      expect(sql).toContain("TYPE string");
      expect(sql).toContain("UNIQUE");
    });

    it("should show field-schema correspondence", () => {
      // Username field and schema
      const usernameField = SurrealField.string("username")
        .unique()
        .min(3)
        .max(50)
        .pattern("^[a-zA-Z0-9_]+$");

      const usernameValidationSchema = usernameSchema;

      // Both should enforce similar constraints
      expect(usernameField.constraints?.min).toBe(3);
      expect(usernameField.constraints?.max).toBe(50);
      expect(usernameField.constraints?.pattern).toBe("^[a-zA-Z0-9_]+$");

      // Validation schema should match field constraints
      expect(() => Schema.decodeUnknownSync(usernameValidationSchema)("john_doe")).not.toThrow();
      expect(() => Schema.decodeUnknownSync(usernameValidationSchema)("ab")).toThrow(); // too short
      expect(() => Schema.decodeUnknownSync(usernameValidationSchema)("user-name")).toThrow(); // invalid chars
    });
  });

  describe("Schema.pipe Performance and Reusability", () => {
    it("should demonstrate constraint reusability across fields", () => {
      // Define reusable constraints
      const titleConstraints = Schema.String.pipe(
        nonEmptyString,
        maxLength(100)
      );

      const descriptionConstraints = Schema.String.pipe(
        nonEmptyString,
        maxLength(1000)
      );

      // Use same constraints for different entities
      const blogPostTitle = SurrealField.string("title").description("Blog post title");
      const productTitle = SurrealField.string("name").description("Product name");
      const categoryTitle = SurrealField.string("title").description("Category title");

      // All share the same validation logic (though implemented separately in SurrealField)
      expect(blogPostTitle.type).toBe("string");
      expect(productTitle.type).toBe("string");
      expect(categoryTitle.type).toBe("string");

      // Validation schemas can be reused
      expect(() => Schema.decodeUnknownSync(titleConstraints)("Valid Title")).not.toThrow();
      expect(() => Schema.decodeUnknownSync(titleConstraints)("")).toThrow();
      expect(() => Schema.decodeUnknownSync(titleConstraints)("a".repeat(101))).toThrow();
    });

    it("should show composition benefits", () => {
      // Base constraints
      const baseString = Schema.String.pipe(nonEmptyString);
      const shortString = baseString.pipe(maxLength(50));
      const mediumString = baseString.pipe(maxLength(255));
      const longString = baseString.pipe(maxLength(1000));

      // Different length variations of the same base
      expect(() => Schema.decodeUnknownSync(shortString)("Short text")).not.toThrow();
      expect(() => Schema.decodeUnknownSync(mediumString)("Medium length text content")).not.toThrow();
      expect(() => Schema.decodeUnknownSync(longString)("Very long text content...")).not.toThrow();

      // All enforce non-empty
      expect(() => Schema.decodeUnknownSync(shortString)("")).toThrow();
      expect(() => Schema.decodeUnknownSync(mediumString)("")).toThrow();
      expect(() => Schema.decodeUnknownSync(longString)("")).toThrow();

      // Different length limits
      const longText = "a".repeat(60);
      expect(() => Schema.decodeUnknownSync(shortString)(longText)).toThrow(); // too long for short
      expect(() => Schema.decodeUnknownSync(mediumString)(longText)).not.toThrow(); // ok for medium
      expect(() => Schema.decodeUnknownSync(longString)(longText)).not.toThrow(); // ok for long
    });
  });
});