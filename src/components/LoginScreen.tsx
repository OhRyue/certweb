import { motion } from "motion/react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "./api/axiosConfig"
import { setAuthSessionPreference, setAuthTokens } from "../utils/authStorage";

// Google Identity Services 타입 선언 (vite-env.d.ts의 타입이 인식되지 않는 경우를 대비)
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          prompt: (notification?: { type: 'display' | 'skip' }) => void;
        };
      };
    };
    Kakao?: any;
  }
}

export function LoginScreen({ onLogin }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberLogin, setRememberLogin] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showExpiredAlert, setShowExpiredAlert] = useState(false);
  const [isGoogleSDKReady, setIsGoogleSDKReady] = useState(false);
  const [isKakaoSDKReady, setIsKakaoSDKReady] = useState(false);

  // URL 파라미터에서 만료 메시지 확인
  useEffect(() => {
    const reason = searchParams.get("reason");
    if (reason === "expired") {
      setShowExpiredAlert(true);
      // 3초 후 자동으로 alert 숨기기
      const timer = setTimeout(() => setShowExpiredAlert(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams])

  // Google 로그인 콜백
  const handleGoogleLogin = useCallback(async (response: { credential: string }) => {
    try {
      const idToken = response.credential;

      if (!idToken) {
        alert("Google 로그인에 실패했습니다. id_token을 받지 못했습니다.");
        return;
      }

      // 백엔드로 id_token 전송
      const loginResponse = await axios.post("/account/login/google", {
        idToken: idToken,
      });

      console.log("Google 로그인 성공:", loginResponse.data);

      // 토큰 저장 (체크 시 localStorage, 미체크 시 sessionStorage)
      const storageKind = rememberLogin ? "local" : "session";
      setAuthSessionPreference(rememberLogin);
      setAuthTokens(storageKind, {
        accessToken: loginResponse.data.accessToken,
        refreshToken: loginResponse.data.refreshToken,
        userId: String(loginResponse.data.userId),
        email: loginResponse.data.email,
        role: loginResponse.data.role,
      });

      // 로그인 성공 시 온보딩 완료 여부 확인
      onLogin();
      // 온보딩 판정은 AppInitializer에서 단일 처리
      navigate("/");
    } catch (error: unknown) {
      console.error("Google 로그인 실패:", error);
      alert("Google 로그인에 실패했습니다. 다시 시도해주세요.");
    }
  }, [navigate, onLogin, rememberLogin]);

  // Google SDK 초기화
  useEffect(() => {
    const initializeGoogleSDK = () => {
      if (window.google?.accounts?.id) {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID);
        console.log(window.location.origin);
        
        if (!clientId) {
          console.error("VITE_GOOGLE_CLIENT_ID 환경 변수가 설정되지 않았습니다.");
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleLogin,

          use_fedcm_for_prompt: false,
        });

        setIsGoogleSDKReady(true);
      } else {
        // SDK가 아직 로드되지 않았으면 잠시 후 재시도
        setTimeout(initializeGoogleSDK, 100);
      }
    };

    initializeGoogleSDK();
  }, [handleGoogleLogin]);

  // Google 로그인 버튼 클릭 핸들러
  const handleGoogleLoginClick = () => {
    if (!isGoogleSDKReady) {
      alert("Google 로그인 서비스가 준비되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    const currentOrigin = window.location.origin;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    console.log("🔍 [Google Login] 현재 Origin:", currentOrigin);
    console.log("🔍 [Google Login] Client ID:", clientId);
    console.log("🔍 [Google Login] 전체 URL:", window.location.href);

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      alert("Google 로그인 서비스를 사용할 수 없습니다.");
    }
  };

  // 카카오 로그인 콜백
  const handleKakaoLogin = useCallback(async (accessToken: string) => {
    try {
      if (!accessToken) {
        alert("카카오 로그인에 실패했습니다. access_token을 받지 못했습니다.");
        return;
      }

      const loginResponse = await axios.post("/account/login/kakao", {
        accessToken: accessToken,
      });

      console.log("카카오 로그인 성공:", loginResponse.data);

      const storageKind = rememberLogin ? "local" : "session";
      setAuthSessionPreference(rememberLogin);
      setAuthTokens(storageKind, {
        accessToken: loginResponse.data.accessToken,
        refreshToken: loginResponse.data.refreshToken,
        userId: String(loginResponse.data.userId),
        email: loginResponse.data.email,
        role: loginResponse.data.role,
      });

      onLogin();
      // 온보딩 판정은 AppInitializer에서 단일 처리
      navigate("/");
    } catch (error: unknown) {
      console.error("카카오 로그인 실패:", error);
      alert("카카오 로그인에 실패했습니다. 다시 시도해주세요.");
    }
  }, [navigate, onLogin, rememberLogin]);

  // 카카오 SDK 초기화
  useEffect(() => {
    const initializeKakaoSDK = () => {
      if (window.Kakao) {
        if (!window.Kakao.isInitialized()) {
          const jsKey = import.meta.env.VITE_KAKAO_JS_KEY;
          
          if (!jsKey) {
            console.error("VITE_KAKAO_JS_KEY 환경 변수가 설정되지 않았습니다.");
            return;
          }

          window.Kakao.init(jsKey);
        }

        setIsKakaoSDKReady(true);
      } else {
        setTimeout(initializeKakaoSDK, 100);
      }
    };

    initializeKakaoSDK();
  }, []);

  // 카카오 로그인 버튼 클릭 핸들러
  const handleKakaoLoginClick = () => {
    if (!isKakaoSDKReady) {
      alert("카카오 로그인 서비스가 준비되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    if (window.Kakao) {
      window.Kakao.Auth.login({
        success: (authObj: any) => {
          const accessToken = authObj.access_token;
          if (accessToken) {
            handleKakaoLogin(accessToken);
          } else {
            alert("카카오 로그인에 실패했습니다. access_token을 받지 못했습니다.");
          }
        },
        fail: (err: any) => {
          console.error("카카오 로그인 실패:", err);
          alert("카카오 로그인에 실패했습니다. 다시 시도해주세요.");
        },
        scope: "profile_nickname",
      });
    } else {
      alert("카카오 로그인 서비스를 사용할 수 없습니다.");
    }
  };

  // 네이버 로그인 버튼 클릭 핸들러
  const handleNaverLoginClick = () => {
    const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;
    
    if (!clientId) {
      console.error("VITE_NAVER_CLIENT_ID 환경 변수가 설정되지 않았습니다.");
      alert("네이버 로그인 서비스를 사용할 수 없습니다.");
      return;
    }

    const state = crypto.randomUUID();
    sessionStorage.setItem("naver_oauth_state", state);
    // 네이버 OAuth 콜백에서 사용할 로그인 유지 설정 저장
    setAuthSessionPreference(rememberLogin);

    const redirectUri = window.location.origin === "http://localhost:3000"
      ? "http://localhost:3000/oauth/naver"
      : "https://mycertpilot.com/oauth/naver";

    const naverAuthUrl = "https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=" + clientId + "&redirect_uri=" + encodeURIComponent(redirectUri) + "&state=" + state;

    window.location.href = naverAuthUrl;
  };

  const features = [
    {
      icon: "📚",
      title: "체계적 학습",
      description: "Micro/Review 모드로 효율적 학습",
      color: "from-blue-400 to-cyan-400"
    },
    {
      icon: "🎯",
      title: "맞춤 학습",
      description: "난이도별, 약점 보완 퀴즈",
      color: "from-sky-400 to-blue-400"
    },
    {
      icon: "⚔️",
      title: "배틀 모드",
      description: "친구와 겨루며 재미있게 학습",
      color: "from-cyan-400 to-teal-400"
    },
    {
      icon: "📊",
      title: "학습 리포트",
      description: "나의 학습 현황을 한눈에",
      color: "from-blue-500 to-indigo-500"
    }
  ];

  const categories = [
    { name: "정보처리기사", icon: "💻", count: "100+ 문제" },
    { name: "컴퓨터활용능력", icon: "🇺🇸", count: "현재 준비 중 ..." },
    { name: "SQLD", icon: "💰", count: "현재 준비 중 ..." },
    { name: "리눅스마스터", icon: "⚖️", count: "현재 준비 중 ..." }
  ];


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await axios.post("/account/login", {
        userId,
        password
      })

      console.log("로그인 성공:", response.data)

      // 토큰 저장 (체크 시 localStorage, 미체크 시 sessionStorage)
      const storageKind = rememberLogin ? "local" : "session";
      setAuthSessionPreference(rememberLogin);
      setAuthTokens(storageKind, {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        userId: String(response.data.userId),
        email: response.data.email,
        role: response.data.role,
      });

      // 로그인 성공 시 온보딩 완료 여부 확인
      onLogin()
      
      // 온보딩 판정은 AppInitializer에서 단일 처리
      navigate("/")
    } catch (error: unknown) {
      console.error("로그인 실패:", error)
      alert("아이디 또는 비밀번호가 올바르지 않습니다")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/assets/ui/logo.png" 
              alt="CertPilot Logo" 
              className="h-12 w-auto cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate("/login")}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Hero Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Hero */}
            <div className="mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Badge className="bg-blue-100 text-blue-700 mb-4">
                  AI 기반 학습 플랫폼
                </Badge>
                <h1 className="text-5xl text-blue-900 mb-4">
                  자격증 합격,<br />
                  <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    더 쉽고 재미있게
                  </span> ✨
                </h1>
                <p className="text-xl text-gray-600 mb-6">
                  체계적인 학습 시스템과 AI 해설로<br />
                  자격증 준비를 완벽하게 지원합니다
                </p>
              </motion.div>
            </div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-12"
            >
              <h2 className="text-blue-900 mb-6">🎯 주요 기능</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <Card className="p-4 hover:shadow-lg transition-shadow bg-white/60 backdrop-blur">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${feature.color} flex-shrink-0`}>
                          <div className="text-2xl">{feature.icon}</div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-blue-900 mb-1">{feature.title}</h3>
                          <p className="text-sm text-gray-600">{feature.description}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Categories */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <h2 className="text-blue-900 mb-6">📚 지원 자격증</h2>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category, index) => (
                  <Card
                    key={index}
                    className="p-4 bg-white/60 backdrop-blur hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl group-hover:scale-110 transition-transform">
                        {category.icon}
                      </div>
                      <div>
                        <div className="text-blue-900">{category.name}</div>
                        <div className="text-sm text-gray-600">{category.count}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Login/Signup Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:sticky lg:top-24"
          >
            <Card className="p-8 bg-white/80 backdrop-blur border-2 border-blue-200 shadow-xl">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">🎓</div>
                <h2 className="text-blue-900 mb-2">로그인</h2>
                <p className="text-gray-600">학습을 계속하려면 로그인하세요</p>
              </div>

              {/* 토큰 만료 알림 */}
              {showExpiredAlert && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4"
                >
                  <Alert variant="destructive" className="border-orange-400 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      로그인 세션이 만료되었습니다. 다시 로그인해주세요.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-700 mb-2 block">아이디</label>
                  <Input
                    type="text"
                    placeholder="아이디를 입력하세요"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="bg-white border-blue-200 focus:border-blue-400"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-700 mb-2 block">비밀번호</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white border-blue-200 focus:border-blue-400"
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-blue-300"
                      checked={rememberLogin}
                      onChange={(e) => setRememberLogin(e.target.checked)}
                    />
                    로그인 상태 유지
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate("/forgotPassword")}
                    className="text-blue-600 hover:underline"
                  >
                    비밀번호 찾기
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-6"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  로그인하기
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">또는</span>
                  </div>
                </div>

                {/* Social Login */}
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-2 hover:bg-gray-50"
                    onClick={handleGoogleLoginClick}
                  >
                    <img
                      src="/assets/ui/Google_logo.png"
                      alt="Google"
                      className="w-5 h-5 mr-2 object-contain"
                      loading="lazy"
                      draggable={false}
                    />
                    Google로 계속하기
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-2 hover:bg-gray-50"
                    onClick={handleNaverLoginClick}
                  >
                    <img
                      src="/assets/ui/Naver_logo.png"
                      alt="Naver"
                      className="w-5 h-5 mr-2 object-contain"
                      loading="lazy"
                      draggable={false}
                    />
                    네이버로 계속하기
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-2 hover:bg-gray-50"
                    onClick={handleKakaoLoginClick}
                  >
                    <img
                      src="/assets/ui/Kakao_logo.png"
                      alt="Kakao"
                      className="w-5 h-5 mr-2 object-contain"
                      loading="lazy"
                      draggable={false}
                    />
                    카카오로 계속하기
                  </Button>
                </div>

                <div className="text-center mt-6">
                  <button
                    type="button"
                    onClick={() => navigate("/signup")}
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    계정이 없으신가요? <span className="text-blue-600 font-medium">회원가입</span>
                  </button>
                </div>
              </form>
            </Card>

            {/* Quick Demo Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-4 text-center"
            >
            </motion.div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-16 pt-8 border-t border-blue-100 text-center text-gray-600"
        >
        </motion.div>
      </div>
    </div>
  );
}
