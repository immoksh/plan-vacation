import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { config } from "../config.js";

export const db = new Database(config.dbFile);

db.pragma("journal_mode = WAL");

const schema = readFileSync(new URL("./schema.sql", import.meta.url), "utf8");
db.exec(schema);

// Lightweight migrations for columns added after a database was first created.
// `CREATE TABLE IF NOT EXISTS` above leaves existing tables untouched, so we add
// any missing columns here. SQLite has no "ADD COLUMN IF NOT EXISTS", so guard
// each one against the current table shape.
ensureColumns("daily_weather", {
  wave_height_max: "REAL",
  wave_period_max: "REAL",
  swell_height_max: "REAL",
  swell_period_max: "REAL",
});

function ensureColumns(table: string, columns: Record<string, string>): void {
  const existing = new Set(
    (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name),
  );
  for (const [name, type] of Object.entries(columns)) {
    if (!existing.has(name)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${type}`);
    }
  }
}
