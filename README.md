# ModelSignature JavaScript SDK

[![npm version](https://img.shields.io/npm/v/@modelsignature/sdk.svg)](https://www.npmjs.com/package/@modelsignature/sdk)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Cryptographic identity verification for AI models — like SSL certificates for AI conversations.**

ModelSignature provides a comprehensive JavaScript/TypeScript SDK for AI model identity verification, policy enforcement, and community trust features. Prove your AI model's identity with cryptographically secure verification links.

## Features

### Core Verification System
- **Cryptographic Verification**: Generate secure identity proofs for your AI models
- **JWT Token Parsing**: Client-side JWT token inspection and validation
- **Response Hashing**: SHA256 utilities for response integrity verification

### Advanced Security Features ✨
- **Policy Enforcement**: Configurable security policies with fail-closed/fail-open modes
- **JWT Token Binding**: Enhanced tokens with deployment_id and model_digest claims
- **Token Validation**: Client-side validation utilities for security checks
- **Response Binding**: Cryptographically bind tokens to specific model outputs

### Developer Experience
- **TypeScript Support**: Full type definitions and IntelliSense support
- **Modern JavaScript**: ES6+ with async/await support
- **Comprehensive Error Handling**: Detailed error types with structured information
- **Zero Dependencies**: Lightweight with minimal external dependencies

## Installation

```bash
npm install @modelsignature/sdk
```

Or with yarn:
```bash
yarn add @modelsignature/sdk
```

Supports Node.js 16+ and modern browsers.

## Quick Start

### Basic JWT Token Verification

```typescript
import { ModelSignatureClient, parseJWT, isTokenExpired } from '@modelsignature/sdk';

const client = new ModelSignatureClient({
  baseURL: 'https://api.modelsignature.com'
});

// Parse JWT token (client-side inspection)
const claims = parseJWT(jwtToken);
console.log('Model ID:', claims?.model_id);
console.log('Deployment ID:', claims?.deployment_id);

// Check token status
if (isTokenExpired(jwtToken)) {
  console.log('Token has expired');
}

// Verify token with API
const verification = await client.verifyToken(jwtToken);
if (verification.valid) {
  console.log('Token is valid!');
  console.log('Provider:', verification.provider?.name);
  console.log('Model:', verification.model?.name);
}
```

### Policy Enforcement for Security Validation

```typescript
import { 
  PolicyEnforcer, PolicyConfig, 
  createSecurePolicy, createLenientPolicy,
  PolicyViolationError 
} from '@modelsignature/sdk';

// Create a secure policy for production use
const enforcer = createSecurePolicy(client);

// Or create a custom policy
const customPolicy: PolicyConfig = {
  requireDeploymentId: true,        // Require mTLS deployment identity
  requireModelDigest: true,         // Require model digest verification
  requireBundleVerification: true,  // Require sigstore bundle verification
  allowedProviders: ['trusted-provider-id'],
  maxTokenAge: 300,                 // 5 minutes
  failClosed: true,                 // Throw on policy violations
};
const customEnforcer = new PolicyEnforcer(client, customPolicy);

// Enforce policy on JWT tokens
try {
  const result = await enforcer.enforcePolicy(jwtToken);
  if (result.allowed) {
    console.log('Token passed all security checks');
    console.log('Deployment ID:', result.verification.claims?.deploymentId);
    console.log('Model Digest:', result.verification.claims?.modelDigest);
  } else {
    console.log('Policy violations:', result.reasons);
  }
} catch (error) {
  if (error instanceof PolicyViolationError) {
    console.log('Security policy failed:', error.violations);
  }
}
```

### JWT Token Utilities

```typescript
import { 
  parseJWT, isTokenExpired, getTokenAge, 
  isValidTokenFormat, hashOutput 
} from '@modelsignature/sdk';

// Parse JWT token claims (client-side inspection)
const claims = parseJWT(jwtToken);
console.log('Model ID:', claims?.model_id);
console.log('Provider ID:', claims?.provider_id);
console.log('Deployment ID:', claims?.deployment_id || 'None');

// Check token status
if (isTokenExpired(jwtToken)) {
  console.log('Token has expired');
}

const age = getTokenAge(jwtToken);
console.log(`Token age: ${age} seconds`);

// Validate token format
if (!isValidTokenFormat(jwtToken)) {
  console.log('Invalid JWT token format');
}

// Hash model output for response binding
const responseText = "This is the model's response.";
const responseHash = hashOutput(responseText);
console.log('Response hash:', responseHash);
```

### Response Binding

```typescript
// Hash model response for cryptographic binding
const responseText = "This is the model's response to bind cryptographically.";
const responseHash = hashOutput(responseText);

console.log('Response SHA256:', responseHash);

// Note: Response binding API endpoint integration would go here
// This demonstrates the hashing utility for client-side binding preparation
```

### Convenience Functions

```typescript
import { ModelSignature } from '@modelsignature/sdk';

// Alternative import style
const client = new ModelSignature.Client({
  baseURL: 'https://api.modelsignature.com'
});

// Create policies using convenience functions
const secureEnforcer = ModelSignature.createSecurePolicy(client);
const lenientEnforcer = ModelSignature.createLenientPolicy(client);

// Use utility functions
const tokenAge = ModelSignature.utils.getTokenAge(jwtToken);
const isExpired = ModelSignature.utils.isTokenExpired(jwtToken);
```

## API Reference

### ModelSignatureClient

The main client class for interacting with the ModelSignature API.

```typescript
interface ModelSignatureConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

class ModelSignatureClient {
  constructor(config?: ModelSignatureConfig);
  
  // JWT token verification
  async verifyToken(token: string): Promise<VerificationResult>;
  
  // Make raw API requests
  async request(method: string, endpoint: string, data?: any): Promise<any>;
}
```

### PolicyEnforcer

Policy enforcement engine for JWT token validation.

```typescript
interface PolicyConfig {
  requireDeploymentId?: boolean;
  requireModelDigest?: boolean;  
  requireBundleVerification?: boolean;
  allowedProviders?: string[];
  allowedModels?: string[];
  maxTokenAge?: number;
  failClosed?: boolean;
}

class PolicyEnforcer {
  constructor(client: ModelSignatureClient, config?: PolicyConfig);
  
  async enforcePolicy(token: string): Promise<PolicyResult>;
  async verifyToken(token: string): Promise<VerificationResult>;
  updateConfig(config: PolicyConfig): void;
  getConfig(): PolicyConfig;
  
  quickCheck(
    token: string,
    options?: {
      requireDeployment?: boolean;
      requireDigest?: boolean;
      maxAge?: number;
      allowedProviders?: string[];
    }
  ): Promise<boolean>;
}
```

### Utility Functions

```typescript
// JWT parsing and validation
function parseJWT(token: string): JWTClaims | null;
function isTokenExpired(token: string): boolean | null;
function getTokenAge(token: string): number | null;
function isValidTokenFormat(token: string): boolean;

// Cryptographic utilities
function hashOutput(responseText: string): string;

// Policy creation helpers
function createSecurePolicy(client: ModelSignatureClient): PolicyEnforcer;
function createLenientPolicy(client: ModelSignatureClient): PolicyEnforcer;
```

### Type Definitions

```typescript
interface JWTClaims {
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

interface VerificationResult {
  valid: boolean;
  claims?: JWTClaims;
  model?: ModelInfo;
  provider?: ProviderInfo;
  bundleCheck?: BundleCheck;
  error?: string;
}

interface PolicyResult {
  allowed: boolean;
  reasons: string[];
  verification: VerificationResult;
}
```

## Error Handling

The SDK provides specific error classes for better error handling:

```typescript
import { ModelSignatureError, PolicyViolationError } from '@modelsignature/sdk';

try {
  const result = await enforcer.enforcePolicy(token);
  // Handle success
} catch (error) {
  if (error instanceof PolicyViolationError) {
    console.log('Policy violations:', error.violations);
    // Handle policy enforcement failure
  } else if (error instanceof ModelSignatureError) {
    console.log('API error:', error.message);
    // Handle general API errors
  } else {
    console.log('Unknown error:', error);
    // Handle unexpected errors
  }
}
```

### Error Types

| Error Class | Description | When Thrown |
|-------------|-------------|-------------|
| `ModelSignatureError` | Base error class | API request failures |
| `PolicyViolationError` | Security policy violation | Policy enforcement failures in fail-closed mode |

## Advanced Usage

### Custom Configuration

```typescript
const client = new ModelSignatureClient({
  baseURL: 'https://api.modelsignature.com',  // Custom API endpoint
  timeout: 30000,                             // 30 second timeout
  headers: {                                  // Custom headers
    'User-Agent': 'MyApp/1.0.0'
  }
});
```

### Policy Enforcement Patterns

```typescript
// Production security policy
const productionEnforcer = createSecurePolicy(client, {
  maxTokenAge: 300,                    // 5 minutes
  allowedProviders: ['trusted-ai-co'], // Specific providers only
  failClosed: true                     // Throw on violations
});

// Development policy
const devEnforcer = createLenientPolicy(client, {
  maxTokenAge: 3600,    // 1 hour
  failClosed: false     // Log violations but don't throw
});

// Custom middleware integration
async function validateAIResponse(token: string, response: string) {
  const result = await productionEnforcer.enforcePolicy(token);
  
  if (!result.allowed) {
    throw new Error(`Security check failed: ${result.reasons.join(', ')}`);
  }
  
  // Verify response integrity if bound
  if (result.verification.claims?.bound_to_response) {
    const expectedHash = result.verification.claims.response_hash;
    const actualHash = hashOutput(response);
    
    if (expectedHash !== actualHash) {
      throw new Error('Response integrity check failed');
    }
  }
  
  return result;
}
```

## Browser Support

The SDK works in modern browsers and Node.js environments:

- **Node.js**: 16.0.0+
- **Chrome**: 60+
- **Firefox**: 60+
- **Safari**: 12+
- **Edge**: 79+

For older browser support, use a polyfill for `crypto.subtle` if using cryptographic features.

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Type check
npm run type-check
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Links

- [ModelSignature Website](https://modelsignature.com)
- [API Documentation](https://docs.modelsignature.com)  
- [Python SDK](https://github.com/ModelSignature/python-sdk)
- [npm Package](https://www.npmjs.com/package/@modelsignature/sdk)