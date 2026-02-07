import { getDatabase } from '../db';
import { Expense } from '../types';

/**
 * Create a new expense with validation
 * @param expense - The expense data (without id, createdAt, updatedAt)
 * @returns The created expense with all fields
 * @throws Error if validation fails
 */
export function createExpense(
  expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>
): Expense {
  // Validate required fields
  if (!expense.type || expense.type.trim() === '') {
    throw new Error('Required field missing: type');
  }
  
  if (typeof expense.amount !== 'number' || expense.amount <= 0) {
    throw new Error('Amount must be a positive number');
  }
  
  if (!expense.date) {
    throw new Error('Required field missing: date');
  }
  
  // Validate date format (ISO 8601)
  const dateObj = new Date(expense.date);
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date format. Use ISO 8601 format');
  }
  
  const db = getDatabase();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO expenses (type, amount, date, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    expense.type,
    expense.amount,
    expense.date,
    expense.description || null,
    now,
    now
  );
  
  // Retrieve the created expense
  const selectStmt = db.prepare('SELECT * FROM expenses WHERE id = ?');
  const row = selectStmt.get(result.lastInsertRowid) as any;
  
  return mapRowToExpense(row);
}

/**
 * Get all expenses ordered chronologically (earliest to latest)
 * @returns Array of expenses ordered by date
 */
export function getExpenses(): Expense[] {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT * FROM expenses
    ORDER BY date ASC
  `);
  
  const rows = stmt.all() as any[];
  
  return rows.map(mapRowToExpense);
}

/**
 * Get a single expense by ID
 * @param id - The expense ID
 * @returns The expense or null if not found
 */
export function getExpenseById(id: number): Expense | null {
  const db = getDatabase();
  
  const stmt = db.prepare('SELECT * FROM expenses WHERE id = ?');
  const row = stmt.get(id) as any;
  
  if (!row) {
    return null;
  }
  
  return mapRowToExpense(row);
}

/**
 * Update an expense, preserving the original createdAt timestamp
 * @param id - The expense ID
 * @param updates - Partial expense data to update
 * @returns The updated expense
 * @throws Error if expense not found or validation fails
 */
export function updateExpense(
  id: number,
  updates: Partial<Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>>
): Expense {
  // Validate updates if provided
  if (updates.amount !== undefined) {
    if (typeof updates.amount !== 'number' || updates.amount <= 0) {
      throw new Error('Amount must be a positive number');
    }
  }
  
  if (updates.date !== undefined) {
    const dateObj = new Date(updates.date);
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date format. Use ISO 8601 format');
    }
  }
  
  if (updates.type !== undefined && updates.type.trim() === '') {
    throw new Error('Type cannot be empty');
  }
  
  const db = getDatabase();
  
  // Check if expense exists
  const existing = getExpenseById(id);
  if (!existing) {
    throw new Error('Resource not found');
  }
  
  // Build dynamic update query
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.type !== undefined) {
    fields.push('type = ?');
    values.push(updates.type);
  }
  
  if (updates.amount !== undefined) {
    fields.push('amount = ?');
    values.push(updates.amount);
  }
  
  if (updates.date !== undefined) {
    fields.push('date = ?');
    values.push(updates.date);
  }
  
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description || null);
  }
  
  // Always update updated_at
  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  
  // Add id to values for WHERE clause
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE expenses
    SET ${fields.join(', ')}
    WHERE id = ?
  `);
  
  stmt.run(...values);
  
  // Retrieve and return the updated expense
  const updated = getExpenseById(id);
  if (!updated) {
    throw new Error('Failed to retrieve updated expense');
  }
  
  return updated;
}

/**
 * Delete an expense
 * @param id - The expense ID
 * @returns true if deleted, false if not found
 */
export function deleteExpense(id: number): boolean {
  const db = getDatabase();
  
  const stmt = db.prepare('DELETE FROM expenses WHERE id = ?');
  const result = stmt.run(id);
  
  return result.changes > 0;
}

/**
 * Map a database row to an Expense object
 * Converts snake_case column names to camelCase property names
 */
function mapRowToExpense(row: any): Expense {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    date: row.date,
    description: row.description || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
