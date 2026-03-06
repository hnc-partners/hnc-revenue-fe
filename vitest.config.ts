import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { sharedVitestConfig, sharedCoverageConfig } from '@hnc-partners/fe-test-utils/config';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    ...sharedVitestConfig,
    passWithNoTests: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      ...sharedCoverageConfig,
      exclude: [
        ...(sharedCoverageConfig.exclude ?? []),
        'src/routeTree.gen.ts',
        'src/routes/**',
        'src/App.tsx',
        'src/main.tsx',
      ],
    },
  },
});
