import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Console, Data, Effect } from "effect";
export class MigrationEntry extends Data.TaggedClass("MigrationEntry") {
}
export class MigrationJournal extends Data.TaggedClass("MigrationJournal") {
}
export class MigrationSnapshot extends Data.TaggedClass("MigrationSnapshot") {
}
// Journal management service
export class MigrationJournalService extends Effect.Service()("MigrationJournalService", {
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
                entries: data.entries.map((entry) => new MigrationEntry({
                    idx: entry.idx,
                    version: entry.version,
                    when: entry.when,
                    tag: entry.tag,
                    breakpoints: entry.breakpoints,
                    description: entry.description,
                    author: entry.author,
                })),
            });
        });
        // Save journal to disk
        const saveJournal = (journal) => Effect.promise(() => writeFile(journalPath, JSON.stringify(journal, null, 2)));
        // Add new migration entry
        const addMigration = (journal, tag, description, author) => {
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
        const generateMigrationTag = (description) => {
            const timestamp = Date.now();
            const slug = description
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_|_$/g, "");
            return `${String(timestamp).slice(-6)}_${slug}`;
        };
        // Create migration snapshot
        const createSnapshot = (tables, indexes = {}, events = {}, functions = {}) => new MigrationSnapshot({
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
        const saveSnapshot = (snapshot, tag) => {
            const snapshotPath = join(metaDir, `${tag}_snapshot.json`);
            return Effect.promise(() => writeFile(snapshotPath, JSON.stringify(snapshot, null, 2)));
        };
        // Load migration snapshot
        const loadSnapshot = (tag) => {
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
        const getLatestMigration = (journal) => {
            if (journal.entries.length === 0)
                return undefined;
            return journal.entries[journal.entries.length - 1];
        };
        // Create migration files
        const createMigrationFiles = (tag, upSql, downSql, snapshot) => Effect.gen(function* () {
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
        };
    }),
}) {
}
