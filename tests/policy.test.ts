/**
 * Tests for PolicyEnforcer
 */

import { PolicyEnforcer, createSecurePolicy, createLenientPolicy } from '../src/policy';
import { ModelSignatureClient } from '../src/client';
import { PolicyViolationError, VerificationResult } from '../src/types';

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('PolicyEnforcer', () => {
  let client: ModelSignatureClient;
  let enforcer: PolicyEnforcer;

  beforeEach(() => {
    client = new ModelSignatureClient();
    enforcer = new PolicyEnforcer(client);
    mockFetch.mockClear();
  });

  const createValidToken = (claims: any = {}) => {
    const defaultClaims = {
      model_id: 'test-model',
      provider_id: 'test-provider',
      user_fp: 'test-fp',
      iat: Math.floor(Date.now() / 1000) - 60, // 1 minute ago
      exp: Math.floor(Date.now() / 1000) + 840, // 14 minutes from now
      jti: 'test-jti',
      ...claims
    };
    // Create proper base64url encoded token (no padding, use - and _ instead of + and /)
    const encodedPayload = btoa(JSON.stringify(defaultClaims))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    return `header.${encodedPayload}.signature`;
  };

  const mockVerificationResponse = (overrides: Partial<VerificationResult> = {}): VerificationResult => ({
    valid: true,
    claims: {
      model_id: 'test-model',
      provider_id: 'test-provider',
      user_fp: 'test-fp',
      iat: Math.floor(Date.now() / 1000) - 60,
      exp: Math.floor(Date.now() / 1000) + 840,
      jti: 'test-jti'
    },
    model: {
      id: 'test-model',
      name: 'Test Model',
      version: '1.0.0'
    },
    provider: {
      id: 'test-provider',
      name: 'Test Provider'
    },
    ...overrides
  });

  describe('enforcePolicy', () => {
    it('should allow valid token with default policy', async () => {
      const token = createValidToken();
      const mockResponse = mockVerificationResponse();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await enforcer.enforcePolicy(token);
      expect(result.allowed).toBe(true);
      expect(result.reasons).toHaveLength(0);
      expect(result.verification).toEqual(mockResponse);
    });

    it('should reject invalid token', async () => {
      const token = createValidToken();
      const mockResponse = {
        valid: false,
        error: 'Token expired'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await enforcer.enforcePolicy(token);
      expect(result.allowed).toBe(false);
      expect(result.reasons).toContain('Token verification failed: Token expired');
    });

    it('should enforce deployment ID requirement', async () => {
      const enforcer = new PolicyEnforcer(client, { requireDeploymentId: true, failClosed: false });
      const token = createValidToken();
      const mockResponse = mockVerificationResponse({
        claims: {
          model_id: 'test-model',
          provider_id: 'test-provider',
          user_fp: 'test-fp',
          iat: Math.floor(Date.now() / 1000) - 60,
          exp: Math.floor(Date.now() / 1000) + 840,
          jti: 'test-jti'
          // No deployment_id
        }
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await enforcer.enforcePolicy(token);
      expect(result.allowed).toBe(false);
      expect(result.reasons).toContain('Deployment ID is required but not present in token');
    });

    it('should enforce model digest requirement', async () => {
      const enforcer = new PolicyEnforcer(client, { requireModelDigest: true, failClosed: false });
      const token = createValidToken();
      const mockResponse = mockVerificationResponse();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await enforcer.enforcePolicy(token);
      expect(result.allowed).toBe(false);
      expect(result.reasons).toContain('Model digest is required but not present in token');
    });

    it('should enforce bundle verification requirement', async () => {
      const enforcer = new PolicyEnforcer(client, { requireBundleVerification: true, failClosed: false });
      const token = createValidToken();
      const mockResponse = mockVerificationResponse({
        bundle_check: {
          status: 'invalid',
          last_checked: '2023-01-01T00:00:00Z'
        }
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await enforcer.enforcePolicy(token);
      expect(result.allowed).toBe(false);
      expect(result.reasons).toContain('Bundle verification failed: status is \'invalid\'');
    });

    it('should enforce token age limits', async () => {
      const enforcer = new PolicyEnforcer(client, { maxTokenAge: 30, failClosed: false }); // 30 seconds max
      const token = createValidToken({ iat: Math.floor(Date.now() / 1000) - 60 }); // 1 minute ago
      const mockResponse = mockVerificationResponse();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await enforcer.enforcePolicy(token);
      expect(result.allowed).toBe(false);
      expect(result.reasons.some(r => r.includes('Token is too old'))).toBe(true);
    });

    it('should enforce allowed providers', async () => {
      const enforcer = new PolicyEnforcer(client, { 
        allowedProviders: ['allowed-provider'], 
        failClosed: false 
      });
      const token = createValidToken();
      const mockResponse = mockVerificationResponse({
        provider: {
          id: 'disallowed-provider',
          name: 'Disallowed Provider'
        }
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await enforcer.enforcePolicy(token);
      expect(result.allowed).toBe(false);
      expect(result.reasons).toContain('Provider \'disallowed-provider\' is not in allowed list');
    });

    it('should enforce allowed models', async () => {
      const enforcer = new PolicyEnforcer(client, { 
        allowedModels: ['allowed-model'], 
        failClosed: false 
      });
      const token = createValidToken();
      const mockResponse = mockVerificationResponse({
        model: {
          id: 'disallowed-model',
          name: 'Disallowed Model',
          version: '1.0.0'
        }
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await enforcer.enforcePolicy(token);
      expect(result.allowed).toBe(false);
      expect(result.reasons).toContain('Model \'disallowed-model\' is not in allowed list');
    });

    it('should throw PolicyViolationError in fail-closed mode', async () => {
      const enforcer = new PolicyEnforcer(client, { requireDeploymentId: true, failClosed: true });
      const token = createValidToken();
      const mockResponse = mockVerificationResponse();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      await expect(enforcer.enforcePolicy(token)).rejects.toThrow(PolicyViolationError);
    });

    it('should handle verification errors gracefully', async () => {
      const enforcer = new PolicyEnforcer(client, { failClosed: false });
      const token = createValidToken();

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await enforcer.enforcePolicy(token);
      expect(result.allowed).toBe(false);
      expect(result.reasons).toContain('Verification request failed: Network error');
    });
  });

  describe('quickCheck', () => {
    it('should perform quick policy check', async () => {
      const token = createValidToken({ deployment_id: 'test-deployment' });
      const mockResponse = mockVerificationResponse({
        claims: {
          model_id: 'test-model',
          provider_id: 'test-provider',
          user_fp: 'test-fp',
          deployment_id: 'test-deployment',
          iat: Math.floor(Date.now() / 1000) - 60,
          exp: Math.floor(Date.now() / 1000) + 840,
          jti: 'test-jti'
        }
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await enforcer.quickCheck(token, { requireDeployment: true });
      expect(result).toBe(true);
    });

    it('should return false on policy violation', async () => {
      const token = createValidToken();
      const mockResponse = mockVerificationResponse();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await enforcer.quickCheck(token, { requireDeployment: true });
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      const token = createValidToken();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await enforcer.quickCheck(token);
      expect(result).toBe(false);
    });
  });

  describe('configuration', () => {
    it('should update configuration', () => {
      enforcer.updateConfig({ requireDeploymentId: true });
      const config = enforcer.getConfig();
      expect(config.requireDeploymentId).toBe(true);
    });

    it('should return current configuration', () => {
      const config = enforcer.getConfig();
      expect(config).toEqual({
        requireDeploymentId: false,
        requireModelDigest: false,
        requireBundleVerification: false,
        allowedProviders: [],
        allowedModels: [],
        maxTokenAge: 900,
        failClosed: true
      });
    });
  });

  describe('factory functions', () => {
    it('should create secure policy', () => {
      const secureEnforcer = createSecurePolicy(client);
      const config = secureEnforcer.getConfig();
      
      expect(config.failClosed).toBe(true);
      expect(config.requireDeploymentId).toBe(true);
      expect(config.requireModelDigest).toBe(true);
      expect(config.maxTokenAge).toBe(300);
    });

    it('should create lenient policy', () => {
      const lenientEnforcer = createLenientPolicy(client);
      const config = lenientEnforcer.getConfig();
      
      expect(config.failClosed).toBe(false);
      expect(config.requireDeploymentId).toBe(false);
      expect(config.requireModelDigest).toBe(false);
      expect(config.maxTokenAge).toBe(3600);
    });

    it('should accept custom config overrides', () => {
      const secureEnforcer = createSecurePolicy(client, { maxTokenAge: 600 });
      const config = secureEnforcer.getConfig();
      
      expect(config.maxTokenAge).toBe(600);
      expect(config.requireDeploymentId).toBe(true); // Still secure defaults
    });
  });
});