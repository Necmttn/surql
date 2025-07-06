/**
 * Step 3: Schema.annotations() for Rich Metadata
 * 
 * This demonstrates how to use Effect Schema's .annotations() to add rich metadata,
 * documentation, and tooling information to your schemas.
 */

import { Schema } from "effect";
import { SurrealTable, SurrealField } from "@necmttn/surql-schema";

console.log("📝 Step 3: Schema.annotations() for Rich Metadata");
console.log("🎯 Goal: Add comprehensive documentation and metadata with .annotations()\n");

// ========================================
// 1. Create Annotated Schema Components
// ========================================

console.log("1️⃣  Creating schemas with rich annotations...\n");

/**
 * Email schema with comprehensive annotations
 */
const AnnotatedEmail = Schema.String.pipe(
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    title: "Email",
    description: "Must be a valid email address",
  }),
  Schema.brand("Email")
).annotations({
  title: "Email Address",
  description: "RFC 5322 compliant email address for user identification",
  examples: ["user@example.com", "john.doe+label@company.co.uk"],
  documentation: "Used throughout the system for user identification and notifications",
  jsonSchema: {
    format: "email",
    minLength: 5,
    maxLength: 254
  },
  message: () => "Please enter a valid email address (e.g., user@example.com)",
  surrealdb: {
    indexed: true,
    unique: true,
    permission: "user can read/write their own email"
  }
});

/**
 * Username schema with validation annotations
 */
const AnnotatedUsername = Schema.String.pipe(
  Schema.pattern(/^[a-zA-Z0-9_]{3,20}$/, {
    title: "Username",
    description: "3-20 characters, alphanumeric and underscore only",
  }),
  Schema.brand("Username")
).annotations({
  title: "User Handle",
  description: "Unique user identifier for public display and mentions",
  examples: ["john_doe", "user123", "developer_jane"],
  documentation: "Usernames are case-sensitive and must be unique across the platform",
  jsonSchema: {
    pattern: "^[a-zA-Z0-9_]{3,20}$",
    minLength: 3,
    maxLength: 20
  },
  message: () => "Username must be 3-20 characters using letters, numbers, or underscores",
  surrealdb: {
    indexed: true,
    unique: true,
    searchable: true
  },
  validation: {
    reservedWords: ["admin", "root", "system", "api", "www"],
    caseSensitive: true,
    allowedChars: "alphanumeric and underscore"
  }
});

/**
 * Rich content text with semantic annotations
 */
const RichContent = Schema.String.pipe(
  Schema.minLength(1, { message: () => "Content cannot be empty" }),
  Schema.maxLength(10000, { message: () => "Content too long (max 10,000 characters)" })
).annotations({
  title: "Rich Content",
  description: "User-generated content supporting markdown and mentions",
  examples: [
    "Hello **world**! Check out @john_doe's latest project.",
    "# My Blog Post\n\nThis is some *rich* content with [links](https://example.com)."
  ],
  documentation: "Supports CommonMark markdown syntax and @username mentions",
  jsonSchema: {
    contentMediaType: "text/markdown",
    minLength: 1,
    maxLength: 10000
  },
  features: {
    markdown: true,
    mentions: true,
    hashtags: false,
    emojis: true
  },
  processing: {
    sanitize: true,
    extractMentions: true,
    renderToHtml: true
  }
});

/**
 * Score with business logic annotations
 */
const QualityScore = Schema.Number.pipe(
  Schema.int({ message: () => "Score must be a whole number" }),
  Schema.between(0, 100, { message: () => "Score must be between 0 and 100" }),
  Schema.brand("QualityScore")
).annotations({
  title: "Quality Score",
  description: "Algorithmic quality rating from 0 (lowest) to 100 (highest)",
  examples: [85, 72, 91],
  documentation: "Calculated based on engagement, completeness, and user feedback",
  jsonSchema: {
    type: "integer",
    minimum: 0,
    maximum: 100
  },
  businessLogic: {
    calculation: "weighted average of engagement (40%), completeness (35%), feedback (25%)",
    updateFrequency: "daily",
    impactOnRecommendations: "high"
  },
  display: {
    format: "percentage",
    colorCoding: {
      "0-30": "red",
      "31-70": "yellow", 
      "71-100": "green"
    }
  }
});

/**
 * URL with security annotations
 */
const SecureUrl = Schema.String.pipe(
  Schema.pattern(/^https?:\/\/[^\s/$.?#].[^\s]*$/, {
    title: "URL",
    description: "Valid HTTP or HTTPS URL",
  }),
  Schema.brand("SecureUrl")
).annotations({
  title: "Secure URL",
  description: "HTTP/HTTPS URL with security validation",
  examples: ["https://example.com", "https://api.example.com/v1/users"],
  documentation: "All URLs are validated for safety and accessibility",
  jsonSchema: {
    format: "uri",
    pattern: "^https?://"
  },
  security: {
    allowedProtocols: ["http", "https"],
    blockedDomains: ["malicious.com", "spam.net"],
    requireHttps: false,
    validateDomain: true,
    checkReachability: false
  },
  validation: {
    maxLength: 2048,
    checkDNS: false,
    allowPrivateIPs: false
  }
});

console.log("✅ Created annotated schemas:");
console.log("   • AnnotatedEmail - with validation, examples, and SurrealDB hints");
console.log("   • AnnotatedUsername - with business rules and reserved words");
console.log("   • RichContent - with markdown features and processing hints");
console.log("   • QualityScore - with business logic and display formatting");
console.log("   • SecureUrl - with security validation and domain checking\n");

// ========================================
// 2. Extract and Display Annotations
// ========================================

console.log("2️⃣  Extracting annotation metadata...\n");

/**
 * Helper function to extract annotations from a schema
 */
function extractAnnotations(schema: Schema.Schema<any>, name: string) {
  const ast = schema.ast;
  
  console.log(`📋 ${name} Annotations:`);
  
  // Navigate through transformations to find annotations
  let currentAst = ast;
  while (currentAst._tag === "Transformation") {
    if (currentAst.annotations) {
      Object.entries(currentAst.annotations).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          console.log(`   ${key}: ${JSON.stringify(value, null, 2)}`);
        } else {
          console.log(`   ${key}: ${value}`);
        }
      });
    }
    currentAst = currentAst.from;
  }
  
  // Check final AST for annotations
  if (currentAst.annotations) {
    Object.entries(currentAst.annotations).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        console.log(`   ${key}: ${JSON.stringify(value, null, 2)}`);
      } else {
        console.log(`   ${key}: ${value}`);
      }
    });
  }
  
  console.log();
}

// Extract annotations from our schemas
extractAnnotations(AnnotatedEmail, "Email");
extractAnnotations(AnnotatedUsername, "Username");
extractAnnotations(QualityScore, "QualityScore");

// ========================================
// 3. Create Comprehensive Table Schema
// ========================================

console.log("3️⃣  Creating comprehensive table with annotated fields...\n");

/**
 * Blog post table with rich annotations
 */
const blogPostTable = SurrealTable.create("blog_post", [
  SurrealField.id("blog_post"),
  
  // Title with SEO annotations
  SurrealField.string("title")
    .withDescription("SEO-optimized blog post title (recommended 50-60 characters)")
    .annotations({
      seo: {
        recommendedLength: "50-60 characters",
        includeKeywords: true,
        avoidClickbait: true
      },
      validation: {
        minLength: 5,
        maxLength: 120,
        forbiddenWords: ["clickbait", "you-wont-believe"]
      }
    }),
  
  // Slug with URL annotations  
  SurrealField.string("slug")
    .unique()
    .withDescription("URL-friendly identifier derived from title")
    .annotations({
      generation: {
        source: "title",
        transform: "lowercase, replace spaces with hyphens, remove special chars",
        maxLength: 80
      },
      url: {
        baseUrl: "https://blog.example.com/posts/",
        permanent: true,
        canonical: true
      }
    }),
    
  // Rich content
  SurrealField.string("content")
    .withDescription("Main blog post content in markdown format")
    .annotations({
      format: "markdown",
      features: ["headings", "links", "images", "code-blocks"],
      processing: {
        sanitize: true,
        generateTOC: true,
        estimateReadTime: true
      }
    }),
    
  // Author relationship with business annotations
  SurrealField.record("author", "user")
    .withDescription("Blog post author")
    .annotations({
      relationship: {
        type: "many-to-one",
        cascadeDelete: false,
        permissions: "author can edit their own posts"
      },
      display: {
        showName: true,
        showAvatar: true,
        linkToProfile: true
      }
    }),
    
  // Publication status with workflow annotations
  SurrealField.enum("status", ["draft", "review", "published", "archived"])
    .default("'draft'")
    .withDescription("Publication workflow status")
    .annotations({
      workflow: {
        transitions: {
          "draft": ["review", "archived"],
          "review": ["draft", "published", "archived"],
          "published": ["archived"],
          "archived": ["draft"]
        },
        permissions: {
          "draft": "author",
          "review": "editor",
          "published": "editor",
          "archived": "admin"
        }
      },
      display: {
        badges: {
          "draft": { color: "gray", text: "Draft" },
          "review": { color: "yellow", text: "Under Review" },
          "published": { color: "green", text: "Published" },
          "archived": { color: "red", text: "Archived" }
        }
      }
    }),
    
  // Quality score
  SurrealField.number("quality_score")
    .default("0")
    .withDescription("Algorithmic quality rating (0-100)")
    .annotations({
      algorithm: {
        factors: ["readability", "engagement", "seo_score", "user_feedback"],
        weights: [0.3, 0.3, 0.2, 0.2],
        updateFrequency: "hourly"
      },
      display: {
        format: "integer",
        showBadge: true,
        colorThresholds: { good: 80, fair: 60, poor: 0 }
      }
    }),
    
  // Tags with categorization annotations
  SurrealField.array("tags", "string")
    .default("[]")
    .withDescription("Content categorization tags")
    .annotations({
      categorization: {
        maxTags: 10,
        suggestFromContent: true,
        hierarchical: false
      },
      seo: {
        useAsKeywords: true,
        includeInMeta: true
      },
      validation: {
        minLength: 2,
        maxLength: 30,
        allowedChars: "alphanumeric, hyphens, spaces"
      }
    }),
    
  // Timestamps with audit annotations
  SurrealField.datetime("created_at")
    .default("time::now()")
    .withDescription("Creation timestamp")
    .annotations({
      audit: {
        immutable: true,
        timezone: "UTC",
        precision: "second"
      }
    }),
    
  SurrealField.datetime("updated_at")
    .default("time::now()")
    .withDescription("Last modification timestamp")
    .annotations({
      audit: {
        autoUpdate: true,
        timezone: "UTC",
        trackChanges: true
      }
    }),
    
  SurrealField.datetime("published_at")
    .optional()
    .withDescription("Publication timestamp")
    .annotations({
      business: {
        setOnPublish: true,
        immutableAfterPublish: true,
        affectsSearch: true
      }
    })
]).withDescription("Blog posts with comprehensive metadata and annotations");

console.log("✅ Created comprehensive blog_post table with:");
console.log("   • SEO annotations on title and slug");
console.log("   • Workflow annotations on status field");
console.log("   • Algorithm annotations on quality_score");
console.log("   • Categorization annotations on tags");
console.log("   • Audit annotations on timestamps");
console.log("   • Relationship annotations on author\n");

// ========================================
// 4. Generate Documentation from Annotations
// ========================================

console.log("4️⃣  Generating documentation from annotations...\n");

/**
 * Generate comprehensive field documentation
 */
function generateFieldDocs(table: typeof blogPostTable) {
  console.log(`📚 ${table.getName().toUpperCase()} TABLE DOCUMENTATION`);
  console.log("=" + "=".repeat(60));
  console.log(`Description: ${table.getDescription()}\n`);
  
  table.getFields().forEach(field => {
    console.log(`🔸 ${field.getName().toUpperCase()}`);
    console.log(`   Type: ${field.getType()}`);
    console.log(`   Description: ${field.getDescription()}`);
    
    if (field.getDefaultValue()) {
      console.log(`   Default: ${field.getDefaultValue()}`);
    }
    
    const constraints = field.getConstraints();
    if (constraints?.unique) {
      console.log(`   Constraints: UNIQUE`);
    }
    if (constraints?.enum) {
      console.log(`   Values: ${constraints.enum.join(', ')}`);
    }
    
    console.log();
  });
}

generateFieldDocs(blogPostTable);

// ========================================
// 5. Generate Schema and SQL
// ========================================

console.log("5️⃣  Generating schema and SQL...\n");

console.log("📋 Schema Summary:");
console.log(`   • Table: ${blogPostTable.getName()}`);
console.log(`   • Fields: ${blogPostTable.getFields().length}`);
console.log(`   • Unique Fields: ${blogPostTable.getFields().filter(f => f.getConstraints()?.unique).length}`);
console.log(`   • Optional Fields: ${blogPostTable.getFields().filter(f => f.isOptional).length}`);

console.log("\n🗄️  Generated SurrealQL:");
console.log("=" + "=".repeat(50));
console.log(blogPostTable.toSurrealQL());

console.log("\n🔧 Generated TypeScript Interface:");
console.log("=" + "=".repeat(50));
console.log(blogPostTable.toTypeScriptInterface());

// ========================================
// 6. Demonstrate Annotation Benefits
// ========================================

console.log("\n6️⃣  Demonstrating annotation benefits...\n");

console.log("🎯 Key Benefits of Schema.annotations():");
console.log("   ✅ Documentation: Rich metadata for teams and tooling");
console.log("   ✅ Validation: Custom error messages and business rules");
console.log("   ✅ Code Generation: Hints for UI components and APIs");
console.log("   ✅ Business Logic: Embedded domain knowledge");
console.log("   ✅ Tooling: IDE support, API docs, and schema analysis");

console.log("\n📊 Annotation Categories Used:");
console.log("   • Validation: examples, message(), jsonSchema");
console.log("   • Business: workflow, algorithm, relationship");
console.log("   • Security: allowedProtocols, blockedDomains");
console.log("   • Display: format, colorCoding, badges");
console.log("   • Processing: sanitize, generateTOC, extractMentions");
console.log("   • SEO: recommendedLength, includeKeywords");
console.log("   • Audit: immutable, autoUpdate, trackChanges");

console.log("\n🛠️  Tooling Applications:");
console.log("   • Form Generation: Use jsonSchema and validation annotations");
console.log("   • API Documentation: Extract examples and descriptions");
console.log("   • Database Migrations: Use surrealdb annotations for indexes");
console.log("   • UI Components: Use display annotations for styling");
console.log("   • Business Rules: Use workflow and algorithm annotations");
console.log("   • Security: Use security annotations for validation");

console.log("\n✨ This approach enables:");
console.log("   • Self-documenting schemas with rich metadata");
console.log("   • Automated tooling based on schema annotations");
console.log("   • Consistent business rules across applications");
console.log("   • Better developer experience with contextual help");
console.log("   • Maintainable code with embedded domain knowledge");

console.log("\n🎉 Step 3 Complete!");
console.log("📝 Next: Step 4 will explore advanced patterns like migrations and versioning");