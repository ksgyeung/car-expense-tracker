/**
 * @jest-environment node
 * 
 * Unit tests for refill API routes
 * Tests GET, POST, PUT, and DELETE operations with validation and efficiency calculation
 */

import { GET, POST } from '../../../app/api/refills/route';
import { PUT, DELETE } from '../../../app/api/refills/[id]/route';
import { NextRequest } from 'next/server';
import {
  createRefill,
  getRefills,
  getRefillById,
  updateRefill,
  deleteRefill,
} from '../../lib/services/refillService';
import { validateSession } from '../../lib/services/authService';

// Mock the refill service
jest.mock('../../lib/services/refillService');
jest.mock('../../lib/services/authService');

const mockCreateRefill = createRefill as jest.MockedFunction<typeof createRefill>;
const mockGetRefills = getRefills as jest.MockedFunction<typeof getRefills>;
const mockGetRefillById = getRefillById as jest.MockedFunction<typeof getRefillById>;
const mockUpdateRefill = updateRefill as jest.MockedFunction<typeof updateRefill>;
const mockDeleteRefill = deleteRefill as jest.MockedFunction<typeof deleteRefill>;
const mockValidateSession = validateSession as jest.MockedFunction<typeof validateSession>;

// Helper to create a mock request with session cookie
function createMockRequest(url: string, options: any = {}): NextRequest {
  const fullUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`;
  const req = new NextRequest(fullUrl, options as any);
  req.cookies.set('sessionId', 'test-session-id');
  return req;
}

describe('Refill API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateSession.mockReturnValue(true);
  });

  describe('GET /api/refills', () => {
    it('should return all refills', async () => {
      const mockRefills = [
        {
          id: 1,
          amountSpent: 50.00,
          distanceTraveled: 400.0,
          date: '2024-01-15',
          notes: 'First refill',
          efficiency: 0.125,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: 2,
          amountSpent: 55.00,
          distanceTraveled: 420.0,
          date: '2024-01-22',
          efficiency: 0.131,
          createdAt: '2024-01-22T14:30:00Z',
          updatedAt: '2024-01-22T14:30:00Z',
        },
      ];

      mockGetRefills.mockReturnValue(mockRefills);

      const response = await GET(createMockRequest('/api/refills'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ refills: mockRefills });
      expect(mockGetRefills).toHaveBeenCalled();
    });

    it('should return empty array when no refills exist', async () => {
      mockGetRefills.mockReturnValue([]);

      const response = await GET(createMockRequest('/api/refills'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ refills: [] });
    });

    it('should handle database errors', async () => {
      mockGetRefills.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await GET(createMockRequest('/api/refills'));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch refills' });
    });
  });

  describe('POST /api/refills', () => {
    it('should create a new refill with all fields', async () => {
      const newRefill = {
        amountSpent: 60.00,
        distanceTraveled: 450.0,
        date: '2024-01-29',
        notes: 'Highway driving',
      };

      const createdRefill = {
        id: 3,
        ...newRefill,
        efficiency: 0.133,
        createdAt: '2024-01-29T12:00:00Z',
        updatedAt: '2024-01-29T12:00:00Z',
      };

      mockCreateRefill.mockReturnValue(createdRefill);

      const request = createMockRequest('http://localhost:3000/api/refills', {
        method: 'POST',
        body: JSON.stringify(newRefill),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({ refill: createdRefill });
      expect(mockCreateRefill).toHaveBeenCalledWith(newRefill);
    });

    it('should create refill without optional notes', async () => {
      const newRefill = {
        amountSpent: 52.00,
        distanceTraveled: 410.0,
        date: '2024-01-30',
      };

      const createdRefill = {
        id: 4,
        ...newRefill,
        efficiency: 0.127,
        createdAt: '2024-01-30T10:00:00Z',
        updatedAt: '2024-01-30T10:00:00Z',
      };

      mockCreateRefill.mockReturnValue(createdRefill);

      const request = createMockRequest('http://localhost:3000/api/refills', {
        method: 'POST',
        body: JSON.stringify(newRefill),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({ refill: createdRefill });
    });

    it('should return 400 when amountSpent is missing', async () => {
      const request = createMockRequest('http://localhost:3000/api/refills', {
        method: 'POST',
        body: JSON.stringify({
          distanceTraveled: 400.0,
          date: '2024-01-31',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Required field missing: amountSpent' });
      expect(mockCreateRefill).not.toHaveBeenCalled();
    });

    it('should return 400 when distanceTraveled is missing', async () => {
      const request = createMockRequest('http://localhost:3000/api/refills', {
        method: 'POST',
        body: JSON.stringify({
          amountSpent: 50.00,
          date: '2024-01-31',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Required field missing: distanceTraveled' });
      expect(mockCreateRefill).not.toHaveBeenCalled();
    });

    it('should return 400 when date is missing', async () => {
      const request = createMockRequest('http://localhost:3000/api/refills', {
        method: 'POST',
        body: JSON.stringify({
          amountSpent: 50.00,
          distanceTraveled: 400.0,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Required field missing: date' });
      expect(mockCreateRefill).not.toHaveBeenCalled();
    });

    it('should return 400 when amountSpent is not positive', async () => {
      mockCreateRefill.mockImplementation(() => {
        throw new Error('Amount must be a positive number');
      });

      const request = createMockRequest('http://localhost:3000/api/refills', {
        method: 'POST',
        body: JSON.stringify({
          amountSpent: -50.00,
          distanceTraveled: 400.0,
          date: '2024-01-31',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Amount must be a positive number' });
    });

    it('should return 400 when distanceTraveled is not positive', async () => {
      mockCreateRefill.mockImplementation(() => {
        throw new Error('Distance must be a positive number');
      });

      const request = createMockRequest('http://localhost:3000/api/refills', {
        method: 'POST',
        body: JSON.stringify({
          amountSpent: 50.00,
          distanceTraveled: 0,
          date: '2024-01-31',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Distance must be a positive number' });
    });

    it('should return 400 when date format is invalid', async () => {
      mockCreateRefill.mockImplementation(() => {
        throw new Error('Invalid date format. Use ISO 8601 format');
      });

      const request = createMockRequest('http://localhost:3000/api/refills', {
        method: 'POST',
        body: JSON.stringify({
          amountSpent: 50.00,
          distanceTraveled: 400.0,
          date: 'invalid-date',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid date format. Use ISO 8601 format' });
    });

    it('should handle JSON parsing errors', async () => {
      const request = createMockRequest('http://localhost:3000/api/refills', {
        method: 'POST',
        body: 'invalid-json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to create refill' });
    });
  });

  describe('PUT /api/refills/[id]', () => {
    it('should update a refill with all fields and recalculate efficiency', async () => {
      const updates = {
        amountSpent: 65.00,
        distanceTraveled: 480.0,
        date: '2024-02-01',
        notes: 'Updated notes',
      };

      const updatedRefill = {
        id: 1,
        ...updates,
        efficiency: 0.135,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-02-01T15:00:00Z',
      };

      mockUpdateRefill.mockReturnValue(updatedRefill);

      const request = createMockRequest('http://localhost:3000/api/refills/1', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ refill: updatedRefill });
      expect(mockUpdateRefill).toHaveBeenCalledWith(1, updates);
    });

    it('should update refill with partial fields and recalculate efficiency', async () => {
      const updates = {
        amountSpent: 58.00,
      };

      const updatedRefill = {
        id: 1,
        amountSpent: 58.00,
        distanceTraveled: 400.0,
        date: '2024-01-15',
        efficiency: 0.145,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-02-01T16:00:00Z',
      };

      mockUpdateRefill.mockReturnValue(updatedRefill);

      const request = createMockRequest('http://localhost:3000/api/refills/1', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ refill: updatedRefill });
      expect(mockUpdateRefill).toHaveBeenCalledWith(1, updates);
    });

    it('should return 400 for invalid refill ID', async () => {
      const request = createMockRequest('http://localhost:3000/api/refills/invalid', {
        method: 'PUT',
        body: JSON.stringify({ amountSpent: 50.00 }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: 'invalid' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid refill ID' });
      expect(mockUpdateRefill).not.toHaveBeenCalled();
    });

    it('should return 404 when refill not found', async () => {
      mockUpdateRefill.mockImplementation(() => {
        throw new Error('Resource not found');
      });

      const request = createMockRequest('http://localhost:3000/api/refills/999', {
        method: 'PUT',
        body: JSON.stringify({ amountSpent: 50.00 }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '999' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Resource not found' });
    });

    it('should return 400 when amountSpent is not positive', async () => {
      mockUpdateRefill.mockImplementation(() => {
        throw new Error('Amount must be a positive number');
      });

      const request = createMockRequest('http://localhost:3000/api/refills/1', {
        method: 'PUT',
        body: JSON.stringify({ amountSpent: -50.00 }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Amount must be a positive number' });
    });

    it('should return 400 when distanceTraveled is not positive', async () => {
      mockUpdateRefill.mockImplementation(() => {
        throw new Error('Distance must be a positive number');
      });

      const request = createMockRequest('http://localhost:3000/api/refills/1', {
        method: 'PUT',
        body: JSON.stringify({ distanceTraveled: 0 }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Distance must be a positive number' });
    });

    it('should return 400 when date format is invalid', async () => {
      mockUpdateRefill.mockImplementation(() => {
        throw new Error('Invalid date format. Use ISO 8601 format');
      });

      const request = createMockRequest('http://localhost:3000/api/refills/1', {
        method: 'PUT',
        body: JSON.stringify({ date: 'invalid-date' }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid date format. Use ISO 8601 format' });
    });
  });

  describe('DELETE /api/refills/[id]', () => {
    it('should delete a refill successfully', async () => {
      mockDeleteRefill.mockReturnValue(true);

      const request = createMockRequest('http://localhost:3000/api/refills/1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(mockDeleteRefill).toHaveBeenCalledWith(1);
    });

    it('should return 400 for invalid refill ID', async () => {
      const request = createMockRequest('http://localhost:3000/api/refills/invalid', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: 'invalid' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid refill ID' });
      expect(mockDeleteRefill).not.toHaveBeenCalled();
    });

    it('should return 404 when refill not found', async () => {
      mockDeleteRefill.mockReturnValue(false);

      const request = createMockRequest('http://localhost:3000/api/refills/999', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '999' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Resource not found' });
    });

    it('should handle database errors', async () => {
      mockDeleteRefill.mockImplementation(() => {
        throw new Error('Database error');
      });

      const request = createMockRequest('http://localhost:3000/api/refills/1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to delete refill' });
    });
  });
});
