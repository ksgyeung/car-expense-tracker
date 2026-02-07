'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiUrl } from '@/src/lib/api';

/**
 * Navigation Component
 * 
 * Responsive navigation bar with logout functionality.
 * Features:
 * - Bootstrap navbar with responsive collapse
 * - Active link highlighting
 * - Logout button with confirmation
 * - Mobile-friendly hamburger menu
 * 
 * Requirements: 7.1, 7.2, 7.5
 */
export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Don't show navigation on login page
  if (pathname === '/login') {
    return null;
  }

  /**
   * Handles user logout
   */
  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) {
      return;
    }

    setIsLoggingOut(true);

    try {
      const response = await fetch(apiUrl('/api/auth/logout'), {
        method: 'POST',
      });

      if (response.ok) {
        // Redirect to login page
        router.push('/login');
      } else {
        alert('Failed to logout. Please try again.');
      }
    } catch (err) {
      console.error('Error logging out:', err);
      alert('An error occurred while logging out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        {/* Brand */}
        <a className="navbar-brand" href="/dashboard">
          <i className="bi bi-car-front-fill me-2"></i>
          Car Expense Tracker
        </a>

        {/* Mobile toggle button */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navigation links */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <a
                className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}
                href="/dashboard"
              >
                <i className="bi bi-speedometer2 me-1"></i>
                Dashboard
              </a>
            </li>
          </ul>

          {/* Logout button */}
          <div className="d-flex">
            <button
              className="btn btn-outline-light"
              onClick={handleLogout}
              disabled={isLoggingOut}
              type="button"
            >
              {isLoggingOut ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Logging out...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-right me-1"></i>
                  Logout
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
