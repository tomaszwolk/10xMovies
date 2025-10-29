/// <reference types="vite/client" />

interface ImportMetaEnv {
  // add app-specific env vars here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
