import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "./components/ui/sonner"
import { Navigation } from "./components/Navigation"
import { LoginScreen } from "./components/LoginScreen"
import { useNavigate } from "react-router-dom"

// Home
import { HomeDashboard } from "./components/HomeDashboard"

// Main Learning
import { MainLearningDashboard } from "./components/MainLearning/MainLearningDashboard"
import { MicroFlowPage } from "./components/MainLearning/MicroFlowPage"
import { ReviewFlowPage } from "./components/MainLearning/ReviewFlowPage"
import { ReviewFlowPracticalPage } from "./components/MainLearning/ReviewFlowPracticalPage"

// Solo Practice
import { SoloPracticeDashboard } from "./components/SoloPractice/SoloPracticeDashboard"
import { CategoryQuiz } from "./components/SoloPractice/CategoryQuiz"
import { DifficultyQuiz } from "./components/SoloPractice/DifficultyQuiz"
import { WeaknessQuiz } from "./components/SoloPractice/WeaknessQuiz"

// Battle
import { BattleDashboard } from "./components/Battle/BattleDashboard"
import { OneVsOneBattle } from "./components/Battle/OneVsOneBattle"
import { BattleGame } from "./components/Battle/BattleGame"
import { BattleResult } from "./components/Battle/BattleResult"
import { Tournament } from "./components/Battle/Tournament"
import { TournamentBracket } from "./components/Battle/TournamentBracket"
import { GoldenBell } from "./components/Battle/GoldenBell"
import { GoldenBellGame } from "./components/Battle/GoldenBellGame"

// Others
import { ReportDashboard } from "./components/Report/ReportDashboard"
import { CertInfoDashboard } from "./components/CertInfo/CertInfoDashboard"
import { CommunityDashboard } from "./components/Community/CommunityDashboard"
import { SettingsDashboard } from "./components/Settings/SettingsDashboard"
import { ShopDashboard } from "./components/Shop/ShopDashboard"
import { LevelUpScreen } from "./components/LevelUpScreen"
import { LevelUpScreenDemo } from "./components/LevelUpScreenDemo"
import { subjects, userProfile, userSettings, shopItems, questions } from "./data/mockData"

import { useState } from "react"
import {
  userProfile as initialProfile,
  userSettings as initialSettings,
  shopItems as initialShopItems,
} from "./data/mockData"

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userProfile, setUserProfile] = useState(initialProfile)
  const [userSettings, setUserSettings] = useState(initialSettings)
  const [userPoints, setUserPoints] = useState(5000)
  const [shopItems, setShopItems] = useState(initialShopItems)

  if (!isLoggedIn) {
    return (
      <>
        <LoginScreen onLogin={() => setIsLoggedIn(true)} />
        <Toaster />
      </>
    )
  }

  return (
    // ⬇️ 여기서부터 BrowserRouter 안으로 navigate 이동
    <BrowserRouter>
      <InnerApp
        userProfile={userProfile}
        setUserProfile={setUserProfile}
        userSettings={userSettings}
        setUserSettings={setUserSettings}
        userPoints={userPoints}
        setUserPoints={setUserPoints}
        shopItems={shopItems}
        setShopItems={setShopItems}
      />
    </BrowserRouter>
  )
}

// 🔹 이건 내부 Router 영역
function InnerApp({
  userProfile,
  setUserProfile,
  userSettings,
  setUserSettings,
  userPoints,
  setUserPoints,
  shopItems,
  setShopItems,
}) {
  const navigate = useNavigate() // 이제 에러 안 남

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
      <Navigation userProfile={userProfile} userPoints={userPoints} />
      <main className="ml-64 flex-1">
        <Routes>
          {/* 메인 학습 전부 그대로 유지 */}
          <Route path="/" element={<HomeDashboard userProfile={userProfile} />} />
          <Route
            path="/learning"
            element={
              <MainLearningDashboard
                subjects={subjects}
                targetCertification={userProfile.targetCertification || "정보처리기사"}
                onStartMicro={(id, name, type) => console.log("Micro 학습 시작:", id, name, type)}
                onStartReview={(id, name, type) => console.log("Review 총정리:", id, name, type)}
              />
            }
          />
          <Route path="/learning/micro" element={<MicroFlowPage />} />
          <Route path="/learning/review-written" element={<ReviewFlowPage />} />
          <Route path="/learning/review-practical" element={<ReviewFlowPracticalPage />} />

          {/* ✅ 혼자풀기 (navigate 제대로 작동) */}
          <Route
            path="/solo"
            element={
              <SoloPracticeDashboard
                onStartCategoryQuiz={() => navigate("/solo/category")}
                onStartDifficultyQuiz={() => navigate("/solo/difficulty")}
                onStartWeaknessQuiz={() => navigate("/solo/weakness")}
              />
            }
          />
          <Route path="/solo/category" element={<CategoryQuiz />} />
          <Route path="/solo/difficulty" element={<DifficultyQuiz />} />
          <Route path="/solo/weakness" element={<WeaknessQuiz />} />

          {/* 기타 그대로 */}
          <Route path="/report" element={<ReportDashboard />} />
          <Route path="/certinfo" element={<CertInfoDashboard />} />
          <Route path="/community" element={<CommunityDashboard />} />
          <Route path="/settings" element={<SettingsDashboard userProfile={userProfile} userSettings={userSettings} onUpdateProfile={setUserProfile} onUpdateSettings={setUserSettings} />} />
          <Route path="/shop" element={<ShopDashboard shopItems={shopItems} userPoints={userPoints} onPurchase={(id, price) => {
            setUserPoints(prev => prev - price)
            setShopItems(prev => prev.map(item => item.id === id ? { ...item, isPurchased: true } : item))
          }} />} />
          <Route path="/levelUp" element={<LevelUpScreen />} />
          <Route path="/levelUp-d" element={<LevelUpScreenDemo />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Toaster />
    </div>
  )
}
