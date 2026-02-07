'use client';

import { useEffect } from 'react';

/**
 * Global Error Boundary Component
 * 
 * Catches errors in the root layout and provides a fallback UI.
 * This is a special error boundary that catches errors even in the layout component.
 * 
 * Requirements: 6.5, 7.3, 7.4
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="container mt-5">
          <div className="row justify-content-center">
            <div className="col-12 col-md-8 col-lg-6">
              <div className="card border-danger">
                <div className="card-body">
                  <div className="alert alert-danger" role="alert">
                    <h4 className="alert-heading">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      Critical Error
                    </h4>
                    <p className="mb-3">
                      A critical error occurred in the application. 
                      Please try reloading the page or contact support if the problem persists.
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
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => window.location.href = '/'}
                      >
                        <i className="bi bi-house me-2"></i>
                        Go to Home
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Help text */}
              <div className="mt-3 text-center text-muted">
                <small>
                  If this problem persists, please try clearing your browser cache and cookies.
                </small>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
