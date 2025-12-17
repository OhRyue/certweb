export type AuthStorageKind = "local" | "session";

export const AUTH_KEYS = ["accessToken", "refreshToken", "userId", "email", "role"] as const;
export type AuthKey = (typeof AUTH_KEYS)[number];

// 로그인 유지 여부는 "토큰 키"가 아니므로 별도 키를 사용해도 무방
const REMEMBER_LOGIN_KEY = "rememberLogin";

function getStorage(kind: AuthStorageKind): Storage {
  return kind === "local" ? localStorage : sessionStorage;
}

export function getAuthItem(key: AuthKey): string | null {
  // 요구사항: localStorage → sessionStorage 순으로 조회
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

export function getAuthItemWithSource(key: AuthKey): { value: string | null; source: AuthStorageKind | null } {
  const fromLocal = localStorage.getItem(key);
  if (fromLocal) return { value: fromLocal, source: "local" };
  const fromSession = sessionStorage.getItem(key);
  if (fromSession) return { value: fromSession, source: "session" };
  return { value: null, source: null };
}

export function setAuthSessionPreference(remember: boolean): void {
  sessionStorage.setItem(REMEMBER_LOGIN_KEY, remember ? "true" : "false");
}

export function getAuthSessionPreference(): boolean {
  return sessionStorage.getItem(REMEMBER_LOGIN_KEY) === "true";
}

export function clearAuthSessionPreference(): void {
  sessionStorage.removeItem(REMEMBER_LOGIN_KEY);
}

export function clearAuthTokens(): void {
  for (const key of AUTH_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}

export function setAuthItemInStorage(kind: AuthStorageKind, key: AuthKey, value: string): void {
  const storage = getStorage(kind);
  storage.setItem(key, value);
}

export function setAuthTokens(
  kind: AuthStorageKind,
  data: Partial<Record<AuthKey, string | undefined | null>>
): void {
  const storage = getStorage(kind);

  // 토큰 저장 위치를 명확히 하기 위해 항상 양쪽의 auth 키를 정리 후 저장
  clearAuthTokens();

  for (const key of AUTH_KEYS) {
    const value = data[key];
    if (typeof value === "string" && value.length > 0) {
      storage.setItem(key, value);
    }
  }
}

export function getAccessToken(): string | null {
  return getAuthItem("accessToken");
}

export function getRefreshTokenWithSource(): { token: string | null; source: AuthStorageKind | null } {
  const { value, source } = getAuthItemWithSource("refreshToken");
  return { token: value, source };
}

