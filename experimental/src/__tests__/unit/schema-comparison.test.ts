import { describe, expect, it } from "vitest";
import { SchemaComparator } from "../../lib/comparison/diff";
import { SurrealEvent } from "../../lib/schema/event";
import { SurrealField } from "../../lib/schema/field";
import { SurrealIndex } from "../../lib/schema/index-def";
import { SurrealSchema } from "../../lib/schema/schema";
import { SurrealTable } from "../../lib/schema/table";

describe("SchemaComparator", () => {
  describe("Table Comparisons", () => {
    it("should detect new tables", () => {
      const oldSchema = SurrealSchema.create("test", "1.0.0");

      const newSchema = SurrealSchema.create("test", "1.1.0").addTable(
        SurrealTable.create("user", [SurrealField.id("user"), SurrealField.string("username")])
      );

      const diff = SchemaComparator.compare(oldSchema, newSchema);

      expect(diff.hasChanges).toBe(true);
      expect(diff.tableDiffs).toHaveLength(1);
      expect(diff.tableDiffs[0].operation).toBe("CREATE");
      expect(diff.tableDiffs[0].tableName).toBe("user");
    });

    it("should detect removed tables", () => {
      const oldSchema = SurrealSchema.create("test", "1.0.0").addTable(SurrealTable.create("user"));

      const newSchema = SurrealSchema.create("test", "1.1.0");

      const diff = SchemaComparator.compare(oldSchema, newSchema);

      expect(diff.hasChanges).toBe(true);
      expect(diff.tableDiffs).toHaveLength(1);
      expect(diff.tableDiffs[0].operation).toBe("DROP");
      expect(diff.tableDiffs[0].tableName).toBe("user");
    });

    it("should detect modified tables", () => {
      const oldSchema = SurrealSchema.create("test", "1.0.0").addTable(
        SurrealTable.create("user").description("Old description")
      );

      const newSchema = SurrealSchema.create("test", "1.1.0").addTable(
        SurrealTable.create("user").description("New description")
      );

      const diff = SchemaComparator.compare(oldSchema, newSchema);

      expect(diff.hasChanges).toBe(true);
      expect(diff.tableDiffs).toHaveLength(1);
      expect(diff.tableDiffs[0].operation).toBe("MODIFY");
    });
  });

  describe("Field Comparisons", () => {
    it("should detect new fields", () => {
      const oldSchema = SurrealSchema.create("test", "1.0.0").addTable(
        SurrealTable.create("user", [SurrealField.id("user"), SurrealField.string("username")])
      );

      const newSchema = SurrealSchema.create("test", "1.1.0").addTable(
        SurrealTable.create("user", [
          SurrealField.id("user"),
          SurrealField.string("username"),
          SurrealField.string("email").unique(),
        ])
      );

      const diff = SchemaComparator.compare(oldSchema, newSchema);

      expect(diff.hasChanges).toBe(true);
      expect(diff.fieldDiffs).toHaveLength(1);
      expect(diff.fieldDiffs[0].operation).toBe("CREATE");
      expect(diff.fieldDiffs[0].tableName).toBe("user");
      expect(diff.fieldDiffs[0].fieldName).toBe("email");
    });

    it("should detect removed fields", () => {
      const oldSchema = SurrealSchema.create("test", "1.0.0").addTable(
        SurrealTable.create("user", [
          SurrealField.id("user"),
          SurrealField.string("username"),
          SurrealField.string("email"),
        ])
      );

      const newSchema = SurrealSchema.create("test", "1.1.0").addTable(
        SurrealTable.create("user", [SurrealField.id("user"), SurrealField.string("username")])
      );

      const diff = SchemaComparator.compare(oldSchema, newSchema);

      expect(diff.hasChanges).toBe(true);
      expect(diff.fieldDiffs).toHaveLength(1);
      expect(diff.fieldDiffs[0].operation).toBe("DROP");
      expect(diff.fieldDiffs[0].fieldName).toBe("email");
    });

    it("should detect modified fields", () => {
      const oldSchema = SurrealSchema.create("test", "1.0.0").addTable(
        SurrealTable.create("user", [SurrealField.string("email")])
      );

      const newSchema = SurrealSchema.create("test", "1.1.0").addTable(
        SurrealTable.create("user", [SurrealField.string("email").unique()])
      );

      const diff = SchemaComparator.compare(oldSchema, newSchema);

      expect(diff.hasChanges).toBe(true);
      expect(diff.fieldDiffs).toHaveLength(1);
      expect(diff.fieldDiffs[0].operation).toBe("MODIFY");
      expect(diff.fieldDiffs[0].fieldName).toBe("email");
    });
  });

  describe("Index Comparisons", () => {
    it("should detect new indexes", () => {
      const oldSchema = SurrealSchema.create("test", "1.0.0").addTable(SurrealTable.create("user"));

      const newSchema = SurrealSchema.create("test", "1.1.0")
        .addTable(SurrealTable.create("user"))
        .addIndex(SurrealIndex.unique("idx_user_email", "user", ["email"]));

      const diff = SchemaComparator.compare(oldSchema, newSchema);

      expect(diff.hasChanges).toBe(true);
      expect(diff.indexDiffs).toHaveLength(1);
      expect(diff.indexDiffs[0].operation).toBe("CREATE");
      expect(diff.indexDiffs[0].indexName).toBe("idx_user_email");
    });

    it("should detect removed indexes", () => {
      const oldSchema = SurrealSchema.create("test", "1.0.0")
        .addTable(SurrealTable.create("user"))
        .addIndex(SurrealIndex.unique("idx_user_email", "user", ["email"]));

      const newSchema = SurrealSchema.create("test", "1.1.0").addTable(SurrealTable.create("user"));

      const diff = SchemaComparator.compare(oldSchema, newSchema);

      expect(diff.hasChanges).toBe(true);
      expect(diff.indexDiffs).toHaveLength(1);
      expect(diff.indexDiffs[0].operation).toBe("DROP");
      expect(diff.indexDiffs[0].indexName).toBe("idx_user_email");
    });
  });

  describe("Event Comparisons", () => {
    it("should detect new events", () => {
      const oldSchema = SurrealSchema.create("test", "1.0.0").addTable(SurrealTable.create("user"));

      const newSchema = SurrealSchema.create("test", "1.1.0")
        .addTable(SurrealTable.create("user"))
        .addEvent(
          SurrealEvent.onCreate("user_created", "user", "UPDATE stats SET user_count += 1")
        );

      const diff = SchemaComparator.compare(oldSchema, newSchema);

      expect(diff.hasChanges).toBe(true);
      expect(diff.eventDiffs).toHaveLength(1);
      expect(diff.eventDiffs[0].operation).toBe("CREATE");
      expect(diff.eventDiffs[0].eventName).toBe("user_created");
    });

    it("should detect removed events", () => {
      const oldSchema = SurrealSchema.create("test", "1.0.0")
        .addTable(SurrealTable.create("user"))
        .addEvent(
          SurrealEvent.onCreate("user_created", "user", "UPDATE stats SET user_count += 1")
        );

      const newSchema = SurrealSchema.create("test", "1.1.0").addTable(SurrealTable.create("user"));

      const diff = SchemaComparator.compare(oldSchema, newSchema);

      expect(diff.hasChanges).toBe(true);
      expect(diff.eventDiffs).toHaveLength(1);
      expect(diff.eventDiffs[0].operation).toBe("DROP");
      expect(diff.eventDiffs[0].eventName).toBe("user_created");
    });
  });

  describe("No Changes Detection", () => {
    it("should detect no changes for identical schemas", () => {
      const schema1 = SurrealSchema.create("test", "1.0.0")
        .addTable(
          SurrealTable.create("user", [SurrealField.id("user"), SurrealField.string("username")])
        )
        .addIndex(SurrealIndex.unique("idx_user_name", "user", ["username"]));

      const schema2 = SurrealSchema.create("test", "1.0.0")
        .addTable(
          SurrealTable.create("user", [SurrealField.id("user"), SurrealField.string("username")])
        )
        .addIndex(SurrealIndex.unique("idx_user_name", "user", ["username"]));

      const diff = SchemaComparator.compare(schema1, schema2);

      expect(diff.hasChanges).toBe(false);
      expect(diff.tableDiffs).toHaveLength(0);
      expect(diff.fieldDiffs).toHaveLength(0);
      expect(diff.indexDiffs).toHaveLength(0);
      expect(diff.eventDiffs).toHaveLength(0);
    });
  });

  describe("Complex Schema Changes", () => {
    it("should handle multiple changes in one comparison", () => {
      const oldSchema = SurrealSchema.create("test", "1.0.0")
        .addTable(
          SurrealTable.create("user", [SurrealField.id("user"), SurrealField.string("username")])
        )
        .addTable(SurrealTable.create("old_table"));

      const newSchema = SurrealSchema.create("test", "1.1.0")
        .addTable(
          SurrealTable.create("user", [
            SurrealField.id("user"),
            SurrealField.string("username"),
            SurrealField.string("email").unique(),
            SurrealField.boolean("is_active").default("true"),
          ])
        )
        .addTable(
          SurrealTable.create("post", [SurrealField.id("post"), SurrealField.string("title")])
        )
        .addIndex(SurrealIndex.unique("idx_user_email", "user", ["email"]));

      const diff = SchemaComparator.compare(oldSchema, newSchema);

      expect(diff.hasChanges).toBe(true);

      // Should detect table changes
      expect(
        diff.tableDiffs.some((d) => d.operation === "DROP" && d.tableName === "old_table")
      ).toBe(true);
      expect(diff.tableDiffs.some((d) => d.operation === "CREATE" && d.tableName === "post")).toBe(
        true
      );

      // Should detect field changes
      expect(diff.fieldDiffs.some((d) => d.operation === "CREATE" && d.fieldName === "email")).toBe(
        true
      );
      expect(
        diff.fieldDiffs.some((d) => d.operation === "CREATE" && d.fieldName === "is_active")
      ).toBe(true);

      // Should detect index changes
      expect(
        diff.indexDiffs.some((d) => d.operation === "CREATE" && d.indexName === "idx_user_email")
      ).toBe(true);
    });
  });

  describe("AI Metadata Changes", () => {
    it("should detect AI metadata changes in tables", () => {
      const oldSchema = SurrealSchema.create("test", "1.0.0").addTable(
        SurrealTable.create("user").description("User table")
      );

      const newSchema = SurrealSchema.create("test", "1.1.0").addTable(
        SurrealTable.create("user")
          .description("User table")
          .aiPrimaryKey("email")
          .aiCommonQueries(["find by email"])
      );

      const diff = SchemaComparator.compare(oldSchema, newSchema);

      expect(diff.hasChanges).toBe(true);
      expect(diff.tableDiffs).toHaveLength(1);
      expect(diff.tableDiffs[0].operation).toBe("MODIFY");
    });
  });
});
