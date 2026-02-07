import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/logout
 * Logs out the current user by clearing their JWT token cookie
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Clear JWT token cookie
    cookieStore.delete('sessionId');

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}
