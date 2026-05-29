/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_FIRESTORE_EMULATOR: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
