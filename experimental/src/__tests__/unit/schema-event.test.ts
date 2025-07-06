import { describe, it, expect } from "vitest";
import { SurrealEvent } from "../../lib/schema/event";

describe("SurrealEvent Schema.Class", () => {
  describe("Factory Methods", () => {
    it("should create basic event with validation", () => {
      const event = SurrealEvent.create("user_created", "user", "AFTER", "CREATE", "UPDATE stats SET user_count += 1");
      
      expect(event.name).toBe("user_created");
      expect(event.table).toBe("user");
      expect(event.when).toBe("AFTER");
      expect(event.action).toBe("CREATE");
      expect(event.then).toBe("UPDATE stats SET user_count += 1");
    });

    it("should create onCreate event", () => {
      const event = SurrealEvent.onCreate("user_audit", "user", "CREATE audit:ulid() SET user = $after.id");
      
      expect(event.when).toBe("AFTER");
      expect(event.action).toBe("CREATE");
    });

    it("should create onUpdate event", () => {
      const event = SurrealEvent.onUpdate("user_updated", "user", "UPDATE user SET updated_at = time::now()");
      
      expect(event.when).toBe("AFTER");
      expect(event.action).toBe("UPDATE");
    });

    it("should create onDelete event", () => {
      const event = SurrealEvent.onDelete("user_deleted", "user", "CREATE audit:ulid() SET action = 'deleted'");
      
      expect(event.when).toBe("AFTER");
      expect(event.action).toBe("DELETE");
    });

    it("should create before events", () => {
      const beforeCreate = SurrealEvent.beforeCreate("validate_user", "user", "IF $before.email = '' THEN THROW 'Email required' END");
      const beforeUpdate = SurrealEvent.beforeUpdate("validate_update", "user", "IF $after.email = '' THEN THROW 'Email required' END");
      const beforeDelete = SurrealEvent.beforeDelete("prevent_delete", "user", "IF $before.is_admin THEN THROW 'Cannot delete admin' END");
      
      expect(beforeCreate.when).toBe("BEFORE");
      expect(beforeUpdate.when).toBe("BEFORE");
      expect(beforeDelete.when).toBe("BEFORE");
    });

    it("should reject invalid event data", () => {
      expect(() => {
        SurrealEvent.parse({
          name: "", // Invalid: empty name
          table: "user",
          when: "AFTER",
          action: "CREATE",
          then: "UPDATE stats SET user_count += 1"
        });
      }).toThrow();

      expect(() => {
        SurrealEvent.parse({
          name: "test",
          table: "user",
          when: "INVALID", // Invalid timing
          action: "CREATE",
          then: "UPDATE stats SET user_count += 1"
        });
      }).toThrow();
    });
  });

  describe("Fluent API", () => {
    it("should chain methods while maintaining validation", () => {
      const event = SurrealEvent.onCreate("user_created", "user", "UPDATE stats SET user_count += 1")
        .withCondition("$after.is_active = true")
        .withDescription("Track user creation");
      
      expect(event.condition).toBe("$after.is_active = true");
      expect(event.description).toBe("Track user creation");
    });

    it("should update then clause", () => {
      const event = SurrealEvent.onCreate("test", "user", "OLD STATEMENT")
        .withThen("NEW STATEMENT");
      
      expect(event.then).toBe("NEW STATEMENT");
    });
  });

  describe("Built-in Validation", () => {
    it("should validate using Schema.Class methods", () => {
      const validData = {
        name: "user_created",
        table: "user",
        when: "AFTER",
        action: "CREATE",
        then: "UPDATE stats SET user_count += 1"
      };

      const event = SurrealEvent.parse(validData);
      expect(event.name).toBe("user_created");
    });

    it("should provide safe parsing", () => {
      const invalidData = {
        name: "",
        table: "user",
        when: "INVALID",
        action: "CREATE",
        then: "UPDATE stats SET user_count += 1"
      };

      const result = SurrealEvent.safeParse(invalidData);
      expect(result._tag).toBe("None");
    });

    it("should encode and decode correctly", () => {
      const event = SurrealEvent.onCreate("test", "user", "UPDATE stats SET user_count += 1");
      
      const encoded = SurrealEvent.encode(event);
      expect(encoded.name).toBe("test");

      const decoded = SurrealEvent.decode(encoded);
      expect(decoded.name).toBe(event.name);
      expect(decoded.table).toBe(event.table);
    });
  });

  describe("SurrealQL Generation", () => {
    it("should generate basic event SurrealQL", () => {
      const event = SurrealEvent.onCreate("user_created", "user", "UPDATE stats SET user_count += 1");
      const sql = event.toSurrealQL();
      
      expect(sql).toBe("DEFINE EVENT user_created ON TABLE user WHEN AFTER CREATE THEN UPDATE stats SET user_count += 1;");
    });

    it("should generate event with condition", () => {
      const event = SurrealEvent.onCreate("active_user_created", "user", "UPDATE stats SET active_users += 1")
        .withCondition("$after.is_active = true");
      
      const sql = event.toSurrealQL();
      expect(sql).toBe("DEFINE EVENT active_user_created ON TABLE user WHEN AFTER CREATE WHERE $after.is_active = true THEN UPDATE stats SET active_users += 1;");
    });

    it("should generate event with description", () => {
      const event = SurrealEvent.onCreate("user_audit", "user", "CREATE audit:ulid() SET user = $after.id")
        .withDescription("Track user creation for audit");
      
      const sql = event.toSurrealQL();
      expect(sql).toBe("DEFINE EVENT user_audit ON TABLE user WHEN AFTER CREATE THEN CREATE audit:ulid() SET user = $after.id COMMENT 'Track user creation for audit';");
    });

    it("should generate before events", () => {
      const event = SurrealEvent.beforeCreate("validate_user", "user", "IF $before.email = '' THEN THROW 'Email required' END");
      const sql = event.toSurrealQL();
      
      expect(sql).toBe("DEFINE EVENT validate_user ON TABLE user WHEN BEFORE CREATE THEN IF $before.email = '' THEN THROW 'Email required' END;");
    });
  });

  describe("SurrealQL Parsing", () => {
    it("should parse basic SurrealQL event definition", () => {
      const sql = "DEFINE EVENT user_created ON TABLE user WHEN AFTER CREATE THEN UPDATE stats SET user_count += 1;";
      const event = SurrealEvent.fromSurrealQL(sql);
      
      expect(event.name).toBe("user_created");
      expect(event.table).toBe("user");
      expect(event.when).toBe("AFTER");
      expect(event.action).toBe("CREATE");
      expect(event.then).toBe("UPDATE stats SET user_count += 1");
    });

    it("should parse event with condition", () => {
      const sql = "DEFINE EVENT active_user_created ON TABLE user WHEN AFTER CREATE WHERE $after.is_active = true THEN UPDATE stats SET active_users += 1;";
      const event = SurrealEvent.fromSurrealQL(sql);
      
      expect(event.condition).toBe("$after.is_active = true");
    });

    it("should parse event with description", () => {
      const sql = "DEFINE EVENT user_audit ON TABLE user WHEN AFTER CREATE THEN CREATE audit:ulid() SET user = $after.id COMMENT 'Track user creation';";
      const event = SurrealEvent.fromSurrealQL(sql);
      
      expect(event.description).toBe("Track user creation");
    });

    it("should throw on invalid SurrealQL", () => {
      expect(() => {
        SurrealEvent.fromSurrealQL("INVALID SQL");
      }).toThrow();
    });
  });

  describe("Migration Generation", () => {
    it("should detect event name changes", () => {
      const oldEvent = SurrealEvent.onCreate("old_name", "user", "UPDATE stats SET user_count += 1");
      const newEvent = SurrealEvent.onCreate("new_name", "user", "UPDATE stats SET user_count += 1");
      
      const diff = SurrealEvent.diff(oldEvent, newEvent);
      expect(diff).toHaveLength(2);
      expect(diff[0]).toBe("REMOVE EVENT old_name ON user;");
      expect(diff[1]).toBe(newEvent.toSurrealQL());
    });

    it("should detect table changes", () => {
      const oldEvent = SurrealEvent.onCreate("test", "old_table", "UPDATE stats SET count += 1");
      const newEvent = SurrealEvent.onCreate("test", "new_table", "UPDATE stats SET count += 1");
      
      const diff = SurrealEvent.diff(oldEvent, newEvent);
      expect(diff).toHaveLength(2);
      expect(diff[0]).toBe("REMOVE EVENT test ON old_table;");
    });

    it("should detect action changes", () => {
      const oldEvent = SurrealEvent.onCreate("test", "user", "UPDATE stats SET created += 1");
      const newEvent = SurrealEvent.onUpdate("test", "user", "UPDATE stats SET updated += 1");
      
      const diff = SurrealEvent.diff(oldEvent, newEvent);
      expect(diff).toHaveLength(2);
      expect(diff[0]).toBe("REMOVE EVENT test ON user;");
      expect(diff[1]).toBe(newEvent.toSurrealQL());
    });

    it("should detect no changes", () => {
      const oldEvent = SurrealEvent.onCreate("test", "user", "UPDATE stats SET count += 1");
      const newEvent = SurrealEvent.onCreate("test", "user", "UPDATE stats SET count += 1");
      
      const diff = SurrealEvent.diff(oldEvent, newEvent);
      expect(diff).toHaveLength(0);
    });
  });

  describe("Helper Methods", () => {
    it("should provide getter methods", () => {
      const event = SurrealEvent.onCreate("user_created", "user", "UPDATE stats SET user_count += 1")
        .withCondition("$after.is_active = true")
        .withDescription("Track user creation");
      
      expect(event.getName()).toBe("user_created");
      expect(event.getTable()).toBe("user");
      expect(event.getTiming()).toBe("AFTER");
      expect(event.getAction()).toBe("CREATE");
      expect(event.getCondition()).toBe("$after.is_active = true");
      expect(event.getThen()).toBe("UPDATE stats SET user_count += 1");
      expect(event.getDescription()).toBe("Track user creation");
    });
  });

  describe("Immutability", () => {
    it("should maintain immutability when chaining methods", () => {
      const original = SurrealEvent.onCreate("test", "user", "UPDATE stats SET count += 1");
      const modified = original.withCondition("$after.is_active = true");
      
      // Original should remain unchanged
      expect(original.condition).toBeUndefined();
      
      // Modified should have new values
      expect(modified.condition).toBe("$after.is_active = true");
    });

    it("should create new instances for each modification", () => {
      const event1 = SurrealEvent.onCreate("test", "user", "UPDATE stats SET count += 1");
      const event2 = event1.withCondition("$after.is_active = true");
      const event3 = event2.withDescription("Track user creation");
      
      // Each should be a different instance
      expect(event1).not.toBe(event2);
      expect(event2).not.toBe(event3);
      expect(event1).not.toBe(event3);
    });
  });
});