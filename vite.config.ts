import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import { federation } from '@module-federation/vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { resolve } from 'path';
import { createHncProxy, hncBuildConfig, HNC_SHARED_DEPS } from '@hnc-partners/vite-config';

const isProduction = process.env.NODE_ENV === 'production';

// TODO: Replace with actual service name
const SERVICE_NAME = 'SERVICE_NAME';
const SERVICE_PORT = 5173; // TODO: Get from port-registry.md

// https://vite.dev/config/
export default defineConfig({
  // Production base URL for MF chunk resolution
  base: isProduction
    ? `https://hncms-${SERVICE_NAME}-fe.scarif-0.duckdns.org/`
    : '/',
  plugins: [
    TanStackRouterVite(),
    react(),
    // Only enable Module Federation for production builds
    // In dev mode, run as standalone app (faster, simpler)
    ...(isProduction ? [
      federation({
        name: SERVICE_NAME,
        filename: 'remoteEntry.js',
        exposes: {
          './App': './src/App.tsx',
          // TODO: Add exposed components
        },
        shared: HNC_SHARED_DEPS,
      }),
      // Inject CSS into remoteEntry.js for MF loading
      cssInjectedByJsPlugin({
        jsAssetsFilterFunction: (outputChunk) =>
          outputChunk.fileName === 'remoteEntry.js',
      }),
    ] : []),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: SERVICE_PORT,
    host: true,
    proxy: createHncProxy({ service: SERVICE_NAME as any }),
  },
  build: hncBuildConfig(isProduction),
});
