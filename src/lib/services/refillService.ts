import { getDatabase } from '../db';
import { Refill } from '../types';

/**
 * Calculate fuel efficiency (cost per kilometer)
 * @param amountSpent - The amount spent on fuel
 * @param distance - The distance traveled
 * @returns The efficiency (cost per km)
 */
export function calculateEfficiency(amountSpent: number, distance: number): number {
  if (distance <= 0) {
    throw new Error('Distance must be a positive number');
  }
  return amountSpent / distance;
}

/**
 * Create a new refill with efficiency calculation
 * @param refill - The refill data (without id, efficiency, createdAt, updatedAt)
 * @returns The created refill with all fields including calculated efficiency
 * @throws Error if validation fails
 */
export function createRefill(
  refill: Omit<Refill, 'id' | 'efficiency' | 'createdAt' | 'updatedAt'>
): Refill {
  // Validate required fields
  if (typeof refill.amountSpent !== 'number' || refill.amountSpent <= 0) {
    throw new Error('Amount must be a positive number');
  }
  
  if (typeof refill.distanceTraveled !== 'number' || refill.distanceTraveled <= 0) {
    throw new Error('Distance must be a positive number');
  }
  
  if (!refill.date) {
    throw new Error('Required field missing: date');
  }
  
  // Validate date format (ISO 8601)
  const dateObj = new Date(refill.date);
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date format. Use ISO 8601 format');
  }
  
  // Calculate efficiency
  const efficiency = calculateEfficiency(refill.amountSpent, refill.distanceTraveled);
  
  const db = getDatabase();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO refills (amount_spent, distance_traveled, date, notes, efficiency, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    refill.amountSpent,
    refill.distanceTraveled,
    refill.date,
    refill.notes || null,
    efficiency,
    now,
    now
  );
  
  // Retrieve the created refill
  const selectStmt = db.prepare('SELECT * FROM refills WHERE id = ?');
  const row = selectStmt.get(result.lastInsertRowid) as any;
  
  return mapRowToRefill(row);
}

/**
 * Get all refills ordered chronologically (earliest to latest)
 * @returns Array of refills ordered by date
 */
export function getRefills(): Refill[] {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT * FROM refills
    ORDER BY date ASC
  `);
  
  const rows = stmt.all() as any[];
  
  return rows.map(mapRowToRefill);
}

/**
 * Get a single refill by ID
 * @param id - The refill ID
 * @returns The refill or null if not found
 */
export function getRefillById(id: number): Refill | null {
  const db = getDatabase();
  
  const stmt = db.prepare('SELECT * FROM refills WHERE id = ?');
  const row = stmt.get(id) as any;
  
  if (!row) {
    return null;
  }
  
  return mapRowToRefill(row);
}

/**
 * Update a refill with efficiency recalculation
 * @param id - The refill ID
 * @param updates - Partial refill data to update
 * @returns The updated refill with recalculated efficiency
 * @throws Error if refill not found or validation fails
 */
export function updateRefill(
  id: number,
  updates: Partial<Omit<Refill, 'id' | 'efficiency' | 'createdAt' | 'updatedAt'>>
): Refill {
  // Validate updates if provided
  if (updates.amountSpent !== undefined) {
    if (typeof updates.amountSpent !== 'number' || updates.amountSpent <= 0) {
      throw new Error('Amount must be a positive number');
    }
  }
  
  if (updates.distanceTraveled !== undefined) {
    if (typeof updates.distanceTraveled !== 'number' || updates.distanceTraveled <= 0) {
      throw new Error('Distance must be a positive number');
    }
  }
  
  if (updates.date !== undefined) {
    const dateObj = new Date(updates.date);
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date format. Use ISO 8601 format');
    }
  }
  
  const db = getDatabase();
  
  // Check if refill exists
  const existing = getRefillById(id);
  if (!existing) {
    throw new Error('Resource not found');
  }
  
  // Determine final values for efficiency calculation
  const finalAmountSpent = updates.amountSpent !== undefined ? updates.amountSpent : existing.amountSpent;
  const finalDistance = updates.distanceTraveled !== undefined ? updates.distanceTraveled : existing.distanceTraveled;
  
  // Recalculate efficiency if amount or distance changed
  const efficiency = calculateEfficiency(finalAmountSpent, finalDistance);
  
  // Build dynamic update query
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.amountSpent !== undefined) {
    fields.push('amount_spent = ?');
    values.push(updates.amountSpent);
  }
  
  if (updates.distanceTraveled !== undefined) {
    fields.push('distance_traveled = ?');
    values.push(updates.distanceTraveled);
  }
  
  if (updates.date !== undefined) {
    fields.push('date = ?');
    values.push(updates.date);
  }
  
  if (updates.notes !== undefined) {
    fields.push('notes = ?');
    values.push(updates.notes || null);
  }
  
  // Always update efficiency and updated_at
  fields.push('efficiency = ?');
  values.push(efficiency);
  
  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  
  // Add id to values for WHERE clause
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE refills
    SET ${fields.join(', ')}
    WHERE id = ?
  `);
  
  stmt.run(...values);
  
  // Retrieve and return the updated refill
  const updated = getRefillById(id);
  if (!updated) {
    throw new Error('Failed to retrieve updated refill');
  }
  
  return updated;
}

/**
 * Delete a refill
 * @param id - The refill ID
 * @returns true if deleted, false if not found
 */
export function deleteRefill(id: number): boolean {
  const db = getDatabase();
  
  const stmt = db.prepare('DELETE FROM refills WHERE id = ?');
  const result = stmt.run(id);
  
  return result.changes > 0;
}

/**
 * Map a database row to a Refill object
 * Converts snake_case column names to camelCase property names
 */
function mapRowToRefill(row: any): Refill {
  return {
    id: row.id,
    amountSpent: row.amount_spent,
    distanceTraveled: row.distance_traveled,
    date: row.date,
    notes: row.notes || undefined,
    efficiency: row.efficiency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
