import { getDatabase, closeDatabase, resetDatabase } from '../db';
import Database from 'better-sqlite3';

describe('Database Initialization', () => {
  beforeEach(() => {
    // Reset database before each test
    resetDatabase();
  });

  afterAll(() => {
    // Close database connection after all tests
    closeDatabase();
  });

  test('should create database connection', () => {
    const db = getDatabase();
    expect(db).toBeDefined();
    expect(db).toBeInstanceOf(Database);
  });

  test('should create expenses table with correct schema', () => {
    const db = getDatabase();
    const tableInfo = db.pragma('table_info(expenses)');
    
    const columnNames = tableInfo.map((col: any) => col.name);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('type');
    expect(columnNames).toContain('amount');
    expect(columnNames).toContain('date');
    expect(columnNames).toContain('description');
    expect(columnNames).toContain('created_at');
    expect(columnNames).toContain('updated_at');
  });

  test('should create refills table with correct schema', () => {
    const db = getDatabase();
    const tableInfo = db.pragma('table_info(refills)');
    
    const columnNames = tableInfo.map((col: any) => col.name);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('amount_spent');
    expect(columnNames).toContain('distance_traveled');
    expect(columnNames).toContain('date');
    expect(columnNames).toContain('notes');
    expect(columnNames).toContain('efficiency');
    expect(columnNames).toContain('created_at');
    expect(columnNames).toContain('updated_at');
  });

  test('should create trips table with correct schema', () => {
    const db = getDatabase();
    const tableInfo = db.pragma('table_info(trips)');
    
    const columnNames = tableInfo.map((col: any) => col.name);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('distance');
    expect(columnNames).toContain('date');
    expect(columnNames).toContain('purpose');
    expect(columnNames).toContain('notes');
    expect(columnNames).toContain('created_at');
    expect(columnNames).toContain('updated_at');
  });

  test('should create sessions table with correct schema', () => {
    const db = getDatabase();
    const tableInfo = db.pragma('table_info(sessions)');
    
    const columnNames = tableInfo.map((col: any) => col.name);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('authenticated');
    expect(columnNames).toContain('created_at');
    expect(columnNames).toContain('expires_at');
  });

  test('should create indexes for date columns', () => {
    const db = getDatabase();
    const indexes = db.pragma('index_list(expenses)');
    
    const indexNames = indexes.map((idx: any) => idx.name);
    expect(indexNames).toContain('idx_expenses_date');
  });

  test('should create index for session expiration', () => {
    const db = getDatabase();
    const indexes = db.pragma('index_list(sessions)');
    
    const indexNames = indexes.map((idx: any) => idx.name);
    expect(indexNames).toContain('idx_sessions_expires');
  });

  test('should enforce CHECK constraint for positive expense amounts', () => {
    const db = getDatabase();
    
    expect(() => {
      db.prepare('INSERT INTO expenses (type, amount, date) VALUES (?, ?, ?)').run(
        'test',
        -10, // Negative amount should fail
        '2024-01-01'
      );
    }).toThrow();
  });

  test('should enforce CHECK constraint for positive refill amounts', () => {
    const db = getDatabase();
    
    expect(() => {
      db.prepare('INSERT INTO refills (amount_spent, distance_traveled, date) VALUES (?, ?, ?)').run(
        -50, // Negative amount should fail
        100,
        '2024-01-01'
      );
    }).toThrow();
  });

  test('should enforce CHECK constraint for positive refill distances', () => {
    const db = getDatabase();
    
    expect(() => {
      db.prepare('INSERT INTO refills (amount_spent, distance_traveled, date) VALUES (?, ?, ?)').run(
        50,
        -100, // Negative distance should fail
        '2024-01-01'
      );
    }).toThrow();
  });

  test('should enforce CHECK constraint for positive trip distances', () => {
    const db = getDatabase();
    
    expect(() => {
      db.prepare('INSERT INTO trips (distance, date) VALUES (?, ?)').run(
        -50, // Negative distance should fail
        '2024-01-01'
      );
    }).toThrow();
  });

  test('should allow valid expense insertion', () => {
    const db = getDatabase();
    
    const result = db.prepare('INSERT INTO expenses (type, amount, date) VALUES (?, ?, ?)').run(
      'car wash',
      25.50,
      '2024-01-01'
    );
    
    expect(result.changes).toBe(1);
    expect(result.lastInsertRowid).toBeGreaterThan(0);
  });

  test('should allow valid refill insertion', () => {
    const db = getDatabase();
    
    const result = db.prepare('INSERT INTO refills (amount_spent, distance_traveled, date) VALUES (?, ?, ?)').run(
      50.00,
      400,
      '2024-01-01'
    );
    
    expect(result.changes).toBe(1);
    expect(result.lastInsertRowid).toBeGreaterThan(0);
  });

  test('should allow valid trip insertion', () => {
    const db = getDatabase();
    
    const result = db.prepare('INSERT INTO trips (distance, date) VALUES (?, ?)').run(
      150.5,
      '2024-01-01'
    );
    
    expect(result.changes).toBe(1);
    expect(result.lastInsertRowid).toBeGreaterThan(0);
  });

  test('should set default timestamps on insertion', () => {
    const db = getDatabase();
    
    db.prepare('INSERT INTO expenses (type, amount, date) VALUES (?, ?, ?)').run(
      'maintenance',
      100,
      '2024-01-01'
    );
    
    const expense = db.prepare('SELECT * FROM expenses WHERE type = ?').get('maintenance') as any;
    
    expect(expense.created_at).toBeDefined();
    expect(expense.updated_at).toBeDefined();
    expect(expense.created_at).toBe(expense.updated_at);
  });
});
