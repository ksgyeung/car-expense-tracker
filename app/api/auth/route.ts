import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createSession } from '../../../src/lib/services/authService';
import { cookies } from 'next/headers';

/**
 * Parse JWT expiration time string to seconds
 * Supports formats like: 1h, 24h, 7d, 30d, 60s, 1m
 */
function parseExpirationToSeconds(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  
  if (!match) {
    // Default to 24 hours if format is invalid
    return 60 * 60 * 24;
  }
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 60 * 60 * 24;
    default: return 60 * 60 * 24; // Default to 24 hours
  }
}

/**
 * POST /api/auth/login
 * Authenticates a user with password and creates a JWT token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    // Validate password is provided
    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    // Verify password
    try {
      const isValid = verifyPassword(password);
      
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid password' },
          { status: 401 }
        );
      }
    } catch (error) {
      // Handle case where APP_PASSWORD is not configured
      console.error('Authentication error:', error);
      return NextResponse.json(
        { success: false, error: 'Authentication service not configured' },
        { status: 500 }
      );
    }

    // Create JWT token
    const token = createSession();

    // Get expiration time from environment
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    const maxAge = parseExpirationToSeconds(expiresIn);

    // Set JWT token as cookie
    const cookieStore = await cookies();
    cookieStore.set('sessionId', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/',
    });

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
