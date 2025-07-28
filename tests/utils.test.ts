/**
 * Tests for utility functions
 */

import {
  hashOutput,
  parseJWT,
  isTokenExpired,
  getTokenAge,
  isValidTokenFormat,
  sleep,
  getBackoffDelay
} from '../src/utils';

describe('Utils', () => {
  describe('hashOutput', () => {
    it('should return mocked hash for any input', () => {
      const result = hashOutput('test response');
      expect(result).toBe('mocked-hash');
    });
  });

  describe('parseJWT', () => {
    it('should parse valid JWT token', () => {
      // Create a valid JWT structure with base64url encoded payload
      const payload = { sub: '1234567890', name: 'John Doe', iat: 1516239022 };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;

      const result = parseJWT(token);
      expect(result).toEqual(payload);
    });

    it('should return null for invalid token format', () => {
      expect(parseJWT('invalid')).toBeNull();
      expect(parseJWT('')).toBeNull();
      expect(parseJWT('one.two')).toBeNull();
    });

    it('should return null for malformed JWT', () => {
      expect(parseJWT('header.invalid-base64.signature')).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for non-expired token', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const payload = { exp: futureTime };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;

      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for expired token', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const payload = { exp: pastTime };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;

      expect(isTokenExpired(token)).toBe(true);
    });

    it('should return null for token without exp claim', () => {
      const payload = { sub: '1234567890' };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;

      expect(isTokenExpired(token)).toBeNull();
    });

    it('should return null for invalid token', () => {
      expect(isTokenExpired('invalid')).toBeNull();
    });
  });

  describe('getTokenAge', () => {
    it('should return age in seconds', () => {
      const issued = Math.floor(Date.now() / 1000) - 300; // 5 minutes ago
      const payload = { iat: issued };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;

      const age = getTokenAge(token);
      expect(age).toBeGreaterThanOrEqual(299);
      expect(age).toBeLessThanOrEqual(301);
    });

    it('should return null for token without iat claim', () => {
      const payload = { sub: '1234567890' };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;

      expect(getTokenAge(token)).toBeNull();
    });

    it('should return null for invalid token', () => {
      expect(getTokenAge('invalid')).toBeNull();
    });
  });

  describe('isValidTokenFormat', () => {
    it('should return true for valid JWT format', () => {
      expect(isValidTokenFormat('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c')).toBe(true);
    });

    it('should return false for invalid formats', () => {
      expect(isValidTokenFormat('')).toBe(false);
      expect(isValidTokenFormat('invalid')).toBe(false);
      expect(isValidTokenFormat('one.two')).toBe(false);
      expect(isValidTokenFormat('one.two.three.four')).toBe(false);
      expect(isValidTokenFormat('one.two.three!')).toBe(false);
    });

    it('should return false for non-string input', () => {
      expect(isValidTokenFormat(null as any)).toBe(false);
      expect(isValidTokenFormat(undefined as any)).toBe(false);
      expect(isValidTokenFormat(123 as any)).toBe(false);
    });
  });

  describe('sleep', () => {
    it('should resolve after specified time', async () => {
      const start = Date.now();
      await sleep(50);
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(45);
    });
  });

  describe('getBackoffDelay', () => {
    it('should return exponential backoff delays', () => {
      expect(getBackoffDelay(0, 1000)).toBeGreaterThanOrEqual(1000);
      expect(getBackoffDelay(0, 1000)).toBeLessThanOrEqual(2000);
      
      expect(getBackoffDelay(1, 1000)).toBeGreaterThanOrEqual(2000);
      expect(getBackoffDelay(1, 1000)).toBeLessThanOrEqual(3000);
      
      expect(getBackoffDelay(2, 1000)).toBeGreaterThanOrEqual(4000);
      expect(getBackoffDelay(2, 1000)).toBeLessThanOrEqual(5000);
    });

    it('should respect max delay', () => {
      const delay = getBackoffDelay(10, 1000, 5000);
      expect(delay).toBeLessThanOrEqual(6000); // 5000 + 1000 jitter
    });
  });
});