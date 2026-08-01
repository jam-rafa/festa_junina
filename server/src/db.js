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
    targetImagePath TEXT,
    enteredAt TEXT NOT NULL
  )
`;

const CREATE_ARREST_REQUESTS_TABLE = `
  CREATE TABLE IF NOT EXISTS arrest_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    targetName TEXT NOT NULL,
    targetImagePath TEXT,
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

const CREATE_PAYMENT_VOUCHERS_TABLE = `
  CREATE TABLE IF NOT EXISTS payment_vouchers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    createdAt TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    usedAt TEXT,
    arrestRequestId INTEGER
  )
`;

function ensureColumn(database, tableName, columnName, definition) {
  const columns = database.prepare(`PRAGMA table_info(${tableName})`).all();
  const hasColumn = columns.some((column) => column.name === columnName);
  if (!hasColumn) {
    database.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`).run();
  }
}

export function openDatabase(databasePath = process.env.DATABASE_PATH ?? defaultDatabasePath) {
  const database = new DatabaseConstructor(databasePath);
  database.pragma("journal_mode = WAL");
  database.exec(CREATE_QUEUE_ENTRIES_TABLE);
  database.exec(CREATE_ARREST_REQUESTS_TABLE);
  database.exec(CREATE_EVENT_SETTINGS_TABLE);
  database.exec(CREATE_PAYMENT_VOUCHERS_TABLE);
  ensureColumn(database, "queue_entries", "targetImagePath", "TEXT");
  ensureColumn(database, "arrest_requests", "targetImagePath", "TEXT");
  return database;
}
