/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_IMAGE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
