import { 
  verifyPassword, 
  createSession, 
  validateSession, 
  deleteSession, 
  cleanupExpiredSessions 
} from '../authService';
import jwt from 'jsonwebtoken';

describe('Authentication Service', () => {
  beforeEach(() => {
    // Set up test environment variables
    process.env.APP_PASSWORD = 'test-password-123';
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_EXPIRES_IN = '24h';
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', () => {
      expect(verifyPassword('test-password-123')).toBe(true);
    });

    it('should return false for incorrect password', () => {
      expect(verifyPassword('wrong-password')).toBe(false);
    });

    it('should throw error if APP_PASSWORD is not configured', () => {
      delete process.env.APP_PASSWORD;
      expect(() => verifyPassword('any-password')).toThrow(
        'APP_PASSWORD environment variable is not configured'
      );
      // Restore for other tests
      process.env.APP_PASSWORD = 'test-password-123';
    });
  });

  describe('createSession', () => {
    it('should create a new JWT token and return it', () => {
      const token = createSession();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should create token with authenticated flag set to true', () => {
      const token = createSession();
      
      const decoded = jwt.verify(token, 'test-secret-key') as { authenticated: boolean };
      
      expect(decoded.authenticated).toBe(true);
    });

    it('should create token with future expiration date', () => {
      const token = createSession();
      
      const decoded = jwt.verify(token, 'test-secret-key') as { exp: number };
      
      const expiresAt = decoded.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      
      expect(expiresAt).toBeGreaterThan(now);
    });

    it('should generate unique tokens', async () => {
      const token1 = createSession();
      // Wait a tiny bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      const token2 = createSession();
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('validateSession', () => {
    it('should return true for valid non-expired token', () => {
      const token = createSession();
      
      expect(validateSession(token)).toBe(true);
    });

    it('should return false for invalid token', () => {
      expect(validateSession('invalid-token')).toBe(false);
    });

    it('should return false for expired token', () => {
      // Create a token that expires immediately
      const expiredToken = jwt.sign(
        { authenticated: true },
        'test-secret-key',
        { expiresIn: '0s' }
      );
      
      // Wait a moment to ensure it's expired
      setTimeout(() => {
        expect(validateSession(expiredToken)).toBe(false);
      }, 100);
    });
  });

  describe('deleteSession', () => {
    it('should not throw error (JWT tokens are stateless)', () => {
      const token = createSession();
      
      // deleteSession is a no-op for JWT
      expect(() => deleteSession(token)).not.toThrow();
    });

    it('should not throw error when deleting non-existent token', () => {
      expect(() => deleteSession('non-existent-token')).not.toThrow();
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should not throw error (JWT tokens are stateless)', () => {
      // cleanupExpiredSessions is a no-op for JWT
      expect(() => cleanupExpiredSessions()).not.toThrow();
    });
  });

  describe('Token expiration time', () => {
    it('should set expiration to approximately 24 hours in the future', () => {
      const token = createSession();
      
      const decoded = jwt.verify(token, 'test-secret-key') as { iat: number; exp: number };
      
      const issuedAt = decoded.iat * 1000; // Convert to milliseconds
      const expiresAt = decoded.exp * 1000;
      
      const diffMs = expiresAt - issuedAt;
      const diffHours = diffMs / (1000 * 60 * 60);
      
      // Should be 24 hours
      expect(diffHours).toBeCloseTo(24, 1);
    });
  });
});
