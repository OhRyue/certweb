// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { LoginScreen } from "./components/LoginScreen"
import { SignUpScreen } from "./components/SignUpScreen"
import { ForgotPasswordScreen } from "./components/ForgotPasswordScreen"
import { OnboardingScreen } from "./components/OnboardingScreen"
import { NaverCallback } from "./components/NaverCallback"
import { PrivateRoute } from "./PrivateRoute"
import { AppInitializer } from "./AppInitializer"
import axios from "./components/api/axiosConfig"
import { isTokenExpired, logTokenInfo } from "./utils/tokenUtils"
import { OnboardingRedirector } from "./OnboardingRedirector"
import { clearAuthTokens, getAccessToken, getRefreshTokenWithSource, setAuthItemInStorage } from "./utils/authStorage"

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isCheckingToken, setIsCheckingToken] = useState(true)

  useEffect(() => {
    async function validateAndRefreshToken() {
      const accessToken = getAccessToken()
      const { token: refreshToken, source } = getRefreshTokenWithSource()

      // 1. 토큰이 없으면 로그아웃 상태
      if (!accessToken) {
        console.log("🔐 [APP INIT] 토큰이 없습니다. 로그아웃 상태")
        setIsLoggedIn(false)
        setIsCheckingToken(false)
        return
      }

      // 2. 액세스 토큰 유효성 검증 (60초 버퍼)
      // 만료되었거나 60초 이내에 만료되면 갱신 시도
      logTokenInfo(accessToken, "Access Token")
      
      if (isTokenExpired(accessToken, 60)) {
        console.log("⚠️ [APP INIT] 액세스 토큰이 만료되었거나 만료 임박. 갱신 시도...")
        
        // 3. Refresh token으로 갱신 시도
        if (!refreshToken) {
          console.error("🔴 [APP INIT] Refresh 토큰이 없습니다. 로그아웃 처리")
          clearAuthTokens()
          setIsLoggedIn(false)
          setIsCheckingToken(false)
          return
        }

        try {
          console.log("🔄 [APP INIT] 토큰 갱신 중...")
          const response = await axios.post("/account/refresh", { refreshToken })
          
          const newAccessToken = response.data.accessToken
          if (newAccessToken) {
            setAuthItemInStorage(source ?? "session", "accessToken", newAccessToken)
            console.log("✅ [APP INIT] 토큰 갱신 성공")
            logTokenInfo(newAccessToken, "New Access Token")
            setIsLoggedIn(true)
          } else {
            console.error("🔴 [APP INIT] 새 액세스 토큰을 받지 못했습니다.")
            clearAuthTokens()
            setIsLoggedIn(false)
          }
        } catch (error: any) {
          console.error("🔴 [APP INIT] 토큰 갱신 실패:", error)
          console.error("응답:", error.response?.data)
          clearAuthTokens()
          setIsLoggedIn(false)
        }
      } else {
        // 4. 액세스 토큰이 유효하면 로그인 상태 유지
        console.log("✅ [APP INIT] 액세스 토큰이 유효합니다. 로그인 상태 유지")
        setIsLoggedIn(true)
      }

      setIsCheckingToken(false)
    }

    validateAndRefreshToken()
  }, [])

  const handleLogout = () => {
    clearAuthTokens()
    setIsLoggedIn(false)
  }

  // 토큰 검증 중 로딩 화면 표시
  if (isCheckingToken) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🔐</div>
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <OnboardingRedirector />
      <Routes>

        {/* 로그인 페이지 */}
        <Route
          path="/login"
          element={
            isLoggedIn
              ? <Navigate to="/" replace />
              : <LoginScreen onLogin={() => setIsLoggedIn(true)} />
          }
        />

        <Route path="/signup" element={<SignUpScreen />} />
        <Route path="/forgotPassword" element={<ForgotPasswordScreen />} />

        {/* 네이버 OAuth 콜백 */}
        <Route
          path="/oauth/naver"
          element={
            isLoggedIn
              ? <Navigate to="/" replace />
              : <NaverCallback onLogin={() => setIsLoggedIn(true)} />
          }
        />

        {/* 보호 영역 */}
        <Route element={<PrivateRoute isLoggedIn={isLoggedIn} />}>
          <Route path="/onboarding" element={<OnboardingScreen />} />
          <Route path="/*" element={<AppInitializer onLogout={handleLogout} />} />
        </Route>
      </Routes>
    </BrowserRouter>

  )
}
