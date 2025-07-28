# Publishing ModelSignature JavaScript SDK

This guide walks you through publishing the JavaScript SDK to its own GitHub repository and npm.

## Step 1: Create GitHub Repository

1. **Create new repository on GitHub:**
   - Go to https://github.com/new
   - Repository name: `javascript-sdk`
   - Owner: `modelsignature` (or your organization)
   - Description: "JavaScript/TypeScript SDK for ModelSignature - cryptographic identity verification for AI models"
   - Public repository
   - Don't initialize with README (we have our own)

2. **Clone the new repository:**
```bash
git clone https://github.com/modelsignature/javascript-sdk.git
cd javascript-sdk
```

## Step 2: Copy Files

Copy all files from the current location to the new repository:

```bash
# Copy all files from current location
cp -r /Users/finnmetz/Documents/rando_projects/ModelSignatureAPI/javascript-sdk/* .
cp -r /Users/finnmetz/Documents/rando_projects/ModelSignatureAPI/javascript-sdk/.* . 2>/dev/null || true

# Verify files are copied
ls -la
```

You should see:
- ✅ README.md
- ✅ package.json  
- ✅ tsconfig.json
- ✅ jest.config.js
- ✅ LICENSE
- ✅ CONTRIBUTING.md
- ✅ .gitignore
- ✅ .npmignore
- ✅ src/ directory
- ✅ tests/ directory
- ✅ .github/workflows/ directory

## Step 3: Initialize Git Repository

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Initial commit
git commit -m "feat: initial release of ModelSignature JavaScript SDK

- Complete TypeScript SDK with policy enforcement
- JWT token validation and parsing utilities
- Support for deployment identity (mTLS) validation
- Model cryptographic verification with digests and sigstore bundles
- Response binding for output integrity verification
- Comprehensive test suite with Jest
- GitHub Actions CI/CD pipeline
- Full API documentation and examples"

# Add remote origin
git remote add origin https://github.com/modelsignature/javascript-sdk.git

# Push to GitHub
git push -u origin main
```

## Step 4: Set Up npm Publishing

1. **Create npm account** (if you don't have one):
   - Go to https://www.npmjs.com/signup
   - Or use existing account

2. **Login to npm:**
```bash
npm login
```

3. **Verify package name availability:**
```bash
npm view @modelsignature/sdk
# Should return 404 if available
```

4. **Test build before publishing:**
```bash
npm install
npm run build
npm test
```

## Step 5: Publish to npm

1. **First release:**
```bash
# Make sure everything builds correctly
npm run build

# Publish to npm (public package)
npm publish --access public
```

2. **Verify publication:**
```bash
npm view @modelsignature/sdk
```

## Step 6: Set Up GitHub Actions (Optional but Recommended)

1. **Create npm token:**
   - Go to https://www.npmjs.com/settings/tokens
   - Create new token with "Automation" permissions
   - Copy the token

2. **Add npm token to GitHub secrets:**
   - Go to your GitHub repository
   - Settings → Secrets and variables → Actions
   - Add new secret: `NPM_TOKEN` with your npm token value

3. **Test automated publishing:**
   - Make a small change to package.json version (e.g., 1.0.0 → 1.0.1)
   - Commit and push to main branch
   - GitHub Actions should automatically publish the new version

## Step 7: Update Documentation References

Update any documentation that references the old location:

### In API Server README:
```markdown
### JavaScript/TypeScript SDK
```bash
npm install @modelsignature/sdk
```

- [GitHub Repository](https://github.com/modelsignature/javascript-sdk)
- [npm Package](https://www.npmjs.com/package/@modelsignature/sdk)
```

### Add to main ModelSignature docs:
Link to the new repository in any central documentation.

## Step 8: Create GitHub Release

1. **Go to GitHub repository → Releases**
2. **Create new release:**
   - Tag: `v1.0.0`
   - Title: `v1.0.0 - Initial Release`
   - Description:
   ```markdown
   ## 🎉 Initial Release of ModelSignature JavaScript SDK
   
   The JavaScript/TypeScript SDK for ModelSignature brings comprehensive AI model identity verification and policy enforcement to Node.js and browser environments.
   
   ### ✨ Features
   - **Policy Enforcement**: Configurable security policies with fail-closed/fail-open modes
   - **JWT Token Validation**: Client-side JWT parsing and verification utilities  
   - **Deployment Identity**: Support for mTLS-based deployment authorization
   - **Model Verification**: Cryptographic verification with digests and sigstore bundles
   - **Response Binding**: Bind tokens to specific model outputs for integrity verification
   - **TypeScript Support**: Full type definitions and IntelliSense support
   
   ### 📦 Installation
   ```bash
   npm install @modelsignature/sdk
   ```
   
   ### 🚀 Quick Start
   ```typescript
   import { ModelSignatureClient, createSecurePolicy } from '@modelsignature/sdk';
   
   const client = new ModelSignatureClient();
   const enforcer = createSecurePolicy(client);
   const result = await enforcer.enforcePolicy(jwtToken);
   ```
   
   See the [README](https://github.com/modelsignature/javascript-sdk/blob/main/README.md) for complete documentation and examples.
   ```

## Step 9: Verify Everything Works

1. **Test installation in a new project:**
```bash
mkdir test-sdk && cd test-sdk
npm init -y
npm install @modelsignature/sdk
```

2. **Create test file:**
```typescript
// test.ts
import { parseJWT, isValidTokenFormat } from '@modelsignature/sdk';

const testToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJtb2RlbF9pZCI6InRlc3QifQ.fake";
console.log('Valid format:', isValidTokenFormat(testToken));
console.log('Claims:', parseJWT(testToken));
```

3. **Run test:**
```bash
npx tsx test.ts  # or compile and run with tsc
```

## Maintenance Going Forward

### For new releases:
1. Update version in `package.json`
2. Commit changes to main branch  
3. GitHub Actions will automatically publish to npm
4. Create GitHub release with changelog

### For documentation updates:
1. Update README.md
2. Update any examples or API references
3. Ensure consistency with Python SDK documentation

## Success Checklist ✅

- [ ] GitHub repository created and populated
- [ ] npm package published successfully
- [ ] GitHub Actions CI/CD working
- [ ] Documentation is complete and accurate
- [ ] GitHub release created
- [ ] Package can be installed and used
- [ ] All tests pass in CI/CD
- [ ] Links updated in other documentation

Congratulations! Your JavaScript SDK is now live and ready for the community to use! 🎉