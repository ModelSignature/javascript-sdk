/**
 * Tests for ModelSignatureClient
 */

import { ModelSignatureClient } from '../src/client';
import { ModelSignatureError } from '../src/types';

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('ModelSignatureClient', () => {
  let client: ModelSignatureClient;

  beforeEach(() => {
    client = new ModelSignatureClient();
    mockFetch.mockClear();
  });

  describe('constructor', () => {
    it('should use default config', () => {
      const config = client.getConfig();
      expect(config.apiBaseUrl).toBe('https://modelsignature-api-541734326273.us-central1.run.app');
      expect(config.timeout).toBe(10000);
      expect(config.retries).toBe(3);
    });

    it('should accept custom config', () => {
      const customClient = new ModelSignatureClient({
        apiBaseUrl: 'https://custom.api.com',
        timeout: 5000,
        retries: 1
      });
      
      const config = customClient.getConfig();
      expect(config.apiBaseUrl).toBe('https://custom.api.com');
      expect(config.timeout).toBe(5000);
      expect(config.retries).toBe(1);
    });
  });

  describe('verifyToken', () => {
    const validToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

    it('should verify valid token successfully', async () => {
      const mockResponse = {
        valid: true,
        claims: {
          model_id: 'test-model',
          provider_id: 'test-provider',
          user_fp: 'test-fingerprint',
          iat: 1234567890,
          exp: 1234567890 + 900,
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
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await client.verifyToken(validToken);
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        `https://modelsignature-api-541734326273.us-central1.run.app/api/v1/jwt/verify/${validToken}`,
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    it('should throw error for invalid token format', async () => {
      await expect(client.verifyToken('invalid-token')).rejects.toThrow(ModelSignatureError);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ detail: 'Invalid token' })
      } as Response);

      await expect(client.verifyToken(validToken)).rejects.toThrow('Invalid token');
    });

    it('should retry on server errors', async () => {
      const client = new ModelSignatureClient({ retries: 1 });
      
      // First call fails with 500
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({})
      } as Response);

      // Second call succeeds
      const mockResponse = { valid: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await client.verifyToken(validToken);
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry client errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ detail: 'Invalid token format' })
      } as Response);

      await expect(client.verifyToken(validToken)).rejects.toThrow('Invalid token format');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle network timeouts', async () => {
      const client = new ModelSignatureClient({ timeout: 100, retries: 0 });
      
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      );

      await expect(client.verifyToken(validToken)).rejects.toThrow(ModelSignatureError);
    });
  });

  describe('bindResponse', () => {
    const validToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const responseText = 'This is a test model response.';

    it('should bind response successfully', async () => {
      const mockResponse = {
        response_hash: 'abc123',
        bound_token: 'bound.jwt.token',
        verification_url: 'https://modelsignature.com/v/abc123'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await client.bindResponse(validToken, responseText);
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        `https://modelsignature-api-541734326273.us-central1.run.app/api/v1/jwt/${validToken}/bind-response`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ response_text: responseText })
        })
      );
    });

    it('should throw error for invalid token format', async () => {
      await expect(client.bindResponse('invalid', responseText)).rejects.toThrow(ModelSignatureError);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should throw error for empty response text', async () => {
      await expect(client.bindResponse(validToken, '')).rejects.toThrow('Response text must be a non-empty string');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should throw error for non-string response text', async () => {
      await expect(client.bindResponse(validToken, null as any)).rejects.toThrow('Response text must be a non-empty string');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      client.updateConfig({ timeout: 5000 });
      const config = client.getConfig();
      expect(config.timeout).toBe(5000);
      expect(config.apiBaseUrl).toBe('https://modelsignature-api-541734326273.us-central1.run.app'); // unchanged
    });
  });
});