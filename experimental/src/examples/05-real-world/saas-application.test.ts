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
  urlSchema,
} from "../../lib/constraints";

describe("Level 5: SaaS Application", () => {
  describe("Complete SaaS Platform Schema", () => {
    it("should create a comprehensive SaaS platform schema", () => {
      // Define SaaS-specific constraints
      const saasConstraints = {
        planType: Schema.Literal("free", "starter", "professional", "enterprise")
          .annotations({
            title: "Subscription Plan",
            description: "Available subscription tiers",
          }),

        billingCycle: Schema.Literal("monthly", "yearly")
          .annotations({
            title: "Billing Cycle",
            description: "Subscription billing frequency",
          }),

        subscriptionStatus: Schema.Literal("active", "past_due", "canceled", "incomplete", "trialing")
          .annotations({
            title: "Subscription Status",
            description: "Current subscription status",
          }),

        userRole: Schema.Literal("owner", "admin", "member", "viewer", "billing")
          .annotations({
            title: "Organization Role",
            description: "User role within organization",
          }),

        projectStatus: Schema.Literal("active", "archived", "suspended")
          .annotations({
            title: "Project Status",
            description: "Current project status",
          }),

        inviteStatus: Schema.Literal("pending", "accepted", "declined", "expired")
          .annotations({
            title: "Invite Status",
            description: "Organization invite status",
          }),
      };

      // Organization table for multi-tenancy
      const organizationTable = SurrealTable.create("organization", [
        SurrealField.id("organization"),
        SurrealField.string("name").description("Organization name"),
        SurrealField.string("slug").unique().description("URL-friendly organization identifier"),
        SurrealField.string("description").optional().description("Organization description"),
        SurrealField.string("logo_url").optional().description("Organization logo"),
        SurrealField.string("website").optional().description("Organization website"),
        SurrealField.string("industry").optional().description("Industry sector"),
        SurrealField.string("size").optional().description("Organization size"),
        SurrealField.record("owner", "user").description("Organization owner"),
        SurrealField.string("plan").default("'free'").description("Current subscription plan"),
        SurrealField.string("billing_email").optional().description("Billing contact email"),
        SurrealField.object("settings").optional().description("Organization settings"),
        SurrealField.boolean("is_active").default("true").description("Organization status"),
        SurrealField.datetime("created_at").default("time::now()").description("Organization creation time"),
        SurrealField.datetime("updated_at").default("time::now()").description("Last organization update"),
      ])
        .withDescription("Multi-tenant organizations")
        .aiPrimaryKey("slug")
        .aiUserField("owner")
        .aiTemporalField("created_at")
        .aiContentFields(["name", "description", "industry"])
        .aiCommonQueries([
          "find organization by slug",
          "organizations by owner",
          "organizations by plan",
          "active organizations",
          "organizations by industry",
        ]);

      // User table with authentication
      const userTable = SurrealTable.create("user", [
        SurrealField.id("user"),
        SurrealField.string("email").unique().description("User email address"),
        SurrealField.string("username").unique().optional().description("Unique username"),
        SurrealField.string("first_name").description("User first name"),
        SurrealField.string("last_name").description("User last name"),
        SurrealField.string("avatar_url").optional().description("Profile avatar"),
        SurrealField.string("timezone").default("'UTC'").description("User timezone"),
        SurrealField.string("locale").default("'en'").description("User locale"),
        SurrealField.object("preferences").optional().description("User preferences"),
        SurrealField.boolean("email_verified").default("false").description("Email verification status"),
        SurrealField.boolean("is_active").default("true").description("Account status"),
        SurrealField.datetime("created_at").default("time::now()").description("Account creation time"),
        SurrealField.datetime("updated_at").default("time::now()").description("Last profile update"),
        SurrealField.datetime("last_login").optional().description("Last login timestamp"),
        SurrealField.datetime("email_verified_at").optional().description("Email verification time"),
      ])
        .withDescription("User accounts and profiles")
        .aiPrimaryKey("email")
        .aiTemporalField("created_at")
        .aiContentFields(["first_name", "last_name", "email"])
        .aiCommonQueries([
          "find user by email",
          "find user by username",
          "active users",
          "unverified users",
          "users by timezone",
        ]);

      // Organization membership table
      const membershipTable = SurrealTable.create("organization_member", [
        SurrealField.id("organization_member"),
        SurrealField.record("organization", "organization").description("Organization"),
        SurrealField.record("user", "user").description("Member user"),
        SurrealField.string("role").default("'member'").description("Member role"),
        SurrealField.array("permissions").optional().description("Additional permissions"),
        SurrealField.boolean("is_active").default("true").description("Membership status"),
        SurrealField.record("invited_by", "user").optional().description("User who sent invitation"),
        SurrealField.datetime("joined_at").default("time::now()").description("Membership start time"),
        SurrealField.datetime("last_active").optional().description("Last activity in organization"),
      ])
        .withDescription("Organization membership and roles")
        .aiPrimaryKey("id")
        .aiCommonQueries([
          "members by organization",
          "organizations by user",
          "members by role",
          "active members",
          "recent joiners",
        ])
        .aiRelationships({
          organization: "organization via organization field",
          user: "user via user field",
          invited_by: "user via invited_by field",
        });

      // Project table for organizing work
      const projectTable = SurrealTable.create("project", [
        SurrealField.id("project"),
        SurrealField.string("name").description("Project name"),
        SurrealField.string("slug").description("URL-friendly project identifier"),
        SurrealField.string("description").optional().description("Project description"),
        SurrealField.record("organization", "organization").description("Parent organization"),
        SurrealField.record("owner", "user").description("Project owner"),
        SurrealField.string("status").default("'active'").description("Project status"),
        SurrealField.string("color").optional().description("Project color theme"),
        SurrealField.string("icon").optional().description("Project icon"),
        SurrealField.array("tags").optional().description("Project tags"),
        SurrealField.object("settings").optional().description("Project settings"),
        SurrealField.boolean("is_public").default("false").description("Public visibility"),
        SurrealField.datetime("created_at").default("time::now()").description("Project creation time"),
        SurrealField.datetime("updated_at").default("time::now()").description("Last project update"),
        SurrealField.datetime("archived_at").optional().description("Project archive time"),
      ])
        .withDescription("Organization projects")
        .aiPrimaryKey("slug")
        .aiUserField("owner")
        .aiTemporalField("created_at")
        .aiContentFields(["name", "description", "tags"])
        .aiCommonQueries([
          "projects by organization",
          "projects by owner",
          "find project by slug",
          "active projects",
          "public projects",
          "archived projects",
        ])
        .aiRelationships({
          organization: "organization via organization field",
          owner: "user via owner field",
        });

      // Subscription table for billing
      const subscriptionTable = SurrealTable.create("subscription", [
        SurrealField.id("subscription"),
        SurrealField.record("organization", "organization").description("Subscribed organization"),
        SurrealField.string("plan").description("Subscription plan"),
        SurrealField.string("status").description("Subscription status"),
        SurrealField.string("billing_cycle").default("'monthly'").description("Billing frequency"),
        SurrealField.number("amount").description("Subscription amount"),
        SurrealField.string("currency").default("'USD'").description("Billing currency"),
        SurrealField.string("external_id").optional().description("External billing system ID"),
        SurrealField.datetime("current_period_start").description("Current billing period start"),
        SurrealField.datetime("current_period_end").description("Current billing period end"),
        SurrealField.datetime("trial_start").optional().description("Trial period start"),
        SurrealField.datetime("trial_end").optional().description("Trial period end"),
        SurrealField.datetime("canceled_at").optional().description("Cancellation time"),
        SurrealField.datetime("created_at").default("time::now()").description("Subscription creation time"),
        SurrealField.datetime("updated_at").default("time::now()").description("Last subscription update"),
      ])
        .withDescription("Organization subscriptions and billing")
        .aiPrimaryKey("id")
        .aiCommonQueries([
          "subscription by organization",
          "subscriptions by plan",
          "subscriptions by status",
          "expiring subscriptions",
          "trial subscriptions",
          "canceled subscriptions",
        ])
        .aiRelationships({
          organization: "organization via organization field",
        });

      // Usage tracking table
      const usageTable = SurrealTable.create("usage_metric", [
        SurrealField.id("usage_metric"),
        SurrealField.record("organization", "organization").description("Organization being tracked"),
        SurrealField.record("project", "project").optional().description("Project context"),
        SurrealField.string("metric_name").description("Metric identifier"),
        SurrealField.string("metric_type").description("Metric type (counter, gauge, etc.)"),
        SurrealField.number("value").description("Metric value"),
        SurrealField.object("metadata").optional().description("Additional metric data"),
        SurrealField.datetime("recorded_at").default("time::now()").description("Metric recording time"),
        SurrealField.string("period").default("'day'").description("Aggregation period"),
      ])
        .withDescription("Usage metrics and analytics")
        .aiPrimaryKey("id")
        .aiCommonQueries([
          "usage by organization",
          "usage by project",
          "usage by metric",
          "usage in period",
          "aggregated usage",
        ])
        .aiRelationships({
          organization: "organization via organization field",
          project: "project via project field",
        });

      // Invite table for organization invitations
      const inviteTable = SurrealTable.create("organization_invite", [
        SurrealField.id("organization_invite"),
        SurrealField.record("organization", "organization").description("Target organization"),
        SurrealField.string("email").description("Invitee email address"),
        SurrealField.string("role").default("'member'").description("Proposed role"),
        SurrealField.string("status").default("'pending'").description("Invite status"),
        SurrealField.record("invited_by", "user").description("User who sent invitation"),
        SurrealField.string("token").unique().description("Invite token"),
        SurrealField.string("message").optional().description("Invitation message"),
        SurrealField.datetime("expires_at").description("Invitation expiry time"),
        SurrealField.datetime("accepted_at").optional().description("Acceptance time"),
        SurrealField.datetime("created_at").default("time::now()").description("Invite creation time"),
      ])
        .withDescription("Organization invitations")
        .aiPrimaryKey("token")
        .aiCommonQueries([
          "invites by organization",
          "invites by email",
          "pending invites",
          "expired invites",
          "invites by user",
        ])
        .aiRelationships({
          organization: "organization via organization field",
          invited_by: "user via invited_by field",
        });

      // Assemble the complete SaaS platform schema
      const saasSchema = SurrealSchema.create("saas_platform", "1.0.0")
        .withDescription("Complete SaaS platform with organizations, projects, and billing")
        .addTable(organizationTable)
        .addTable(userTable)
        .addTable(membershipTable)
        .addTable(projectTable)
        .addTable(subscriptionTable)
        .addTable(usageTable)
        .addTable(inviteTable)
        // Organization and user indexes
        .addIndex(SurrealIndex.unique("idx_organization_slug", "organization", ["slug"]))
        .addIndex(SurrealIndex.create("idx_organization_owner", "organization", ["owner", "is_active"]))
        .addIndex(SurrealIndex.create("idx_organization_plan", "organization", ["plan", "is_active"]))
        .addIndex(SurrealIndex.unique("idx_user_email", "user", ["email"]))
        .addIndex(SurrealIndex.unique("idx_user_username", "user", ["username"]))
        .addIndex(SurrealIndex.create("idx_user_active", "user", ["is_active", "created_at"]))
        // Membership and permissions indexes
        .addIndex(SurrealIndex.unique("idx_membership_unique", "organization_member", ["organization", "user"]))
        .addIndex(SurrealIndex.create("idx_membership_org", "organization_member", ["organization", "is_active"]))
        .addIndex(SurrealIndex.create("idx_membership_user", "organization_member", ["user", "is_active"]))
        .addIndex(SurrealIndex.create("idx_membership_role", "organization_member", ["role", "is_active"]))
        // Project management indexes
        .addIndex(SurrealIndex.unique("idx_project_org_slug", "project", ["organization", "slug"]))
        .addIndex(SurrealIndex.create("idx_project_owner", "project", ["owner", "status"]))
        .addIndex(SurrealIndex.create("idx_project_org_status", "project", ["organization", "status"]))
        .addIndex(SurrealIndex.search("idx_project_search", "project", ["name", "description", "tags"]))
        // Billing and subscription indexes
        .addIndex(SurrealIndex.unique("idx_subscription_org", "subscription", ["organization"]))
        .addIndex(SurrealIndex.create("idx_subscription_status", "subscription", ["status", "current_period_end"]))
        .addIndex(SurrealIndex.create("idx_subscription_plan", "subscription", ["plan", "status"]))
        .addIndex(SurrealIndex.create("idx_subscription_trial", "subscription", ["trial_end", "status"]))
        // Usage and analytics indexes
        .addIndex(SurrealIndex.create("idx_usage_org_metric", "usage_metric", ["organization", "metric_name", "recorded_at"]))
        .addIndex(SurrealIndex.create("idx_usage_project", "usage_metric", ["project", "metric_name", "recorded_at"]))
        .addIndex(SurrealIndex.create("idx_usage_period", "usage_metric", ["period", "recorded_at"]))
        // Invitation indexes
        .addIndex(SurrealIndex.unique("idx_invite_token", "organization_invite", ["token"]))
        .addIndex(SurrealIndex.create("idx_invite_org_status", "organization_invite", ["organization", "status"]))
        .addIndex(SurrealIndex.create("idx_invite_email", "organization_invite", ["email", "status"]))
        .addIndex(SurrealIndex.create("idx_invite_expires", "organization_invite", ["expires_at", "status"]))
        // Business logic events
        .addEvent(
          SurrealEvent.onCreate("create_owner_membership", "organization", `
            CREATE organization_member SET 
              organization = $after.id,
              user = $after.owner,
              role = 'owner',
              joined_at = time::now()
          `).withDescription("Auto-create owner membership when organization is created")
        )
        .addEvent(
          SurrealEvent.onUpdate("update_plan_limits", "subscription", `
            IF $before.plan != $after.plan THEN
              UPDATE $after.organization SET plan = $after.plan
            END
          `).withDescription("Update organization plan when subscription changes")
        )
        .addEvent(
          SurrealEvent.onUpdate("expire_invites", "organization_invite", `
            IF time::now() > $after.expires_at AND $after.status = 'pending' THEN
              UPDATE $after SET status = 'expired'
            END
          `).withDescription("Auto-expire pending invitations")
        )
        .addEvent(
          SurrealEvent.onCreate("track_usage", "project", `
            CREATE usage_metric SET
              organization = $after.organization,
              project = $after.id,
              metric_name = 'projects_created',
              metric_type = 'counter',
              value = 1,
              recorded_at = time::now()
          `).withDescription("Track project creation metrics")
        );

      // Validate schema structure
      expect(saasSchema.getTables()).toHaveLength(7);
      expect(saasSchema.getIndexes()).toHaveLength(25);
      expect(saasSchema.getEvents()).toHaveLength(4);

      // Verify table relationships
      const membershipTable_verified = saasSchema.getTable("organization_member");
      expect(membershipTable_verified?.getField("organization")?.getType()).toBe("record");
      expect(membershipTable_verified?.getField("user")?.getType()).toBe("record");

      const projectTable_verified = saasSchema.getTable("project");
      expect(projectTable_verified?.getField("organization")?.getType()).toBe("record");
      expect(projectTable_verified?.getField("owner")?.getType()).toBe("record");

      // Verify unique constraints for multi-tenancy
      const orgSlugIndex = saasSchema.getIndexes()?.find(i => i.getName() === "idx_organization_slug");
      expect(orgSlugIndex?.isUnique()).toBe(true);

      const membershipIndex = saasSchema.getIndexes()?.find(i => i.getName() === "idx_membership_unique");
      expect(membershipIndex?.isUnique()).toBe(true);
      expect(membershipIndex?.getFields()).toEqual(["organization", "user"]);

      // Verify AI metadata
      expect(projectTable_verified?.getAiHints()?.primary_key).toBe("slug");
      expect(projectTable_verified?.getAiHints()?.user_field).toBe("owner");
      expect(membershipTable_verified?.getAiHints()?.content_fields).toBe(undefined);

      // Test schema generation capabilities
      const typescript = saasSchema.toTypeScript();
      expect(typescript).toContain("export interface Organization");
      expect(typescript).toContain("export interface User");
      expect(typescript).toContain("export interface Project");
      expect(typescript).toContain("export interface Subscription");

      const surrealql = saasSchema.toSurrealQL();
      expect(surrealql).toContain("DEFINE TABLE organization");
      expect(surrealql).toContain("DEFINE TABLE project");
      expect(surrealql).toContain("DEFINE INDEX idx_project_search");
      expect(surrealql).toContain("DEFINE EVENT create_owner_membership");
    });
  });

  describe("Role-Based Access Control", () => {
    it("should implement comprehensive RBAC system", () => {
      // Permission definition table
      const permissionTable = SurrealTable.create("permission", [
        SurrealField.id("permission"),
        SurrealField.string("name").unique().description("Permission identifier"),
        SurrealField.string("resource").description("Resource type"),
        SurrealField.string("action").description("Action type"),
        SurrealField.string("description").description("Permission description"),
        SurrealField.string("category").optional().description("Permission category"),
        SurrealField.datetime("created_at").default("time::now()").description("Permission creation time"),
      ])
        .withDescription("System permissions");

      // Role definition table
      const roleTable = SurrealTable.create("role", [
        SurrealField.id("role"),
        SurrealField.string("name").unique().description("Role name"),
        SurrealField.string("description").description("Role description"),
        SurrealField.array("permissions").description("Role permissions"),
        SurrealField.boolean("is_system").default("false").description("System-defined role"),
        SurrealField.record("organization", "organization").optional().description("Organization scope"),
        SurrealField.datetime("created_at").default("time::now()").description("Role creation time"),
      ])
        .withDescription("Access control roles");

      // Resource permissions table
      const resourcePermissionTable = SurrealTable.create("resource_permission", [
        SurrealField.id("resource_permission"),
        SurrealField.record("user", "user").description("User being granted permission"),
        SurrealField.string("resource_type").description("Type of resource"),
        SurrealField.string("resource_id").description("Specific resource ID"),
        SurrealField.array("permissions").description("Granted permissions"),
        SurrealField.record("granted_by", "user").description("User who granted permission"),
        SurrealField.datetime("expires_at").optional().description("Permission expiry"),
        SurrealField.datetime("created_at").default("time::now()").description("Permission grant time"),
      ])
        .withDescription("Resource-specific permissions");

      const rbacSchema = SurrealSchema.create("rbac_system", "1.0.0")
        .addTable(permissionTable)
        .addTable(roleTable)
        .addTable(resourcePermissionTable)
        .addIndex(SurrealIndex.unique("idx_permission_name", "permission", ["name"]))
        .addIndex(SurrealIndex.create("idx_permission_resource", "permission", ["resource", "action"]))
        .addIndex(SurrealIndex.unique("idx_role_name", "role", ["name"]))
        .addIndex(SurrealIndex.create("idx_role_org", "role", ["organization", "is_system"]))
        .addIndex(SurrealIndex.create("idx_resource_perm_user", "resource_permission", ["user", "resource_type"]))
        .addIndex(SurrealIndex.create("idx_resource_perm_resource", "resource_permission", ["resource_type", "resource_id"]));

      expect(rbacSchema.getTables()).toHaveLength(3);
      expect(rbacSchema.getIndexes()).toHaveLength(6);

      // Test permission constraint
      const resourcePermission = SurrealField.string("action")
        .assert("$value IN ['create', 'read', 'update', 'delete', 'admin']")
        .description("Permission action");

      expect(resourcePermission.getConstraints()?.assert).toContain("IN ['create'");
    });
  });

  describe("Billing and Usage Tracking", () => {
    it("should implement comprehensive billing system", () => {
      // Invoice table
      const invoiceTable = SurrealTable.create("invoice", [
        SurrealField.id("invoice"),
        SurrealField.string("number").unique().description("Invoice number"),
        SurrealField.record("organization", "organization").description("Billed organization"),
        SurrealField.record("subscription", "subscription").description("Related subscription"),
        SurrealField.string("status").default("'draft'").description("Invoice status"),
        SurrealField.number("subtotal").description("Invoice subtotal"),
        SurrealField.number("tax_amount").description("Tax amount"),
        SurrealField.number("total_amount").description("Total amount"),
        SurrealField.string("currency").default("'USD'").description("Invoice currency"),
        SurrealField.datetime("period_start").description("Billing period start"),
        SurrealField.datetime("period_end").description("Billing period end"),
        SurrealField.datetime("due_date").description("Payment due date"),
        SurrealField.datetime("paid_at").optional().description("Payment timestamp"),
        SurrealField.datetime("created_at").default("time::now()").description("Invoice creation time"),
      ])
        .withDescription("Billing invoices");

      // Usage aggregation table
      const usageAggregateTable = SurrealTable.create("usage_aggregate", [
        SurrealField.id("usage_aggregate"),
        SurrealField.record("organization", "organization").description("Organization"),
        SurrealField.string("metric_name").description("Aggregated metric"),
        SurrealField.string("period_type").description("Aggregation period (hour, day, month)"),
        SurrealField.datetime("period_start").description("Period start time"),
        SurrealField.datetime("period_end").description("Period end time"),
        SurrealField.number("total_usage").description("Aggregated usage value"),
        SurrealField.number("peak_usage").optional().description("Peak usage in period"),
        SurrealField.object("breakdown").optional().description("Usage breakdown details"),
        SurrealField.datetime("calculated_at").default("time::now()").description("Calculation timestamp"),
      ])
        .withDescription("Aggregated usage metrics");

      // Plan limit table
      const planLimitTable = SurrealTable.create("plan_limit", [
        SurrealField.id("plan_limit"),
        SurrealField.string("plan").description("Plan name"),
        SurrealField.string("metric_name").description("Limited metric"),
        SurrealField.number("limit_value").description("Limit amount"),
        SurrealField.string("limit_type").description("Limit type (hard, soft)"),
        SurrealField.string("period").description("Limit period"),
        SurrealField.boolean("is_active").default("true").description("Limit status"),
        SurrealField.datetime("created_at").default("time::now()").description("Limit creation time"),
      ])
        .withDescription("Subscription plan limits");

      const billingSchema = SurrealSchema.create("billing_system", "1.0.0")
        .addTable(invoiceTable)
        .addTable(usageAggregateTable)
        .addTable(planLimitTable)
        .addIndex(SurrealIndex.unique("idx_invoice_number", "invoice", ["number"]))
        .addIndex(SurrealIndex.create("idx_invoice_org_status", "invoice", ["organization", "status"]))
        .addIndex(SurrealIndex.create("idx_invoice_due", "invoice", ["due_date", "status"]))
        .addIndex(SurrealIndex.create("idx_usage_agg_org", "usage_aggregate", ["organization", "metric_name", "period_start"]))
        .addIndex(SurrealIndex.create("idx_usage_agg_period", "usage_aggregate", ["period_type", "period_start"]))
        .addIndex(SurrealIndex.unique("idx_plan_limit", "plan_limit", ["plan", "metric_name"]))
        .addEvent(
          SurrealEvent.onCreate("generate_invoice", "usage_aggregate", `
            IF $after.period_type = 'month' THEN
              LET $subscription = (SELECT * FROM subscription WHERE organization = $after.organization LIMIT 1);
              IF $subscription THEN
                CREATE invoice SET
                  organization = $after.organization,
                  subscription = $subscription.id,
                  period_start = $after.period_start,
                  period_end = $after.period_end,
                  subtotal = $after.total_usage * $subscription.amount,
                  total_amount = $after.total_usage * $subscription.amount
              END
            END
          `).withDescription("Auto-generate invoices from monthly usage")
        );

      expect(billingSchema.getTables()).toHaveLength(3);
      expect(billingSchema.getEvents()).toHaveLength(1);

      // Test billing status constraints
      const invoiceStatus = SurrealField.string("status")
        .assert("$value IN ['draft', 'sent', 'paid', 'overdue', 'void']")
        .description("Invoice status");

      expect(invoiceStatus.getConstraints()?.assert).toContain("IN ['draft'");
    });
  });

  describe("Analytics and Reporting", () => {
    it("should support comprehensive analytics", () => {
      // Analytics dashboard table
      const dashboardTable = SurrealTable.create("dashboard", [
        SurrealField.id("dashboard"),
        SurrealField.string("name").description("Dashboard name"),
        SurrealField.string("description").optional().description("Dashboard description"),
        SurrealField.record("organization", "organization").description("Dashboard owner"),
        SurrealField.record("created_by", "user").description("Dashboard creator"),
        SurrealField.array("widgets").optional().description("Dashboard widgets configuration"),
        SurrealField.object("layout").optional().description("Dashboard layout"),
        SurrealField.boolean("is_public").default("false").description("Public dashboard"),
        SurrealField.datetime("created_at").default("time::now()").description("Dashboard creation time"),
        SurrealField.datetime("updated_at").default("time::now()").description("Last dashboard update"),
      ])
        .withDescription("Analytics dashboards");

      // Report template table
      const reportTable = SurrealTable.create("report", [
        SurrealField.id("report"),
        SurrealField.string("name").description("Report name"),
        SurrealField.string("type").description("Report type"),
        SurrealField.record("organization", "organization").description("Report scope"),
        SurrealField.object("parameters").description("Report parameters"),
        SurrealField.object("schedule").optional().description("Report schedule"),
        SurrealField.string("format").default("'json'").description("Report output format"),
        SurrealField.array("recipients").optional().description("Report recipients"),
        SurrealField.datetime("last_run").optional().description("Last execution time"),
        SurrealField.datetime("next_run").optional().description("Next scheduled run"),
        SurrealField.datetime("created_at").default("time::now()").description("Report creation time"),
      ])
        .withDescription("Scheduled reports");

      // Analytics event table
      const analyticsEventTable = SurrealTable.create("analytics_event", [
        SurrealField.id("analytics_event"),
        SurrealField.record("organization", "organization").optional().description("Event organization"),
        SurrealField.record("user", "user").optional().description("Event user"),
        SurrealField.string("event_name").description("Event identifier"),
        SurrealField.string("event_category").description("Event category"),
        SurrealField.object("properties").optional().description("Event properties"),
        SurrealField.string("session_id").optional().description("User session ID"),
        SurrealField.string("ip_address").optional().description("Client IP address"),
        SurrealField.string("user_agent").optional().description("Client user agent"),
        SurrealField.datetime("timestamp").default("time::now()").description("Event timestamp"),
      ])
        .withDescription("Analytics and user events");

      const analyticsSchema = SurrealSchema.create("analytics_system", "1.0.0")
        .addTable(dashboardTable)
        .addTable(reportTable)
        .addTable(analyticsEventTable)
        .addIndex(SurrealIndex.create("idx_dashboard_org", "dashboard", ["organization", "created_at"]))
        .addIndex(SurrealIndex.create("idx_report_org", "report", ["organization", "type"]))
        .addIndex(SurrealIndex.create("idx_report_schedule", "report", ["next_run"]))
        .addIndex(SurrealIndex.create("idx_analytics_event_org", "analytics_event", ["organization", "timestamp"]))
        .addIndex(SurrealIndex.create("idx_analytics_event_user", "analytics_event", ["user", "timestamp"]))
        .addIndex(SurrealIndex.create("idx_analytics_event_name", "analytics_event", ["event_name", "timestamp"]))
        .addIndex(SurrealIndex.create("idx_analytics_session", "analytics_event", ["session_id", "timestamp"]));

      expect(analyticsSchema.getTables()).toHaveLength(3);
      expect(analyticsSchema.getIndexes()).toHaveLength(7);

      // Verify time-series indexes for analytics
      const eventTimestampIndex = analyticsSchema.getIndexes()?.find(i => 
        i.getName() === "idx_analytics_event_org" && i.getFields().includes("timestamp")
      );
      expect(eventTimestampIndex).toBeDefined();
    });
  });

  describe("Schema Evolution and Migration", () => {
    it("should handle SaaS platform schema evolution", () => {
      // V1: Basic SaaS schema
      const v1Schema = SurrealSchema.create("saas", "1.0.0")
        .addTable(
          SurrealTable.create("organization", [
            SurrealField.id("organization"),
            SurrealField.string("name"),
            SurrealField.string("slug").unique(),
            SurrealField.record("owner", "user"),
            SurrealField.datetime("created_at").default("time::now()"),
          ])
        )
        .addTable(
          SurrealTable.create("user", [
            SurrealField.id("user"),
            SurrealField.string("email").unique(),
            SurrealField.string("name"),
            SurrealField.datetime("created_at").default("time::now()"),
          ])
        );

      // V2: Add billing, projects, and advanced features
      const v2Schema = SurrealSchema.create("saas", "2.0.0")
        .addTable(
          SurrealTable.create("organization", [
            SurrealField.id("organization"),
            SurrealField.string("name"),
            SurrealField.string("slug").unique(),
            SurrealField.string("description").optional(), // New field
            SurrealField.record("owner", "user"),
            SurrealField.string("plan").default("'free'"), // New field
            SurrealField.object("settings").optional(), // New field
            SurrealField.boolean("is_active").default("true"), // New field
            SurrealField.datetime("created_at").default("time::now()"),
            SurrealField.datetime("updated_at").default("time::now()"), // New field
          ])
        )
        .addTable(
          SurrealTable.create("user", [
            SurrealField.id("user"),
            SurrealField.string("email").unique(),
            SurrealField.string("first_name"), // Split name field
            SurrealField.string("last_name"),  // Split name field
            SurrealField.string("avatar_url").optional(), // New field
            SurrealField.string("timezone").default("'UTC'"), // New field
            SurrealField.boolean("email_verified").default("false"), // New field
            SurrealField.datetime("created_at").default("time::now()"),
            SurrealField.datetime("updated_at").default("time::now()"), // New field
          ])
        )
        .addTable( // New table
          SurrealTable.create("project", [
            SurrealField.id("project"),
            SurrealField.string("name"),
            SurrealField.string("slug"),
            SurrealField.record("organization", "organization"),
            SurrealField.record("owner", "user"),
            SurrealField.string("status").default("'active'"),
            SurrealField.datetime("created_at").default("time::now()"),
          ])
        )
        .addTable( // New table
          SurrealTable.create("subscription", [
            SurrealField.id("subscription"),
            SurrealField.record("organization", "organization"),
            SurrealField.string("plan"),
            SurrealField.string("status"),
            SurrealField.number("amount"),
            SurrealField.datetime("created_at").default("time::now()"),
          ])
        );

      // Generate migration
      const diff = SchemaComparator.compare(v1Schema, v2Schema);
      expect(diff.hasChanges).toBe(true);

      const migration = MigrationGenerator.generateMigration(
        diff,
        "add_billing_and_projects",
        "Add billing, projects, and enhanced user management"
      );

      expect(migration.statements.length).toBeGreaterThan(0);

      // Verify migration includes new table creation
      const tableCreations = migration.statements.filter(s => s.type === "table" && s.operation === "CREATE");
      expect(tableCreations.some(s => s.description.includes("project"))).toBe(true);
      expect(tableCreations.some(s => s.description.includes("subscription"))).toBe(true);

      // Verify migration includes field additions
      const fieldCreations = migration.statements.filter(s => s.type === "field" && s.operation === "CREATE");
      expect(fieldCreations.length).toBeGreaterThan(7); // Multiple new fields added

      // Test migration SQL generation
      const migrationSQL = MigrationGenerator.generateMigrationFile(migration);
      expect(migrationSQL).toContain("-- UP");
      expect(migrationSQL).toContain("-- DOWN");
      expect(migrationSQL).toContain("DEFINE");
    });
  });
});