declare module "*.css"
declare module "*.scss"
declare module "*.sass"
declare module "*.png"
declare module "*.jpg"
declare module "*.jpeg"
declare module "*.svg"
declare module "*.gif"
declare module "*.webp"

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}