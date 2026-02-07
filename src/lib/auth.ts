import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from './services/authService';
import { cookies } from 'next/headers';

/**
 * Validates the JWT token from the request cookies
 * Returns true if valid, or a NextResponse with 401 error if invalid
 * 
 * Usage in API routes:
 * ```
 * const sessionValidation = await validateApiRequest(request);
 * if (sessionValidation instanceof NextResponse) {
 *   return sessionValidation; // Return the error response
 * }
 * // Token is valid, continue with API logic
 * ```
 */
export async function validateApiRequest(
  request: NextRequest
): Promise<true | NextResponse> {
  // Get JWT token from request cookies (works in both test and production)
  const token = request.cookies.get('sessionId')?.value;
  
  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized: No session found' },
      { status: 401 }
    );
  }
  
  // Validate JWT token
  const isValid = validateSession(token);
  
  if (!isValid) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or expired session' },
      { status: 401 }
    );
  }
  
  return true;
}

/**
 * Validates the JWT token for GET requests (no request object needed)
 * Returns true if valid, or a NextResponse with 401 error if invalid
 */
export async function validateApiRequestGet(): Promise<true | NextResponse> {
  // Get JWT token from cookies
  const cookieStore = await cookies();
  const token = cookieStore.get('sessionId')?.value;
  
  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized: No session found' },
      { status: 401 }
    );
  }
  
  // Validate JWT token
  const isValid = validateSession(token);
  
  if (!isValid) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or expired session' },
      { status: 401 }
    );
  }
  
  return true;
}
