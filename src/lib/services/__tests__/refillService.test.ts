import { describe, test, expect, beforeEach, afterAll } from '@jest/globals';
import {
  createRefill,
  getRefills,
  getRefillById,
  updateRefill,
  deleteRefill,
  calculateEfficiency,
} from '../refillService';
import { resetDatabase, closeDatabase } from '../../db';

describe('refillService', () => {
  beforeEach(() => {
    resetDatabase();
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('calculateEfficiency', () => {
    test('should calculate efficiency correctly', () => {
      const efficiency = calculateEfficiency(50, 10);
      expect(efficiency).toBe(5); // 50 / 10 = 5 cost per km
    });

    test('should handle decimal values', () => {
      const efficiency = calculateEfficiency(45.50, 8.5);
      expect(efficiency).toBeCloseTo(5.353, 3);
    });

    test('should throw error for zero distance', () => {
      expect(() => calculateEfficiency(50, 0)).toThrow('Distance must be a positive number');
    });

    test('should throw error for negative distance', () => {
      expect(() => calculateEfficiency(50, -10)).toThrow('Distance must be a positive number');
    });
  });

  describe('createRefill', () => {
    test('should create a refill with all required fields and calculated efficiency', () => {
      const refillData = {
        amountSpent: 50.00,
        distanceTraveled: 10.0,
        date: '2024-01-15T10:00:00.000Z',
        notes: 'First refill',
      };

      const refill = createRefill(refillData);

      expect(refill.id).toBeDefined();
      expect(refill.amountSpent).toBe(refillData.amountSpent);
      expect(refill.distanceTraveled).toBe(refillData.distanceTraveled);
      expect(refill.date).toBe(refillData.date);
      expect(refill.notes).toBe(refillData.notes);
      expect(refill.efficiency).toBe(5.0); // 50 / 10 = 5
      expect(refill.createdAt).toBeDefined();
      expect(refill.updatedAt).toBeDefined();
    });

    test('should create a refill without optional notes', () => {
      const refillData = {
        amountSpent: 60.00,
        distanceTraveled: 12.0,
        date: '2024-01-20T14:30:00.000Z',
      };

      const refill = createRefill(refillData);

      expect(refill.id).toBeDefined();
      expect(refill.amountSpent).toBe(refillData.amountSpent);
      expect(refill.distanceTraveled).toBe(refillData.distanceTraveled);
      expect(refill.date).toBe(refillData.date);
      expect(refill.notes).toBeUndefined();
      expect(refill.efficiency).toBe(5.0); // 60 / 12 = 5
    });

    test('should throw error for zero amount', () => {
      const refillData = {
        amountSpent: 0,
        distanceTraveled: 10.0,
        date: '2024-01-15T10:00:00.000Z',
      };

      expect(() => createRefill(refillData)).toThrow('Amount must be a positive number');
    });

    test('should throw error for negative amount', () => {
      const refillData = {
        amountSpent: -50,
        distanceTraveled: 10.0,
        date: '2024-01-15T10:00:00.000Z',
      };

      expect(() => createRefill(refillData)).toThrow('Amount must be a positive number');
    });

    test('should throw error for zero distance', () => {
      const refillData = {
        amountSpent: 50.00,
        distanceTraveled: 0,
        date: '2024-01-15T10:00:00.000Z',
      };

      expect(() => createRefill(refillData)).toThrow('Distance must be a positive number');
    });

    test('should throw error for negative distance', () => {
      const refillData = {
        amountSpent: 50.00,
        distanceTraveled: -10,
        date: '2024-01-15T10:00:00.000Z',
      };

      expect(() => createRefill(refillData)).toThrow('Distance must be a positive number');
    });

    test('should throw error for invalid date format', () => {
      const refillData = {
        amountSpent: 50.00,
        distanceTraveled: 10.0,
        date: 'invalid-date',
      };

      expect(() => createRefill(refillData)).toThrow('Invalid date format. Use ISO 8601 format');
    });

    test('should throw error for missing date', () => {
      const refillData = {
        amountSpent: 50.00,
        distanceTraveled: 10.0,
        date: '',
      };

      expect(() => createRefill(refillData)).toThrow('Required field missing: date');
    });
  });

  describe('getRefills', () => {
    test('should return empty array when no refills exist', () => {
      const refills = getRefills();
      expect(refills).toEqual([]);
    });

    test('should return all refills in chronological order', () => {
      // Create refills in non-chronological order
      const refill1 = createRefill({
        amountSpent: 60.00,
        distanceTraveled: 12.0,
        date: '2024-01-20T10:00:00.000Z',
      });

      const refill2 = createRefill({
        amountSpent: 50.00,
        distanceTraveled: 10.0,
        date: '2024-01-10T10:00:00.000Z',
      });

      const refill3 = createRefill({
        amountSpent: 55.00,
        distanceTraveled: 11.0,
        date: '2024-01-15T10:00:00.000Z',
      });

      const refills = getRefills();

      expect(refills).toHaveLength(3);
      // Should be ordered by date (earliest first)
      expect(refills[0].id).toBe(refill2.id); // Jan 10
      expect(refills[1].id).toBe(refill3.id); // Jan 15
      expect(refills[2].id).toBe(refill1.id); // Jan 20
    });

    test('should include efficiency in all returned refills', () => {
      createRefill({
        amountSpent: 50.00,
        distanceTraveled: 10.0,
        date: '2024-01-10T10:00:00.000Z',
      });

      createRefill({
        amountSpent: 60.00,
        distanceTraveled: 12.0,
        date: '2024-01-15T10:00:00.000Z',
      });

      const refills = getRefills();

      expect(refills).toHaveLength(2);
      refills.forEach(refill => {
        expect(refill.efficiency).toBeDefined();
        expect(typeof refill.efficiency).toBe('number');
      });
    });
  });

  describe('getRefillById', () => {
    test('should return refill when it exists', () => {
      const created = createRefill({
        amountSpent: 50.00,
        distanceTraveled: 10.0,
        date: '2024-01-15T10:00:00.000Z',
        notes: 'Test refill',
      });

      const refill = getRefillById(created.id);

      expect(refill).not.toBeNull();
      expect(refill?.id).toBe(created.id);
      expect(refill?.amountSpent).toBe(created.amountSpent);
      expect(refill?.distanceTraveled).toBe(created.distanceTraveled);
      expect(refill?.efficiency).toBe(created.efficiency);
    });

    test('should return null when refill does not exist', () => {
      const refill = getRefillById(999);
      expect(refill).toBeNull();
    });

    test('should include efficiency field in returned refill', () => {
      const created = createRefill({
        amountSpent: 50.00,
        distanceTraveled: 10.0,
        date: '2024-01-15T10:00:00.000Z',
      });

      const refill = getRefillById(created.id);

      expect(refill?.efficiency).toBeDefined();
      expect(refill?.efficiency).toBe(5.0);
    });
  });

  describe('updateRefill', () => {
    test('should update refill fields and recalculate efficiency', () => {
      const created = createRefill({
        amountSpent: 50.00,
        distanceTraveled: 10.0,
        date: '2024-01-15T10:00:00.000Z',
        notes: 'Original notes',
      });

      expect(created.efficiency).toBe(5.0); // 50 / 10

      const updated = updateRefill(created.id, {
        amountSpent: 60.00,
        distanceTraveled: 12.0,
        notes: 'Updated notes',
      });

      expect(updated.id).toBe(created.id);
      expect(updated.amountSpent).toBe(60.00);
      expect(updated.distanceTraveled).toBe(12.0);
      expect(updated.notes).toBe('Updated notes');
      expect(updated.efficiency).toBe(5.0); // 60 / 12 = 5
      expect(updated.date).toBe(created.date); // Date unchanged
    });

    test('should recalculate efficiency when only amount changes', () => {
      const created = createRefill({
        amountSpent: 50.00,
        distanceTraveled: 10.0,
        date: '2024-01-15T10:00:00.000Z',
      });

      expect(created.efficiency).toBe(5.0);

      const updated = updateRefill(created.id, {
        amountSpent: 70.00,
      });

      expect(updated.amountSpent).toBe(70.00);
      expect(updated.distanceTraveled).toBe(10.0);
      expect(updated.efficiency).toBe(7.0); // 70 / 10 = 7
    });

    test('should recalculate efficiency when only distance changes', () => {
      const created = createRefill({
        amountSpent: 50.00,
        distanceTraveled: 10.0,
        date: '2024-01-15T10:00:00.000Z',
      });

      expect(created.efficiency).toBe(5.0);

      const updated = updateRefill(created.id, {
        distanceTraveled: 5.0,
      });

      expect(updated.amountSpent).toBe(50.00);
      expect(updated.distanceTraveled).toBe(5.0);
      expect(updated.efficiency).toBe(10.0); // 50 / 5 = 10
    });

    test('should preserve createdAt when updating', () => {
      const created = createRefill({
        amountSpent: 50.00,
        distanceTraveled: 10.0,
        date: '2024-01-15T10:00:00.000Z',
      });

      const originalCreatedAt = created.createdAt;

      const updated = updateRefill(created.id, {
        amountSpent: 60.00,
      });

      // createdAt should remain unchanged
      expect(updated.createdAt).toBe(originalCreatedAt);
      // updatedAt should be greater than or equal to createdAt
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(created.createdAt).getTime()
      );
    });

    test('should update only specified fields', () => {
      const created = createRefill({
        amountSpent: 50.00,
        distanceTraveled: 10.0,
        date: '2024-01-15T10:00:00.000Z',
        notes: 'Original',
      });

      const updated = updateRefill(created.id, {
        notes: 'Updated',
      });

      expect(updated.amountSpent).toBe(created.amountSpent);
      expect(updated.distanceTraveled).toBe(created.distanceTraveled);
      expect(updated.date).toBe(created.date);
      expect(updated.notes).toBe('Updated');
      expect(updated.efficiency).toBe(created.efficiency); // Unchanged
    });

    test('should throw error when updating with invalid amount', () => {
      const created = createRefill({
        amountSpent: 50.00,
        distanceTraveled: 10.0,
        date: '2024-01-15T10:00:00.000Z',
      });

      expect(() => updateRefill(created.id, { amountSpent: -10 })).toThrow(
        'Amount must be a positive number'
      );
    });

    test('should throw error when updating with invalid distance', () => {
      const created = createRefill({
        amountSpent: 50.00,
        distanceTraveled: 10.0,
        date: '2024-01-15T10:00:00.000Z',
      });

      expect(() => updateRefill(created.id, { distanceTraveled: 0 })).toThrow(
        'Distance must be a positive number'
      );
    });

    test('should throw error when updating with invalid date', () => {
      const created = createRefill({
        amountSpent: 50.00,
        distanceTraveled: 10.0,
        date: '2024-01-15T10:00:00.000Z',
      });

      expect(() => updateRefill(created.id, { date: 'invalid' })).toThrow(
        'Invalid date format. Use ISO 8601 format'
      );
    });

    test('should throw error when refill does not exist', () => {
      expect(() => updateRefill(999, { amountSpent: 60.00 })).toThrow('Resource not found');
    });
  });

  describe('deleteRefill', () => {
    test('should delete existing refill', () => {
      const created = createRefill({
        amountSpent: 50.00,
        distanceTraveled: 10.0,
        date: '2024-01-15T10:00:00.000Z',
      });

      const result = deleteRefill(created.id);

      expect(result).toBe(true);
      expect(getRefillById(created.id)).toBeNull();
    });

    test('should return false when refill does not exist', () => {
      const result = deleteRefill(999);
      expect(result).toBe(false);
    });

    test('should permanently remove refill from database', () => {
      const created = createRefill({
        amountSpent: 50.00,
        distanceTraveled: 10.0,
        date: '2024-01-15T10:00:00.000Z',
      });

      deleteRefill(created.id);

      const refills = getRefills();
      expect(refills).toHaveLength(0);
    });
  });

  describe('CRUD round-trip', () => {
    test('should maintain data integrity through create, read, update, delete cycle', () => {
      // Create
      const created = createRefill({
        amountSpent: 50.00,
        distanceTraveled: 10.0,
        date: '2024-01-15T10:00:00.000Z',
        notes: 'Test refill',
      });

      expect(created.id).toBeDefined();
      expect(created.efficiency).toBe(5.0);

      // Read
      const retrieved = getRefillById(created.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.amountSpent).toBe(created.amountSpent);
      expect(retrieved?.distanceTraveled).toBe(created.distanceTraveled);
      expect(retrieved?.efficiency).toBe(created.efficiency);

      // Update
      const updated = updateRefill(created.id, {
        amountSpent: 60.00,
        distanceTraveled: 12.0,
        notes: 'Updated refill',
      });
      expect(updated.amountSpent).toBe(60.00);
      expect(updated.distanceTraveled).toBe(12.0);
      expect(updated.notes).toBe('Updated refill');
      expect(updated.efficiency).toBe(5.0); // 60 / 12 = 5
      expect(updated.createdAt).toBe(created.createdAt);

      // Delete
      const deleted = deleteRefill(created.id);
      expect(deleted).toBe(true);
      expect(getRefillById(created.id)).toBeNull();
    });
  });

  describe('efficiency calculation edge cases', () => {
    test('should handle very small distances', () => {
      const refill = createRefill({
        amountSpent: 50.00,
        distanceTraveled: 0.1,
        date: '2024-01-15T10:00:00.000Z',
      });

      expect(refill.efficiency).toBe(500); // 50 / 0.1 = 500
    });

    test('should handle very large amounts', () => {
      const refill = createRefill({
        amountSpent: 10000.00,
        distanceTraveled: 100.0,
        date: '2024-01-15T10:00:00.000Z',
      });

      expect(refill.efficiency).toBe(100); // 10000 / 100 = 100
    });

    test('should handle decimal precision correctly', () => {
      const refill = createRefill({
        amountSpent: 45.67,
        distanceTraveled: 8.9,
        date: '2024-01-15T10:00:00.000Z',
      });

      expect(refill.efficiency).toBeCloseTo(5.131, 3);
    });
  });
});
