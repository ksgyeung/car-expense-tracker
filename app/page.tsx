import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

/**
 * Root Page Component
 * 
 * Handles initial routing based on authentication status.
 * - If authenticated (has session cookie): redirects to dashboard
 * - If not authenticated: redirects to login page
 * 
 * Requirements: 1.5
 */
export default async function Home() {
  // Check for session cookie
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('sessionId')?.value;
  
  if (sessionId) {
    // User is authenticated, redirect to dashboard
    redirect('/dashboard');
  } else {
    // User is not authenticated, redirect to login
    redirect('/login');
  }
}
