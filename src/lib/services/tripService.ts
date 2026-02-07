import { getDatabase } from '../db';
import { Trip } from '../types';

/**
 * Create a new trip with validation
 * @param trip - The trip data (without id, createdAt, updatedAt)
 * @returns The created trip with all fields
 * @throws Error if validation fails
 */
export function createTrip(
  trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>
): Trip {
  // Validate required fields
  if (typeof trip.distance !== 'number' || trip.distance <= 0) {
    throw new Error('Distance must be a positive number');
  }
  
  if (!trip.date) {
    throw new Error('Required field missing: date');
  }
  
  // Validate date format (ISO 8601)
  const dateObj = new Date(trip.date);
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date format. Use ISO 8601 format');
  }
  
  const db = getDatabase();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO trips (distance, date, purpose, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    trip.distance,
    trip.date,
    trip.purpose || null,
    trip.notes || null,
    now,
    now
  );
  
  // Retrieve the created trip
  const selectStmt = db.prepare('SELECT * FROM trips WHERE id = ?');
  const row = selectStmt.get(result.lastInsertRowid) as any;
  
  return mapRowToTrip(row);
}

/**
 * Get all trips ordered chronologically (earliest to latest)
 * @returns Array of trips ordered by date
 */
export function getTrips(): Trip[] {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT * FROM trips
    ORDER BY date ASC
  `);
  
  const rows = stmt.all() as any[];
  
  return rows.map(mapRowToTrip);
}

/**
 * Get a single trip by ID
 * @param id - The trip ID
 * @returns The trip or null if not found
 */
export function getTripById(id: number): Trip | null {
  const db = getDatabase();
  
  const stmt = db.prepare('SELECT * FROM trips WHERE id = ?');
  const row = stmt.get(id) as any;
  
  if (!row) {
    return null;
  }
  
  return mapRowToTrip(row);
}

/**
 * Update a trip
 * @param id - The trip ID
 * @param updates - Partial trip data to update
 * @returns The updated trip
 * @throws Error if trip not found or validation fails
 */
export function updateTrip(
  id: number,
  updates: Partial<Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>>
): Trip {
  // Validate updates if provided
  if (updates.distance !== undefined) {
    if (typeof updates.distance !== 'number' || updates.distance <= 0) {
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
  
  // Check if trip exists
  const existing = getTripById(id);
  if (!existing) {
    throw new Error('Resource not found');
  }
  
  // Build dynamic update query
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.distance !== undefined) {
    fields.push('distance = ?');
    values.push(updates.distance);
  }
  
  if (updates.date !== undefined) {
    fields.push('date = ?');
    values.push(updates.date);
  }
  
  if (updates.purpose !== undefined) {
    fields.push('purpose = ?');
    values.push(updates.purpose || null);
  }
  
  if (updates.notes !== undefined) {
    fields.push('notes = ?');
    values.push(updates.notes || null);
  }
  
  // Always update updated_at
  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  
  // Add id to values for WHERE clause
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE trips
    SET ${fields.join(', ')}
    WHERE id = ?
  `);
  
  stmt.run(...values);
  
  // Retrieve and return the updated trip
  const updated = getTripById(id);
  if (!updated) {
    throw new Error('Failed to retrieve updated trip');
  }
  
  return updated;
}

/**
 * Delete a trip
 * @param id - The trip ID
 * @returns true if deleted, false if not found
 */
export function deleteTrip(id: number): boolean {
  const db = getDatabase();
  
  const stmt = db.prepare('DELETE FROM trips WHERE id = ?');
  const result = stmt.run(id);
  
  return result.changes > 0;
}

/**
 * Get the total distance traveled across all trips
 * @returns The sum of all trip distances
 */
export function getTotalDistance(): number {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT COALESCE(SUM(distance), 0) as total
    FROM trips
  `);
  
  const row = stmt.get() as any;
  
  return row.total;
}

/**
 * Get mileage over time for chart visualization
 * Aggregates distance data from trips and refills, ordered chronologically
 * @returns Array of objects with date and cumulative distance
 */
export function getMileageOverTime(): Array<{ date: string; cumulativeDistance: number }> {
  const db = getDatabase();
  
  // Query to get all distance data from both trips and refills, ordered by date
  const stmt = db.prepare(`
    SELECT date, distance FROM (
      SELECT date, distance FROM trips
      UNION ALL
      SELECT date, distance_traveled as distance FROM refills
    )
    ORDER BY date ASC
  `);
  
  const rows = stmt.all() as Array<{ date: string; distance: number }>;
  
  // Calculate cumulative distance
  let cumulative = 0;
  const result: Array<{ date: string; cumulativeDistance: number }> = [];
  
  for (const row of rows) {
    cumulative += row.distance;
    result.push({
      date: row.date,
      cumulativeDistance: cumulative,
    });
  }
  
  return result;
}

/**
 * Map a database row to a Trip object
 * Converts snake_case column names to camelCase property names
 */
function mapRowToTrip(row: any): Trip {
  return {
    id: row.id,
    distance: row.distance,
    date: row.date,
    purpose: row.purpose || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
