/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_URL: string;
  readonly VITE_REPORT_MANAGEMENT_API_URL: string;
  readonly VITE_MOCK_AUTH: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Shell detection for Module Federation
declare global {
  interface Window {
    __SHELL__?: boolean;
  }
}

export {};
