import { Schema } from "effect";
/**
 * Reusable Constraint Schemas using Schema.pipe
 *
 * This library provides composable, reusable constraint schemas that can be
 * combined with Effect's Schema.pipe for building complex validation patterns.
 *
 * Inspired by the user's example:
 * ```typescript
 * const Password = Schema.String
 *   .annotations({ message: () => "not a string" })
 *   .pipe(
 *     Schema.nonEmptyString({ message: () => "required" }),
 *     Schema.maxLength(10, { message: (issue) => `${issue.actual} is too long` })
 *   )
 *   .annotations({
 *     identifier: "Password",
 *     title: "password",
 *     description: "A password is a secret string used to authenticate a user",
 *     examples: ["1Ki77y", "jelly22fi$h"],
 *     documentation: `...technical information on Password schema...`
 *   })
 * ```
 */
// =============================================================================
// Basic String Constraints
// =============================================================================
/**
 * Non-empty string constraint with helpful error message
 */
export const nonEmptyString = Schema.nonEmptyString({
    message: () => "String cannot be empty"
});
/**
 * Email validation pattern with custom error message
 */
export const emailPattern = Schema.pattern(/^[^@]+@[^@]+\.[^@]+$/, {
    message: () => "Must be a valid email address"
});
/**
 * Strong password validation
 */
export const strongPassword = Schema.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
    message: () => "Password must contain uppercase, lowercase, number, and special character"
});
/**
 * Username pattern (alphanumeric + underscore)
 */
export const usernamePattern = Schema.pattern(/^[a-zA-Z0-9_]+$/, {
    message: () => "Username can only contain letters, numbers, and underscores"
});
/**
 * URL pattern validation
 */
export const urlPattern = Schema.pattern(/^https?:\/\/.*/, {
    message: () => "Must be a valid HTTP or HTTPS URL"
});
/**
 * UUID pattern validation
 */
export const uuidPattern = Schema.pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: () => "Must be a valid UUID"
});
// =============================================================================
// Length Constraints
// =============================================================================
/**
 * Common string length constraints
 */
export const shortString = Schema.maxLength(50, {
    message: (issue) => `String too long: ${issue.actual} characters (max 50)`
});
export const mediumString = Schema.maxLength(255, {
    message: (issue) => `String too long: ${issue.actual} characters (max 255)`
});
export const longString = Schema.maxLength(1000, {
    message: (issue) => `String too long: ${issue.actual} characters (max 1000)`
});
export const textString = Schema.maxLength(5000, {
    message: (issue) => `Text too long: ${issue.actual} characters (max 5000)`
});
/**
 * Minimum length constraints
 */
export const minLength = (min) => Schema.minLength(min, {
    message: (issue) => `String too short: ${issue.actual} characters (min ${min})`
});
export const maxLength = (max) => Schema.maxLength(max, {
    message: (issue) => `String too long: ${issue.actual} characters (max ${max})`
});
export const exactLength = (length) => Schema.length(length, {
    message: (issue) => `String must be exactly ${length} characters (got ${issue.actual})`
});
// =============================================================================
// Number Constraints
// =============================================================================
/**
 * Positive number constraint
 */
export const positiveNumber = Schema.positive({
    message: () => "Number must be positive"
});
/**
 * Non-negative number constraint
 */
export const nonNegativeNumber = Schema.nonNegative({
    message: () => "Number must be non-negative"
});
/**
 * Integer constraint
 */
export const integerNumber = Schema.int({
    message: () => "Must be an integer"
});
/**
 * Number range constraints
 */
export const minNumber = (min) => Schema.greaterThanOrEqualTo(min, {
    message: (issue) => `Number too small: ${issue.actual} (min ${min})`
});
export const maxNumber = (max) => Schema.lessThanOrEqualTo(max, {
    message: (issue) => `Number too large: ${issue.actual} (max ${max})`
});
export const numberRange = (min, max) => Schema.between(min, max, {
    message: (issue) => `Number out of range: ${issue.actual} (must be between ${min} and ${max})`
});
// =============================================================================
// Common Field Type Schemas
// =============================================================================
/**
 * Email field schema with validation and annotations
 */
export const emailSchema = Schema.String
    .annotations({
    message: () => "Email must be a string"
})
    .pipe(nonEmptyString, emailPattern, maxLength(255))
    .annotations({
    identifier: "EmailAddress",
    title: "Email Address",
    description: "A valid email address for user communication",
    examples: ["user@example.com", "admin@company.org"],
    documentation: "Email addresses are used for authentication and communication"
});
/**
 * Username field schema with validation and annotations
 */
export const usernameSchema = Schema.String
    .annotations({
    message: () => "Username must be a string"
})
    .pipe(nonEmptyString, usernamePattern, minLength(3), maxLength(50))
    .annotations({
    identifier: "Username",
    title: "Username",
    description: "A unique identifier for user accounts",
    examples: ["john_doe", "admin123", "user_name"],
    documentation: "Usernames must be unique and contain only alphanumeric characters and underscores"
});
/**
 * Password field schema with strong validation
 */
export const passwordSchema = Schema.String
    .annotations({
    message: () => "Password must be a string"
})
    .pipe(nonEmptyString, minLength(8), maxLength(128), strongPassword)
    .annotations({
    identifier: "Password",
    title: "Password",
    description: "A secure password for user authentication",
    examples: ["SecurePass123!", "MyStr0ng@Pass"],
    documentation: "Passwords must be at least 8 characters with mixed case, numbers, and symbols"
});
/**
 * URL field schema with validation
 */
export const urlSchema = Schema.String
    .annotations({
    message: () => "URL must be a string"
})
    .pipe(nonEmptyString, urlPattern, maxLength(2048))
    .annotations({
    identifier: "URL",
    title: "URL",
    description: "A valid HTTP or HTTPS URL",
    examples: ["https://example.com", "http://localhost:3000"],
    documentation: "URLs must be valid HTTP or HTTPS addresses"
});
/**
 * UUID field schema with validation
 */
export const uuidSchema = Schema.String
    .annotations({
    message: () => "UUID must be a string"
})
    .pipe(nonEmptyString, uuidPattern)
    .annotations({
    identifier: "UUID",
    title: "UUID",
    description: "A universally unique identifier",
    examples: ["123e4567-e89b-12d3-a456-426614174000", "550e8400-e29b-41d4-a716-446655440000"],
    documentation: "UUIDs are 128-bit identifiers that are unique across time and space"
});
/**
 * Slug field schema (URL-friendly string)
 */
export const slugSchema = Schema.String
    .annotations({
    message: () => "Slug must be a string"
})
    .pipe(nonEmptyString, Schema.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: () => "Slug must be lowercase letters, numbers, and hyphens only"
}), minLength(1), maxLength(100))
    .annotations({
    identifier: "Slug",
    title: "URL Slug",
    description: "A URL-friendly string identifier",
    examples: ["blog-post-title", "user-profile", "product-name"],
    documentation: "Slugs are used in URLs and must be lowercase with hyphens"
});
// =============================================================================
// Number Field Schemas
// =============================================================================
/**
 * Age field schema with realistic constraints
 */
export const ageSchema = Schema.Number
    .annotations({
    message: () => "Age must be a number"
})
    .pipe(integerNumber, numberRange(0, 150))
    .annotations({
    identifier: "Age",
    title: "Age",
    description: "A person's age in years",
    examples: [25, 30, 45],
    documentation: "Age must be a realistic number between 0 and 150"
});
/**
 * Count field schema for non-negative integers
 */
export const countSchema = Schema.Number
    .annotations({
    message: () => "Count must be a number"
})
    .pipe(integerNumber, nonNegativeNumber)
    .annotations({
    identifier: "Count",
    title: "Count",
    description: "A non-negative integer count",
    examples: [0, 1, 100, 9999],
    documentation: "Counts represent quantities and must be non-negative integers"
});
/**
 * Price field schema with decimal precision
 */
export const priceSchema = Schema.Number
    .annotations({
    message: () => "Price must be a number"
})
    .pipe(nonNegativeNumber, maxNumber(999999.99))
    .annotations({
    identifier: "Price",
    title: "Price",
    description: "A monetary price value",
    examples: [9.99, 29.95, 199.00],
    documentation: "Prices must be non-negative and reasonable for commerce"
});
// =============================================================================
// Temporal Schemas
// =============================================================================
/**
 * ISO timestamp schema
 */
export const timestampSchema = Schema.String
    .annotations({
    message: () => "Timestamp must be a string"
})
    .pipe(nonEmptyString, Schema.pattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, {
    message: () => "Must be a valid ISO timestamp"
}))
    .annotations({
    identifier: "Timestamp",
    title: "Timestamp",
    description: "An ISO 8601 formatted timestamp",
    examples: ["2024-01-01T12:00:00Z", "2024-12-31T23:59:59.999Z"],
    documentation: "Timestamps follow ISO 8601 format for consistent date/time representation"
});
// =============================================================================
// Helper Functions for Custom Constraints
// =============================================================================
/**
 * Create a custom string constraint with pattern and length
 */
export const customStringConstraint = (pattern, minLen, maxLen, patternMessage) => Schema.String.pipe(nonEmptyString, Schema.pattern(pattern, { message: () => patternMessage }), minLength(minLen), maxLength(maxLen));
/**
 * Create a custom number constraint with range
 */
export const customNumberConstraint = (min, max, integer = false) => {
    const base = Schema.Number.pipe(numberRange(min, max));
    return integer ? base.pipe(integerNumber) : base;
};
/**
 * Create an enum constraint with custom values
 */
export const enumConstraint = (...values) => Schema.Literal(...values).annotations({
    description: `Must be one of: ${values.join(", ")}`,
    examples: values.slice(0, 3)
});
// =============================================================================
// Exports
// =============================================================================
export { 
// Re-export Effect Schema for convenience
Schema };
