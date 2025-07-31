/**
 * ModelSignature JavaScript SDK - Main Entry Point
 * Milestone 4: Client SDKs + policy enforcement
 */

// Export main classes
export { ModelSignatureClient } from './client';
export { PolicyEnforcer, createSecurePolicy, createLenientPolicy } from './policy';

// Export utility functions
export { hashOutput, parseJWT, isTokenExpired, getTokenAge, isValidTokenFormat } from './utils';

// Export types
export type {
  ModelSignatureConfig,
  JWTClaims,
  ModelInfo,
  ProviderInfo,
  BundleCheck,
  VerificationResult,
  PolicyConfig,
  PolicyResult,
  ResponseBinding
} from './types';

// Export errors
export { ModelSignatureError, PolicyViolationError } from './types';