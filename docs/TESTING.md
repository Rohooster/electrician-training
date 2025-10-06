# Testing & Logging Guide

Comprehensive testing and logging infrastructure for the CA Electrician Exam Prep application.

## Table of Contents

- [Logging](#logging)
- [Unit Tests](#unit-tests)
- [Integration Tests](#integration-tests)
- [E2E Tests](#e2e-tests)
- [Running Tests](#running-tests)
- [Coverage](#coverage)

---

## Logging

### Architecture

We use a structured logging system with contextual metadata for extreme debugging clarity.

**Logger Features:**
- Color-coded console output (server and client)
- Structured metadata with timestamps
- Log levels: DEBUG, INFO, WARN, ERROR
- Performance timing utilities
- Contextual child loggers
- Production-ready error tracking integration

### Usage

#### Basic Logging

```typescript
import { createLogger } from '@/lib/logger';

const logger = createLogger({ component: 'MyComponent' });

// Different log levels
logger.debug('Debugging info', { data: 'some value' });
logger.info('Informational message', { userId: 'user-123' });
logger.warn('Warning message', { reason: 'low memory' });
logger.error('Error occurred', error, { context: 'additional info' });
```

#### Contextual Logging

```typescript
// Create a logger with persistent context
const logger = createLogger({
  component: 'AdminRouter',
  action: 'createItem',
});

// All logs from this logger will include the context
logger.info('Starting operation'); // [AdminRouter] [createItem] Starting operation
```

#### Performance Timing

```typescript
const result = await logger.time('Database query', async () => {
  return await prisma.item.findMany();
});
// Logs: "Completed: Database query" with duration in ms
```

#### Server-Side Logging (tRPC)

```typescript
import { createLogger } from '@/lib/logger';
import { withLogging } from '../utils/trpc-logger';

const logger = createLogger({ component: 'AdminRouter' });

export const adminRouter = createTRPCRouter({
  createItem: adminProcedure
    .input(itemSchema)
    .mutation(async ({ ctx, input }) => {
      return withLogging(
        'createItem',
        ctx.session.user.id,
        async () => {
          logger.info('Creating new item', { topic: input.topic });
          const item = await ctx.prisma.item.create({ data: input });
          logger.info('Item created', { itemId: item.id });
          return item;
        },
        input
      );
    }),
});
```

#### Client-Side Logging (React)

```typescript
import { createLogger } from '@/lib/logger';

const logger = createLogger({ component: 'AdminItemsPage' });

export default function ItemsPage() {
  useEffect(() => {
    logger.info('Page mounted');
  }, []);

  const { data } = trpc.admin.listItems.useQuery(
    { filters },
    {
      onSuccess: (data) => {
        logger.debug('Items loaded', { count: data.items.length });
      },
      onError: (error) => {
        logger.error('Failed to load items', error, { filters });
      },
    }
  );

  const handleDelete = (id: string) => {
    logger.warn('User initiating delete', { itemId: id });
    // ... deletion logic
  };
}
```

### Log Output Examples

**Console Output:**
```
[2025-10-06T10:30:15.123Z] [INFO] [AdminRouter] [createItem] Creating new item
  Data: { topic: 'conductor_sizing', difficulty: 'MEDIUM' }
[2025-10-06T10:30:15.234Z] [INFO] [tRPC] [createItem] Execute createItem completed (111ms)
[2025-10-06T10:30:15.235Z] [INFO] [AdminRouter] [createItem] Item created
  Data: { itemId: 'clt123abc' }
```

### Production Monitoring

In production, ERROR level logs are automatically sent to your monitoring service:

```typescript
// In logger.ts - add your monitoring service
private sendToMonitoring(entry: LogEntry) {
  // Example with Sentry
  Sentry.captureException(entry.error, {
    contexts: { logger: entry.context },
    extra: entry.data,
  });

  // Example with DataDog
  // datadogLogs.logger.error(entry.message, entry);
}
```

---

## Unit Tests

### Setup

Unit tests use Vitest for fast, modern testing with TypeScript support.

**Dependencies:**
```bash
npm install -D vitest @vitest/ui vitest-mock-extended @testing-library/react @testing-library/jest-dom jsdom
```

### Running Unit Tests

```bash
# Run tests once
npm run test:unit

# Watch mode (re-run on file changes)
npm run test:watch

# With coverage report
npm run test:coverage

# Interactive UI
npm run test -- --ui
```

### Test Structure

Tests are colocated with source files in `__tests__` directories:

```
src/
├── server/
│   ├── routers/
│   │   ├── admin.ts
│   │   └── __tests__/
│   │       └── admin.test.ts
├── lib/
│   ├── logger.ts
│   └── __tests__/
│       └── logger.test.ts
```

### Example Unit Test

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { adminRouter } from '../admin';
import { prisma } from '@/lib/prisma';

describe('Admin Router - listItems', () => {
  const mockPrisma = prisma as unknown as DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    mockReset(mockPrisma);
  });

  it('should list items with filters', async () => {
    // Arrange
    const mockItems = [{ id: '1', stem: 'Test question' }];
    mockPrisma.item.findMany.mockResolvedValue(mockItems);
    mockPrisma.item.count.mockResolvedValue(1);

    const caller = adminRouter.createCaller({
      session: mockSession,
      prisma: mockPrisma,
    });

    // Act
    const result = await caller.listItems({
      topic: 'conductor_sizing',
      limit: 50,
      offset: 0,
    });

    // Assert
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(mockPrisma.item.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ topic: 'conductor_sizing' }),
      })
    );
  });
});
```

### Test Coverage Goals

- **Critical paths**: 100% coverage
- **Business logic**: 90%+ coverage
- **UI components**: 70%+ coverage
- **Overall**: 80%+ coverage

---

## Integration Tests

Integration tests verify that multiple components work together correctly.

### Example Integration Test

```typescript
describe('Item Management Flow', () => {
  it('should create, update, and delete an item', async () => {
    const caller = adminRouter.createCaller({ session, prisma });

    // Create
    const created = await caller.createItem({
      jurisdictionId: 'juris-1',
      stem: 'Test question',
      // ... other fields
    });
    expect(created.id).toBeTruthy();

    // Update
    const updated = await caller.updateItem({
      id: created.id,
      data: { difficulty: 'HARD' },
    });
    expect(updated.difficulty).toBe('HARD');

    // Delete
    await caller.deleteItem({ id: created.id });

    // Verify deletion
    const items = await caller.listItems({});
    expect(items.items.find((i) => i.id === created.id)).toBeUndefined();
  });
});
```

---

## E2E Tests

End-to-end tests use Playwright to test real user workflows.

### Running E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui

# Run all tests (unit + E2E)
npm run test:all
```

### Example E2E Test

```typescript
import { test, expect } from '@playwright/test';

test('Admin can create and view items', async ({ page }) => {
  // Login
  await page.goto('/api/auth/signin');
  await page.fill('[name="email"]', 'admin@test.com');
  await page.click('button[type="submit"]');

  // Navigate to items
  await page.goto('/admin/items');
  await expect(page.locator('h1')).toContainText('Item Bank');

  // Create new item
  await page.click('text=Create Item');
  await page.fill('[name="stem"]', 'What is the minimum wire size?');
  await page.fill('[name="optionA"]', '12 AWG');
  await page.fill('[name="optionB"]', '10 AWG');
  await page.fill('[name="optionC"]', '8 AWG');
  await page.fill('[name="optionD"]', '6 AWG');
  await page.selectOption('[name="correctAnswer"]', 'A');
  await page.fill('[name="topic"]', 'conductor_sizing');
  await page.click('button[type="submit"]');

  // Verify item appears in list
  await expect(page.locator('text=What is the minimum wire size?')).toBeVisible();
});
```

---

## Running Tests

### Quick Reference

```bash
# Development workflow
npm run test:watch           # Auto-run unit tests on changes

# Pre-commit
npm run test:unit            # Run all unit tests once
npm run lint                 # Check code quality

# CI/CD Pipeline
npm run test:all             # Run all tests
npm run test:coverage        # Generate coverage report
npm run build                # Verify build succeeds

# Debugging
npm run test -- --ui         # Interactive test UI
npm run test:e2e:ui          # Interactive E2E testing
```

### CI/CD Configuration

Example GitHub Actions workflow:

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Coverage

### Viewing Coverage

```bash
# Generate HTML coverage report
npm run test:coverage

# Open coverage report in browser
open coverage/index.html
```

### Coverage Reports Include:

- **Line coverage**: % of lines executed
- **Branch coverage**: % of code branches taken
- **Function coverage**: % of functions called
- **Statement coverage**: % of statements executed

### Coverage Thresholds

Configure in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    coverage: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },
});
```

---

## Best Practices

### Logging Best Practices

1. **Use appropriate log levels**:
   - DEBUG: Detailed debugging info (dev only)
   - INFO: General informational messages
   - WARN: Warning conditions, potential issues
   - ERROR: Error events, exceptions

2. **Include context**: Always log relevant metadata
   ```typescript
   logger.info('User action', { userId, action, resource });
   ```

3. **Don't log sensitive data**: Never log passwords, tokens, PII
   ```typescript
   // BAD
   logger.info('Login attempt', { email, password });

   // GOOD
   logger.info('Login attempt', { email: email.substring(0, 3) + '***' });
   ```

4. **Use timing for performance**: Track slow operations
   ```typescript
   await logger.time('Expensive operation', async () => {
     // ... operation
   });
   ```

### Testing Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **One assertion per test**: Focus on single behavior
3. **Mock external dependencies**: Isolate units under test
4. **Test edge cases**: Empty arrays, null values, errors
5. **Descriptive test names**: Explain what is being tested

```typescript
// GOOD
it('should return empty array when no items match filter', async () => {
  // ... test
});

// BAD
it('test items', async () => {
  // ... test
});
```

---

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "Cannot find module"
```bash
# Solution: Regenerate Prisma client
npm run db:generate
```

**Issue**: Mocks not working in tests
```typescript
// Solution: Ensure mocks are defined before imports
vi.mock('@/lib/prisma', () => ({ prisma: mockDeep() }));
import { prisma } from '@/lib/prisma'; // After mock
```

**Issue**: Logs not appearing in tests
```typescript
// Solution: Remove logger mock or use spy
vi.spyOn(logger, 'info'); // Instead of vi.fn()
```

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [tRPC Testing Guide](https://trpc.io/docs/server/testing)

---

**Last Updated**: 2025-10-06
