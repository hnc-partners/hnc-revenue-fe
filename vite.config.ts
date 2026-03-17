import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { resolve } from 'path';
import { createHncProxy, hncBuildConfig, HNC_SHARED_DEPS } from '@hnc-partners/vite-config';

const isProduction = process.env.NODE_ENV === 'production';

// https://vite.dev/config/
export default defineConfig({
  // Production base URL for MF chunk resolution
  base: isProduction
    ? 'https://hncms-revenue-fe.scarif-0.duckdns.org/'
    : '/',
  plugins: [
    react(),
    // Only enable Module Federation for production builds
    // In dev mode, run as standalone app (faster, simpler)
    ...(isProduction ? [
      federation({
        name: 'revenue',
        filename: 'remoteEntry.js',
        exposes: {
          './App': './src/App.tsx',
          './RevenuePage': './src/features/revenue/components/RevenuePage.tsx',
        },
        shared: HNC_SHARED_DEPS,
      }),
      // Inject CSS into remoteEntry.js for MF loading
      cssInjectedByJsPlugin({
        jsAssetsFilterFunction: (outputChunk) => outputChunk.fileName === 'remoteEntry.js',
      }),
    ] : []),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5177,
    host: true,
    proxy: createHncProxy({ crossServices: ['report-management'] }),
  },
  build: {
    ...hncBuildConfig(isProduction),
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        manualChunks: {
          'route-tree': ['./src/routeTree.gen.ts'],
          'tanstack-router': ['@tanstack/react-router'],
        },
      },
    },
  },
});
