// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { LoginScreen } from "./components/LoginScreen"
import { SignUpScreen } from "./components/SignUpScreen"
import { ForgotPasswordScreen } from "./components/ForgotPasswordScreen"
import InnerApp from "./InnerApp"
import { Toaster } from "./components/ui/sonner"

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("accessToken"))

  useEffect(() => {
    // accessToken 존재 여부로 로그인 유지
    const token = localStorage.getItem("accessToken")
    if (token) setIsLoggedIn(true)
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* 로그인 안 해도 접근 가능한 페이지 */}
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

        {/* 로그인 필요 → 안 되어 있으면 자동으로 /login */}
        <Route
          path="/*"
          element={
            isLoggedIn ? (
              <InnerApp />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}
