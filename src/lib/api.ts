/**
 * API utility functions
 * Handles base path configuration for API calls
 */

/**
 * Get the configured base path from environment variables
 */
export function getBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH || '';
}

/**
 * Build an API URL with the correct base path prefix
 * @param path - The API path (e.g., '/api/auth', '/api/expenses')
 * @returns The full API URL with base path prefix
 */
export function apiUrl(path: string): string {
  const basePath = getBasePath();
  return `${basePath}${path}`;
}
