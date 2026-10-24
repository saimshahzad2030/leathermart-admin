/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly API_URL?: string;
  readonly API_REFRESH_URL?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_API_REFRESH_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
