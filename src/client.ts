/**
 * ModelSignature JavaScript SDK - Main Client
 * Milestone 4: Client SDKs + policy enforcement
 */

import {
  ModelSignatureConfig,
  ModelSignatureConfigRequired,
  VerificationResult,
  ResponseBinding,
  ModelSignatureError,
  JWTClaims,
  ModelInfo,
  ProviderInfo,
  BundleCheck
} from './types';
import { sleep, getBackoffDelay, isValidTokenFormat } from './utils';

export class ModelSignatureClient {
  private config: ModelSignatureConfigRequired;
  private apiKey?: string;

  constructor(config: ModelSignatureConfig = {}) {
    this.config = {
      apiKey: config.apiKey,
      apiBaseUrl: config.apiBaseUrl || 'https://modelsignature-api-541734326273.us-central1.run.app',
      timeout: config.timeout || 10000,
      retries: config.retries || 3
    };
    this.apiKey = config.apiKey;
  }

  /**
   * Verify a JWT token and return detailed information
   * @param token JWT token string
   * @returns Verification result with claims, model, and provider info
   */
  async verifyToken(token: string): Promise<VerificationResult> {
    if (!isValidTokenFormat(token)) {
      throw new ModelSignatureError('Invalid token format', 'INVALID_FORMAT');
    }

    return this.makeRequest(`/api/v1/jwt/verify/${token}`, {
      method: 'GET'
    });
  }

  /**
   * Bind a JWT token to a specific response text
   * @param token Original JWT token
   * @param responseText The model's response text
   * @returns Response binding with bound token and verification URL
   */
  async bindResponse(token: string, responseText: string): Promise<ResponseBinding> {
    if (!isValidTokenFormat(token)) {
      throw new ModelSignatureError('Invalid token format', 'INVALID_FORMAT');
    }

    if (!responseText || typeof responseText !== 'string') {
      throw new ModelSignatureError('Response text must be a non-empty string', 'INVALID_RESPONSE');
    }

    return this.makeRequest(`/api/v1/jwt/${token}/bind-response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        response_text: responseText
      })
    });
  }

  /**
   * Register a new deployment
   * @param data Deployment registration data
   * @returns Deployment information
   */
  async registerDeployment(data: {
    name: string;
    description?: string;
    endpoint_url: string;
    certificate_fingerprint: string;
    deployment_type?: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    return this.makeRequest('/api/v1/deployments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  }

  /**
   * List all deployments for the current provider
   * @returns List of deployments
   */
  async listDeployments(): Promise<any[]> {
    return this.makeRequest('/api/v1/deployments', {
      method: 'GET'
    });
  }

  /**
   * Allow a deployment to serve a specific model
   * @param modelId Model ID
   * @param deploymentId Deployment ID
   * @returns Authorization result
   */
  async allowDeploymentForModel(modelId: string, deploymentId: string): Promise<any> {
    return this.makeRequest(`/api/v1/models/${modelId}/deployments/${deploymentId}/allow`, {
      method: 'POST'
    });
  }

  /**
   * Update deployment status
   * @param deploymentId Deployment ID
   * @param status New status
   * @returns Updated deployment
   */
  async updateDeploymentStatus(deploymentId: string, status: string): Promise<any> {
    return this.makeRequest(`/api/v1/deployments/${deploymentId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
  }

  /**
   * Delete a deployment
   * @param deploymentId Deployment ID
   * @returns Deletion result
   */
  async deleteDeployment(deploymentId: string): Promise<any> {
    return this.makeRequest(`/api/v1/deployments/${deploymentId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Create a verification with mTLS headers
   * @param data Verification data with mTLS headers
   * @returns Verification result
   */
  async createVerificationWithMtls(data: {
    model_id: string;
    prompt: string;
    response: string;
    client_cert_fingerprint?: string;
    client_cert_subject?: string;
    client_cert_issuer?: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    return this.makeRequest('/api/v1/create-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  }

  /**
   * Register a new model
   * @param data Model registration data
   * @returns Model information
   */
  async registerModel(data: {
    model_id: string;
    name: string;
    description?: string;
    license?: string;
    homepage_url?: string;
    digest?: string;
    bundle_url?: string;
    capabilities?: string[];
    trust_level?: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    return this.makeRequest('/api/v1/models', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  }

  /**
   * Search for models and providers
   * @param query Search query
   * @param options Search options
   * @returns Search results
   */
  async search(query: string, options: {
    limit?: number;
    offset?: number;
    filter_verified?: boolean;
    filter_capabilities?: string[];
    filter_trust_level?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  } = {}): Promise<any> {
    const params = new URLSearchParams({
      q: query,
      ...Object.fromEntries(
        Object.entries(options).map(([k, v]) => [k, String(v)])
      )
    });

    return this.makeRequest(`/api/v1/search?${params}`, {
      method: 'GET'
    });
  }

  /**
   * List public models
   * @param options Listing options
   * @returns List of public models
   */
  async listPublicModels(options: {
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  } = {}): Promise<any> {
    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(options).map(([k, v]) => [k, String(v)])
      )
    );

    return this.makeRequest(`/api/v1/public/models?${params}`, {
      method: 'GET'
    });
  }

  /**
   * Get a public model by ID
   * @param modelId Model ID
   * @returns Model information
   */
  async getPublicModel(modelId: string): Promise<any> {
    return this.makeRequest(`/api/v1/public/models/${modelId}`, {
      method: 'GET'
    });
  }

  /**
   * List public providers
   * @param options Listing options
   * @returns List of public providers
   */
  async listPublicProviders(options: {
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  } = {}): Promise<any> {
    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(options).map(([k, v]) => [k, String(v)])
      )
    );

    return this.makeRequest(`/api/v1/public/providers?${params}`, {
      method: 'GET'
    });
  }

  /**
   * Get a public provider by ID
   * @param providerId Provider ID
   * @returns Provider information
   */
  async getPublicProvider(providerId: string): Promise<any> {
    return this.makeRequest(`/api/v1/public/providers/${providerId}`, {
      method: 'GET'
    });
  }

  /**
   * Make HTTP request with retries and error handling
   * @param endpoint API endpoint path
   * @param options Fetch options
   * @returns Response data
   */
  private async makeRequest(endpoint: string, options: RequestInit): Promise<any> {
    const url = `${this.config.apiBaseUrl}${endpoint}`;
    let lastError: Error = new Error('Unknown error');

    // Add authentication header if API key is available
    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {})
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        // Add timeout to fetch options
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          let errorData: any = null;

          try {
            errorData = await response.json();
            if (errorData.detail) {
              errorMessage = errorData.detail;
            } else if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (e) {
            // Unable to parse error response, use status text
          }

          throw new ModelSignatureError(
            errorMessage,
            'HTTP_ERROR',
            response.status
          );
        }

        const data = await response.json();
        return data;

      } catch (error) {
        lastError = error as Error;

        // Don't retry client errors (4xx) or non-retryable errors
        if (error instanceof ModelSignatureError && error.statusCode && error.statusCode < 500) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === this.config.retries) {
          break;
        }

        // Wait before retrying with exponential backoff
        const delay = getBackoffDelay(attempt);
        await sleep(delay);
      }
    }

    // If we get here, all retries failed
    throw new ModelSignatureError(
      `Request failed after ${this.config.retries + 1} attempts: ${lastError.message}`,
      'REQUEST_FAILED'
    );
  }

  /**
   * Get API configuration
   */
  getConfig(): ModelSignatureConfigRequired {
    return { ...this.config };
  }

  /**
   * Update API configuration
   */
  updateConfig(config: Partial<ModelSignatureConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }
}