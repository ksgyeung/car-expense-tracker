import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import DashboardClient from './DashboardClient';

/**
 * Dashboard Page Component (Server Component)
 * 
 * Server-side wrapper that verifies authentication before rendering the dashboard.
 * Provides defense-in-depth alongside middleware protection.
 * 
 * Requirements: 1.5, 7.2, 7.5
 */
export default async function DashboardPage() {
  // Verify authentication on server side
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('sessionId')?.value;
  
  if (!sessionId) {
    // No session cookie, redirect to login
    redirect('/login');
  }
  
  // User is authenticated, render the dashboard
  return <DashboardClient />;
}
