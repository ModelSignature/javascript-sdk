// Quick test to debug the quickCheck issue
const { PolicyEnforcer } = require('./dist/policy');
const { ModelSignatureClient } = require('./dist/client');

// Mock fetch
global.fetch = jest.fn();

const client = new ModelSignatureClient();
const enforcer = new PolicyEnforcer(client);

// Test the logic
console.log('Testing quickCheck logic...');

// Mock response
global.fetch.mockResolvedValueOnce({
  ok: true,
  json: async () => ({
    valid: true,
    claims: {
      model_id: 'test-model',
      provider_id: 'test-provider',
      user_fp: 'test-fp',
      deployment_id: 'test-deployment',
      iat: Math.floor(Date.now() / 1000) - 60,
      exp: Math.floor(Date.now() / 1000) + 840,
      jti: 'test-jti'
    }
  })
});

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtb2RlbF9pZCI6InRlc3QtbW9kZWwiLCJwcm92aWRlcl9pZCI6InRlc3QtcHJvdmlkZXIiLCJ1c2VyX2ZwIjoidGVzdC1mcCIsImRlcGxveW1lbnRfaWQiOiJ0ZXN0LWRlcGxveW1lbnQiLCJpYXQiOjE2NDE0ODEyMDAsImV4cCI6MTY0MTQ4MTIwMCwianRpIjoidGVzdC1qdGkifQ.test';

enforcer.quickCheck(token, { requireDeployment: true })
  .then(result => {
    console.log('Result:', result);
  })
  .catch(error => {
    console.log('Error:', error);
  });