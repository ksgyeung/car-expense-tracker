import { describe, test, expect, beforeEach, afterAll } from '@jest/globals';
import {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  getTotalDistance,
  getMileageOverTime,
} from '../tripService';
import { createRefill } from '../refillService';
import { resetDatabase, closeDatabase } from '../../db';

describe('tripService', () => {
  beforeEach(() => {
    resetDatabase();
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('createTrip', () => {
    test('should create a trip with all required fields', () => {
      const tripData = {
        distance: 45.5,
        date: '2024-01-15T10:00:00.000Z',
        purpose: 'Work commute',
        notes: 'Morning drive',
      };

      const trip = createTrip(tripData);

      expect(trip.id).toBeDefined();
      expect(trip.distance).toBe(tripData.distance);
      expect(trip.date).toBe(tripData.date);
      expect(trip.purpose).toBe(tripData.purpose);
      expect(trip.notes).toBe(tripData.notes);
      expect(trip.createdAt).toBeDefined();
      expect(trip.updatedAt).toBeDefined();
    });

    test('should create a trip without optional purpose and notes', () => {
      const tripData = {
        distance: 30.0,
        date: '2024-01-20T14:30:00.000Z',
      };

      const trip = createTrip(tripData);

      expect(trip.id).toBeDefined();
      expect(trip.distance).toBe(tripData.distance);
      expect(trip.date).toBe(tripData.date);
      expect(trip.purpose).toBeUndefined();
      expect(trip.notes).toBeUndefined();
    });

    test('should throw error for zero distance', () => {
      const tripData = {
        distance: 0,
        date: '2024-01-15T10:00:00.000Z',
      };

      expect(() => createTrip(tripData)).toThrow('Distance must be a positive number');
    });

    test('should throw error for negative distance', () => {
      const tripData = {
        distance: -10,
        date: '2024-01-15T10:00:00.000Z',
      };

      expect(() => createTrip(tripData)).toThrow('Distance must be a positive number');
    });

    test('should throw error for invalid date format', () => {
      const tripData = {
        distance: 45.5,
        date: 'invalid-date',
      };

      expect(() => createTrip(tripData)).toThrow('Invalid date format. Use ISO 8601 format');
    });

    test('should throw error for missing date', () => {
      const tripData = {
        distance: 45.5,
        date: '',
      };

      expect(() => createTrip(tripData)).toThrow('Required field missing: date');
    });
  });

  describe('getTrips', () => {
    test('should return empty array when no trips exist', () => {
      const trips = getTrips();
      expect(trips).toEqual([]);
    });

    test('should return all trips in chronological order', () => {
      // Create trips in non-chronological order
      const trip1 = createTrip({
        distance: 50,
        date: '2024-01-20T10:00:00.000Z',
        purpose: 'Trip 1',
      });

      const trip2 = createTrip({
        distance: 30,
        date: '2024-01-10T10:00:00.000Z',
        purpose: 'Trip 2',
      });

      const trip3 = createTrip({
        distance: 40,
        date: '2024-01-15T10:00:00.000Z',
        purpose: 'Trip 3',
      });

      const trips = getTrips();

      expect(trips).toHaveLength(3);
      // Should be ordered by date (earliest first)
      expect(trips[0].id).toBe(trip2.id); // Jan 10
      expect(trips[1].id).toBe(trip3.id); // Jan 15
      expect(trips[2].id).toBe(trip1.id); // Jan 20
    });
  });

  describe('getTripById', () => {
    test('should return trip when it exists', () => {
      const created = createTrip({
        distance: 45.5,
        date: '2024-01-15T10:00:00.000Z',
        purpose: 'Test trip',
        notes: 'Test notes',
      });

      const trip = getTripById(created.id);

      expect(trip).not.toBeNull();
      expect(trip?.id).toBe(created.id);
      expect(trip?.distance).toBe(created.distance);
      expect(trip?.purpose).toBe(created.purpose);
    });

    test('should return null when trip does not exist', () => {
      const trip = getTripById(999);
      expect(trip).toBeNull();
    });
  });

  describe('updateTrip', () => {
    test('should update trip fields', () => {
      const created = createTrip({
        distance: 45.5,
        date: '2024-01-15T10:00:00.000Z',
        purpose: 'Original purpose',
        notes: 'Original notes',
      });

      const updated = updateTrip(created.id, {
        distance: 50.0,
        purpose: 'Updated purpose',
        notes: 'Updated notes',
      });

      expect(updated.id).toBe(created.id);
      expect(updated.distance).toBe(50.0);
      expect(updated.purpose).toBe('Updated purpose');
      expect(updated.notes).toBe('Updated notes');
      expect(updated.date).toBe(created.date); // Date unchanged
    });

    test('should preserve createdAt when updating', () => {
      const created = createTrip({
        distance: 45.5,
        date: '2024-01-15T10:00:00.000Z',
      });

      const originalCreatedAt = created.createdAt;

      const updated = updateTrip(created.id, {
        distance: 50.0,
      });

      // createdAt should remain unchanged
      expect(updated.createdAt).toBe(originalCreatedAt);
      // updatedAt should be greater than or equal to createdAt
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(created.createdAt).getTime()
      );
    });

    test('should update only specified fields', () => {
      const created = createTrip({
        distance: 45.5,
        date: '2024-01-15T10:00:00.000Z',
        purpose: 'Original',
        notes: 'Original notes',
      });

      const updated = updateTrip(created.id, {
        distance: 50.0,
      });

      expect(updated.distance).toBe(50.0);
      expect(updated.date).toBe(created.date);
      expect(updated.purpose).toBe(created.purpose);
      expect(updated.notes).toBe(created.notes);
    });

    test('should throw error when updating with invalid distance', () => {
      const created = createTrip({
        distance: 45.5,
        date: '2024-01-15T10:00:00.000Z',
      });

      expect(() => updateTrip(created.id, { distance: -10 })).toThrow(
        'Distance must be a positive number'
      );
    });

    test('should throw error when updating with invalid date', () => {
      const created = createTrip({
        distance: 45.5,
        date: '2024-01-15T10:00:00.000Z',
      });

      expect(() => updateTrip(created.id, { date: 'invalid' })).toThrow(
        'Invalid date format. Use ISO 8601 format'
      );
    });

    test('should throw error when trip does not exist', () => {
      expect(() => updateTrip(999, { distance: 50.0 })).toThrow('Resource not found');
    });
  });

  describe('deleteTrip', () => {
    test('should delete existing trip', () => {
      const created = createTrip({
        distance: 45.5,
        date: '2024-01-15T10:00:00.000Z',
      });

      const result = deleteTrip(created.id);

      expect(result).toBe(true);
      expect(getTripById(created.id)).toBeNull();
    });

    test('should return false when trip does not exist', () => {
      const result = deleteTrip(999);
      expect(result).toBe(false);
    });

    test('should permanently remove trip from database', () => {
      const created = createTrip({
        distance: 45.5,
        date: '2024-01-15T10:00:00.000Z',
      });

      deleteTrip(created.id);

      const trips = getTrips();
      expect(trips).toHaveLength(0);
    });
  });

  describe('getTotalDistance', () => {
    test('should return 0 when no trips exist', () => {
      const total = getTotalDistance();
      expect(total).toBe(0);
    });

    test('should calculate total distance across all trips', () => {
      createTrip({
        distance: 45.5,
        date: '2024-01-15T10:00:00.000Z',
      });

      createTrip({
        distance: 30.0,
        date: '2024-01-16T10:00:00.000Z',
      });

      createTrip({
        distance: 24.5,
        date: '2024-01-17T10:00:00.000Z',
      });

      const total = getTotalDistance();
      expect(total).toBe(100.0);
    });

    test('should update total distance after trip deletion', () => {
      const trip1 = createTrip({
        distance: 45.5,
        date: '2024-01-15T10:00:00.000Z',
      });

      createTrip({
        distance: 30.0,
        date: '2024-01-16T10:00:00.000Z',
      });

      expect(getTotalDistance()).toBe(75.5);

      deleteTrip(trip1.id);

      expect(getTotalDistance()).toBe(30.0);
    });
  });

  describe('getMileageOverTime', () => {
    test('should return empty array when no trips or refills exist', () => {
      const mileage = getMileageOverTime();
      expect(mileage).toEqual([]);
    });

    test('should calculate cumulative distance from trips only', () => {
      createTrip({
        distance: 45.5,
        date: '2024-01-15T10:00:00.000Z',
      });

      createTrip({
        distance: 30.0,
        date: '2024-01-16T10:00:00.000Z',
      });

      createTrip({
        distance: 24.5,
        date: '2024-01-17T10:00:00.000Z',
      });

      const mileage = getMileageOverTime();

      expect(mileage).toHaveLength(3);
      expect(mileage[0]).toEqual({
        date: '2024-01-15T10:00:00.000Z',
        cumulativeDistance: 45.5,
      });
      expect(mileage[1]).toEqual({
        date: '2024-01-16T10:00:00.000Z',
        cumulativeDistance: 75.5,
      });
      expect(mileage[2]).toEqual({
        date: '2024-01-17T10:00:00.000Z',
        cumulativeDistance: 100.0,
      });
    });

    test('should aggregate distance from both trips and refills', () => {
      createTrip({
        distance: 45.5,
        date: '2024-01-15T10:00:00.000Z',
      });

      createRefill({
        amountSpent: 50.0,
        distanceTraveled: 30.0,
        date: '2024-01-16T10:00:00.000Z',
      });

      createTrip({
        distance: 24.5,
        date: '2024-01-17T10:00:00.000Z',
      });

      const mileage = getMileageOverTime();

      expect(mileage).toHaveLength(3);
      expect(mileage[0].cumulativeDistance).toBe(45.5);
      expect(mileage[1].cumulativeDistance).toBe(75.5); // 45.5 + 30.0
      expect(mileage[2].cumulativeDistance).toBe(100.0); // 75.5 + 24.5
    });

    test('should order data chronologically regardless of creation order', () => {
      // Create in non-chronological order
      createTrip({
        distance: 30.0,
        date: '2024-01-20T10:00:00.000Z',
      });

      createTrip({
        distance: 45.5,
        date: '2024-01-10T10:00:00.000Z',
      });

      createRefill({
        amountSpent: 50.0,
        distanceTraveled: 24.5,
        date: '2024-01-15T10:00:00.000Z',
      });

      const mileage = getMileageOverTime();

      expect(mileage).toHaveLength(3);
      // Should be ordered by date
      expect(mileage[0].date).toBe('2024-01-10T10:00:00.000Z');
      expect(mileage[0].cumulativeDistance).toBe(45.5);
      expect(mileage[1].date).toBe('2024-01-15T10:00:00.000Z');
      expect(mileage[1].cumulativeDistance).toBe(70.0); // 45.5 + 24.5
      expect(mileage[2].date).toBe('2024-01-20T10:00:00.000Z');
      expect(mileage[2].cumulativeDistance).toBe(100.0); // 70.0 + 30.0
    });
  });

  describe('CRUD round-trip', () => {
    test('should maintain data integrity through create, read, update, delete cycle', () => {
      // Create
      const created = createTrip({
        distance: 45.5,
        date: '2024-01-15T10:00:00.000Z',
        purpose: 'Test trip',
        notes: 'Test notes',
      });

      expect(created.id).toBeDefined();

      // Read
      const retrieved = getTripById(created.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.distance).toBe(created.distance);
      expect(retrieved?.purpose).toBe(created.purpose);

      // Update
      const updated = updateTrip(created.id, {
        distance: 50.0,
        purpose: 'Updated trip',
      });
      expect(updated.distance).toBe(50.0);
      expect(updated.purpose).toBe('Updated trip');
      expect(updated.createdAt).toBe(created.createdAt);

      // Delete
      const deleted = deleteTrip(created.id);
      expect(deleted).toBe(true);
      expect(getTripById(created.id)).toBeNull();
    });
  });
});
