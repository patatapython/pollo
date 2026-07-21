import { defineConfig, configDefaults } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: [],
    // An ignored local directory holds full checkouts of this repo. Without
    // this, their tests resolve `@` to the root source instead of their own.
    exclude: [
      ...configDefaults.exclude,
      '**/.claude/**',
      // Needs a real PostgreSQL. Runs via `npm run test:db`.
      '**/__tests__/integration/**',
    ],
  },
});
