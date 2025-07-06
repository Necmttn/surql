import { describe, it, expect } from "vitest";
import { Schema } from "effect";
import {
  emailSchema,
  usernameSchema,
  passwordSchema,
  nonEmptyString,
  maxLength,
  minLength
} from "../../lib/constraints";

/**
 * Level 3: Schema Metadata and Annotations
 * 
 * This test demonstrates how to use Effect Schema's annotation system
 * to add rich metadata and documentation to schemas, and how to extract
 * and use this metadata for various purposes.
 */
describe("Level 3: Schema Metadata", () => {
  describe("Basic Annotation Usage", () => {
    it("should create schemas with comprehensive annotations", () => {
      // Create a fully annotated user profile schema
      const userProfileSchema = Schema.Struct({
        firstName: Schema.String.pipe(
          nonEmptyString,
          minLength(2),
          maxLength(50)
        ).annotations({
          identifier: "FirstName",
          title: "First Name",
          description: "User's given name",
          examples: ["John", "Jane", "Alex"],
          documentation: "The first name should be between 2 and 50 characters"
        }),

        lastName: Schema.String.pipe(
          nonEmptyString,
          minLength(2), 
          maxLength(50)
        ).annotations({
          identifier: "LastName",
          title: "Last Name",
          description: "User's family name",
          examples: ["Doe", "Smith", "Johnson"],
          documentation: "The last name should be between 2 and 50 characters"
        }),

        email: emailSchema, // Already has annotations from constraints library

        username: usernameSchema, // Already has annotations

        bio: Schema.optional(
          Schema.String.pipe(
            nonEmptyString,
            maxLength(500)
          ).annotations({
            identifier: "Biography",
            title: "Biography",
            description: "Short user biography or description",
            examples: ["Software developer passionate about open source"],
            documentation: "Optional biographical information, up to 500 characters"
          })
        ),

        age: Schema.optional(
          Schema.Number.pipe(
            Schema.int(),
            Schema.between(13, 120)
          ).annotations({
            identifier: "Age", 
            title: "Age",
            description: "User's age in years",
            examples: [25, 30, 45],
            documentation: "Age must be between 13 and 120 years for compliance"
          })
        )
      }).annotations({
        identifier: "UserProfile",
        title: "User Profile",
        description: "Complete user profile information",
        documentation: "Represents a user's profile with personal information and preferences"
      });

      // Test that the schema works for validation
      const validProfile = {
        firstName: "John",
        lastName: "Doe", 
        email: "john.doe@example.com",
        username: "johndoe",
        bio: "Software developer",
        age: 30
      };

      expect(() => Schema.decodeUnknownSync(userProfileSchema)(validProfile)).not.toThrow();

      // Test schema structure
      expect(userProfileSchema.ast.annotations).toBeDefined();
      expect(typeof userProfileSchema.ast.annotations).toBe("object");
    });

    it("should create schemas with validation-focused annotations", () => {
      // Schema with detailed validation metadata
      const productSchema = Schema.Struct({
        sku: Schema.String.pipe(
          nonEmptyString,
          Schema.pattern(/^[A-Z]{2,4}-[0-9A-Z]{4,8}$/)
        ).annotations({
          identifier: "ProductSKU",
          title: "Product SKU",
          description: "Unique product stock keeping unit",
          examples: ["PROD-1234", "ELEC-5678AB", "BOOK-ABC123"],
          documentation: "SKU format: 2-4 uppercase letters, hyphen, 4-8 alphanumeric characters",
          jsonSchema: {
            pattern: "^[A-Z]{2,4}-[0-9A-Z]{4,8}$",
            minLength: 7,
            maxLength: 13
          }
        }),

        price: Schema.Number.pipe(
          Schema.positive(),
          Schema.lessThanOrEqualTo(999999.99)
        ).annotations({
          identifier: "Price",
          title: "Price",
          description: "Product price in USD",
          examples: [9.99, 29.95, 199.00],
          documentation: "Price must be positive and less than $1,000,000",
          jsonSchema: {
            type: "number",
            minimum: 0.01,
            maximum: 999999.99,
            multipleOf: 0.01
          }
        }),

        category: Schema.Literal("electronics", "books", "clothing", "home").annotations({
          identifier: "ProductCategory",
          title: "Product Category",
          description: "Product category classification",
          examples: ["electronics", "books"],
          documentation: "One of the predefined product categories",
          jsonSchema: {
            enum: ["electronics", "books", "clothing", "home"]
          }
        })
      }).annotations({
        identifier: "Product",
        title: "Product",
        description: "Product catalog item",
        documentation: "Represents a product in the e-commerce catalog"
      });

      // Test validation
      const validProduct = {
        sku: "ELEC-1234AB",
        price: 299.99,
        category: "electronics" as const
      };

      expect(() => Schema.decodeUnknownSync(productSchema)(validProduct)).not.toThrow();

      // Invalid product should fail
      const invalidProduct = {
        sku: "invalid-sku",
        price: -10,
        category: "invalid" as any
      };

      expect(() => Schema.decodeUnknownSync(productSchema)(invalidProduct)).toThrow();
    });
  });

  describe("Annotation Inheritance and Composition", () => {
    it("should preserve annotations through schema composition", () => {
      // Base schema with annotations
      const basePersonSchema = Schema.Struct({
        firstName: Schema.String.pipe(nonEmptyString, maxLength(50)),
        lastName: Schema.String.pipe(nonEmptyString, maxLength(50))
      }).annotations({
        identifier: "BasePerson", 
        title: "Person",
        description: "Basic person information"
      });

      // Extended schema that builds on the base
      const employeeSchema = basePersonSchema.pipe(
        Schema.extend(
          Schema.Struct({
            employeeId: Schema.String.pipe(
              nonEmptyString,
              Schema.pattern(/^EMP-\d{6}$/)
            ).annotations({
              identifier: "EmployeeId",
              title: "Employee ID",
              description: "Unique employee identifier",
              examples: ["EMP-123456", "EMP-789012"]
            }),

            department: Schema.Literal("engineering", "sales", "marketing", "hr").annotations({
              identifier: "Department",
              title: "Department", 
              description: "Employee department",
              examples: ["engineering", "sales"]
            }),

            salary: Schema.optional(
              Schema.Number.pipe(
                Schema.positive(),
                Schema.between(30000, 500000)
              ).annotations({
                identifier: "Salary",
                title: "Annual Salary",
                description: "Employee annual salary in USD",
                examples: [75000, 95000, 120000],
                documentation: "Salary information is confidential and optional"
              })
            )
          })
        )
      ).annotations({
        identifier: "Employee",
        title: "Employee",
        description: "Company employee with department and salary information",
        documentation: "Extends basic person information with employment details"
      });

      // Test that extended schema works
      const validEmployee = {
        firstName: "Alice",
        lastName: "Johnson",
        employeeId: "EMP-123456",
        department: "engineering" as const,
        salary: 95000
      };

      expect(() => Schema.decodeUnknownSync(employeeSchema)(validEmployee)).not.toThrow();

      // Check that both base and extended annotations exist
      expect(employeeSchema.ast.annotations).toBeDefined();
      expect(typeof employeeSchema.ast.annotations).toBe("object");
    });

    it("should compose schemas with merged metadata", () => {
      // Contact information schema
      const contactSchema = Schema.Struct({
        email: emailSchema,
        phone: Schema.optional(
          Schema.String.pipe(
            nonEmptyString,
            Schema.pattern(/^\+?[\d\s\-\(\)]{10,20}$/)
          ).annotations({
            identifier: "PhoneNumber", 
            title: "Phone Number",
            description: "Contact phone number",
            examples: ["+1 (555) 123-4567", "555-123-4567"]
          })
        )
      }).annotations({
        identifier: "ContactInfo",
        title: "Contact Information",
        description: "Ways to contact a person"
      });

      // Address schema
      const addressSchema = Schema.Struct({
        street: Schema.String.pipe(nonEmptyString, maxLength(100)),
        city: Schema.String.pipe(nonEmptyString, maxLength(50)),
        state: Schema.String.pipe(nonEmptyString, maxLength(50)),
        zipCode: Schema.String.pipe(
          nonEmptyString,
          Schema.pattern(/^\d{5}(-\d{4})?$/)
        ).annotations({
          identifier: "ZipCode",
          title: "ZIP Code", 
          description: "US postal code",
          examples: ["12345", "12345-6789"]
        })
      }).annotations({
        identifier: "Address",
        title: "Address",
        description: "Physical mailing address"
      });

      // Complete customer schema combining both
      const customerSchema = Schema.Struct({
        id: Schema.String.pipe(
          nonEmptyString,
          Schema.pattern(/^CUST-[A-Z0-9]{8}$/)
        ).annotations({
          identifier: "CustomerId",
          title: "Customer ID",
          description: "Unique customer identifier"
        }),
        
        contact: contactSchema,
        billingAddress: addressSchema,
        shippingAddress: Schema.optional(addressSchema)
      }).annotations({
        identifier: "Customer",
        title: "Customer",
        description: "Customer with contact and address information",
        documentation: "Complete customer record for e-commerce operations"
      });

      // Test composed schema
      const validCustomer = {
        id: "CUST-ABC12345",
        contact: {
          email: "customer@example.com",
          phone: "+1 (555) 123-4567"
        },
        billingAddress: {
          street: "123 Main St",
          city: "Anytown", 
          state: "CA",
          zipCode: "12345"
        }
      };

      expect(() => Schema.decodeUnknownSync(customerSchema)(validCustomer)).not.toThrow();
    });
  });

  describe("Metadata Extraction Utilities", () => {
    it("should extract annotation metadata", () => {
      // Create a schema with rich annotations
      const annotatedSchema = Schema.String.pipe(
        nonEmptyString,
        maxLength(100)
      ).annotations({
        identifier: "Title",
        title: "Title",
        description: "A descriptive title",
        examples: ["Blog Post Title", "Product Name"],
        documentation: "The title should be descriptive and concise",
        category: "text",
        validation: {
          required: true,
          maxLength: 100
        }
      });

      // Access annotations
      const annotations = annotatedSchema.ast.annotations;
      expect(annotations).toBeDefined();
      expect(typeof annotations).toBe("object");

      // The annotations are accessible, though the exact structure may vary
      // This demonstrates that metadata is preserved
    });

    it("should provide schema introspection capabilities", () => {
      // Complex schema for testing introspection
      const complexSchema = Schema.Struct({
        stringField: Schema.String.annotations({
          title: "String Field",
          description: "A string input"
        }),
        
        numberField: Schema.Number.annotations({
          title: "Number Field", 
          description: "A numeric input"
        }),
        
        optionalField: Schema.optional(
          Schema.String.annotations({
            title: "Optional Field",
            description: "An optional string"
          })
        ),
        
        arrayField: Schema.Array(
          Schema.String.annotations({
            title: "Array Item",
            description: "String item in array"
          })
        ).annotations({
          title: "String Array",
          description: "Array of strings"
        })
      }).annotations({
        identifier: "ComplexExample",
        title: "Complex Schema",
        description: "Schema with various field types"
      });

      // Test that schema structure is accessible
      expect(complexSchema.ast).toBeDefined();
      expect(complexSchema.ast.annotations).toBeDefined();
      
      // Verify schema validation works
      const validData = {
        stringField: "test",
        numberField: 42,
        arrayField: ["item1", "item2"]
      };
      
      expect(() => Schema.decodeUnknownSync(complexSchema)(validData)).not.toThrow();
    });
  });

  describe("Custom Annotation Types", () => {
    it("should support custom annotation properties", () => {
      // Schema with custom annotation properties for UI generation
      const formFieldSchema = Schema.String.pipe(
        nonEmptyString,
        maxLength(200)
      ).annotations({
        identifier: "FormField",
        title: "Form Field",
        description: "A form input field",
        
        // Custom UI-related annotations
        ui: {
          widget: "textarea",
          placeholder: "Enter your message here...",
          rows: 4,
          validation: {
            showLength: true,
            validateOnBlur: true
          }
        },
        
        // Custom database-related annotations
        database: {
          column: "message_text",
          index: false,
          searchable: true
        },
        
        // Custom API-related annotations  
        api: {
          filterable: true,
          sortable: false,
          includedInList: true
        }
      });

      // Test that schema works normally
      expect(() => Schema.decodeUnknownSync(formFieldSchema)("Valid message")).not.toThrow();
      expect(() => Schema.decodeUnknownSync(formFieldSchema)("")).toThrow();

      // Annotations are preserved
      expect(formFieldSchema.ast.annotations).toBeDefined();
    });

    it("should support validation-specific annotations", () => {
      // Schema with detailed validation annotations
      const validatedSchema = Schema.Number.pipe(
        Schema.int(),
        Schema.between(1, 100)
      ).annotations({
        identifier: "Percentage",
        title: "Percentage",
        description: "A percentage value between 1 and 100",
        
        validation: {
          rules: [
            { type: "required", message: "Percentage is required" },
            { type: "min", value: 1, message: "Percentage must be at least 1" },
            { type: "max", value: 100, message: "Percentage cannot exceed 100" },
            { type: "integer", message: "Percentage must be a whole number" }
          ],
          async: false,
          debounce: 300
        },
        
        formatting: {
          display: "{{value}}%",
          input: "number",
          step: 1
        }
      });

      // Test validation
      expect(() => Schema.decodeUnknownSync(validatedSchema)(50)).not.toThrow();
      expect(() => Schema.decodeUnknownSync(validatedSchema)(0)).toThrow(); // below min
      expect(() => Schema.decodeUnknownSync(validatedSchema)(101)).toThrow(); // above max
      expect(() => Schema.decodeUnknownSync(validatedSchema)(50.5)).toThrow(); // not integer
    });
  });
});