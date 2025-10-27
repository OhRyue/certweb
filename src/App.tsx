import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "./components/ui/sonner"
import { Navigation } from "./components/Navigation"
import { LoginScreen } from "./components/LoginScreen"

// Home
import { HomeDashboard } from "./components/HomeDashboard"

// Main Learning
import { MainLearningDashboard } from "./components/MainLearning/MainLearningDashboard"
import { MicroFlowPage } from "./components/MainLearning/MicroFlowPage"
import { ReviewMode } from "./components/MainLearning/ReviewMode"

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
    <BrowserRouter>
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
        <Navigation userProfile={userProfile} userPoints={userPoints} />
        <main className="ml-64 flex-1">
          <Routes>
            {/* 기본 홈 */}
            <Route path="/" element={<HomeDashboard userProfile={userProfile} />} />

            {/* 메인 학습 */}
            <Route
              path="/learning"
              element={
                <MainLearningDashboard
                  subjects={subjects} // mockData에서 불러온 실제 데이터
                  targetCertification={userProfile.targetCertification || "정보처리기사"} // userProfile 안에 자격증 정보 있으면 그대로 사용
                  onStartMicro={(id, name, type) => {
                    console.log("Micro 학습 시작:", id, name, type)
                  }}
                  onStartReview={(id, name, type) => {
                    console.log("Review 총정리:", id, name, type)
                  }}
                />
              }
            />
            <Route path="/learning/micro" element={<MicroFlowPage />} />
            <Route
              path="/learning/review-written"
              element={
                <ReviewMode
                  questions={questions.slice(0, 5)}
                  topicName="필기 총정리"
                  onComplete={(score) => console.log("필기 완료:", score)}
                />
              }
            />
            <Route
              path="/learning/review-practical"
              element={
                <ReviewMode
                  questions={questions.slice(5, 10)}
                  topicName="실기 총정리"
                  onComplete={(score) => console.log("실기 완료:", score)}
                />
              }
            />


            {/* 혼자풀기 */}
            <Route path="/solo" element={<SoloPracticeDashboard />} />
            <Route path="/solo/category" element={<CategoryQuiz />} />
            <Route path="/solo/difficulty" element={<DifficultyQuiz />} />
            <Route path="/solo/weakness" element={<WeaknessQuiz />} />

            {/* 배틀 */}
            <Route path="/battle" element={<BattleDashboard />} />
            <Route path="/battle/1v1" element={<OneVsOneBattle />} />
            <Route path="/battle/game" element={<BattleGame />} />
            <Route path="/battle/result" element={<BattleResult />} />
            <Route path="/battle/tournament" element={<Tournament />} />
            <Route path="/battle/tournament/bracket" element={<TournamentBracket />} />
            <Route path="/battle/goldenbell" element={<GoldenBell />} />
            <Route path="/battle/goldenbell/game" element={<GoldenBellGame />} />

            {/* 기타 */}
            <Route path="/report" element={<ReportDashboard />} />
            <Route path="/certinfo" element={<CertInfoDashboard />} />
            <Route path="/community" element={<CommunityDashboard />} />
            <Route
              path="/settings"
              element={
                <SettingsDashboard
                  userProfile={userProfile}
                  userSettings={userSettings}
                  onUpdateProfile={setUserProfile}
                  onUpdateSettings={setUserSettings}
                />
              }
            />
            <Route
              path="/shop"
              element={
                <ShopDashboard
                  shopItems={shopItems}
                  userPoints={userPoints}
                  onPurchase={(id, price) => {
                    setUserPoints((prev) => prev - price)
                    setShopItems((prev) =>
                      prev.map((item) =>
                        item.id === id ? { ...item, isPurchased: true } : item
                      )
                    )
                  }}
                />
              }
            />

            {/* 잘못된 경로 → 홈으로 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <Toaster />
    </BrowserRouter>
  )
}
