export const AUTH_ONBOARDING_REQUIRED_EVENT = "auth:onboarding-required";

export function emitOnboardingRequired(): void {
  window.dispatchEvent(new Event(AUTH_ONBOARDING_REQUIRED_EVENT));
}

