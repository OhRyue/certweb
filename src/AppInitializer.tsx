import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "./components/api/axiosConfig";
import InnerApp from "./InnerApp";

type ProfileResponse = {
  onboardingCompleted?: boolean;
  userId?: string;
  nickname?: string;
  skinId?: number;
};

export function AppInitializer({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const profileRes = await axios.get("/account/profile");
        const nextProfile = profileRes.data as ProfileResponse;

        if (cancelled) return;
        setProfile(nextProfile);

        // 서버의 onboardingCompleted 필드만을 유일한 기준으로 사용
        if (nextProfile.onboardingCompleted === false || nextProfile.onboardingCompleted == null) {
          navigate("/onboarding", { replace: true });
          return;
        }
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

