import { describe, it, expect, beforeEach } from "vitest";
import { SurrealField } from "../../lib/schema/field";
import { SurrealTable } from "../../lib/schema/table";

/**
 * Level 1: Basic Table Creation Patterns
 * 
 * This test demonstrates how to create and manage tables using our
 * Schema.Class architecture. Tables are collections of fields with
 * additional metadata and constraints.
 */
describe("Level 1: Basic Table Creation", () => {
  describe("Table Factory Methods", () => {
    it("should create empty table", () => {
      const userTable = SurrealTable.create("user");
      
      expect(userTable.name).toBe("user");
      expect(userTable.fields).toEqual([]);
      expect(userTable.schemafull).toBe(true); // Default to schemafull
    });

    it("should create table with initial fields", () => {
      const fields = [
        SurrealField.id("user"),
        SurrealField.string("username"),
        SurrealField.string("email")
      ];
      
      const userTable = SurrealTable.create("user", fields);
      
      expect(userTable.name).toBe("user");
      expect(userTable.fields).toHaveLength(3);
      expect(userTable.fields[0].name).toBe("id");
      expect(userTable.fields[1].name).toBe("username");
      expect(userTable.fields[2].name).toBe("email");
    });

    it("should create schemaless table", () => {
      const logsTable = SurrealTable.schemaless("logs");
      
      expect(logsTable.name).toBe("logs");
      expect(logsTable.schemafull).toBe(false);
    });

    it("should create view table", () => {
      const activeUsersView = SurrealTable.view("active_users", ["id", "username", "email"]);
      
      expect(activeUsersView.name).toBe("active_users");
      expect(activeUsersView.view?.fields).toEqual(["id", "username", "email"]);
    });
  });

  describe("Fluent Field Management", () => {
    it("should add single field", () => {
      const table = SurrealTable.create("user")
        .addField(SurrealField.string("username"));
      
      expect(table.fields).toHaveLength(1);
      expect(table.fields[0].name).toBe("username");
    });

    it("should add multiple fields at once", () => {
      const table = SurrealTable.create("user")
        .addFields(
          SurrealField.id("user"),
          SurrealField.string("username"),
          SurrealField.string("email")
        );
      
      expect(table.fields).toHaveLength(3);
      expect(table.fields.map(f => f.name)).toEqual(["id", "username", "email"]);
    });

    it("should remove fields", () => {
      const table = SurrealTable.create("user")
        .addFields(
          SurrealField.string("username"),
          SurrealField.string("email"),
          SurrealField.string("phone")
        )
        .removeField("phone");
      
      expect(table.fields).toHaveLength(2);
      expect(table.fields.map(f => f.name)).toEqual(["username", "email"]);
    });

    it("should update existing fields", () => {
      const table = SurrealTable.create("user")
        .addField(SurrealField.string("bio"))
        .updateField("bio", field => field.optional().description("User biography"));
      
      const bioField = table.getField("bio");
      expect(bioField?.isOptional).toBe(true);
      expect(bioField?.description).toBe("User biography");
    });

    it("should replace fields", () => {
      const table = SurrealTable.create("user")
        .addField(SurrealField.string("name"))
        .removeField("name")
        .addField(SurrealField.string("full_name").description("Full name"));
      
      const nameField = table.getField("full_name");
      expect(nameField?.name).toBe("full_name");
      expect(nameField?.description).toBe("Full name");
      expect(table.hasField("name")).toBe(false);
    });
  });

  describe("Table Metadata", () => {
    it("should set table description", () => {
      const table = SurrealTable.create("user")
        .withDescription("User account information");
      
      expect(table.description).toBe("User account information");
    });

    it("should toggle schema mode", () => {
      const table = SurrealTable.create("user")
        .schemalessMode();
      
      expect(table.schemafull).toBe(false);
      
      const backToSchemafull = table.schemafullMode();
      expect(backToSchemafull.schemafull).toBe(true);
    });

    it("should set permissions", () => {
      const permissions = {
        select: "WHERE owner = $auth.id",
        create: "WHERE $auth.role = 'admin'",
        update: "WHERE owner = $auth.id OR $auth.role = 'admin'",
        delete: "WHERE $auth.role = 'admin'"
      };
      
      const table = SurrealTable.create("user")
        .withPermissions(permissions);
      
      expect(table.permissions).toEqual(permissions);
    });
  });

  describe("Helper Methods", () => {
    let userTable: SurrealTable;
    
    beforeEach(() => {
      userTable = SurrealTable.create("user")
        .addFields(
          SurrealField.id("user"),
          SurrealField.string("username").unique(),
          SurrealField.string("email").unique(),
          SurrealField.string("bio").optional(),
          SurrealField.datetime("created_at").default("time::now()")
        );
    });

    it("should provide field access methods", () => {
      expect(userTable.fields.map(f => f.name)).toEqual([
        "id", "username", "email", "bio", "created_at"
      ]);
      
      const emailField = userTable.getField("email");
      expect(emailField?.name).toBe("email");
      expect(emailField?.type).toBe("string");
      
      expect(userTable.hasField("email")).toBe(true);
      expect(userTable.hasField("nonexistent")).toBe(false);
    });

    it("should get required vs optional fields", () => {
      const requiredFields = userTable.fields.filter(f => !f.isOptional);
      const optionalFields = userTable.fields.filter(f => f.isOptional);
      
      expect(requiredFields.map(f => f.name)).toEqual([
        "id", "username", "email", "created_at"
      ]);
      expect(optionalFields.map(f => f.name)).toEqual(["bio"]);
    });

    it("should identify field with constraints", () => {
      const uniqueFields = userTable.fields.filter(f => 
        f.constraints?.unique === true
      );
      expect(uniqueFields.map(f => f.name)).toEqual(["username", "email"]);
    });

    it("should provide table statistics", () => {
      expect(userTable.fields.length).toBe(5);
      expect(userTable.fields.filter(f => !f.isOptional).length).toBe(4);
      expect(userTable.fields.filter(f => f.isOptional).length).toBe(1);
    });
  });

  describe("Built-in Validation", () => {
    it("should validate table creation", () => {
      expect(() => {
        SurrealTable.create("valid_table");
      }).not.toThrow();
    });

    it("should reject invalid table names", () => {
      expect(() => {
        SurrealTable.parse({
          name: "", // Invalid empty name
          fields: [],
          schemafull: true
        });
      }).toThrow();
    });

    it("should provide safe parsing", () => {
      const result = SurrealTable.safeParse({
        name: "",
        fields: "invalid", // Should be array
        schemafull: true
      });
      
      expect(result._tag).toBe("None");
    });
  });

  describe("Schema.Class Features", () => {
    it("should maintain immutability", () => {
      const originalTable = SurrealTable.create("user");
      const modifiedTable = originalTable
        .withDescription("User table")
        .addField(SurrealField.string("username"));
      
      // Original should be unchanged
      expect(originalTable.description).toBeUndefined();
      expect(originalTable.fields).toHaveLength(0);
      
      // Modified should have new values
      expect(modifiedTable.description).toBe("User table");
      expect(modifiedTable.fields).toHaveLength(1);
      
      // Should be different objects
      expect(originalTable).not.toBe(modifiedTable);
    });

    it("should encode and decode correctly", () => {
      const table = SurrealTable.create("user")
        .withDescription("User accounts")
        .addField(SurrealField.string("username"));
      
      const encoded = SurrealTable.encode(table);
      expect(encoded.name).toBe("user");
      expect(encoded.description).toBe("User accounts");
      
      const decoded = SurrealTable.decode(encoded);
      expect(decoded.name).toBe(table.name);
      expect(decoded.description).toBe(table.description);
      expect(decoded.fields).toHaveLength(1);
    });
  });

  describe("SurrealQL Generation", () => {
    it("should generate basic table SurrealQL", () => {
      const table = SurrealTable.create("user");
      const sql = table.toSurrealQL();
      
      expect(sql).toContain("DEFINE TABLE user SCHEMAFULL;");
    });

    it("should generate schemaless table", () => {
      const table = SurrealTable.schemaless("logs");
      const sql = table.toSurrealQL();
      
      expect(sql).toContain("DEFINE TABLE logs SCHEMALESS;");
    });

    it("should generate table with description", () => {
      const table = SurrealTable.create("user")
        .withDescription("User account information");
      
      const sql = table.toSurrealQL();
      expect(sql).toContain("COMMENT 'User account information'");
    });

    it("should generate table with fields", () => {
      const table = SurrealTable.create("user")
        .addFields(
          SurrealField.id("user"),
          SurrealField.string("username")
        );
      
      const sql = table.toSurrealQL();
      expect(sql).toContain("DEFINE TABLE user SCHEMAFULL;");
      expect(sql).toContain("DEFINE FIELD id ON");
      expect(sql).toContain("TYPE record<user>");
      expect(sql).toContain("DEFINE FIELD username ON");
      expect(sql).toContain("TYPE string");
    });
  });
});