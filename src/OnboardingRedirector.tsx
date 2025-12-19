import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AUTH_ONBOARDING_REQUIRED_EVENT } from "./utils/authEvents";

/**
 * axios interceptor 등 라우터 밖 코드에서 발생한 "온보딩 필요" 신호를
 * SPA navigate로 변환하는 전역 리다이렉터.
 */
export function OnboardingRedirector() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = () => {
      if (location.pathname === "/onboarding") return;
      navigate("/onboarding", { replace: true });
    };

    window.addEventListener(AUTH_ONBOARDING_REQUIRED_EVENT, handler);
    return () => window.removeEventListener(AUTH_ONBOARDING_REQUIRED_EVENT, handler);
  }, [navigate, location.pathname]);

  return null;
}

