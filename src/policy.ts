/**
 * ModelSignature JavaScript SDK - Policy Enforcement
 * Milestone 4: Client SDKs + policy enforcement
 */

import {
  PolicyConfig,
  PolicyResult,
  VerificationResult,
  PolicyViolationError,
  ModelSignatureError,
  JWTClaims
} from './types';
import { ModelSignatureClient } from './client';
import { getTokenAge, parseJWT, isTokenExpired } from './utils';

export class PolicyEnforcer {
  private client: ModelSignatureClient;
  private config: PolicyConfig;

  constructor(client: ModelSignatureClient, config: PolicyConfig = {}) {
    this.client = client;
    this.config = {
      requireDeploymentId: false,
      requireModelDigest: false,
      requireBundleVerification: false,
      allowedProviders: [],
      allowedModels: [],
      maxTokenAge: 900, // 15 minutes default
      failClosed: true, // Fail securely by default
      ...config
    };
  }

  /**
   * Enforce policy on a JWT token
   * @param token JWT token to validate
   * @returns Policy result with allowed status and reasons
   */
  async enforcePolicy(token: string): Promise<PolicyResult> {
    const violations: string[] = [];
    let verification: VerificationResult;

    try {
      // First verify the token
      verification = await this.client.verifyToken(token);

      if (!verification.valid) {
        violations.push(`Token verification failed: ${verification.error}`);
        return this.buildResult(false, violations, verification);
      }

      // Now enforce policy rules
      this.checkTokenPolicy(token, verification, violations);
      
    } catch (error) {
      let errorMessage = error instanceof Error ? error.message : 'Unknown verification error';
      
      // Extract original error message from retry wrapper
      if (errorMessage.includes('Request failed after') && errorMessage.includes('attempts:')) {
        const match = errorMessage.match(/attempts: (.+)$/);
        if (match) {
          errorMessage = match[1];
        }
      }
      
      violations.push(`Verification request failed: ${errorMessage}`);
      
      verification = {
        valid: false,
        error: errorMessage
      };
    }

    const allowed = violations.length === 0;
    const result = this.buildResult(allowed, violations, verification);

    // Throw error if policy violated and fail-closed mode is enabled
    if (!allowed && this.config.failClosed) {
      throw new PolicyViolationError(
        `Policy violation: ${violations.join(', ')}`,
        violations
      );
    }

    return result;
  }

  /**
   * Check token-level policy rules
   * @param token JWT token string
   * @param verification Verification result
   * @param violations Array to collect violations
   */
  private checkTokenPolicy(
    token: string, 
    verification: VerificationResult, 
    violations: string[]
  ): void {
    const claims = verification.claims;
    const model = verification.model;
    const provider = verification.provider;
    const bundleCheck = verification.bundle_check;

    if (!claims) {
      violations.push('No claims found in token');
      return;
    }

    // Check token age
    if (this.config.maxTokenAge !== undefined) {
      const tokenAge = getTokenAge(token);
      if (tokenAge === null) {
        violations.push('Unable to determine token age');
      } else if (tokenAge > this.config.maxTokenAge) {
        violations.push(`Token is too old: ${tokenAge}s > ${this.config.maxTokenAge}s`);
      }
    }

    // Check if deployment ID is required
    if (this.config.requireDeploymentId && !claims.deployment_id) {
      violations.push('Deployment ID is required but not present in token');
    }

    // Check if model digest is required  
    if (this.config.requireModelDigest && !claims.model_digest) {
      violations.push('Model digest is required but not present in token');
    }

    // Check bundle verification requirement
    if (this.config.requireBundleVerification) {
      if (!bundleCheck) {
        violations.push('Bundle verification is required but no bundle information available');
      } else if (bundleCheck.status !== 'verified') {
        violations.push(`Bundle verification failed: status is '${bundleCheck.status}'`);
      }
    }

    // Check allowed providers
    if (this.config.allowedProviders && this.config.allowedProviders.length > 0) {
      if (!provider || !this.config.allowedProviders.includes(provider.id)) {
        violations.push(`Provider '${provider?.id || 'unknown'}' is not in allowed list`);
      }
    }

    // Check allowed models
    if (this.config.allowedModels && this.config.allowedModels.length > 0) {
      if (!model || !this.config.allowedModels.includes(model.id)) {
        violations.push(`Model '${model?.id || 'unknown'}' is not in allowed list`);
      }
    }
  }

  /**
   * Build policy result
   * @param allowed Whether the policy allows the token
   * @param violations List of policy violations
   * @param verification Original verification result
   * @returns PolicyResult
   */
  private buildResult(
    allowed: boolean, 
    violations: string[], 
    verification: VerificationResult
  ): PolicyResult {
    return {
      allowed,
      reasons: violations,
      verification
    };
  }

  /**
   * Update policy configuration
   * @param config New policy configuration
   */
  updateConfig(config: Partial<PolicyConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }

  /**
   * Get current policy configuration
   */
  getConfig(): PolicyConfig {
    return { ...this.config };
  }

  /**
   * Quick policy check with custom rules (shorthand method)
   * @param token JWT token
   * @param rules Quick policy rules
   * @returns Whether token passes policy
   */
  async quickCheck(
    token: string, 
    rules: {
      requireDeployment?: boolean;
      requireDigest?: boolean;
      maxAge?: number;
      allowedProviders?: string[];
    } = {}
  ): Promise<boolean> {
    try {
      const tempConfig: PolicyConfig = {
        ...this.config,
        requireDeploymentId: rules.requireDeployment ?? this.config.requireDeploymentId,
        requireModelDigest: rules.requireDigest ?? this.config.requireModelDigest,
        maxTokenAge: rules.maxAge ?? this.config.maxTokenAge,
        allowedProviders: rules.allowedProviders ?? this.config.allowedProviders,
        failClosed: false // Don't throw for quick check
      };

      const tempEnforcer = new PolicyEnforcer(this.client, tempConfig);
      const result = await tempEnforcer.enforcePolicy(token);
      return result.allowed;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Convenience function to create a policy enforcer with fail-closed mode
 * @param client ModelSignature client
 * @param config Policy configuration
 * @returns PolicyEnforcer configured for production use
 */
export function createSecurePolicy(
  client: ModelSignatureClient, 
  config: PolicyConfig = {}
): PolicyEnforcer {
  return new PolicyEnforcer(client, {
    failClosed: true,
    requireDeploymentId: true,
    requireModelDigest: true,
    maxTokenAge: 300, // 5 minutes for production
    ...config
  });
}

/**
 * Convenience function to create a lenient policy enforcer
 * @param client ModelSignature client
 * @param config Policy configuration
 * @returns PolicyEnforcer configured for development/testing
 */
export function createLenientPolicy(
  client: ModelSignatureClient, 
  config: PolicyConfig = {}
): PolicyEnforcer {
  return new PolicyEnforcer(client, {
    failClosed: false,
    requireDeploymentId: false,
    requireModelDigest: false,
    maxTokenAge: 3600, // 1 hour for development
    ...config
  });
}