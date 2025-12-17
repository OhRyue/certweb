export const AUTH_ONBOARDING_REQUIRED_EVENT = "auth:onboarding-required";

export function emitOnboardingRequired(): void {
  window.dispatchEvent(new Event(AUTH_ONBOARDING_REQUIRED_EVENT));
}

/**
 * 멀티 탭 인증 이벤트(로그아웃 동기화)용 localStorage 키
 *
 * - storage 이벤트는 "다른 탭"에서만 발생하므로,
 *   한 탭에서 로그아웃 시 다른 탭들이 즉시 감지해 토큰 정리 + /login 이동을 수행할 수 있다.
 */
export const AUTH_EVENT_STORAGE_KEY = "auth:event";

export type AuthEventPayload = {
  type: "logout";
  timestamp: number;
};

export function emitAuthLogoutEvent(): void {
  const payload: AuthEventPayload = {
    type: "logout",
    timestamp: Date.now(),
  };

  // storage 이벤트 트리거를 위해 localStorage에 기록
  localStorage.setItem(AUTH_EVENT_STORAGE_KEY, JSON.stringify(payload));
}

