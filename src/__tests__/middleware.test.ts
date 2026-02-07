/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../middleware';

describe('Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Public paths', () => {
    it('should allow access to /login without authentication', () => {
      const request = new NextRequest(new URL('http://localhost:3000/login'));
      const response = middleware(request);
      
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it('should allow access to /api/auth/login without authentication', () => {
      const request = new NextRequest(new URL('http://localhost:3000/api/auth/login'));
      const response = middleware(request);
      
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it('should allow access to /api/auth/logout without authentication', () => {
      const request = new NextRequest(new URL('http://localhost:3000/api/auth/logout'));
      const response = middleware(request);
      
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });
  });

  describe('Protected paths without session', () => {
    it('should redirect to /login when accessing root without session', () => {
      const request = new NextRequest(new URL('http://localhost:3000/'));
      const response = middleware(request);
      
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307); // Temporary redirect
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('should redirect to /login when accessing /dashboard without session', () => {
      const request = new NextRequest(new URL('http://localhost:3000/dashboard'));
      const response = middleware(request);
      
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('should redirect to /login when accessing API routes without session', () => {
      const request = new NextRequest(new URL('http://localhost:3000/api/expenses'));
      const response = middleware(request);
      
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    });
  });

  describe('Protected paths with session cookie', () => {
    it('should allow access to root with session cookie', () => {
      const request = new NextRequest(new URL('http://localhost:3000/'));
      request.cookies.set('sessionId', 'some-session-id');
      
      const response = middleware(request);
      
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it('should allow access to /dashboard with session cookie', () => {
      const request = new NextRequest(new URL('http://localhost:3000/dashboard'));
      request.cookies.set('sessionId', 'some-session-id');
      
      const response = middleware(request);
      
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it('should allow access to API routes with session cookie', () => {
      const request = new NextRequest(new URL('http://localhost:3000/api/expenses'));
      request.cookies.set('sessionId', 'some-session-id');
      
      const response = middleware(request);
      
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });
  });

  describe('Session persistence', () => {
    it('should maintain authentication state across multiple requests with same session cookie', () => {
      const sessionId = 'persistent-session-id';
      
      // First request
      const request1 = new NextRequest(new URL('http://localhost:3000/dashboard'));
      request1.cookies.set('sessionId', sessionId);
      const response1 = middleware(request1);
      
      expect(response1.status).toBe(200);
      
      // Second request with same session
      const request2 = new NextRequest(new URL('http://localhost:3000/api/expenses'));
      request2.cookies.set('sessionId', sessionId);
      const response2 = middleware(request2);
      
      expect(response2.status).toBe(200);
    });
  });
});
