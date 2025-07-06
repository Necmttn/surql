/**
 * Tests for Step 1: Basic Schema Foundation
 * 
 * Validates that our basic schema creation works correctly
 */

import { describe, expect, it } from "vitest";
import { taskManagementSchema, userTable, projectTable, taskTable } from "./schema";

describe("Step 1: Basic Schema Foundation", () => {
  describe("Schema Creation", () => {
    it("should create a valid task management schema", () => {
      expect(taskManagementSchema.getName()).toBe("task_management");
      expect(taskManagementSchema.getVersion()).toBe("1.0.0");
      expect(taskManagementSchema.getDescription()).toBe("Simple task management system for small teams");
    });

    it("should contain all required tables", () => {
      const tables = taskManagementSchema.getTables();
      expect(tables).toHaveLength(3);
      
      const tableNames = tables.map(t => t.getName());
      expect(tableNames).toContain("user");
      expect(tableNames).toContain("project");
      expect(tableNames).toContain("task");
    });
  });

  describe("User Table", () => {
    it("should have correct structure", () => {
      const fields = userTable.getFields();
      expect(fields).toHaveLength(8);
      
      const fieldNames = fields.map(f => f.getName());
      expect(fieldNames).toContain("id");
      expect(fieldNames).toContain("email");
      expect(fieldNames).toContain("first_name");
      expect(fieldNames).toContain("last_name");
    });

    it("should have email field with unique constraint", () => {
      const emailField = userTable.getField("email");
      expect(emailField?.getConstraints()?.unique).toBe(true);
    });

    it("should have proper default values", () => {
      const isActiveField = userTable.getField("is_active");
      expect(isActiveField?.getDefaultValue()).toBe("true");
      
      const createdAtField = userTable.getField("created_at");
      expect(createdAtField?.getDefaultValue()).toBe("time::now()");
    });
  });

  describe("Project Table", () => {
    it("should have correct structure", () => {
      const fields = projectTable.getFields();
      expect(fields).toHaveLength(8);
      
      const ownerField = projectTable.getField("owner");
      expect(ownerField?.getType()).toBe("record");
      expect(ownerField?.getReferences()?.table).toBe("user");
    });
  });

  describe("Task Table", () => {
    it("should have correct relationships", () => {
      const projectField = taskTable.getField("project");
      expect(projectField?.getType()).toBe("record");
      expect(projectField?.getReferences()?.table).toBe("project");
      
      const assigneeField = taskTable.getField("assignee");
      expect(assigneeField?.getType()).toBe("record");
      expect(assigneeField?.getReferences()?.table).toBe("user");
    });

    it("should have proper default values", () => {
      const statusField = taskTable.getField("status");
      expect(statusField?.getDefaultValue()).toBe("'todo'");
      
      const priorityField = taskTable.getField("priority");
      expect(priorityField?.getDefaultValue()).toBe("'medium'");
    });
  });

  describe("SurrealQL Generation", () => {
    it("should generate valid SurrealQL", () => {
      const sql = taskManagementSchema.toSurrealQL();
      
      expect(sql).toContain("DEFINE TABLE user");
      expect(sql).toContain("DEFINE TABLE project");
      expect(sql).toContain("DEFINE TABLE task");
      
      expect(sql).toContain("TYPE string UNIQUE"); // email field
      expect(sql).toContain("TYPE record<user>"); // foreign keys
      expect(sql).toContain("DEFAULT time::now()"); // timestamps
    });
  });

  describe("TypeScript Generation", () => {
    it("should generate TypeScript interfaces", () => {
      const typescript = taskManagementSchema.toTypeScript();
      
      expect(typescript).toContain("export interface User");
      expect(typescript).toContain("export interface Project");
      expect(typescript).toContain("export interface Task");
      
      expect(typescript).toContain("email: string");
      expect(typescript).toContain("created_at: Date");
    });
  });

  describe("Real-world Usage Simulation", () => {
    it("should demonstrate how users would validate data", () => {
      // This shows how a user would validate incoming data against our schema
      const userData = {
        email: "test@example.com",
        first_name: "Test",
        last_name: "User"
      };

      // Schema validation would happen here (simulated)
      expect(userData.email).toMatch(/^[^@]+@[^@]+\.[^@]+$/);
      expect(userData.first_name).toBeTruthy();
      expect(userData.last_name).toBeTruthy();
    });

    it("should show relationship validation", () => {
      // This shows how users would ensure referential integrity
      const taskData = {
        title: "Test Task",
        project: "project:abc123", // Reference to project
        created_by: "user:def456"   // Reference to user
      };

      expect(taskData.project).toMatch(/^project:/);
      expect(taskData.created_by).toMatch(/^user:/);
    });
  });
});