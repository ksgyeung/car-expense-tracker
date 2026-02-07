/**
 * @jest-environment node
 * 
 * Unit tests for authentication API routes
 * Tests successful login, failed login, and logout functionality
 */

import { POST as loginPOST } from '../../../app/api/auth/route';
import { POST as logoutPOST } from '../../../app/api/auth/logout/route';
import { NextRequest } from 'next/server';
import { verifyPassword, createSession, deleteSession } from '../../lib/services/authService';
import { cookies } from 'next/headers';

// Mock the auth service
jest.mock('../../lib/services/authService');
jest.mock('next/headers');

const mockVerifyPassword = verifyPassword as jest.MockedFunction<typeof verifyPassword>;
const mockCreateSession = createSession as jest.MockedFunction<typeof createSession>;
const mockDeleteSession = deleteSession as jest.MockedFunction<typeof deleteSession>;
const mockCookies = cookies as jest.MockedFunction<typeof cookies>;

describe('Authentication API Routes', () => {
  let mockCookieStore: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock cookie store
    mockCookieStore = {
      set: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
    };
    
    mockCookies.mockResolvedValue(mockCookieStore);
  });

  describe('POST /api/auth/login', () => {
    it('should successfully login with correct password', async () => {
      const mockToken = 'test-jwt-token-123';
      mockVerifyPassword.mockReturnValue(true);
      mockCreateSession.mockReturnValue(mockToken);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ password: 'correct-password' }),
      });

      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
      });
      expect(mockVerifyPassword).toHaveBeenCalledWith('correct-password');
      expect(mockCreateSession).toHaveBeenCalled();
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'sessionId',
        mockToken,
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        })
      );
    });

    it('should fail login with incorrect password', async () => {
      mockVerifyPassword.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ password: 'wrong-password' }),
      });

      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: 'Invalid password',
      });
      expect(mockVerifyPassword).toHaveBeenCalledWith('wrong-password');
      expect(mockCreateSession).not.toHaveBeenCalled();
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('should return 400 when password is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Password is required',
      });
      expect(mockVerifyPassword).not.toHaveBeenCalled();
      expect(mockCreateSession).not.toHaveBeenCalled();
    });

    it('should return 500 when APP_PASSWORD is not configured', async () => {
      mockVerifyPassword.mockImplementation(() => {
        throw new Error('APP_PASSWORD environment variable is not configured');
      });

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ password: 'any-password' }),
      });

      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Authentication service not configured',
      });
      expect(mockCreateSession).not.toHaveBeenCalled();
    });

    it('should handle JSON parsing errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: 'invalid-json',
      });

      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'An error occurred during login',
      });
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should successfully logout and clear cookie', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      });

      const response = await logoutPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
      });
      expect(mockCookieStore.delete).toHaveBeenCalledWith('sessionId');
    });

    it('should handle logout when no session exists', async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      });

      const response = await logoutPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
      });
      expect(mockCookieStore.delete).toHaveBeenCalled();
    });

    it('should handle errors during logout', async () => {
      mockCookieStore.delete.mockImplementation(() => {
        throw new Error('Cookie store error');
      });

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      });

      const response = await logoutPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'An error occurred during logout',
      });
    });
  });
});
