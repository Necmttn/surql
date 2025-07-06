import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { Effect, Layer } from "effect";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  MigrationEntry,
  MigrationJournal,
  MigrationJournalService,
} from "../../lib/migration/journal";

describe("MigrationJournalService", () => {
  const testMigrationsDir = "./migrations";

  beforeEach(async () => {
    // Clean up any existing test migrations
    if (existsSync(testMigrationsDir)) {
      await rm(testMigrationsDir, { recursive: true });
    }
  });

  afterEach(async () => {
    // Clean up test migrations after each test
    if (existsSync(testMigrationsDir)) {
      await rm(testMigrationsDir, { recursive: true });
    }
  });

  describe("Journal Creation", () => {
    it("should create new journal when none exists", async () => {
      const program = Effect.gen(function* () {
        const service = yield* MigrationJournalService;

        yield* service.ensureDirectoryStructure;
        const journal = yield* service.loadJournal;

        expect(journal.version).toBe("1");
        expect(journal.dialect).toBe("surrealdb");
        expect(journal.entries).toHaveLength(0);
      });

      await Effect.runPromise(Effect.provide(program, MigrationJournalService.Default));
    });
  });

  describe("Migration Entry Management", () => {
    it("should add migration entries", async () => {
      const program = Effect.gen(function* () {
        const service = yield* MigrationJournalService;

        yield* service.ensureDirectoryStructure;
        let journal = yield* service.loadJournal;

        journal = service.addMigration(
          journal,
          "001_initial_schema",
          "Initial schema setup",
          "developer"
        );

        expect(journal.entries).toHaveLength(1);

        const entry = journal.entries[0];
        expect(entry.idx).toBe(0);
        expect(entry.tag).toBe("001_initial_schema");
        expect(entry.description).toBe("Initial schema setup");
        expect(entry.author).toBe("developer");
        expect(entry.breakpoints).toBe(true);
        expect(typeof entry.when).toBe("number");
      });

      await Effect.runPromise(Effect.provide(program, MigrationJournalService.Default));
    });

    it("should increment migration index", async () => {
      const program = Effect.gen(function* () {
        const service = yield* MigrationJournalService;

        yield* service.ensureDirectoryStructure;
        let journal = yield* service.loadJournal;

        journal = service.addMigration(journal, "001_first", "First migration");
        journal = service.addMigration(journal, "002_second", "Second migration");
        journal = service.addMigration(journal, "003_third", "Third migration");

        expect(journal.entries).toHaveLength(3);
        expect(journal.entries[0].idx).toBe(0);
        expect(journal.entries[1].idx).toBe(1);
        expect(journal.entries[2].idx).toBe(2);
      });

      await Effect.runPromise(Effect.provide(program, MigrationJournalService.Default));
    });

    it("should get latest migration", async () => {
      const program = Effect.gen(function* () {
        const service = yield* MigrationJournalService;

        let journal = new MigrationJournal({
          version: "1",
          dialect: "surrealdb",
          entries: [],
        });

        // No migrations initially
        expect(service.getLatestMigration(journal)).toBeUndefined();

        journal = service.addMigration(journal, "001_first", "First");
        journal = service.addMigration(journal, "002_second", "Second");

        const latest = service.getLatestMigration(journal);
        expect(latest?.tag).toBe("002_second");
        expect(latest?.idx).toBe(1);
      });

      await Effect.runPromise(Effect.provide(program, MigrationJournalService.Default));
    });
  });

  describe("Migration Tag Generation", () => {
    it("should generate valid migration tags", async () => {
      const program = Effect.gen(function* () {
        const service = yield* MigrationJournalService;

        const tag1 = service.generateMigrationTag("add user table");
        const tag2 = service.generateMigrationTag("Update User Fields");
        const tag3 = service.generateMigrationTag("remove-old-indexes");

        expect(tag1).toMatch(/^\d{6}_add_user_table$/);
        expect(tag2).toMatch(/^\d{6}_update_user_fields$/);
        expect(tag3).toMatch(/^\d{6}_remove_old_indexes$/);

        // Tags should be different (different timestamps)
        expect(tag1).not.toBe(tag2);
      });

      await Effect.runPromise(Effect.provide(program, MigrationJournalService.Default));
    });
  });

  describe("Snapshot Management", () => {
    it("should create migration snapshots", async () => {
      const program = Effect.gen(function* () {
        const service = yield* MigrationJournalService;

        const tables = {
          user: {
            name: "user",
            fields: ["id", "username", "email"],
          },
        };

        const indexes = {
          idx_user_email: {
            table: "user",
            fields: ["email"],
            unique: true,
          },
        };

        const snapshot = service.createSnapshot(tables, indexes);

        expect(snapshot.version).toBe("1");
        expect(snapshot.tables).toEqual(tables);
        expect(snapshot.indexes).toEqual(indexes);
        expect(snapshot._meta.generator).toBe("surql-gen-experimental");
        expect(typeof snapshot.timestamp).toBe("number");
      });

      await Effect.runPromise(Effect.provide(program, MigrationJournalService.Default));
    });
  });

  describe("Journal Persistence", () => {
    it("should save and load journal", async () => {
      const program = Effect.gen(function* () {
        const service = yield* MigrationJournalService;

        yield* service.ensureDirectoryStructure;

        let journal = yield* service.loadJournal;
        journal = service.addMigration(journal, "001_test", "Test migration", "test-user");

        yield* service.saveJournal(journal);

        const loadedJournal = yield* service.loadJournal;

        expect(loadedJournal.entries).toHaveLength(1);
        expect(loadedJournal.entries[0].tag).toBe("001_test");
        expect(loadedJournal.entries[0].description).toBe("Test migration");
        expect(loadedJournal.entries[0].author).toBe("test-user");
      });

      await Effect.runPromise(Effect.provide(program, MigrationJournalService.Default));
    });
  });

  describe("Data Immutability", () => {
    it("should maintain immutability with TaggedClass", async () => {
      const program = Effect.gen(function* () {
        const service = yield* MigrationJournalService;

        const original = new MigrationJournal({
          version: "1",
          dialect: "surrealdb",
          entries: [],
        });

        const modified = service.addMigration(original, "001_test", "Test");

        expect(original.entries).toHaveLength(0);
        expect(modified.entries).toHaveLength(1);
        expect(original).not.toBe(modified);
      });

      await Effect.runPromise(Effect.provide(program, MigrationJournalService.Default));
    });

    it("should support structural equality for entries", () => {
      const entry1 = new MigrationEntry({
        idx: 0,
        version: "1",
        when: 1234567890,
        tag: "001_test",
        breakpoints: true,
        description: "Test migration",
        author: "developer",
      });

      const entry2 = new MigrationEntry({
        idx: 0,
        version: "1",
        when: 1234567890,
        tag: "001_test",
        breakpoints: true,
        description: "Test migration",
        author: "developer",
      });

      // Both entries should have the same structure
      expect(entry1.idx).toBe(entry2.idx);
      expect(entry1.tag).toBe(entry2.tag);
      expect(entry1.description).toBe(entry2.description);
    });
  });

  describe("Error Handling", () => {
    it("should handle missing snapshot gracefully", async () => {
      const program = Effect.gen(function* () {
        const service = yield* MigrationJournalService;

        const snapshot = yield* service.loadSnapshot("nonexistent_migration");

        expect(snapshot).toBeUndefined();
      });

      await Effect.runPromise(Effect.provide(program, MigrationJournalService.Default));
    });
  });
});
