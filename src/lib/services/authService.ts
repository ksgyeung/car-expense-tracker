import jwt from 'jsonwebtoken';

/**
 * Get JWT secret from environment variables
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }
  
  return secret;
}

/**
 * Get JWT expiration time from environment variables
 * Defaults to '24h' if not configured
 */
function getJwtExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || '24h';
}

/**
 * Verify if the provided password matches the configured password
 * @param password - The password to verify
 * @returns true if password matches, false otherwise
 */
export function verifyPassword(password: string): boolean {
  const configuredPassword = process.env.APP_PASSWORD;
  
  if (!configuredPassword) {
    throw new Error('APP_PASSWORD environment variable is not configured');
  }
  
  return password === configuredPassword;
}

/**
 * Create a new JWT token for authenticated session
 * @returns The JWT token
 */
export function createSession(): string {
  const secret = getJwtSecret();
  const expiresIn = getJwtExpiresIn();
  
  // @ts-ignore - JWT types are complex, but this is the correct usage
  const token: string = jwt.sign(
    {
      authenticated: true,
      createdAt: new Date().toISOString()
    },
    secret,
    { expiresIn }
  );
  
  return token;
}

/**
 * Validate if a JWT token is valid and not expired
 * @param token - The JWT token to validate
 * @returns true if token is valid, false otherwise
 */
export function validateSession(token: string): boolean {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as { authenticated: boolean };
    
    return decoded.authenticated === true;
  } catch (error) {
    // Token is invalid or expired
    return false;
  }
}

/**
 * Delete a specific session (no-op for JWT as tokens are stateless)
 * @param token - The JWT token (not used, kept for API compatibility)
 */
export function deleteSession(token: string): void {
  // JWT tokens are stateless, so we don't need to delete them from a database
  // The client will remove the cookie, effectively logging out
}

/**
 * Clean up all expired sessions (no-op for JWT as tokens are stateless)
 */
export function cleanupExpiredSessions(): void {
  // JWT tokens are stateless and expire automatically
  // No cleanup needed
}
