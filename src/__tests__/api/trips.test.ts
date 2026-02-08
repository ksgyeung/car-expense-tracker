/**
 * @jest-environment node
 * 
 * Unit tests for trip API routes
 * Tests GET, POST, PUT, and DELETE operations with validation
 */

import { GET, POST } from '../../../app/api/trips/route';
import { PUT, DELETE } from '../../../app/api/trips/[id]/route';
import { GET as getMileage } from '../../../app/api/trips/mileage/route';
import { NextRequest } from 'next/server';
import {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  getMileageOverTime,
} from '../../lib/services/tripService';
import { validateSession } from '../../lib/services/authService';

// Mock the service functions
jest.mock('../../lib/services/tripService');
jest.mock('../../lib/services/authService');

const mockCreateTrip = createTrip as jest.MockedFunction<typeof createTrip>;
const mockGetTrips = getTrips as jest.MockedFunction<typeof getTrips>;
const mockGetTripById = getTripById as jest.MockedFunction<typeof getTripById>;
const mockUpdateTrip = updateTrip as jest.MockedFunction<typeof updateTrip>;
const mockDeleteTrip = deleteTrip as jest.MockedFunction<typeof deleteTrip>;
const mockGetMileageOverTime = getMileageOverTime as jest.MockedFunction<typeof getMileageOverTime>;
const mockValidateSession = validateSession as jest.MockedFunction<typeof validateSession>;

// Helper to create a mock request with session cookie
function createMockRequest(url: string, options: any = {}): NextRequest {
  const fullUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`;
  const req = new NextRequest(fullUrl, options as any);
  req.cookies.set('sessionId', 'test-session-id');
  return req;
}
describe('Trip API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateSession.mockReturnValue(true);
  });

  describe('GET /api/trips', () => {
    test('should return all trips successfully', async () => {
      const mockTrips = [
        {
          id: 1,
          distance: 45.5,
          date: '2024-01-15',
          purpose: 'Work commute',
          notes: 'Morning drive',
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: 2,
          distance: 30.0,
          date: '2024-01-16',
          purpose: 'Shopping',
          createdAt: '2024-01-16T14:00:00.000Z',
          updatedAt: '2024-01-16T14:00:00.000Z',
        },
      ];

      mockGetTrips.mockReturnValue(mockTrips);

      const response = await GET(createMockRequest('/api/trips'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ trips: mockTrips });
      expect(mockGetTrips).toHaveBeenCalledTimes(1);
    });

    test('should return empty array when no trips exist', async () => {
      mockGetTrips.mockReturnValue([]);

      const response = await GET(createMockRequest('/api/trips'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ trips: [] });
    });

    test('should handle service errors', async () => {
      mockGetTrips.mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await GET(createMockRequest('/api/trips'));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch trips' });
    });
  });

  describe('POST /api/trips', () => {
    test('should create a trip successfully with all fields', async () => {
      const tripData = {
        distance: 45.5,
        date: '2024-01-15',
        purpose: 'Work commute',
        notes: 'Morning drive',
      };

      const mockCreatedTrip = {
        id: 1,
        ...tripData,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      };

      mockCreateTrip.mockReturnValue(mockCreatedTrip);

      const request = createMockRequest('http://localhost:3000/api/trips', {
        method: 'POST',
        body: JSON.stringify(tripData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({ trip: mockCreatedTrip });
      expect(mockCreateTrip).toHaveBeenCalledWith(tripData);
    });

    test('should create a trip without optional fields', async () => {
      const tripData = {
        distance: 30.0,
        date: '2024-01-16',
      };

      const mockCreatedTrip = {
        id: 2,
        ...tripData,
        createdAt: '2024-01-16T14:00:00.000Z',
        updatedAt: '2024-01-16T14:00:00.000Z',
      };

      mockCreateTrip.mockReturnValue(mockCreatedTrip);

      const request = createMockRequest('http://localhost:3000/api/trips', {
        method: 'POST',
        body: JSON.stringify(tripData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({ trip: mockCreatedTrip });
    });

    test('should return 400 when distance is missing', async () => {
      const tripData = {
        date: '2024-01-15',
        purpose: 'Work commute',
      };

      const request = createMockRequest('http://localhost:3000/api/trips', {
        method: 'POST',
        body: JSON.stringify(tripData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Required field missing: distance' });
      expect(mockCreateTrip).not.toHaveBeenCalled();
    });

    test('should return 400 when date is missing', async () => {
      const tripData = {
        distance: 45.5,
        purpose: 'Work commute',
      };

      const request = createMockRequest('http://localhost:3000/api/trips', {
        method: 'POST',
        body: JSON.stringify(tripData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Required field missing: date' });
      expect(mockCreateTrip).not.toHaveBeenCalled();
    });

    test('should return 400 for negative distance', async () => {
      const tripData = {
        distance: -10,
        date: '2024-01-15',
      };

      mockCreateTrip.mockImplementation(() => {
        throw new Error('Distance must be a positive number');
      });

      const request = createMockRequest('http://localhost:3000/api/trips', {
        method: 'POST',
        body: JSON.stringify(tripData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Distance must be a positive number' });
    });

    test('should return 400 for zero distance', async () => {
      const tripData = {
        distance: 0,
        date: '2024-01-15',
      };

      mockCreateTrip.mockImplementation(() => {
        throw new Error('Distance must be a positive number');
      });

      const request = createMockRequest('http://localhost:3000/api/trips', {
        method: 'POST',
        body: JSON.stringify(tripData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Distance must be a positive number' });
    });

    test('should return 400 for invalid date format', async () => {
      const tripData = {
        distance: 45.5,
        date: 'invalid-date',
      };

      mockCreateTrip.mockImplementation(() => {
        throw new Error('Invalid date format. Use ISO 8601 format');
      });

      const request = createMockRequest('http://localhost:3000/api/trips', {
        method: 'POST',
        body: JSON.stringify(tripData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid date format. Use ISO 8601 format' });
    });

    test('should handle unexpected service errors', async () => {
      const tripData = {
        distance: 45.5,
        date: '2024-01-15',
      };

      mockCreateTrip.mockImplementation(() => {
        throw new Error('Unexpected database error');
      });

      const request = createMockRequest('http://localhost:3000/api/trips', {
        method: 'POST',
        body: JSON.stringify(tripData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to create trip' });
    });
  });

  describe('PUT /api/trips/[id]', () => {
    test('should update a trip successfully', async () => {
      const updates = {
        distance: 50.0,
        purpose: 'Updated purpose',
      };

      const mockUpdatedTrip = {
        id: 1,
        distance: 50.0,
        date: '2024-01-15',
        purpose: 'Updated purpose',
        notes: 'Original notes',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T11:00:00.000Z',
      };

      mockUpdateTrip.mockReturnValue(mockUpdatedTrip);

      const request = createMockRequest('http://localhost:3000/api/trips/1', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ trip: mockUpdatedTrip });
      expect(mockUpdateTrip).toHaveBeenCalledWith(1, updates);
    });

    test('should update only specified fields', async () => {
      const updates = {
        distance: 60.0,
      };

      const mockUpdatedTrip = {
        id: 1,
        distance: 60.0,
        date: '2024-01-15',
        purpose: 'Original purpose',
        notes: 'Original notes',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T11:00:00.000Z',
      };

      mockUpdateTrip.mockReturnValue(mockUpdatedTrip);

      const request = createMockRequest('http://localhost:3000/api/trips/1', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ trip: mockUpdatedTrip });
      expect(mockUpdateTrip).toHaveBeenCalledWith(1, updates);
    });

    test('should return 400 for invalid trip ID', async () => {
      const request = createMockRequest('http://localhost:3000/api/trips/invalid', {
        method: 'PUT',
        body: JSON.stringify({ distance: 50.0 }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: 'invalid' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid trip ID' });
      expect(mockUpdateTrip).not.toHaveBeenCalled();
    });

    test('should return 404 when trip does not exist', async () => {
      const updates = {
        distance: 50.0,
      };

      mockUpdateTrip.mockImplementation(() => {
        throw new Error('Resource not found');
      });

      const request = createMockRequest('http://localhost:3000/api/trips/999', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '999' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Resource not found' });
    });

    test('should return 400 for negative distance', async () => {
      const updates = {
        distance: -10,
      };

      mockUpdateTrip.mockImplementation(() => {
        throw new Error('Distance must be a positive number');
      });

      const request = createMockRequest('http://localhost:3000/api/trips/1', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Distance must be a positive number' });
    });

    test('should return 400 for invalid date format', async () => {
      const updates = {
        date: 'invalid-date',
      };

      mockUpdateTrip.mockImplementation(() => {
        throw new Error('Invalid date format. Use ISO 8601 format');
      });

      const request = createMockRequest('http://localhost:3000/api/trips/1', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid date format. Use ISO 8601 format' });
    });

    test('should handle unexpected service errors', async () => {
      const updates = {
        distance: 50.0,
      };

      mockUpdateTrip.mockImplementation(() => {
        throw new Error('Unexpected database error');
      });

      const request = createMockRequest('http://localhost:3000/api/trips/1', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to update trip' });
    });
  });

  describe('DELETE /api/trips/[id]', () => {
    test('should delete a trip successfully', async () => {
      mockDeleteTrip.mockReturnValue(true);

      const request = createMockRequest('http://localhost:3000/api/trips/1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(mockDeleteTrip).toHaveBeenCalledWith(1);
    });

    test('should return 400 for invalid trip ID', async () => {
      const request = createMockRequest('http://localhost:3000/api/trips/invalid', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: 'invalid' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid trip ID' });
      expect(mockDeleteTrip).not.toHaveBeenCalled();
    });

    test('should return 404 when trip does not exist', async () => {
      mockDeleteTrip.mockReturnValue(false);

      const request = createMockRequest('http://localhost:3000/api/trips/999', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '999' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Resource not found' });
      expect(mockDeleteTrip).toHaveBeenCalledWith(999);
    });

    test('should handle unexpected service errors', async () => {
      mockDeleteTrip.mockImplementation(() => {
        throw new Error('Unexpected database error');
      });

      const request = createMockRequest('http://localhost:3000/api/trips/1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to delete trip' });
    });
  });

  describe('GET /api/trips/mileage', () => {
    test('should return mileage data successfully', async () => {
      const mockMileageData = [
        { date: '2024-01-15', cumulativeDistance: 45.5 },
        { date: '2024-01-16', cumulativeDistance: 75.5 },
        { date: '2024-01-17', cumulativeDistance: 120.0 },
      ];

      mockGetMileageOverTime.mockReturnValue(mockMileageData);

      const response = await getMileage(createMockRequest('/api/trips/mileage'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ data: mockMileageData });
      expect(mockGetMileageOverTime).toHaveBeenCalledTimes(1);
    });

    test('should return empty array when no data exists', async () => {
      mockGetMileageOverTime.mockReturnValue([]);

      const response = await getMileage(createMockRequest('/api/trips/mileage'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ data: [] });
    });

    test('should handle service errors', async () => {
      mockGetMileageOverTime.mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await getMileage(createMockRequest('/api/trips/mileage'));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch mileage data' });
    });

    test('should return cumulative distance data', async () => {
      const mockMileageData = [
        { date: '2024-01-15', cumulativeDistance: 45.5 },
        { date: '2024-01-16', cumulativeDistance: 75.5 },
        { date: '2024-01-17', cumulativeDistance: 120.0 },
        { date: '2024-01-18', cumulativeDistance: 165.5 },
      ];

      mockGetMileageOverTime.mockReturnValue(mockMileageData);

      const response = await getMileage(createMockRequest('/api/trips/mileage'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(4);
      expect(data.data[0].cumulativeDistance).toBe(45.5);
      expect(data.data[3].cumulativeDistance).toBe(165.5);
    });
  });
});
