// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useState } from "react"
import { LoginScreen } from "./components/LoginScreen"
import { SignUpScreen } from "./components/SignUpScreen"
import InnerApp from "./InnerApp"
import { Toaster } from "./components/ui/sonner"

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  return (
    <BrowserRouter>
      <Routes>
        {/* 로그인 안 해도 접근 가능한 페이지 */}
        <Route path="/login" element={<LoginScreen onLogin={() => setIsLoggedIn(true)} />} />
        <Route path="/signup" element={<SignUpScreen />} />

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
