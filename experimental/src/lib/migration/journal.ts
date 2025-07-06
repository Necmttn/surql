import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Console, Data, Effect, Layer } from "effect";

// Migration journal types based on Drizzle patterns
export interface MigrationEntry extends Data.TaggedClass<"MigrationEntry"> {
  readonly idx: number;
  readonly version: string;
  readonly when: number;
  readonly tag: string;
  readonly breakpoints: boolean;
  readonly description?: string;
  readonly author?: string;
}

export class MigrationEntry extends Data.TaggedClass("MigrationEntry")<{
  readonly idx: number;
  readonly version: string;
  readonly when: number;
  readonly tag: string;
  readonly breakpoints: boolean;
  readonly description?: string;
  readonly author?: string;
}> {}

export class MigrationJournal extends Data.TaggedClass("MigrationJournal")<{
  readonly version: string;
  readonly dialect: "surrealdb";
  readonly entries: readonly MigrationEntry[];
}> {}

export class MigrationSnapshot extends Data.TaggedClass("MigrationSnapshot")<{
  readonly version: string;
  readonly timestamp: number;
  readonly tables: Record<string, any>;
  readonly indexes: Record<string, any>;
  readonly events: Record<string, any>;
  readonly functions: Record<string, any>;
  readonly _meta: {
    readonly generator: string;
    readonly version: string;
  };
}> {}

// Journal management service
export class MigrationJournalService extends Effect.Service<MigrationJournalService>()(
  "MigrationJournalService",
  {
    effect: Effect.gen(function* () {
      const migrationsDir = "migrations";
      const metaDir = join(migrationsDir, "meta");
      const journalPath = join(metaDir, "_journal.json");

      // Ensure migrations directory structure exists
      const ensureDirectoryStructure = Effect.promise(() => mkdir(metaDir, { recursive: true }));

      // Load existing journal or create new one
      const loadJournal = Effect.gen(function* () {
        if (!existsSync(journalPath)) {
          const newJournal = new MigrationJournal({
            version: "1",
            dialect: "surrealdb",
            entries: [],
          });
          yield* Effect.promise(() => writeFile(journalPath, JSON.stringify(newJournal, null, 2)));
          return newJournal;
        }

        const content = yield* Effect.promise(() => readFile(journalPath, "utf-8"));
        const data = JSON.parse(content);
        return new MigrationJournal({
          version: data.version,
          dialect: data.dialect,
          entries: data.entries.map(
            (entry: any) =>
              new MigrationEntry({
                idx: entry.idx,
                version: entry.version,
                when: entry.when,
                tag: entry.tag,
                breakpoints: entry.breakpoints,
                description: entry.description,
                author: entry.author,
              })
          ),
        });
      });

      // Save journal to disk
      const saveJournal = (journal: MigrationJournal) =>
        Effect.promise(() => writeFile(journalPath, JSON.stringify(journal, null, 2)));

      // Add new migration entry
      const addMigration = (
        journal: MigrationJournal,
        tag: string,
        description?: string,
        author?: string
      ) => {
        const newEntry = new MigrationEntry({
          idx: journal.entries.length,
          version: "1",
          when: Date.now(),
          tag,
          breakpoints: true,
          description,
          author,
        });

        return new MigrationJournal({
          ...journal,
          entries: [...journal.entries, newEntry],
        });
      };

      // Generate migration filename
      const generateMigrationTag = (description: string) => {
        const timestamp = Date.now();
        const slug = description
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_|_$/g, "");

        return `${String(timestamp).slice(-6)}_${slug}`;
      };

      // Create migration snapshot
      const createSnapshot = (
        tables: Record<string, any>,
        indexes: Record<string, any> = {},
        events: Record<string, any> = {},
        functions: Record<string, any> = {}
      ) =>
        new MigrationSnapshot({
          version: "1",
          timestamp: Date.now(),
          tables,
          indexes,
          events,
          functions,
          _meta: {
            generator: "surql-gen-experimental",
            version: "1.0.0",
          },
        });

      // Save migration snapshot
      const saveSnapshot = (snapshot: MigrationSnapshot, tag: string) => {
        const snapshotPath = join(metaDir, `${tag}_snapshot.json`);
        return Effect.promise(() => writeFile(snapshotPath, JSON.stringify(snapshot, null, 2)));
      };

      // Load migration snapshot
      const loadSnapshot = (tag: string) => {
        const snapshotPath = join(metaDir, `${tag}_snapshot.json`);
        return Effect.gen(function* () {
          if (!existsSync(snapshotPath)) {
            return undefined;
          }
          const content = yield* Effect.promise(() => readFile(snapshotPath, "utf-8"));
          const data = JSON.parse(content);
          return new MigrationSnapshot({
            version: data.version,
            timestamp: data.timestamp,
            tables: data.tables,
            indexes: data.indexes,
            events: data.events,
            functions: data.functions,
            _meta: data._meta,
          });
        });
      };

      // Get latest migration
      const getLatestMigration = (journal: MigrationJournal) => {
        if (journal.entries.length === 0) return undefined;
        return journal.entries[journal.entries.length - 1];
      };

      // Create migration files
      const createMigrationFiles = (
        tag: string,
        upSql: string,
        downSql: string,
        snapshot: MigrationSnapshot
      ) =>
        Effect.gen(function* () {
          const migrationPath = join(migrationsDir, `${tag}.sql`);
          const migrationContent = `-- Migration: ${tag}
-- Generated: ${new Date().toISOString()}

-- UP
${upSql}

-- DOWN
${downSql}
`;

          yield* Effect.promise(() => writeFile(migrationPath, migrationContent));
          yield* saveSnapshot(snapshot, tag);
          yield* Console.log(`✅ Migration files created: ${tag}`);
        });

      return {
        ensureDirectoryStructure,
        loadJournal,
        saveJournal,
        addMigration,
        generateMigrationTag,
        createSnapshot,
        saveSnapshot,
        loadSnapshot,
        getLatestMigration,
        createMigrationFiles,
      } as const;
    }),
  }
) {}
