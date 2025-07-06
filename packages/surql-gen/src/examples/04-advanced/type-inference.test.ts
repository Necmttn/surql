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
 * Level 4: Advanced Type Inference and Conditional Schemas
 * 
 * This test demonstrates sophisticated type inference patterns,
 * conditional schemas, and dynamic schema generation based on runtime data.
 */
describe("Level 4: Type Inference", () => {
  describe("Conditional Schema Types", () => {
    it("should support conditional field validation", () => {
      // User schema with conditional validation based on user type
      const baseUserSchema = Schema.Struct({
        id: Schema.String,
        email: emailSchema,
        userType: Schema.Literal("individual", "business", "enterprise")
      });

      // Individual user - simple validation
      const individualUserSchema = baseUserSchema.pipe(
        Schema.extend(
          Schema.Struct({
            profile: Schema.Struct({
              firstName: Schema.String.pipe(nonEmptyString, maxLength(50)),
              lastName: Schema.String.pipe(nonEmptyString, maxLength(50)),
              dateOfBirth: Schema.optional(Schema.String)
            })
          })
        )
      ).annotations({
        userType: "individual",
        description: "Individual user account"
      });

      // Business user - additional business validation
      const businessUserSchema = baseUserSchema.pipe(
        Schema.extend(
          Schema.Struct({
            business: Schema.Struct({
              companyName: Schema.String.pipe(nonEmptyString, maxLength(100)),
              taxId: Schema.String.pipe(
                nonEmptyString,
                Schema.pattern(/^\d{2}-\d{7}$/, {
                  message: () => "Tax ID must be in format: XX-XXXXXXX"
                })
              ),
              industry: Schema.String.pipe(nonEmptyString),
              employeeCount: Schema.Number.pipe(
                Schema.int(),
                Schema.positive()
              )
            }),
            billingAddress: Schema.Struct({
              street: Schema.String.pipe(nonEmptyString),
              city: Schema.String.pipe(nonEmptyString),
              state: Schema.String.pipe(nonEmptyString),
              zipCode: Schema.String.pipe(
                nonEmptyString,
                Schema.pattern(/^\d{5}(-\d{4})?$/)
              ),
              country: Schema.String.pipe(nonEmptyString)
            })
          })
        )
      ).annotations({
        userType: "business",
        description: "Business user account with company information"
      });

      // Enterprise user - complex validation with custom requirements
      const enterpriseUserSchema = baseUserSchema.pipe(
        Schema.extend(
          Schema.Struct({
            enterprise: Schema.Struct({
              organizationName: Schema.String.pipe(nonEmptyString, maxLength(200)),
              domain: Schema.String.pipe(
                nonEmptyString,
                Schema.pattern(/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/, {
                  message: () => "Must be a valid domain name"
                })
              ),
              adminEmail: emailSchema,
              contractNumber: Schema.String.pipe(
                nonEmptyString,
                Schema.pattern(/^ENT-\d{8}$/, {
                  message: () => "Contract number must be in format: ENT-12345678"
                })
              ),
              tier: Schema.Literal("standard", "premium", "enterprise"),
              maxUsers: Schema.Number.pipe(Schema.int(), Schema.positive()),
              features: Schema.Array(Schema.String)
            }),
            compliance: Schema.Struct({
              gdprCompliant: Schema.Boolean,
              socCompliant: Schema.Boolean,
              hipaaRequired: Schema.Boolean,
              customTerms: Schema.optional(Schema.String)
            })
          })
        )
      ).annotations({
        userType: "enterprise",
        description: "Enterprise user account with compliance requirements"
      });

      // Test individual user
      const individualUser = {
        id: "user-123",
        email: "john@example.com",
        userType: "individual" as const,
        profile: {
          firstName: "John",
          lastName: "Doe",
          dateOfBirth: "1990-01-01"
        }
      };
      expect(() => Schema.decodeUnknownSync(individualUserSchema)(individualUser)).not.toThrow();

      // Test business user
      const businessUser = {
        id: "user-456",
        email: "admin@company.com",
        userType: "business" as const,
        business: {
          companyName: "Example Corp",
          taxId: "12-3456789",
          industry: "Technology",
          employeeCount: 50
        },
        billingAddress: {
          street: "123 Business St",
          city: "San Francisco",
          state: "CA",
          zipCode: "94105",
          country: "USA"
        }
      };
      expect(() => Schema.decodeUnknownSync(businessUserSchema)(businessUser)).not.toThrow();

      // Test enterprise user
      const enterpriseUser = {
        id: "user-789",
        email: "admin@enterprise.com",
        userType: "enterprise" as const,
        enterprise: {
          organizationName: "Enterprise Solutions Inc",
          domain: "enterprise.com",
          adminEmail: "admin@enterprise.com",
          contractNumber: "ENT-12345678",
          tier: "premium" as const,
          maxUsers: 1000,
          features: ["sso", "audit_logs", "advanced_analytics"]
        },
        compliance: {
          gdprCompliant: true,
          socCompliant: true,
          hipaaRequired: false
        }
      };
      expect(() => Schema.decodeUnknownSync(enterpriseUserSchema)(enterpriseUser)).not.toThrow();
    });

    it("should support dynamic schema selection", () => {
      // Dynamic schema factory based on configuration
      const createProductSchema = (category: string) => {
        const baseProduct = Schema.Struct({
          id: Schema.String,
          name: Schema.String.pipe(nonEmptyString, maxLength(200)),
          price: Schema.Number.pipe(Schema.positive()),
          category: Schema.Literal(category as any)
        });

        switch (category) {
          case "electronics":
            return baseProduct.pipe(
              Schema.extend(
                Schema.Struct({
                  specifications: Schema.Struct({
                    brand: Schema.String.pipe(nonEmptyString),
                    model: Schema.String.pipe(nonEmptyString),
                    warranty: Schema.String.pipe(nonEmptyString),
                    powerConsumption: Schema.optional(Schema.String),
                    dimensions: Schema.optional(Schema.Struct({
                      width: Schema.Number,
                      height: Schema.Number,
                      depth: Schema.Number,
                      unit: Schema.Literal("mm", "cm", "inches")
                    }))
                  }),
                  safety: Schema.Struct({
                    ceMarking: Schema.Boolean,
                    fccCompliant: Schema.Boolean,
                    rohs: Schema.Boolean
                  })
                })
              )
            );

          case "books":
            return baseProduct.pipe(
              Schema.extend(
                Schema.Struct({
                  publication: Schema.Struct({
                    author: Schema.String.pipe(nonEmptyString),
                    publisher: Schema.String.pipe(nonEmptyString),
                    isbn: Schema.String.pipe(
                      nonEmptyString,
                      Schema.pattern(/^(?:\d{9}X|\d{10}|\d{13})$/, {
                        message: () => "Invalid ISBN format"
                      })
                    ),
                    publishedDate: Schema.String,
                    edition: Schema.optional(Schema.String),
                    language: Schema.String.pipe(nonEmptyString)
                  }),
                  physical: Schema.Struct({
                    pages: Schema.Number.pipe(Schema.int(), Schema.positive()),
                    format: Schema.Literal("paperback", "hardcover", "ebook"),
                    weight: Schema.optional(Schema.Number)
                  })
                })
              )
            );

          case "clothing":
            return baseProduct.pipe(
              Schema.extend(
                Schema.Struct({
                  apparel: Schema.Struct({
                    brand: Schema.String.pipe(nonEmptyString),
                    material: Schema.String.pipe(nonEmptyString),
                    care: Schema.Array(Schema.String),
                    sizes: Schema.Array(Schema.Literal("XS", "S", "M", "L", "XL", "XXL")),
                    colors: Schema.Array(Schema.String),
                    gender: Schema.Literal("men", "women", "unisex", "kids")
                  }),
                  sustainability: Schema.optional(
                    Schema.Struct({
                      organic: Schema.Boolean,
                      fairTrade: Schema.Boolean,
                      recycled: Schema.Boolean,
                      certifications: Schema.Array(Schema.String)
                    })
                  )
                })
              )
            );

          default:
            return baseProduct;
        }
      };

      // Test electronics product
      const electronicsSchema = createProductSchema("electronics");
      const laptop = {
        id: "prod-1",
        name: "Gaming Laptop",
        price: 1299.99,
        category: "electronics",
        specifications: {
          brand: "TechBrand",
          model: "GB-15",
          warranty: "2 years",
          powerConsumption: "65W",
          dimensions: {
            width: 360,
            height: 25,
            depth: 270,
            unit: "mm" as const
          }
        },
        safety: {
          ceMarking: true,
          fccCompliant: true,
          rohs: true
        }
      };
      expect(() => Schema.decodeUnknownSync(electronicsSchema)(laptop)).not.toThrow();

      // Test book product
      const bookSchema = createProductSchema("books");
      const book = {
        id: "prod-2",
        name: "TypeScript Handbook",
        price: 29.99,
        category: "books",
        publication: {
          author: "Jane Author",
          publisher: "Tech Press",
          isbn: "9781234567890",
          publishedDate: "2024-01-15",
          edition: "3rd Edition",
          language: "English"
        },
        physical: {
          pages: 350,
          format: "paperback" as const,
          weight: 0.8
        }
      };
      expect(() => Schema.decodeUnknownSync(bookSchema)(book)).not.toThrow();

      // Test clothing product
      const clothingSchema = createProductSchema("clothing");
      const shirt = {
        id: "prod-3",
        name: "Organic Cotton T-Shirt",
        price: 24.99,
        category: "clothing",
        apparel: {
          brand: "EcoWear",
          material: "100% Organic Cotton",
          care: ["Machine wash cold", "Tumble dry low", "Do not bleach"],
          sizes: ["S", "M", "L", "XL"] as const,
          colors: ["White", "Black", "Navy", "Gray"],
          gender: "unisex" as const
        },
        sustainability: {
          organic: true,
          fairTrade: true,
          recycled: false,
          certifications: ["GOTS", "Fair Trade Certified"]
        }
      };
      expect(() => Schema.decodeUnknownSync(clothingSchema)(shirt)).not.toThrow();
    });
  });

  describe("Query Result Type Inference", () => {
    it("should infer types from query patterns", () => {
      // Base table schemas for type inference
      const UserSchema = Schema.Struct({
        id: Schema.String,
        username: Schema.String,
        email: Schema.String,
        profile: Schema.Struct({
          firstName: Schema.String,
          lastName: Schema.String,
          bio: Schema.optional(Schema.String)
        }),
        createdAt: Schema.String
      });

      const PostSchema = Schema.Struct({
        id: Schema.String,
        title: Schema.String,
        content: Schema.String,
        authorId: Schema.String,
        tags: Schema.Array(Schema.String),
        publishedAt: Schema.optional(Schema.String),
        createdAt: Schema.String
      });

      // Query result type inference helpers
      const createSelectSchema = <T extends Record<string, any>>(
        baseSchema: Schema.Schema<T>,
        fields: (keyof T)[]
      ) => {
        // In a real implementation, this would dynamically create a schema
        // with only the selected fields. For testing, we'll simulate this.
        return Schema.Struct(
          Object.fromEntries(
            fields.map(field => [
              field,
              (baseSchema as any).fields?.[field] || Schema.String
            ])
          ) as any
        );
      };

      // SELECT id, username, email FROM user
      const userListQuery = createSelectSchema(UserSchema, ["id", "username", "email"]);
      const userListResult = {
        id: "user-123",
        username: "johndoe",
        email: "john@example.com"
      };
      expect(() => Schema.decodeUnknownSync(userListQuery)(userListResult)).not.toThrow();

      // SELECT * FROM user WHERE id = $userId (single user)
      const singleUserResult = {
        id: "user-123",
        username: "johndoe",
        email: "john@example.com",
        profile: {
          firstName: "John",
          lastName: "Doe",
          bio: "Software developer"
        },
        createdAt: "2024-01-15T10:00:00Z"
      };
      expect(() => Schema.decodeUnknownSync(UserSchema)(singleUserResult)).not.toThrow();

      // JOIN query result type
      const userWithPostsSchema = Schema.Struct({
        id: Schema.String,
        username: Schema.String,
        email: Schema.String,
        posts: Schema.Array(
          Schema.Struct({
            id: Schema.String,
            title: Schema.String,
            publishedAt: Schema.optional(Schema.String)
          })
        )
      });

      const userWithPostsResult = {
        id: "user-123",
        username: "johndoe",
        email: "john@example.com",
        posts: [
          {
            id: "post-1",
            title: "My First Post",
            publishedAt: "2024-01-15T12:00:00Z"
          },
          {
            id: "post-2",
            title: "Another Post",
            publishedAt: "2024-01-16T10:00:00Z"
          }
        ]
      };
      expect(() => Schema.decodeUnknownSync(userWithPostsSchema)(userWithPostsResult)).not.toThrow();
    });

    it("should support aggregation result types", () => {
      // Aggregation query result schemas
      const userStatsSchema = Schema.Struct({
        totalUsers: Schema.Number,
        activeUsers: Schema.Number,
        averageAge: Schema.optional(Schema.Number),
        oldestUser: Schema.optional(Schema.String),
        newestUser: Schema.optional(Schema.String)
      }).annotations({
        queryType: "aggregation",
        description: "User statistics aggregation"
      });

      const postStatsSchema = Schema.Struct({
        totalPosts: Schema.Number,
        publishedPosts: Schema.Number,
        draftPosts: Schema.Number,
        averageLength: Schema.Number,
        topTags: Schema.Array(
          Schema.Struct({
            tag: Schema.String,
            count: Schema.Number
          })
        ),
        postsPerMonth: Schema.Array(
          Schema.Struct({
            month: Schema.String,
            count: Schema.Number
          })
        )
      }).annotations({
        queryType: "aggregation",
        description: "Post statistics aggregation"
      });

      // Test aggregation results
      const userStats = {
        totalUsers: 1500,
        activeUsers: 1200,
        averageAge: 28.5,
        oldestUser: "2020-01-01T00:00:00Z",
        newestUser: "2024-01-15T10:00:00Z"
      };
      expect(() => Schema.decodeUnknownSync(userStatsSchema)(userStats)).not.toThrow();

      const postStats = {
        totalPosts: 850,
        publishedPosts: 620,
        draftPosts: 230,
        averageLength: 1250.5,
        topTags: [
          { tag: "javascript", count: 45 },
          { tag: "typescript", count: 38 },
          { tag: "react", count: 32 }
        ],
        postsPerMonth: [
          { month: "2024-01", count: 25 },
          { month: "2024-02", count: 30 },
          { month: "2024-03", count: 28 }
        ]
      };
      expect(() => Schema.decodeUnknownSync(postStatsSchema)(postStats)).not.toThrow();
    });
  });

  describe("Complex Relationship Types", () => {
    it("should handle polymorphic relationships", () => {
      // Base content schema
      const baseContentSchema = Schema.Struct({
        id: Schema.String,
        title: Schema.String,
        createdAt: Schema.String,
        authorId: Schema.String
      });

      // Article content type
      const articleSchema = baseContentSchema.pipe(
        Schema.extend(
          Schema.Struct({
            type: Schema.Literal("article"),
            content: Schema.String,
            excerpt: Schema.String,
            readTime: Schema.Number,
            categories: Schema.Array(Schema.String)
          })
        )
      );

      // Video content type
      const videoSchema = baseContentSchema.pipe(
        Schema.extend(
          Schema.Struct({
            type: Schema.Literal("video"),
            videoUrl: Schema.String,
            duration: Schema.Number,
            thumbnail: Schema.String,
            quality: Schema.Literal("720p", "1080p", "4K"),
            transcript: Schema.optional(Schema.String)
          })
        )
      );

      // Podcast content type
      const podcastSchema = baseContentSchema.pipe(
        Schema.extend(
          Schema.Struct({
            type: Schema.Literal("podcast"),
            audioUrl: Schema.String,
            duration: Schema.Number,
            episodeNumber: Schema.Number,
            season: Schema.optional(Schema.Number),
            transcript: Schema.optional(Schema.String),
            guests: Schema.Array(Schema.String)
          })
        )
      );

      // Union type for all content
      const contentSchema = Schema.Union(articleSchema, videoSchema, podcastSchema);

      // Comment schema that can reference any content type
      const commentSchema = Schema.Struct({
        id: Schema.String,
        contentId: Schema.String,
        contentType: Schema.Literal("article", "video", "podcast"),
        authorId: Schema.String,
        content: Schema.String,
        parentId: Schema.optional(Schema.String),
        createdAt: Schema.String
      });

      // Test polymorphic content
      const article = {
        id: "content-1",
        type: "article" as const,
        title: "Understanding TypeScript",
        content: "TypeScript is a strongly typed programming language...",
        excerpt: "Learn the basics of TypeScript",
        readTime: 8,
        categories: ["programming", "typescript"],
        createdAt: "2024-01-15T10:00:00Z",
        authorId: "user-123"
      };
      expect(() => Schema.decodeUnknownSync(contentSchema)(article)).not.toThrow();

      const video = {
        id: "content-2",
        type: "video" as const,
        title: "TypeScript Tutorial",
        videoUrl: "https://example.com/video.mp4",
        duration: 1800,
        thumbnail: "https://example.com/thumb.jpg",
        quality: "1080p" as const,
        createdAt: "2024-01-16T10:00:00Z",
        authorId: "user-456"
      };
      expect(() => Schema.decodeUnknownSync(contentSchema)(video)).not.toThrow();

      const podcast = {
        id: "content-3",
        type: "podcast" as const,
        title: "TypeScript Deep Dive",
        audioUrl: "https://example.com/podcast.mp3",
        duration: 3600,
        episodeNumber: 15,
        season: 2,
        guests: ["Jane Developer", "John Expert"],
        createdAt: "2024-01-17T10:00:00Z",
        authorId: "user-789"
      };
      expect(() => Schema.decodeUnknownSync(contentSchema)(podcast)).not.toThrow();

      // Test comment referencing different content types
      const articleComment = {
        id: "comment-1",
        contentId: "content-1",
        contentType: "article" as const,
        authorId: "user-999",
        content: "Great article!",
        createdAt: "2024-01-15T11:00:00Z"
      };
      expect(() => Schema.decodeUnknownSync(commentSchema)(articleComment)).not.toThrow();
    });

    it("should support nested relationship validation", () => {
      // Organization hierarchy schema
      const organizationSchema = Schema.Struct({
        id: Schema.String,
        name: Schema.String,
        type: Schema.Literal("company", "department", "team"),
        parentId: Schema.optional(Schema.String),
        managerId: Schema.String,
        members: Schema.Array(Schema.String),
        budget: Schema.optional(Schema.Number),
        settings: Schema.Struct({
          visibility: Schema.Literal("public", "internal", "private"),
          allowSubOrgs: Schema.Boolean,
          maxMembers: Schema.optional(Schema.Number)
        })
      });

      // Project schema with complex relationships
      const projectSchema = Schema.Struct({
        id: Schema.String,
        name: Schema.String,
        organizationId: Schema.String,
        leadId: Schema.String,
        teamMembers: Schema.Array(
          Schema.Struct({
            userId: Schema.String,
            role: Schema.Literal("developer", "designer", "tester", "manager"),
            permissions: Schema.Array(Schema.String),
            joinedAt: Schema.String
          })
        ),
        milestones: Schema.Array(
          Schema.Struct({
            id: Schema.String,
            title: Schema.String,
            dueDate: Schema.String,
            status: Schema.Literal("planning", "in_progress", "completed", "overdue"),
            assignedTo: Schema.Array(Schema.String),
            dependencies: Schema.Array(Schema.String)
          })
        ),
        budget: Schema.Struct({
          allocated: Schema.Number,
          spent: Schema.Number,
          currency: Schema.String,
          approvedBy: Schema.String
        }),
        status: Schema.Literal("draft", "active", "on_hold", "completed", "cancelled"),
        metadata: Schema.Struct({
          createdAt: Schema.String,
          updatedAt: Schema.String,
          createdBy: Schema.String,
          tags: Schema.Array(Schema.String),
          priority: Schema.Literal("low", "medium", "high", "critical")
        })
      });

      // Test organization
      const organization = {
        id: "org-1",
        name: "Engineering Department",
        type: "department" as const,
        parentId: "org-0",
        managerId: "user-123",
        members: ["user-456", "user-789", "user-101"],
        budget: 500000,
        settings: {
          visibility: "internal" as const,
          allowSubOrgs: true,
          maxMembers: 50
        }
      };
      expect(() => Schema.decodeUnknownSync(organizationSchema)(organization)).not.toThrow();

      // Test complex project
      const project = {
        id: "proj-1",
        name: "New Customer Portal",
        organizationId: "org-1",
        leadId: "user-123",
        teamMembers: [
          {
            userId: "user-456",
            role: "developer" as const,
            permissions: ["read", "write", "deploy"],
            joinedAt: "2024-01-01T00:00:00Z"
          },
          {
            userId: "user-789",
            role: "designer" as const,
            permissions: ["read", "write"],
            joinedAt: "2024-01-02T00:00:00Z"
          }
        ],
        milestones: [
          {
            id: "milestone-1",
            title: "Design Phase",
            dueDate: "2024-02-15T00:00:00Z",
            status: "completed" as const,
            assignedTo: ["user-789"],
            dependencies: []
          },
          {
            id: "milestone-2",
            title: "Development Phase",
            dueDate: "2024-04-15T00:00:00Z",
            status: "in_progress" as const,
            assignedTo: ["user-456"],
            dependencies: ["milestone-1"]
          }
        ],
        budget: {
          allocated: 75000,
          spent: 25000,
          currency: "USD",
          approvedBy: "user-123"
        },
        status: "active" as const,
        metadata: {
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-15T10:00:00Z",
          createdBy: "user-123",
          tags: ["customer-facing", "high-priority"],
          priority: "high" as const
        }
      };
      expect(() => Schema.decodeUnknownSync(projectSchema)(project)).not.toThrow();
    });
  });

  describe("Dynamic Schema Generation", () => {
    it("should generate schemas from configuration", () => {
      // Configuration-driven schema generator
      interface FieldConfig {
        name: string;
        type: "string" | "number" | "boolean" | "array" | "object";
        required?: boolean;
        validation?: {
          min?: number;
          max?: number;
          pattern?: string;
          options?: string[];
        };
        nested?: FieldConfig[];
      }

      const generateSchemaFromConfig = (fields: FieldConfig[]): any => {
        const schemaFields: Record<string, any> = {};

        for (const field of fields) {
          let fieldSchema: any;

          switch (field.type) {
            case "string":
              fieldSchema = Schema.String;
              if (field.validation?.min) {
                fieldSchema = fieldSchema.pipe(Schema.minLength(field.validation.min));
              }
              if (field.validation?.max) {
                fieldSchema = fieldSchema.pipe(Schema.maxLength(field.validation.max));
              }
              if (field.validation?.pattern) {
                fieldSchema = fieldSchema.pipe(
                  Schema.pattern(new RegExp(field.validation.pattern))
                );
              }
              if (field.validation?.options) {
                fieldSchema = Schema.Literal(...field.validation.options as any);
              }
              break;

            case "number":
              fieldSchema = Schema.Number;
              if (field.validation?.min !== undefined) {
                fieldSchema = fieldSchema.pipe(Schema.greaterThanOrEqualTo(field.validation.min));
              }
              if (field.validation?.max !== undefined) {
                fieldSchema = fieldSchema.pipe(Schema.lessThanOrEqualTo(field.validation.max));
              }
              break;

            case "boolean":
              fieldSchema = Schema.Boolean;
              break;

            case "array":
              fieldSchema = Schema.Array(Schema.String); // Simplified for test
              break;

            case "object":
              if (field.nested) {
                fieldSchema = generateSchemaFromConfig(field.nested);
              } else {
                fieldSchema = Schema.Record(Schema.String, Schema.Any);
              }
              break;

            default:
              fieldSchema = Schema.String;
          }

          if (!field.required) {
            fieldSchema = Schema.optional(fieldSchema);
          }

          schemaFields[field.name] = fieldSchema;
        }

        return Schema.Struct(schemaFields);
      };

      // Test configuration
      const formConfig: FieldConfig[] = [
        {
          name: "title",
          type: "string",
          required: true,
          validation: { min: 5, max: 100 }
        },
        {
          name: "status",
          type: "string",
          required: true,
          validation: { options: ["draft", "published", "archived"] }
        },
        {
          name: "priority",
          type: "number",
          required: false,
          validation: { min: 1, max: 10 }
        },
        {
          name: "metadata",
          type: "object",
          required: false,
          nested: [
            {
              name: "author",
              type: "string",
              required: true
            },
            {
              name: "tags",
              type: "array",
              required: false
            }
          ]
        }
      ];

      const dynamicSchema = generateSchemaFromConfig(formConfig);

      // Test generated schema
      const validData = {
        title: "Test Article",
        status: "published",
        priority: 5,
        metadata: {
          author: "John Doe",
          tags: ["test", "article"]
        }
      };
      expect(() => Schema.decodeUnknownSync(dynamicSchema)(validData)).not.toThrow();

      // Test invalid data
      const invalidData = {
        title: "Hi", // too short
        status: "invalid", // not in options
        priority: 15 // too high
      };
      expect(() => Schema.decodeUnknownSync(dynamicSchema)(invalidData)).toThrow();
    });

    it("should support runtime schema modification", () => {
      // Runtime schema extension system
      class DynamicSchemaBuilder {
        private baseSchema: any;
        private extensions: Map<string, any> = new Map();

        constructor(baseSchema: any) {
          this.baseSchema = baseSchema;
        }

        addField(name: string, schema: any) {
          this.extensions.set(name, schema);
          return this;
        }

        removeField(name: string) {
          this.extensions.delete(name);
          return this;
        }

        build() {
          if (this.extensions.size === 0) {
            return this.baseSchema;
          }

          const extensionFields = Object.fromEntries(this.extensions);
          return this.baseSchema.pipe(
            Schema.extend(Schema.Struct(extensionFields))
          );
        }

        getFieldNames() {
          // This would normally extract from schema AST
          return Array.from(this.extensions.keys());
        }
      }

      // Base user schema
      const baseUserSchema = Schema.Struct({
        id: Schema.String,
        username: Schema.String,
        email: Schema.String
      });

      const builder = new DynamicSchemaBuilder(baseUserSchema);

      // Add fields dynamically
      builder.addField("firstName", Schema.String.pipe(nonEmptyString));
      builder.addField("lastName", Schema.String.pipe(nonEmptyString));
      builder.addField("age", Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())));

      const extendedSchema = builder.build();

      // Test extended schema
      const userData = {
        id: "user-123",
        username: "johndoe",
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
        age: 30
      };
      expect(() => Schema.decodeUnknownSync(extendedSchema)(userData)).not.toThrow();

      // Test field management
      expect(builder.getFieldNames()).toEqual(["firstName", "lastName", "age"]);

      // Remove a field and rebuild
      builder.removeField("age");
      const modifiedSchema = builder.build();

      const userDataWithoutAge = {
        id: "user-123",
        username: "johndoe",
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe"
      };
      expect(() => Schema.decodeUnknownSync(modifiedSchema)(userDataWithoutAge)).not.toThrow();
    });
  });
});