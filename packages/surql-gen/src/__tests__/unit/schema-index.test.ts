import { describe, it, expect } from "vitest";
import { SurrealIndex } from "../../lib/schema/index-def";

describe("SurrealIndex Schema.Class", () => {
  describe("Factory Methods", () => {
    it("should create basic index with validation", () => {
      const index = SurrealIndex.create("idx_user_email", "user", ["email"]);
      
      expect(index.name).toBe("idx_user_email");
      expect(index.table).toBe("user");
      expect(index.fields).toEqual(["email"]);
    });

    it("should create unique index", () => {
      const index = SurrealIndex.unique("idx_user_email", "user", ["email"]);
      
      expect(index.unique).toBe(true);
      expect(index.isUnique()).toBe(true);
    });

    it("should create search index", () => {
      const index = SurrealIndex.search("idx_content_search", "post", ["title", "content"]);
      
      expect(index.type).toBe("SEARCH");
      expect(index.isSearch()).toBe(true);
    });

    it("should create mtree index", () => {
      const index = SurrealIndex.mtree("idx_vector", "embeddings", "vector");
      
      expect(index.type).toBe("MTREE");
      expect(index.fields).toEqual(["vector"]);
      expect(index.isMtree()).toBe(true);
    });

    it("should reject invalid index data", () => {
      expect(() => {
        SurrealIndex.parse({
          name: "", // Invalid: empty name
          table: "user",
          fields: ["email"]
        });
      }).toThrow();

      expect(() => {
        SurrealIndex.parse({
          name: "test",
          table: "user",
          fields: [] // Invalid: empty fields
        });
      }).toThrow();
    });
  });

  describe("Fluent API", () => {
    it("should chain methods while maintaining validation", () => {
      const index = SurrealIndex.create("idx_user_email", "user", ["email"])
        .makeUnique()
        .withCondition("email IS NOT NULL")
        .withDescription("Unique email index");
      
      expect(index.unique).toBe(true);
      expect(index.condition).toBe("email IS NOT NULL");
      expect(index.description).toBe("Unique email index");
    });

    it("should convert to different index types", () => {
      const basic = SurrealIndex.create("test", "table", ["field"]);
      
      const unique = basic.makeUnique();
      expect(unique.isUnique()).toBe(true);
      
      const search = basic.makeSearch();
      expect(search.isSearch()).toBe(true);
      
      const mtree = basic.makeMtree();
      expect(mtree.isMtree()).toBe(true);
    });
  });

  describe("Built-in Validation", () => {
    it("should validate using Schema.Class methods", () => {
      const validData = {
        name: "idx_user_email",
        table: "user",
        fields: ["email"]
      };

      const index = SurrealIndex.parse(validData);
      expect(index.name).toBe("idx_user_email");
    });

    it("should provide safe parsing", () => {
      const invalidData = {
        name: "",
        table: "user",
        fields: []
      };

      const result = SurrealIndex.safeParse(invalidData);
      expect(result._tag).toBe("None");
    });

    it("should encode and decode correctly", () => {
      const index = SurrealIndex.unique("test", "user", ["email"]);
      
      const encoded = SurrealIndex.encode(index);
      expect(encoded.name).toBe("test");

      const decoded = SurrealIndex.decode(encoded);
      expect(decoded.name).toBe(index.name);
      expect(decoded.table).toBe(index.table);
    });
  });

  describe("SurrealQL Generation", () => {
    it("should generate basic index SurrealQL", () => {
      const index = SurrealIndex.create("idx_user_email", "user", ["email"]);
      const sql = index.toSurrealQL();
      
      expect(sql).toBe("DEFINE INDEX idx_user_email ON user FIELDS email;");
    });

    it("should generate unique index", () => {
      const index = SurrealIndex.unique("idx_user_email", "user", ["email"]);
      const sql = index.toSurrealQL();
      
      expect(sql).toBe("DEFINE INDEX idx_user_email ON user FIELDS email UNIQUE;");
    });

    it("should generate search index", () => {
      const index = SurrealIndex.search("idx_content_search", "post", ["title", "content"]);
      const sql = index.toSurrealQL();
      
      expect(sql).toBe("DEFINE INDEX idx_content_search ON post FIELDS title, content SEARCH ANALYZER ascii BM25;");
    });

    it("should generate index with condition", () => {
      const index = SurrealIndex.create("idx_active_users", "user", ["username"])
        .withCondition("is_active = true");
      
      const sql = index.toSurrealQL();
      expect(sql).toBe("DEFINE INDEX idx_active_users ON user FIELDS username WHERE is_active = true;");
    });

    it("should generate index with description", () => {
      const index = SurrealIndex.unique("idx_user_email", "user", ["email"])
        .withDescription("Unique email constraint");
      
      const sql = index.toSurrealQL();
      expect(sql).toBe("DEFINE INDEX idx_user_email ON user FIELDS email UNIQUE COMMENT 'Unique email constraint';");
    });

    it("should generate multi-field index", () => {
      const index = SurrealIndex.create("idx_user_name", "user", ["first_name", "last_name"]);
      const sql = index.toSurrealQL();
      
      expect(sql).toBe("DEFINE INDEX idx_user_name ON user FIELDS first_name, last_name;");
    });
  });

  describe("SurrealQL Parsing", () => {
    it("should parse basic SurrealQL index definition", () => {
      const sql = "DEFINE INDEX idx_user_email ON user FIELDS email;";
      const index = SurrealIndex.fromSurrealQL(sql);
      
      expect(index.name).toBe("idx_user_email");
      expect(index.table).toBe("user");
      expect(index.fields).toEqual(["email"]);
    });

    it("should parse unique index", () => {
      const sql = "DEFINE INDEX idx_user_email ON user FIELDS email UNIQUE;";
      const index = SurrealIndex.fromSurrealQL(sql);
      
      expect(index.unique).toBe(true);
    });

    it("should parse index with condition", () => {
      const sql = "DEFINE INDEX idx_active_users ON user FIELDS username WHERE is_active = true;";
      const index = SurrealIndex.fromSurrealQL(sql);
      
      expect(index.condition).toBe("is_active = true");
    });

    it("should parse index with description", () => {
      const sql = "DEFINE INDEX idx_user_email ON user FIELDS email UNIQUE COMMENT 'Unique email constraint';";
      const index = SurrealIndex.fromSurrealQL(sql);
      
      expect(index.description).toBe("Unique email constraint");
    });

    it("should parse multi-field index", () => {
      const sql = "DEFINE INDEX idx_user_name ON user FIELDS first_name, last_name;";
      const index = SurrealIndex.fromSurrealQL(sql);
      
      expect(index.fields).toEqual(["first_name", "last_name"]);
    });

    it("should throw on invalid SurrealQL", () => {
      expect(() => {
        SurrealIndex.fromSurrealQL("INVALID SQL");
      }).toThrow();
    });
  });

  describe("Migration Generation", () => {
    it("should detect index name changes", () => {
      const oldIndex = SurrealIndex.create("old_name", "user", ["email"]);
      const newIndex = SurrealIndex.create("new_name", "user", ["email"]);
      
      const diff = SurrealIndex.diff(oldIndex, newIndex);
      expect(diff).toHaveLength(2);
      expect(diff[0]).toBe("REMOVE INDEX old_name ON user;");
      expect(diff[1]).toBe(newIndex.toSurrealQL());
    });

    it("should detect table changes", () => {
      const oldIndex = SurrealIndex.create("test", "old_table", ["field"]);
      const newIndex = SurrealIndex.create("test", "new_table", ["field"]);
      
      const diff = SurrealIndex.diff(oldIndex, newIndex);
      expect(diff).toHaveLength(2);
      expect(diff[0]).toBe("REMOVE INDEX test ON old_table;");
    });

    it("should detect field changes", () => {
      const oldIndex = SurrealIndex.create("test", "user", ["old_field"]);
      const newIndex = SurrealIndex.create("test", "user", ["new_field"]);
      
      const diff = SurrealIndex.diff(oldIndex, newIndex);
      expect(diff).toHaveLength(2);
      expect(diff[0]).toBe("REMOVE INDEX test ON user;");
      expect(diff[1]).toBe(newIndex.toSurrealQL());
    });

    it("should detect uniqueness changes", () => {
      const oldIndex = SurrealIndex.create("test", "user", ["email"]);
      const newIndex = SurrealIndex.unique("test", "user", ["email"]);
      
      const diff = SurrealIndex.diff(oldIndex, newIndex);
      expect(diff).toHaveLength(2);
      expect(diff[0]).toBe("REMOVE INDEX test ON user;");
      expect(diff[1]).toBe(newIndex.toSurrealQL());
    });

    it("should detect no changes", () => {
      const oldIndex = SurrealIndex.unique("test", "user", ["email"]);
      const newIndex = SurrealIndex.unique("test", "user", ["email"]);
      
      const diff = SurrealIndex.diff(oldIndex, newIndex);
      expect(diff).toHaveLength(0);
    });
  });

  describe("Helper Methods", () => {
    it("should provide getter methods", () => {
      const index = SurrealIndex.unique("idx_user_email", "user", ["email"])
        .withCondition("email IS NOT NULL")
        .withDescription("Unique email index");
      
      expect(index.getName()).toBe("idx_user_email");
      expect(index.getTable()).toBe("user");
      expect(index.getFields()).toEqual(["email"]);
      expect(index.getCondition()).toBe("email IS NOT NULL");
      expect(index.getDescription()).toBe("Unique email index");
      expect(index.isUnique()).toBe(true);
      expect(index.isSearch()).toBe(false);
      expect(index.isMtree()).toBe(false);
    });

    it("should detect index types correctly", () => {
      const basic = SurrealIndex.create("test", "table", ["field"]);
      const unique = SurrealIndex.unique("test", "table", ["field"]);
      const search = SurrealIndex.search("test", "table", ["field"]);
      const mtree = SurrealIndex.mtree("test", "table", "field");
      
      expect(basic.isUnique()).toBe(false);
      expect(unique.isUnique()).toBe(true);
      expect(search.isSearch()).toBe(true);
      expect(mtree.isMtree()).toBe(true);
    });
  });

  describe("Immutability", () => {
    it("should maintain immutability when chaining methods", () => {
      const original = SurrealIndex.create("test", "user", ["email"]);
      const modified = original.makeUnique().withCondition("email IS NOT NULL");
      
      // Original should remain unchanged
      expect(original.unique).toBeUndefined();
      expect(original.condition).toBeUndefined();
      
      // Modified should have new values
      expect(modified.unique).toBe(true);
      expect(modified.condition).toBe("email IS NOT NULL");
    });

    it("should create new instances for each modification", () => {
      const index1 = SurrealIndex.create("test", "user", ["email"]);
      const index2 = index1.makeUnique();
      const index3 = index2.withDescription("Unique email index");
      
      // Each should be a different instance
      expect(index1).not.toBe(index2);
      expect(index2).not.toBe(index3);
      expect(index1).not.toBe(index3);
    });
  });
});