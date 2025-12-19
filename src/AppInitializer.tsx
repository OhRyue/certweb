import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "./components/api/axiosConfig";
import InnerApp from "./InnerApp";

type ProfileResponse = {
  userId?: string;
  nickname?: string;
  skinId?: number;
};

type OnboardingStatusResponse = {
  completed: boolean;
  completedAt?: string;
  nextStep?: string;
  emailVerified?: boolean;
  nicknameSet?: boolean;
  goalSelected?: boolean;
  settingsReady?: boolean;
};

export function AppInitializer({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // 1) 온보딩 완료 여부는 onboarding status API의 completed로만 판단
        const statusRes = await axios.get("/account/onboarding/status");
        const status = statusRes.data as OnboardingStatusResponse;

        if (cancelled) return;
        if (!status?.completed) {
          navigate("/onboarding", { replace: true });
          return;
        }

        // 2) 온보딩 완료 상태인 경우에만 메인 진입용 프로필을 1회 조회
        const profileRes = await axios.get("/account/profile");
        const nextProfile = profileRes.data as ProfileResponse;
        if (cancelled) return;
        setProfile(nextProfile);
      } catch (err: any) {
        // 프로필 조회가 401이면 로그인 세션 문제로 판단하고 로그아웃 처리
        if (!cancelled) {
          if (err?.response?.status === 401) {
            onLogout();
            navigate("/login", { replace: true });
            return;
          }
        }
      } finally {
        if (!cancelled) setIsCheckingProfile(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [navigate, onLogout]);

  if (isCheckingProfile) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">프로필 확인 중...</p>
        </div>
      </div>
    );
  }

  // 프로필을 받았고, 온보딩 완료 상태면 메인 앱 렌더
  return <InnerApp onLogout={onLogout} initialProfile={profile} />;
}

