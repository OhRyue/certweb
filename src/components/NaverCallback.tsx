import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "./api/axiosConfig";
import { clearAuthSessionPreference, getAuthSessionPreference, setAuthTokens } from "../utils/authStorage";

export function NaverCallback({ onLogin }: { onLogin: () => void }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const savedState = sessionStorage.getItem("naver_oauth_state");

      if (!code || !state) {
        console.error("네이버 로그인 실패: code 또는 state가 없습니다.", { code, state });
        alert("네이버 로그인에 실패했습니다. 인증 정보를 받지 못했습니다.");
        navigate("/login");
        return;
      }

      if (state !== savedState) {
        console.error("네이버 로그인 실패: state 검증 실패", { receivedState: state, savedState });
        alert("네이버 로그인에 실패했습니다. 보안 검증에 실패했습니다.");
        sessionStorage.removeItem("naver_oauth_state");
        navigate("/login");
        return;
      }

      try {
        const loginResponse = await axios.post("/account/login/naver", {
          code,
          state,
        });

        console.log("네이버 로그인 성공:", loginResponse.data);

        const rememberLogin = getAuthSessionPreference();
        const storageKind = rememberLogin ? "local" : "session";
        setAuthTokens(storageKind, {
          accessToken: loginResponse.data.accessToken,
          refreshToken: loginResponse.data.refreshToken,
          userId: String(loginResponse.data.userId),
          email: loginResponse.data.email,
          role: loginResponse.data.role,
        });

        sessionStorage.removeItem("naver_oauth_state");
        clearAuthSessionPreference();

        onLogin();
        // 온보딩 판정은 AppInitializer에서 단일 처리
        navigate("/");
      } catch (error: any) {
        console.error("네이버 로그인 실패:", error);
        sessionStorage.removeItem("naver_oauth_state");
        clearAuthSessionPreference();
        
        const errorMessage = error.response?.data?.message || "네이버 로그인에 실패했습니다. 다시 시도해주세요.";
        alert(errorMessage);
        navigate("/login");
      }
    };

    handleCallback();
  }, [searchParams, navigate, onLogin]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">🔐</div>
        <p className="text-gray-600">네이버 로그인 중입니다...</p>
      </div>
    </div>
  );
}
