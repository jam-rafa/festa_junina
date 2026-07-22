import DatabaseConstructor from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const defaultDatabasePath = path.join(currentDir, "..", "fila.db");

const CREATE_QUEUE_ENTRIES_TABLE = `
  CREATE TABLE IF NOT EXISTS queue_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guestName TEXT NOT NULL,
    holdDurationMinutes INTEGER NOT NULL,
    enteredAt TEXT NOT NULL
  )
`;

const CREATE_ARREST_REQUESTS_TABLE = `
  CREATE TABLE IF NOT EXISTS arrest_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    targetName TEXT NOT NULL,
    status TEXT NOT NULL,
    priceCents INTEGER NOT NULL,
    durationMinutes INTEGER NOT NULL,
    paymentStatus TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    paidAt TEXT,
    acceptedAt TEXT,
    rejectedAt TEXT
  )
`;

const CREATE_EVENT_SETTINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS event_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`;

export function openDatabase(databasePath = process.env.DATABASE_PATH ?? defaultDatabasePath) {
  const database = new DatabaseConstructor(databasePath);
  database.pragma("journal_mode = WAL");
  database.exec(CREATE_QUEUE_ENTRIES_TABLE);
  database.exec(CREATE_ARREST_REQUESTS_TABLE);
  database.exec(CREATE_EVENT_SETTINGS_TABLE);
  return database;
}
