/**
 * ModelSignature JavaScript SDK - Main Client
 * Milestone 4: Client SDKs + policy enforcement
 */

import {
  ModelSignatureConfig,
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
  private config: Required<ModelSignatureConfig>;

  constructor(config: ModelSignatureConfig = {}) {
    this.config = {
      apiBaseUrl: config.apiBaseUrl || 'https://modelsignature-api-541734326273.us-central1.run.app',
      timeout: config.timeout || 10000,
      retries: config.retries || 3
    };
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
   * Make HTTP request with retries and error handling
   * @param endpoint API endpoint path
   * @param options Fetch options
   * @returns Response data
   */
  private async makeRequest(endpoint: string, options: RequestInit): Promise<any> {
    const url = `${this.config.apiBaseUrl}${endpoint}`;
    let lastError: Error;

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        // Add timeout to fetch options
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          ...options,
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
  getConfig(): Required<ModelSignatureConfig> {
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