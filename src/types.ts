/**
 * ModelSignature JavaScript SDK - Type Definitions
 * Milestone 4: Client SDKs + policy enforcement
 */

export interface ModelSignatureConfig {
  apiBaseUrl?: string;
  timeout?: number;
  retries?: number;
}

export interface JWTClaims {
  model_id: string;
  provider_id: string;
  user_fp: string;
  deployment_id?: string;
  model_digest?: string;
  response_hash?: string;
  bound_to_response?: boolean;
  iat: number;
  exp: number;
  jti: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  version: string;
  type?: string;
  model_digest?: string;
  sigstore_bundle_url?: string;
  bundle_status?: 'unknown' | 'verified' | 'invalid' | 'error';
  bundle_last_checked?: string;
}

export interface ProviderInfo {
  id: string;
  name: string;
  website?: string;
  verification_level?: string;
  domain_verified?: boolean;
}

export interface BundleCheck {
  status: 'unknown' | 'verified' | 'invalid' | 'error';
  last_checked?: string;
  details?: any;
}

export interface VerificationResult {
  valid: boolean;
  claims?: JWTClaims;
  model?: ModelInfo;
  provider?: ProviderInfo;
  bundle_check?: BundleCheck;
  error?: string;
}

export interface PolicyConfig {
  requireDeploymentId?: boolean;
  requireModelDigest?: boolean;
  requireBundleVerification?: boolean;
  allowedProviders?: string[];
  allowedModels?: string[];
  maxTokenAge?: number; // seconds
  failClosed?: boolean;
}

export interface PolicyResult {
  allowed: boolean;
  reasons: string[];
  verification: VerificationResult;
}

export interface ResponseBinding {
  response_hash: string;
  bound_token: string;
  verification_url: string;
}

export class ModelSignatureError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ModelSignatureError';
  }
}

export class PolicyViolationError extends ModelSignatureError {
  constructor(
    message: string,
    public violations: string[]
  ) {
    super(message, 'POLICY_VIOLATION');
    this.name = 'PolicyViolationError';
  }
}