# Contributing to ModelSignature JavaScript SDK

Thank you for your interest in contributing! This document provides guidelines for contributing to the ModelSignature JavaScript SDK.

## Development Setup

### Prerequisites
- Node.js 16.0.0 or higher
- npm or yarn package manager

### Getting Started

1. **Fork and clone the repository**
```bash
git clone https://github.com/your-username/javascript-sdk.git
cd javascript-sdk
```

2. **Install dependencies**
```bash
npm install
```

3. **Build the project**
```bash
npm run build
```

4. **Run tests**
```bash
npm test
```

## Development Workflow

### Code Structure
```
src/
├── client.ts      # Main ModelSignatureClient class
├── policy.ts      # Policy enforcement and JWT verification
├── utils.ts       # Utility functions (JWT parsing, hashing)
├── types.ts       # TypeScript type definitions
└── index.ts       # Main entry point and exports

tests/
├── client.test.ts # Client functionality tests
├── policy.test.ts # Policy enforcement tests
├── utils.test.ts  # Utility function tests
└── setup.ts       # Test configuration
```

### Available Scripts

- `npm run build` - Build the TypeScript project
- `npm test` - Run the test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run dev` - Build in watch mode for development

### Testing

We use Jest for testing. All new features should include comprehensive tests.

**Writing Tests:**
```typescript
import { PolicyEnforcer } from '../src/policy';

describe('PolicyEnforcer', () => {
  it('should enforce policy correctly', async () => {
    // Test implementation
  });
});
```

**Running Tests:**
```bash
# Run all tests
npm test

# Run specific test file
npm test -- policy.test.ts

# Run tests in watch mode
npm run test:watch
```

### Code Style

We use ESLint and TypeScript for code quality. Please ensure your code:

- Follows TypeScript best practices
- Includes proper type annotations
- Passes all linting checks (`npm run lint`)
- Is formatted consistently

### Making Changes

1. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**
   - Write code following the existing patterns
   - Add tests for new functionality
   - Update documentation if needed

3. **Test your changes**
```bash
npm test
npm run lint
npm run build
```

4. **Commit your changes**
```bash
git commit -m "feat: add new feature description"
```

Follow [Conventional Commits](https://conventionalcommits.org/) format:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test changes
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

5. **Push and create PR**
```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Adding New Features

### Policy Enforcement Features
When adding new policy enforcement capabilities:

1. Add the configuration option to `PolicyConfig` interface in `types.ts`
2. Implement the enforcement logic in `PolicyEnforcer` class in `policy.ts`
3. Add corresponding tests in `tests/policy.test.ts`
4. Update the README.md with examples

### JWT Utilities
When adding new JWT utility functions:

1. Add the function to `utils.ts`
2. Export it from `index.ts`
3. Add comprehensive tests in `tests/utils.test.ts`
4. Document the function with JSDoc comments

### Client Methods
When adding new client methods:

1. Add the method to `ModelSignatureClient` class in `client.ts`
2. Add appropriate TypeScript types in `types.ts`
3. Add tests in `tests/client.test.ts`
4. Update documentation

## Documentation

### Code Documentation
- Use JSDoc comments for all public methods
- Include parameter descriptions and return types
- Add usage examples for complex functions

### README Updates
When adding new features, update the README.md with:
- Feature description
- Code examples
- API reference updates

## Pull Request Guidelines

### Before Submitting
- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation is updated
- [ ] Commit messages follow conventional format

### PR Description
Please include:
- Summary of changes
- Motivation for the changes
- Any breaking changes
- Related issue numbers

### Review Process
1. Automated checks must pass (CI/CD)
2. At least one maintainer review required
3. All feedback addressed
4. Squash and merge to main branch

## Release Process

Releases are automated through GitHub Actions:

1. Update version in `package.json`
2. Create PR with version bump
3. Merge to main branch
4. GitHub Actions will automatically publish to npm

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH`
- MAJOR: Breaking changes
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes (backwards compatible)

## Getting Help

- Create an issue for bugs or feature requests
- Join discussions in existing issues
- Check the README.md for API documentation
- Review existing tests for usage examples

## Code of Conduct

Please be respectful and inclusive in all interactions. We're building software to help the AI community, and we welcome contributors from all backgrounds.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.