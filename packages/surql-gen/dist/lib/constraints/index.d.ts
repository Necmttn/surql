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
/**
 * Non-empty string constraint with helpful error message
 */
export declare const nonEmptyString: <A extends string>(self: Schema.Schema.Any & Schema.Schema<A, any, unknown>) => Schema.filter<Schema.Schema.Any>;
/**
 * Email validation pattern with custom error message
 */
export declare const emailPattern: <A extends string>(self: Schema.Schema.Any & Schema.Schema<A, any, unknown>) => Schema.filter<Schema.Schema.Any>;
/**
 * Strong password validation
 */
export declare const strongPassword: <A extends string>(self: Schema.Schema.Any & Schema.Schema<A, any, unknown>) => Schema.filter<Schema.Schema.Any>;
/**
 * Username pattern (alphanumeric + underscore)
 */
export declare const usernamePattern: <A extends string>(self: Schema.Schema.Any & Schema.Schema<A, any, unknown>) => Schema.filter<Schema.Schema.Any>;
/**
 * URL pattern validation
 */
export declare const urlPattern: <A extends string>(self: Schema.Schema.Any & Schema.Schema<A, any, unknown>) => Schema.filter<Schema.Schema.Any>;
/**
 * UUID pattern validation
 */
export declare const uuidPattern: <A extends string>(self: Schema.Schema.Any & Schema.Schema<A, any, unknown>) => Schema.filter<Schema.Schema.Any>;
/**
 * Common string length constraints
 */
export declare const shortString: <A extends string>(self: Schema.Schema.Any & Schema.Schema<A, any, unknown>) => Schema.filter<Schema.Schema.Any>;
export declare const mediumString: <A extends string>(self: Schema.Schema.Any & Schema.Schema<A, any, unknown>) => Schema.filter<Schema.Schema.Any>;
export declare const longString: <A extends string>(self: Schema.Schema.Any & Schema.Schema<A, any, unknown>) => Schema.filter<Schema.Schema.Any>;
export declare const textString: <A extends string>(self: Schema.Schema.Any & Schema.Schema<A, any, unknown>) => Schema.filter<Schema.Schema.Any>;
/**
 * Minimum length constraints
 */
export declare const minLength: (min: number) => <A extends string>(self: Schema.Schema.Any & Schema.Schema<A, any, unknown>) => Schema.filter<Schema.Schema.Any>;
export declare const maxLength: (max: number) => <A extends string>(self: Schema.Schema.Any & Schema.Schema<A, any, unknown>) => Schema.filter<Schema.Schema.Any>;
export declare const exactLength: (length: number) => <A extends string>(self: Schema.Schema.Any & Schema.Schema<A, any, unknown>) => Schema.filter<Schema.Schema.Any>;
/**
 * Positive number constraint
 */
export declare const positiveNumber: <A extends number>(self: Schema.Schema.Any & Schema.Schema<A, any, unknown>) => Schema.filter<Schema.Schema.Any>;
/**
 * Non-negative number constraint
 */
export declare const nonNegativeNumber: <A extends number>(self: Schema.Schema.Any & Schema.Schema<A, any, unknown>) => Schema.filter<Schema.Schema.Any>;
/**
 * Integer constraint
 */
export declare const integerNumber: <A extends number>(self: Schema.Schema.Any & Schema.Schema<A, any, unknown>) => Schema.filter<Schema.Schema.Any>;
/**
 * Number range constraints
 */
export declare const minNumber: (min: number) => <A extends number>(self: Schema.Schema.Any & Schema.Schema<A, any, unknown>) => Schema.filter<Schema.Schema.Any>;
export declare const maxNumber: (max: number) => <A extends number>(self: Schema.Schema.Any & Schema.Schema<A, any, unknown>) => Schema.filter<Schema.Schema.Any>;
export declare const numberRange: (min: number, max: number) => <A extends number>(self: Schema.Schema.Any & Schema.Schema<A, any, unknown>) => Schema.filter<Schema.Schema.Any>;
/**
 * Email field schema with validation and annotations
 */
export declare const emailSchema: Schema.refine<any, Schema.Schema.Any>;
/**
 * Username field schema with validation and annotations
 */
export declare const usernameSchema: Schema.refine<any, Schema.Schema.Any>;
/**
 * Password field schema with strong validation
 */
export declare const passwordSchema: Schema.refine<any, Schema.Schema.Any>;
/**
 * URL field schema with validation
 */
export declare const urlSchema: Schema.refine<any, Schema.Schema.Any>;
/**
 * UUID field schema with validation
 */
export declare const uuidSchema: Schema.refine<any, Schema.Schema.Any>;
/**
 * Slug field schema (URL-friendly string)
 */
export declare const slugSchema: Schema.refine<any, Schema.Schema.Any>;
/**
 * Age field schema with realistic constraints
 */
export declare const ageSchema: Schema.refine<any, Schema.Schema.Any>;
/**
 * Count field schema for non-negative integers
 */
export declare const countSchema: Schema.refine<any, Schema.Schema.Any>;
/**
 * Price field schema with decimal precision
 */
export declare const priceSchema: Schema.refine<any, Schema.Schema.Any>;
/**
 * ISO timestamp schema
 */
export declare const timestampSchema: Schema.refine<any, Schema.filter<Schema.Schema.Any>>;
/**
 * Create a custom string constraint with pattern and length
 */
export declare const customStringConstraint: (pattern: RegExp, minLen: number, maxLen: number, patternMessage: string) => Schema.filter<Schema.Schema.Any>;
/**
 * Create a custom number constraint with range
 */
export declare const customNumberConstraint: (min: number, max: number, integer?: boolean) => Schema.filter<Schema.Schema.Any>;
/**
 * Create an enum constraint with custom values
 */
export declare const enumConstraint: <T extends readonly [string, ...string[]]>(...values: T) => Schema.Literal<[...T]>;
export { Schema };
//# sourceMappingURL=index.d.ts.map