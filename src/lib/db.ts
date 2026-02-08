import Database from 'better-sqlite3';
import path from 'path';

// Database file path - read from environment variable or use default
const DB_PATH = process.env.DB_PATH 
  ? path.isAbsolute(process.env.DB_PATH)
    ? process.env.DB_PATH
    : path.join(process.cwd(), process.env.DB_PATH)
  : path.join(process.cwd(), 'car-expense-tracker.db');

// Initialize database connection
let db: Database.Database | null = null;

/**
 * Get or create the database connection
 */
export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL'); // Enable Write-Ahead Logging for better performance
    initializeSchema();
  }
  return db;
}

/**
 * Initialize database schema with all tables and indexes
 */
function initializeSchema(): void {
  const db = getDatabase();

  // Create expenses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      date TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create refills table
  db.exec(`
    CREATE TABLE IF NOT EXISTS refills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount_spent REAL NOT NULL CHECK(amount_spent > 0),
      liters REAL CHECK(liters > 0),
      distance_traveled REAL NOT NULL CHECK(distance_traveled > 0),
      date TEXT NOT NULL,
      notes TEXT,
      efficiency REAL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create trips table
  db.exec(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      distance REAL NOT NULL CHECK(distance > 0),
      date TEXT NOT NULL,
      purpose TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes for date columns
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    CREATE INDEX IF NOT EXISTS idx_refills_date ON refills(date);
    CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(date);
  `);
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Reset the database (useful for testing)
 */
export function resetDatabase(): void {
  const db = getDatabase();
  
  // Drop indexes first
  db.exec(`
    DROP INDEX IF EXISTS idx_expenses_date;
    DROP INDEX IF EXISTS idx_refills_date;
    DROP INDEX IF EXISTS idx_trips_date;
  `);
  
  // Then drop tables
  db.exec(`
    DROP TABLE IF EXISTS expenses;
    DROP TABLE IF EXISTS refills;
    DROP TABLE IF EXISTS trips;
  `);
  
  initializeSchema();
}
