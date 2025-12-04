// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { LoginScreen } from "./components/LoginScreen"
import { SignUpScreen } from "./components/SignUpScreen"
import { ForgotPasswordScreen } from "./components/ForgotPasswordScreen"
import { OnboardingScreen } from "./components/OnboardingScreen"
import { PrivateRoute } from "./PrivateRoute"
import InnerApp from "./InnerApp"
import { Toaster } from "./components/ui/sonner"

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("accessToken"))

  useEffect(() => {
    // accessToken 존재 여부로 로그인 유지
    const token = localStorage.getItem("accessToken")
    if (token) setIsLoggedIn(true)
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    setIsLoggedIn(false)
  }

  return (
    <BrowserRouter>
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

        {/* 보호 영역 */}
        <Route element={<PrivateRoute isLoggedIn={isLoggedIn} />}>
          <Route path="/onboarding" element={<OnboardingScreen />} />
          <Route path="/*" element={<InnerApp onLogout={handleLogout} />} />
        </Route>
      </Routes>
    </BrowserRouter>

  )
}
