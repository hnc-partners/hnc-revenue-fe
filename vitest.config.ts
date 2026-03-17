import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { sharedVitestConfig, sharedCoverageConfig } from '@hnc-partners/fe-test-utils/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    ...sharedVitestConfig,
    passWithNoTests: false,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      ...sharedCoverageConfig,
      exclude: [
        ...(sharedCoverageConfig.exclude || []),
        'src/routeTree.gen.ts',
        'src/routes/**',
        'src/App.tsx',
        'src/main.tsx',
        'src/**/types/**',
        'src/**/index.ts',
        'src/features/revenue/api/config.ts',
      ],
    },
  },
});
