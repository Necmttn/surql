import { describe, expect, it } from "vitest";
import { Schema } from "effect";
import { SurrealField } from "../../lib/schema/field";
import { SurrealTable } from "../../lib/schema/table";
import { SurrealSchema } from "../../lib/schema/schema";
import { SurrealIndex } from "../../lib/schema/index-def";
import { SurrealEvent } from "../../lib/schema/event";
import { SchemaComparator } from "../../lib/comparison/diff";
import { MigrationGenerator } from "../../lib/migration/generator";

// Import reusable constraints from Level 2
import {
  emailSchema,
  slugSchema,
  currencySchema,
  priceSchema,
  phoneSchema,
  positiveIntegerSchema,
} from "../../lib/constraints";

describe("Level 5: E-commerce Platform", () => {
  describe("Complete E-commerce Schema", () => {
    it("should create a comprehensive e-commerce platform schema", () => {
      // Define business-specific constraints
      const ecommerceConstraints = {
        sku: Schema.String.pipe(
          Schema.minLength(3),
          Schema.maxLength(50),
        ).annotations({
          identifier: "ProductSKU",
          title: "Product SKU",
          description: "Unique product identifier for inventory management",
          examples: ["LAPTOP-001", "PHONE-SAMSUNG-S23"],
        }),

        orderStatus: Schema.Literal(
          "pending",
          "confirmed",
          "shipped",
          "delivered",
          "cancelled",
        ).annotations({
          title: "Order Status",
          description: "Current status of customer order",
        }),

        paymentStatus: Schema.Literal(
          "pending",
          "authorized",
          "captured",
          "refunded",
          "failed",
        ).annotations({
          title: "Payment Status",
          description: "Payment processing status",
        }),
      };

      // User table with comprehensive profile
      const userTable = SurrealTable.create("user", [
        SurrealField.id("user"),
        SurrealField.string("email").unique().description("User email address"),
        SurrealField.string("first_name").description("User first name"),
        SurrealField.string("last_name").description("User last name"),
        SurrealField.string("phone")
          .optional()
          .description("Contact phone number"),
        SurrealField.datetime("created_at")
          .default("time::now()")
          .description("Account creation time"),
        SurrealField.datetime("updated_at")
          .default("time::now()")
          .description("Last profile update"),
        SurrealField.boolean("is_active")
          .default("true")
          .description("Account status"),
        SurrealField.datetime("last_login")
          .optional()
          .description("Last login timestamp"),
      ])
        .withDescription("Customer accounts and profiles")
        .aiPrimaryKey("email")
        .aiTemporalField("created_at")
        .aiContentFields(["first_name", "last_name", "email"])
        .aiCommonQueries([
          "find user by email",
          "get active users",
          "users created in date range",
          "users by last login",
        ]);

      // Address table for shipping/billing
      const addressTable = SurrealTable.create("address", [
        SurrealField.id("address"),
        SurrealField.record("user", "user").description("Address owner"),
        SurrealField.string("type")
          .assert("$value IN ['billing', 'shipping']")
          .description("Address type"),
        SurrealField.string("street_line1").description(
          "Street address line 1",
        ),
        SurrealField.string("street_line2")
          .optional()
          .description("Street address line 2"),
        SurrealField.string("city").description("City"),
        SurrealField.string("state").description("State/Province"),
        SurrealField.string("postal_code").description("Postal/ZIP code"),
        SurrealField.string("country")
          .default("'US'")
          .description("Country code"),
        SurrealField.boolean("is_default")
          .default("false")
          .description("Default address for type"),
        SurrealField.datetime("created_at")
          .default("time::now()")
          .description("Address creation time"),
      ])
        .withDescription("User shipping and billing addresses")
        .aiPrimaryKey("id")
        .aiUserField("user")
        .aiContentFields(["street_line1", "city", "state"])
        .aiCommonQueries([
          "find addresses by user",
          "get default shipping address",
          "addresses by location",
        ]);

      // Category table for product organization
      const categoryTable = SurrealTable.create("category", [
        SurrealField.id("category"),
        SurrealField.string("name").unique().description("Category name"),
        SurrealField.string("slug")
          .unique()
          .description("URL-friendly category identifier"),
        SurrealField.string("description")
          .optional()
          .description("Category description"),
        SurrealField.record("parent", "category")
          .optional()
          .description("Parent category for hierarchy"),
        SurrealField.string("image_url")
          .optional()
          .description("Category banner image"),
        SurrealField.boolean("is_active")
          .default("true")
          .description("Category visibility status"),
        SurrealField.int("sort_order")
          .default("0")
          .description("Display sort order"),
        SurrealField.datetime("created_at")
          .default("time::now()")
          .description("Category creation time"),
      ])
        .withDescription("Product categories with hierarchical organization")
        .aiPrimaryKey("slug")
        .aiContentFields(["name", "description"])
        .aiCommonQueries([
          "find category by slug",
          "get active categories",
          "category hierarchy",
        ]);

      // Product table with rich metadata
      const productTable = SurrealTable.create("product", [
        SurrealField.id("product"),
        SurrealField.string("sku").unique().description("Product SKU"),
        SurrealField.string("name").description("Product name"),
        SurrealField.string("slug")
          .unique()
          .description("URL-friendly product identifier"),
        SurrealField.string("description").description("Product description"),
        SurrealField.string("short_description")
          .optional()
          .description("Brief product summary"),
        SurrealField.record("category", "category").description(
          "Primary product category",
        ),
        SurrealField.number("price").description("Product price"),
        SurrealField.number("sale_price")
          .optional()
          .description("Discounted sale price"),
        SurrealField.string("currency")
          .default("'USD'")
          .description("Price currency"),
        SurrealField.int("stock_quantity").description(
          "Available inventory count",
        ),
        SurrealField.int("low_stock_threshold")
          .default("10")
          .description("Low stock alert threshold"),
        SurrealField.boolean("track_inventory")
          .default("true")
          .description("Enable inventory tracking"),
        SurrealField.boolean("is_active")
          .default("true")
          .description("Product availability status"),
        SurrealField.boolean("is_featured")
          .default("false")
          .description("Featured product status"),
        SurrealField.number("weight")
          .optional()
          .description("Product weight for shipping"),
        SurrealField.array("tags")
          .optional()
          .description("Product tags for search"),
        SurrealField.array("images")
          .optional()
          .description("Product image URLs"),
        SurrealField.datetime("created_at")
          .default("time::now()")
          .description("Product creation time"),
        SurrealField.datetime("updated_at")
          .default("time::now()")
          .description("Last product update"),
      ])
        .withDescription("Product catalog with inventory management")
        .aiPrimaryKey("sku")
        .aiTemporalField("updated_at")
        .aiContentFields(["name", "description", "short_description", "tags"])
        .aiCommonQueries([
          "search products by name",
          "find product by SKU",
          "products in category",
          "featured products",
          "low stock products",
          "products by price range",
        ])
        .aiRelationships({
          category: "category via category field",
          orders: "order_item via product_id",
        });

      // Order table for purchase tracking
      const orderTable = SurrealTable.create("order", [
        SurrealField.id("order"),
        SurrealField.string("order_number")
          .unique()
          .description("Human-readable order identifier"),
        SurrealField.record("user", "user").description(
          "Customer who placed the order",
        ),
        SurrealField.string("status")
          .default("'pending'")
          .description("Order processing status"),
        SurrealField.string("payment_status")
          .default("'pending'")
          .description("Payment processing status"),
        SurrealField.number("subtotal").description(
          "Order subtotal before tax",
        ),
        SurrealField.number("tax_amount").description("Tax amount"),
        SurrealField.number("shipping_amount").description("Shipping cost"),
        SurrealField.number("total_amount").description("Final order total"),
        SurrealField.string("currency")
          .default("'USD'")
          .description("Order currency"),
        SurrealField.record("shipping_address", "address").description(
          "Delivery address",
        ),
        SurrealField.record("billing_address", "address").description(
          "Billing address",
        ),
        SurrealField.string("notes")
          .optional()
          .description("Customer order notes"),
        SurrealField.datetime("created_at")
          .default("time::now()")
          .description("Order placement time"),
        SurrealField.datetime("updated_at")
          .default("time::now()")
          .description("Last order update"),
        SurrealField.datetime("shipped_at")
          .optional()
          .description("Order shipment time"),
        SurrealField.datetime("delivered_at")
          .optional()
          .description("Order delivery time"),
      ])
        .withDescription("Customer orders and order management")
        .aiPrimaryKey("order_number")
        .aiUserField("user")
        .aiTemporalField("created_at")
        .aiCommonQueries([
          "find order by number",
          "orders by user",
          "orders by status",
          "orders in date range",
          "pending orders",
          "shipped orders awaiting delivery",
        ])
        .aiRelationships({
          user: "user via user field",
          items: "order_item via order_id",
          shipping_address: "address via shipping_address",
          billing_address: "address via billing_address",
        });

      // Order items for detailed line items
      const orderItemTable = SurrealTable.create("order_item", [
        SurrealField.id("order_item"),
        SurrealField.record("order", "order").description("Parent order"),
        SurrealField.record("product", "product").description(
          "Ordered product",
        ),
        SurrealField.int("quantity").description("Quantity ordered"),
        SurrealField.number("unit_price").description(
          "Price per unit at time of order",
        ),
        SurrealField.number("total_price").description("Total line item price"),
        SurrealField.string("product_snapshot").description(
          "Product details at time of order",
        ),
        SurrealField.datetime("created_at")
          .default("time::now()")
          .description("Line item creation time"),
      ])
        .withDescription("Individual items within customer orders")
        .aiPrimaryKey("id")
        .aiCommonQueries([
          "items for order",
          "orders containing product",
          "bestselling products",
          "revenue by product",
        ])
        .aiRelationships({
          order: "order via order field",
          product: "product via product field",
        });

      // Assemble the complete e-commerce schema
      const ecommerceSchema = SurrealSchema.create(
        "ecommerce_platform",
        "1.0.0",
      )
        .withDescription(
          "Complete e-commerce platform with users, products, and orders",
        )
        .addTable(userTable)
        .addTable(addressTable)
        .addTable(categoryTable)
        .addTable(productTable)
        .addTable(orderTable)
        .addTable(orderItemTable)
        // Essential indexes for performance
        .addIndex(SurrealIndex.unique("idx_user_email", "user", ["email"]))
        .addIndex(
          SurrealIndex.create("idx_user_active", "user", [
            "is_active",
            "created_at",
          ]),
        )
        .addIndex(
          SurrealIndex.create("idx_address_user", "address", ["user", "type"]),
        )
        .addIndex(
          SurrealIndex.unique("idx_category_slug", "category", ["slug"]),
        )
        .addIndex(
          SurrealIndex.create("idx_category_parent", "category", [
            "parent",
            "sort_order",
          ]),
        )
        .addIndex(SurrealIndex.unique("idx_product_sku", "product", ["sku"]))
        .addIndex(SurrealIndex.unique("idx_product_slug", "product", ["slug"]))
        .addIndex(
          SurrealIndex.create("idx_product_category", "product", [
            "category",
            "is_active",
          ]),
        )
        .addIndex(
          SurrealIndex.create("idx_product_featured", "product", [
            "is_featured",
            "created_at",
          ]),
        )
        .addIndex(
          SurrealIndex.create("idx_product_stock", "product", [
            "stock_quantity",
            "low_stock_threshold",
          ]),
        )
        .addIndex(
          SurrealIndex.search("idx_product_search", "product", [
            "name",
            "description",
            "tags",
          ]),
        )
        .addIndex(
          SurrealIndex.unique("idx_order_number", "order", ["order_number"]),
        )
        .addIndex(
          SurrealIndex.create("idx_order_user", "order", [
            "user",
            "created_at",
          ]),
        )
        .addIndex(
          SurrealIndex.create("idx_order_status", "order", [
            "status",
            "updated_at",
          ]),
        )
        .addIndex(
          SurrealIndex.create("idx_order_item_order", "order_item", ["order"]),
        )
        .addIndex(
          SurrealIndex.create("idx_order_item_product", "order_item", [
            "product",
          ]),
        )
        // Business logic events
        .addEvent(
          SurrealEvent.onCreate(
            "update_product_stock",
            "order_item",
            `
            UPDATE $after.product SET stock_quantity -= $after.quantity
          `,
          ).withDescription(
            "Decrease product stock when order item is created",
          ),
        )
        .addEvent(
          SurrealEvent.onUpdate(
            "order_status_change",
            "order",
            `
            IF $before.status != $after.status THEN
              UPDATE $after.user SET last_order_status = $after.status
            END
          `,
          ).withDescription("Track order status changes on user profile"),
        )
        .addEvent(
          SurrealEvent.onCreate(
            "set_order_totals",
            "order",
            `
            LET $items = (SELECT VALUE { quantity, unit_price, total_price: quantity * unit_price } FROM order_item WHERE order = $after.id);
            LET $subtotal = math::sum($items[*].total_price);
            UPDATE $after SET 
              subtotal = $subtotal,
              total_amount = $subtotal + tax_amount + shipping_amount
          `,
          ).withDescription("Calculate order totals from line items"),
        );

      // Validate schema structure
      expect(ecommerceSchema.getTables()).toHaveLength(6);
      expect(ecommerceSchema.getIndexes()).toHaveLength(16);
      expect(ecommerceSchema.getEvents()).toHaveLength(3);

      // Verify table relationships
      const productTable_verified = ecommerceSchema.getTable("product");
      expect(productTable_verified?.getField("category")?.getType()).toBe(
        "record",
      );

      const orderTable_verified = ecommerceSchema.getTable("order");
      expect(orderTable_verified?.getField("user")?.getType()).toBe("record");
      expect(orderTable_verified?.getField("shipping_address")?.getType()).toBe(
        "record",
      );

      // Verify AI metadata
      expect(productTable_verified?.getAiHints()?.primary_key).toBe("sku");
      expect(productTable_verified?.getAiHints()?.content_fields).toContain(
        "name",
      );
      expect(orderTable_verified?.getAiHints()?.user_field).toBe("user");

      // Test schema generation capabilities
      const typescript = ecommerceSchema.toTypeScript();
      expect(typescript).toContain("export interface User");
      expect(typescript).toContain("export interface Product");
      expect(typescript).toContain("export interface Order");

      const surrealql = ecommerceSchema.toSurrealQL();
      expect(surrealql).toContain("DEFINE TABLE user");
      expect(surrealql).toContain("DEFINE TABLE product");
      expect(surrealql).toContain("DEFINE INDEX idx_product_search");
      expect(surrealql).toContain("DEFINE EVENT update_product_stock");
    });
  });

  describe("Schema Evolution and Migration", () => {
    it("should handle e-commerce schema evolution", () => {
      // V1: Basic e-commerce schema
      const v1Schema = SurrealSchema.create("ecommerce", "1.0.0")
        .addTable(
          SurrealTable.create("user", [
            SurrealField.id("user"),
            SurrealField.string("email").unique(),
            SurrealField.string("name"),
            SurrealField.datetime("created_at").default("time::now()"),
          ]),
        )
        .addTable(
          SurrealTable.create("product", [
            SurrealField.id("product"),
            SurrealField.string("name"),
            SurrealField.number("price"),
            SurrealField.int("stock"),
          ]),
        );

      // V2: Add order management and enhanced user profiles
      const v2Schema = SurrealSchema.create("ecommerce", "2.0.0")
        .addTable(
          SurrealTable.create("user", [
            SurrealField.id("user"),
            SurrealField.string("email").unique(),
            SurrealField.string("first_name"), // Split name field
            SurrealField.string("last_name"), // Split name field
            SurrealField.string("phone").optional(), // New field
            SurrealField.boolean("is_active").default("true"), // New field
            SurrealField.datetime("created_at").default("time::now()"),
            SurrealField.datetime("updated_at").default("time::now()"), // New field
          ]),
        )
        .addTable(
          SurrealTable.create("product", [
            SurrealField.id("product"),
            SurrealField.string("sku").unique(), // New field
            SurrealField.string("name"),
            SurrealField.string("description"), // New field
            SurrealField.number("price"),
            SurrealField.string("currency").default("'USD'"), // New field
            SurrealField.int("stock"),
            SurrealField.boolean("is_active").default("true"), // New field
          ]),
        )
        .addTable(
          // New table
          SurrealTable.create("order", [
            SurrealField.id("order"),
            SurrealField.string("order_number").unique(),
            SurrealField.record("user", "user"),
            SurrealField.string("status").default("'pending'"),
            SurrealField.number("total_amount"),
            SurrealField.datetime("created_at").default("time::now()"),
          ]),
        );

      // Generate migration
      const diff = SchemaComparator.compare(v1Schema, v2Schema);
      expect(diff.hasChanges).toBe(true);

      const migration = MigrationGenerator.generateMigration(
        diff,
        "add_order_management",
        "Add order management and enhance user/product tables",
      );

      expect(migration.statements.length).toBeGreaterThan(0);

      // Verify migration includes new table creation
      const tableCreations = migration.statements.filter(
        (s) => s.type === "table" && s.operation === "CREATE",
      );
      expect(tableCreations.some((s) => s.description.includes("order"))).toBe(
        true,
      );

      // Verify migration includes field additions
      const fieldCreations = migration.statements.filter(
        (s) => s.type === "field" && s.operation === "CREATE",
      );
      expect(fieldCreations.length).toBeGreaterThan(5); // Multiple new fields added

      // Test migration SQL generation
      const migrationSQL = MigrationGenerator.generateMigrationFile(migration);
      expect(migrationSQL).toContain("-- UP");
      expect(migrationSQL).toContain("-- DOWN");
      expect(migrationSQL).toContain("DEFINE");
    });
  });

  describe("Business Logic Validation", () => {
    it("should enforce e-commerce business rules", () => {
      // Test inventory constraints
      const product = SurrealField.int("stock_quantity")
        .min(0)
        .description("Available inventory count");

      expect(product.getConstraints()?.min).toBe(0);

      // Test price validation
      const price = SurrealField.number("price")
        .min(0)
        .description("Product price");

      expect(price.getConstraints()?.min).toBe(0);

      // Test order status constraints
      const orderStatus = SurrealField.string("status")
        .assert(
          "$value IN ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']",
        )
        .description("Order status");

      expect(orderStatus.getConstraints()?.assert).toContain("IN ['pending'");

      // Test email uniqueness
      const userEmail = SurrealField.string("email")
        .unique()
        .pattern("^[^@]+@[^@]+\\.[^@]+$")
        .description("User email address");

      expect(userEmail.getConstraints()?.unique).toBe(true);
      expect(userEmail.getConstraints()?.pattern).toContain("^[^@]+@[^@]+");
    });
  });

  describe("Performance and Scaling", () => {
    it("should optimize for e-commerce query patterns", () => {
      let schema = SurrealSchema.create("ecommerce", "1.0.0");

      // Essential e-commerce indexes
      const performanceIndexes = [
        // User lookups
        SurrealIndex.unique("idx_user_email", "user", ["email"]),
        SurrealIndex.create("idx_user_active_created", "user", [
          "is_active",
          "created_at",
        ]),

        // Product discovery
        SurrealIndex.unique("idx_product_sku", "product", ["sku"]),
        SurrealIndex.create("idx_product_category_active", "product", [
          "category",
          "is_active",
        ]),
        SurrealIndex.create("idx_product_featured", "product", [
          "is_featured",
          "created_at",
        ]),
        SurrealIndex.search("idx_product_search", "product", [
          "name",
          "description",
        ]),

        // Order management
        SurrealIndex.unique("idx_order_number", "order", ["order_number"]),
        SurrealIndex.create("idx_order_user_created", "order", [
          "user",
          "created_at",
        ]),
        SurrealIndex.create("idx_order_status_updated", "order", [
          "status",
          "updated_at",
        ]),

        // Analytics and reporting
        SurrealIndex.create("idx_order_item_product", "order_item", [
          "product",
        ]),
        SurrealIndex.create("idx_order_created_status", "order", [
          "created_at",
          "status",
        ]),
      ];

      performanceIndexes.forEach((index) => {
        schema = schema.addIndex(index);
      });

      expect(schema.getIndexes()).toHaveLength(performanceIndexes.length);

      // Verify search index exists for product discovery
      const searchIndex = schema
        .getIndexes()
        ?.find((i) => i.getName() === "idx_product_search");
      expect(searchIndex?.isSearch()).toBe(true);
      expect(searchIndex?.getFields()).toContain("name");
      expect(searchIndex?.getFields()).toContain("description");

      // Verify unique indexes for critical lookups
      const emailIndex = schema
        .getIndexes()
        ?.find((i) => i.getName() === "idx_user_email");
      expect(emailIndex?.isUnique()).toBe(true);

      const skuIndex = schema
        .getIndexes()
        ?.find((i) => i.getName() === "idx_product_sku");
      expect(skuIndex?.isUnique()).toBe(true);
    });
  });
});
