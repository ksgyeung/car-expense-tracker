'use client';

import { useEffect } from 'react';

/**
 * Error Boundary Component
 * 
 * Global error boundary for handling React errors.
 * Features:
 * - Catches React component errors
 * - Displays user-friendly error messages with Bootstrap alerts
 * - Provides reset functionality to recover from errors
 * - Logs errors for debugging
 * 
 * Requirements: 6.5, 7.3, 7.4
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card border-danger">
            <div className="card-body">
              <div className="alert alert-danger" role="alert">
                <h4 className="alert-heading">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  Something went wrong!
                </h4>
                <p className="mb-3">
                  An unexpected error occurred while processing your request. 
                  This has been logged and we apologize for the inconvenience.
                </p>
                
                {/* Error details (only in development) */}
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-muted">
                      <small>Error Details (Development Only)</small>
                    </summary>
                    <pre className="mt-2 p-2 bg-light border rounded" style={{ fontSize: '0.75rem' }}>
                      <code>{error.message}</code>
                    </pre>
                    {error.digest && (
                      <p className="text-muted mb-0">
                        <small>Error ID: {error.digest}</small>
                      </p>
                    )}
                  </details>
                )}

                <hr />

                {/* Action buttons */}
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => reset()}
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Try Again
                  </button>
                  <a
                    href="/dashboard"
                    className="btn btn-outline-secondary"
                  >
                    <i className="bi bi-house me-2"></i>
                    Go to Dashboard
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Help text */}
          <div className="mt-3 text-center text-muted">
            <small>
              If this problem persists, please try refreshing the page or contact support.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
