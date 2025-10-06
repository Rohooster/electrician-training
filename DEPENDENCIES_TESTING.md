# Testing & Logging Dependencies

## Required NPM Packages

Run this command to install all testing and logging dependencies:

```bash
npm install -D vitest @vitest/ui @vitest/coverage-v8 @vitejs/plugin-react vitest-mock-extended @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @types/testing-library__jest-dom
```

## Individual Packages

### Core Testing

```bash
npm install -D vitest              # Fast unit test runner
npm install -D @vitest/ui          # Interactive test UI
npm install -D @vitest/coverage-v8 # Code coverage reporting
npm install -D @vitejs/plugin-react # React support for Vitest
```

### Testing Libraries

```bash
npm install -D @testing-library/react           # React component testing utilities
npm install -D @testing-library/jest-dom        # Custom Jest matchers for DOM
npm install -D @testing-library/user-event      # Simulate user interactions
npm install -D @types/testing-library__jest-dom # TypeScript types
```

### Mocking & Environment

```bash
npm install -D vitest-mock-extended  # Deep mocking utilities
npm install -D jsdom                 # Browser environment simulation
```

### Already Installed (from existing setup)

These are already in your project:
- `@playwright/test` - E2E testing
- `typescript` - TypeScript support
- `@types/node`, `@types/react`, `@types/react-dom` - Type definitions

## Verification

After installation, verify setup:

```bash
# Check packages are installed
npm list vitest @testing-library/react vitest-mock-extended

# Run tests to verify
npm run test:unit

# Generate coverage
npm run test:coverage
```

## Package.json Scripts

These scripts are already added to your `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test:unit && npm run test:e2e"
  }
}
```

## Optional: Monitoring Services

For production error tracking, you may want to add one of these:

### Sentry
```bash
npm install @sentry/nextjs
```

### DataDog
```bash
npm install @datadog/browser-logs
```

### LogRocket
```bash
npm install logrocket logrocket-react
```

Then update `src/lib/logger.ts` to integrate with your chosen service.

## VS Code Extension Recommendations

Add to `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "vitest.explorer",           // Vitest test explorer
    "ms-playwright.playwright",  // Playwright test runner
    "dbaeumer.vscode-eslint"     // ESLint integration
  ]
}
```

## Next Steps

1. Install dependencies: `npm install`
2. Run tests: `npm run test:unit`
3. View coverage: `npm run test:coverage && open coverage/index.html`
4. Read testing guide: `docs/TESTING.md`
