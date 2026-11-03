import * as SQLite from "expo-sqlite";
import { logger } from "../utils/logger";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  logger.info("Opening database");
  const db = await SQLite.openDatabaseAsync("medirem.db");
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'Tablet',
      scheduleTime TEXT NOT NULL,
      startDate TEXT NOT NULL,
      durationDays INTEGER NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      photoUri TEXT,
      notificationIds TEXT NOT NULL DEFAULT '[]',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dose_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicineId INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      loggedAt TEXT NOT NULL,
      UNIQUE (medicineId, date)
    );

    CREATE INDEX IF NOT EXISTS idx_medicines_user ON medicines (userId);
    CREATE INDEX IF NOT EXISTS idx_logs_date ON dose_logs (date);
  `);
  return db;
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabase().catch((error) => {
      dbPromise = null; // allow a retry after a failure
      throw error;
    });
  }
  return dbPromise;
}