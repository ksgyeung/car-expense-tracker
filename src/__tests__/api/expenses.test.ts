/**
 * @jest-environment node
 * 
 * Unit tests for expense API routes
 * Tests GET, POST, PUT, and DELETE operations with validation
 */

import { GET, POST } from '../../../app/api/expenses/route';
import { PUT, DELETE } from '../../../app/api/expenses/[id]/route';
import { NextRequest } from 'next/server';
import {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
} from '../../lib/services/expenseService';
import { validateSession } from '../../lib/services/authService';

// Mock the expense service
jest.mock('../../lib/services/expenseService');
// Mock the auth service
jest.mock('../../lib/services/authService');

const mockCreateExpense = createExpense as jest.MockedFunction<typeof createExpense>;
const mockGetExpenses = getExpenses as jest.MockedFunction<typeof getExpenses>;
const mockGetExpenseById = getExpenseById as jest.MockedFunction<typeof getExpenseById>;
const mockUpdateExpense = updateExpense as jest.MockedFunction<typeof updateExpense>;
const mockDeleteExpense = deleteExpense as jest.MockedFunction<typeof deleteExpense>;
const mockValidateSession = validateSession as jest.MockedFunction<typeof validateSession>;

// Helper to create a mock request with session cookie
function createMockRequest(url: string, options: any = {}): NextRequest {
  const fullUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`;
  const req = new NextRequest(fullUrl, options as any);
  req.cookies.set('sessionId', 'test-session-id');
  return req;
}

describe('Expense API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock session validation to return true by default
    mockValidateSession.mockReturnValue(true);
  });

  describe('GET /api/expenses', () => {
    it('should return all expenses', async () => {
      const mockExpenses = [
        {
          id: 1,
          type: 'car wash',
          amount: 25.50,
          date: '2024-01-15',
          description: 'Monthly car wash',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: 2,
          type: 'maintenance',
          amount: 150.00,
          date: '2024-01-20',
          createdAt: '2024-01-20T14:30:00Z',
          updatedAt: '2024-01-20T14:30:00Z',
        },
      ];

      mockGetExpenses.mockReturnValue(mockExpenses);

      const request = createMockRequest('/api/expenses');
      const response = await GET(createMockRequest('/api/expenses'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ expenses: mockExpenses });
      expect(mockGetExpenses).toHaveBeenCalled();
    });

    it('should return empty array when no expenses exist', async () => {
      mockGetExpenses.mockReturnValue([]);

      const request = createMockRequest('/api/expenses');
      const response = await GET(createMockRequest('/api/expenses'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ expenses: [] });
    });

    it('should handle database errors', async () => {
      mockGetExpenses.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const request = createMockRequest('/api/expenses');
      const response = await GET(createMockRequest('/api/expenses'));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch expenses' });
    });
  });

  describe('POST /api/expenses', () => {
    it('should create a new expense with all fields', async () => {
      const newExpense = {
        type: 'insurance',
        amount: 500.00,
        date: '2024-01-25',
        description: 'Annual insurance payment',
      };

      const createdExpense = {
        id: 3,
        ...newExpense,
        createdAt: '2024-01-25T12:00:00Z',
        updatedAt: '2024-01-25T12:00:00Z',
      };

      mockCreateExpense.mockReturnValue(createdExpense);

      const request = createMockRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify(newExpense),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({ expense: createdExpense });
      expect(mockCreateExpense).toHaveBeenCalledWith(newExpense);
    });

    it('should create expense without optional description', async () => {
      const newExpense = {
        type: 'car wash',
        amount: 20.00,
        date: '2024-01-26',
      };

      const createdExpense = {
        id: 4,
        ...newExpense,
        createdAt: '2024-01-26T10:00:00Z',
        updatedAt: '2024-01-26T10:00:00Z',
      };

      mockCreateExpense.mockReturnValue(createdExpense);

      const request = createMockRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify(newExpense),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({ expense: createdExpense });
    });

    it('should return 400 when type is missing', async () => {
      const request = createMockRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          amount: 100.00,
          date: '2024-01-27',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Required field missing: type' });
      expect(mockCreateExpense).not.toHaveBeenCalled();
    });

    it('should return 400 when amount is missing', async () => {
      const request = createMockRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          type: 'maintenance',
          date: '2024-01-27',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Required field missing: amount' });
      expect(mockCreateExpense).not.toHaveBeenCalled();
    });

    it('should return 400 when date is missing', async () => {
      const request = createMockRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          type: 'maintenance',
          amount: 100.00,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Required field missing: date' });
      expect(mockCreateExpense).not.toHaveBeenCalled();
    });

    it('should return 400 when amount is not positive', async () => {
      mockCreateExpense.mockImplementation(() => {
        throw new Error('Amount must be a positive number');
      });

      const request = createMockRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          type: 'maintenance',
          amount: -50.00,
          date: '2024-01-27',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Amount must be a positive number' });
    });

    it('should return 400 when date format is invalid', async () => {
      mockCreateExpense.mockImplementation(() => {
        throw new Error('Invalid date format. Use ISO 8601 format');
      });

      const request = createMockRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          type: 'maintenance',
          amount: 100.00,
          date: 'invalid-date',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid date format. Use ISO 8601 format' });
    });

    it('should handle JSON parsing errors', async () => {
      const request = createMockRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: 'invalid-json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to create expense' });
    });
  });

  describe('PUT /api/expenses/[id]', () => {
    it('should update an expense with all fields', async () => {
      const updates = {
        type: 'maintenance',
        amount: 200.00,
        date: '2024-01-28',
        description: 'Updated description',
      };

      const updatedExpense = {
        id: 1,
        ...updates,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-28T15:00:00Z',
      };

      mockUpdateExpense.mockReturnValue(updatedExpense);

      const request = createMockRequest('http://localhost:3000/api/expenses/1', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ expense: updatedExpense });
      expect(mockUpdateExpense).toHaveBeenCalledWith(1, updates);
    });

    it('should update expense with partial fields', async () => {
      const updates = {
        amount: 175.00,
      };

      const updatedExpense = {
        id: 1,
        type: 'maintenance',
        amount: 175.00,
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-28T16:00:00Z',
      };

      mockUpdateExpense.mockReturnValue(updatedExpense);

      const request = createMockRequest('http://localhost:3000/api/expenses/1', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ expense: updatedExpense });
      expect(mockUpdateExpense).toHaveBeenCalledWith(1, updates);
    });

    it('should return 400 for invalid expense ID', async () => {
      const request = createMockRequest('http://localhost:3000/api/expenses/invalid', {
        method: 'PUT',
        body: JSON.stringify({ amount: 100.00 }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: 'invalid' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid expense ID' });
      expect(mockUpdateExpense).not.toHaveBeenCalled();
    });

    it('should return 404 when expense not found', async () => {
      mockUpdateExpense.mockImplementation(() => {
        throw new Error('Resource not found');
      });

      const request = createMockRequest('http://localhost:3000/api/expenses/999', {
        method: 'PUT',
        body: JSON.stringify({ amount: 100.00 }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '999' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Resource not found' });
    });

    it('should return 400 when amount is not positive', async () => {
      mockUpdateExpense.mockImplementation(() => {
        throw new Error('Amount must be a positive number');
      });

      const request = createMockRequest('http://localhost:3000/api/expenses/1', {
        method: 'PUT',
        body: JSON.stringify({ amount: -50.00 }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Amount must be a positive number' });
    });

    it('should return 400 when date format is invalid', async () => {
      mockUpdateExpense.mockImplementation(() => {
        throw new Error('Invalid date format. Use ISO 8601 format');
      });

      const request = createMockRequest('http://localhost:3000/api/expenses/1', {
        method: 'PUT',
        body: JSON.stringify({ date: 'invalid-date' }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid date format. Use ISO 8601 format' });
    });

    it('should return 400 when type is empty', async () => {
      mockUpdateExpense.mockImplementation(() => {
        throw new Error('Type cannot be empty');
      });

      const request = createMockRequest('http://localhost:3000/api/expenses/1', {
        method: 'PUT',
        body: JSON.stringify({ type: '' }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Type cannot be empty' });
    });
  });

  describe('DELETE /api/expenses/[id]', () => {
    it('should delete an expense successfully', async () => {
      mockDeleteExpense.mockReturnValue(true);

      const request = createMockRequest('http://localhost:3000/api/expenses/1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(mockDeleteExpense).toHaveBeenCalledWith(1);
    });

    it('should return 400 for invalid expense ID', async () => {
      const request = createMockRequest('http://localhost:3000/api/expenses/invalid', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: 'invalid' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid expense ID' });
      expect(mockDeleteExpense).not.toHaveBeenCalled();
    });

    it('should return 404 when expense not found', async () => {
      mockDeleteExpense.mockReturnValue(false);

      const request = createMockRequest('http://localhost:3000/api/expenses/999', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '999' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Resource not found' });
    });

    it('should handle database errors', async () => {
      mockDeleteExpense.mockImplementation(() => {
        throw new Error('Database error');
      });

      const request = createMockRequest('http://localhost:3000/api/expenses/1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to delete expense' });
    });
  });
});
