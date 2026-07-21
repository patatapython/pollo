import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Integration suite. Separate from the default config because these tests need
 * a real PostgreSQL, which `npm test` must not require: the unit suite has to
 * stay runnable on a machine with nothing installed.
 *
 * They are not optional, though. See __tests__/integration/README.md.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/integration/**/*.test.ts'],
    // One database, shared state: parallel files would truncate each other's
    // rows mid-assertion.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
