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

export function openDatabase(databasePath = process.env.DATABASE_PATH ?? defaultDatabasePath) {
  const database = new DatabaseConstructor(databasePath);
  database.pragma("journal_mode = WAL");
  database.exec(CREATE_QUEUE_ENTRIES_TABLE);
  return database;
}
