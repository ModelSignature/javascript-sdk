/**
 * ModelSignature JavaScript SDK - Utility Functions
 * Milestone 4: Client SDKs + policy enforcement
 */

import CryptoJS from 'crypto-js';

/**
 * Calculate SHA256 hash of response text for binding
 * @param responseText The model's raw response text
 * @returns SHA256 hash as hex string
 */
export function hashOutput(responseText: string): string {
  return CryptoJS.SHA256(responseText).toString(CryptoJS.enc.Hex);
}

/**
 * Parse JWT token without verification (for extracting claims)
 * Note: This is for client-side inspection only, not security validation
 * @param token JWT token string
 * @returns Parsed payload or null if invalid format
 */
export function parseJWT(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
}

/**
 * Check if JWT token is expired (client-side check only)
 * @param token JWT token string
 * @returns true if expired, false if valid, null if can't parse
 */
export function isTokenExpired(token: string): boolean | null {
  const payload = parseJWT(token);
  if (!payload || !payload.exp) {
    return null;
  }
  
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

/**
 * Extract token age in seconds
 * @param token JWT token string
 * @returns Age in seconds or null if can't parse
 */
export function getTokenAge(token: string): number | null {
  const payload = parseJWT(token);
  if (!payload || !payload.iat) {
    return null;
  }
  
  const now = Math.floor(Date.now() / 1000);
  return now - payload.iat;
}

/**
 * Validate token format (basic structure check)
 * @param token JWT token string
 * @returns true if format is valid
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }
  
  // Check that each part is base64url encoded
  const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
  return parts.every(part => base64UrlRegex.test(part));
}

/**
 * Sleep utility for retries
 * @param ms Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Exponential backoff for retries
 * @param attempt Attempt number (0-based)
 * @param baseDelay Base delay in milliseconds
 * @param maxDelay Maximum delay in milliseconds
 */
export function getBackoffDelay(attempt: number, baseDelay: number = 1000, maxDelay: number = 10000): number {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  // Add some jitter
  return delay + Math.random() * 1000;
}