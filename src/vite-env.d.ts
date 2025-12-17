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
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_KAKAO_JS_KEY: string
  readonly VITE_NAVER_CLIENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Google Identity Services 타입 선언
interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
      }) => void;
      prompt: (notification?: { type: 'display' | 'skip' }) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
    Kakao?: any;
  }
}