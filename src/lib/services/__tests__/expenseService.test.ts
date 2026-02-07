import { describe, test, expect, beforeEach, afterAll } from '@jest/globals';
import {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
} from '../expenseService';
import { resetDatabase, closeDatabase } from '../../db';

describe('expenseService', () => {
  beforeEach(() => {
    resetDatabase();
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('createExpense', () => {
    test('should create an expense with all required fields', () => {
      const expenseData = {
        type: 'car wash',
        amount: 25.50,
        date: '2024-01-15T10:00:00.000Z',
        description: 'Full service wash',
      };

      const expense = createExpense(expenseData);

      expect(expense.id).toBeDefined();
      expect(expense.type).toBe(expenseData.type);
      expect(expense.amount).toBe(expenseData.amount);
      expect(expense.date).toBe(expenseData.date);
      expect(expense.description).toBe(expenseData.description);
      expect(expense.createdAt).toBeDefined();
      expect(expense.updatedAt).toBeDefined();
    });

    test('should create an expense without optional description', () => {
      const expenseData = {
        type: 'maintenance',
        amount: 150.00,
        date: '2024-01-20T14:30:00.000Z',
      };

      const expense = createExpense(expenseData);

      expect(expense.id).toBeDefined();
      expect(expense.type).toBe(expenseData.type);
      expect(expense.amount).toBe(expenseData.amount);
      expect(expense.date).toBe(expenseData.date);
      expect(expense.description).toBeUndefined();
    });

    test('should throw error for missing type', () => {
      const expenseData = {
        type: '',
        amount: 25.50,
        date: '2024-01-15T10:00:00.000Z',
      };

      expect(() => createExpense(expenseData)).toThrow('Required field missing: type');
    });

    test('should throw error for zero amount', () => {
      const expenseData = {
        type: 'car wash',
        amount: 0,
        date: '2024-01-15T10:00:00.000Z',
      };

      expect(() => createExpense(expenseData)).toThrow('Amount must be a positive number');
    });

    test('should throw error for negative amount', () => {
      const expenseData = {
        type: 'car wash',
        amount: -10,
        date: '2024-01-15T10:00:00.000Z',
      };

      expect(() => createExpense(expenseData)).toThrow('Amount must be a positive number');
    });

    test('should throw error for invalid date format', () => {
      const expenseData = {
        type: 'car wash',
        amount: 25.50,
        date: 'invalid-date',
      };

      expect(() => createExpense(expenseData)).toThrow('Invalid date format. Use ISO 8601 format');
    });

    test('should throw error for missing date', () => {
      const expenseData = {
        type: 'car wash',
        amount: 25.50,
        date: '',
      };

      expect(() => createExpense(expenseData)).toThrow('Required field missing: date');
    });
  });

  describe('getExpenses', () => {
    test('should return empty array when no expenses exist', () => {
      const expenses = getExpenses();
      expect(expenses).toEqual([]);
    });

    test('should return all expenses in chronological order', () => {
      // Create expenses in non-chronological order
      const expense1 = createExpense({
        type: 'maintenance',
        amount: 100,
        date: '2024-01-20T10:00:00.000Z',
      });

      const expense2 = createExpense({
        type: 'car wash',
        amount: 25,
        date: '2024-01-10T10:00:00.000Z',
      });

      const expense3 = createExpense({
        type: 'insurance',
        amount: 500,
        date: '2024-01-15T10:00:00.000Z',
      });

      const expenses = getExpenses();

      expect(expenses).toHaveLength(3);
      // Should be ordered by date (earliest first)
      expect(expenses[0].id).toBe(expense2.id); // Jan 10
      expect(expenses[1].id).toBe(expense3.id); // Jan 15
      expect(expenses[2].id).toBe(expense1.id); // Jan 20
    });
  });

  describe('getExpenseById', () => {
    test('should return expense when it exists', () => {
      const created = createExpense({
        type: 'car wash',
        amount: 25.50,
        date: '2024-01-15T10:00:00.000Z',
        description: 'Test expense',
      });

      const expense = getExpenseById(created.id);

      expect(expense).not.toBeNull();
      expect(expense?.id).toBe(created.id);
      expect(expense?.type).toBe(created.type);
      expect(expense?.amount).toBe(created.amount);
    });

    test('should return null when expense does not exist', () => {
      const expense = getExpenseById(999);
      expect(expense).toBeNull();
    });
  });

  describe('updateExpense', () => {
    test('should update expense fields', () => {
      const created = createExpense({
        type: 'car wash',
        amount: 25.50,
        date: '2024-01-15T10:00:00.000Z',
        description: 'Original description',
      });

      const updated = updateExpense(created.id, {
        type: 'maintenance',
        amount: 150.00,
        description: 'Updated description',
      });

      expect(updated.id).toBe(created.id);
      expect(updated.type).toBe('maintenance');
      expect(updated.amount).toBe(150.00);
      expect(updated.description).toBe('Updated description');
      expect(updated.date).toBe(created.date); // Date unchanged
    });

    test('should preserve createdAt when updating', () => {
      const created = createExpense({
        type: 'car wash',
        amount: 25.50,
        date: '2024-01-15T10:00:00.000Z',
      });

      const originalCreatedAt = created.createdAt;

      const updated = updateExpense(created.id, {
        amount: 30.00,
      });

      // createdAt should remain unchanged
      expect(updated.createdAt).toBe(originalCreatedAt);
      // updatedAt should be greater than or equal to createdAt
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(created.createdAt).getTime()
      );
    });

    test('should update only specified fields', () => {
      const created = createExpense({
        type: 'car wash',
        amount: 25.50,
        date: '2024-01-15T10:00:00.000Z',
        description: 'Original',
      });

      const updated = updateExpense(created.id, {
        amount: 30.00,
      });

      expect(updated.type).toBe(created.type);
      expect(updated.amount).toBe(30.00);
      expect(updated.date).toBe(created.date);
      expect(updated.description).toBe(created.description);
    });

    test('should throw error when updating with invalid amount', () => {
      const created = createExpense({
        type: 'car wash',
        amount: 25.50,
        date: '2024-01-15T10:00:00.000Z',
      });

      expect(() => updateExpense(created.id, { amount: -10 })).toThrow(
        'Amount must be a positive number'
      );
    });

    test('should throw error when updating with invalid date', () => {
      const created = createExpense({
        type: 'car wash',
        amount: 25.50,
        date: '2024-01-15T10:00:00.000Z',
      });

      expect(() => updateExpense(created.id, { date: 'invalid' })).toThrow(
        'Invalid date format. Use ISO 8601 format'
      );
    });

    test('should throw error when expense does not exist', () => {
      expect(() => updateExpense(999, { amount: 30.00 })).toThrow('Resource not found');
    });
  });

  describe('deleteExpense', () => {
    test('should delete existing expense', () => {
      const created = createExpense({
        type: 'car wash',
        amount: 25.50,
        date: '2024-01-15T10:00:00.000Z',
      });

      const result = deleteExpense(created.id);

      expect(result).toBe(true);
      expect(getExpenseById(created.id)).toBeNull();
    });

    test('should return false when expense does not exist', () => {
      const result = deleteExpense(999);
      expect(result).toBe(false);
    });

    test('should permanently remove expense from database', () => {
      const created = createExpense({
        type: 'car wash',
        amount: 25.50,
        date: '2024-01-15T10:00:00.000Z',
      });

      deleteExpense(created.id);

      const expenses = getExpenses();
      expect(expenses).toHaveLength(0);
    });
  });

  describe('CRUD round-trip', () => {
    test('should maintain data integrity through create, read, update, delete cycle', () => {
      // Create
      const created = createExpense({
        type: 'car wash',
        amount: 25.50,
        date: '2024-01-15T10:00:00.000Z',
        description: 'Test expense',
      });

      expect(created.id).toBeDefined();

      // Read
      const retrieved = getExpenseById(created.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.type).toBe(created.type);
      expect(retrieved?.amount).toBe(created.amount);

      // Update
      const updated = updateExpense(created.id, {
        amount: 30.00,
        description: 'Updated expense',
      });
      expect(updated.amount).toBe(30.00);
      expect(updated.description).toBe('Updated expense');
      expect(updated.createdAt).toBe(created.createdAt);

      // Delete
      const deleted = deleteExpense(created.id);
      expect(deleted).toBe(true);
      expect(getExpenseById(created.id)).toBeNull();
    });
  });
});
