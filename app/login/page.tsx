'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import 'bootstrap/dist/css/bootstrap.min.css';
import { apiUrl } from '@/src/lib/api';

/**
 * Login Page Component
 * 
 * Provides password-based authentication for the application.
 * Features:
 * - Password input form with Bootstrap styling
 * - Form submission and session storage
 * - Error message display for failed authentication
 * - Redirect to dashboard on successful login
 * 
 * Requirements: 1.1, 1.2, 1.3, 7.2, 7.3, 7.4
 */
export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl('/api/auth'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        // Session is stored in httpOnly cookie by the API
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        // Display error message
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card shadow">
            <div className="card-body p-4">
              <h1 className="card-title text-center mb-4">
                Car Expense Tracker
              </h1>
              <p className="text-center text-muted mb-4">
                Please enter your password to continue
              </p>

              {/* Error Alert - Requirement 7.4 */}
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {/* Login Form - Requirements 1.1, 1.2, 7.2 */}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    disabled={isLoading}
                    autoFocus
                  />
                </div>

                {/* Submit Button - Requirement 7.3 */}
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
