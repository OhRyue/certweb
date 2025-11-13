// InnerApp.tsx
import { Routes, Route, Navigate, useNavigate } from "react-router-dom"
import { Navigation } from "./components/Navigation"
import { Toaster } from "./components/ui/sonner"

// 화면들 import

import { HomeDashboard } from "./components/HomeDashboard"

// main Learning
import { MainLearningDashboard } from "./components/MainLearning/MainLearningDashboard"
import { MicroFlowPage } from "./components/MainLearning/MicroFlowPage"
import { ReviewFlowPage } from "./components/MainLearning/ReviewFlowPage"
import { ReviewFlowPracticalPage } from "./components/MainLearning/ReviewFlowPracticalPage"

// solo Pracitce
import { SoloPracticeDashboard } from "./components/SoloPractice/SoloPracticeDashboard"
import { CategoryQuiz } from "./components/SoloPractice/CategoryQuiz"
import { QuizFlowPage } from "./components/SoloPractice/QuizFlowPage"
import { DifficultyQuiz } from "./components/SoloPractice/DifficultyQuiz"
import { WeaknessQuiz } from "./components/SoloPractice/WeaknessQuiz"

// battle
import { BattleDashboard } from "./components/Battle/BattleDashboard"
import { OneVsOneBattle } from "./components/Battle/OneVsOneBattle"

// report
import { ReportDashboard } from "./components/Report/ReportDashboard"

// cert info
import { CertInfoDashboard } from "./components/CertInfo/CertInfoDashboard"

// community
import { CommunityDashboard } from "./components/Community/CommunityDashboard"

// setting
import { SettingsDashboard } from "./components/Settings/SettingsDashboard"
// shop
import { ShopDashboard } from "./components/Shop/ShopDashboard"

//etc
import { LevelUpScreen } from "./components/LevelUpScreen"
import { LevelUpScreenDemo } from "./components/LevelUpScreenDemo"

import { useState } from "react"
import { userProfile as initialProfile, userSettings as initialSettings, shopItems as initialShopItems } from "./data/mockData"

export default function InnerApp() {
  const navigate = useNavigate()
  const [userProfile, setUserProfile] = useState(initialProfile)
  const [userSettings, setUserSettings] = useState(initialSettings)
  const [userPoints, setUserPoints] = useState(5000)
  const [shopItems, setShopItems] = useState(initialShopItems)

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
      <Navigation userProfile={userProfile} userPoints={userPoints} />
      <main className="ml-64 flex-1">
        <Routes>
          {/* 메인 홈 */}
          <Route path="/" element={<HomeDashboard userProfile={userProfile} />} />

          {/* 메인 학습 */}
          <Route
            path="/learning"
            element={
              <MainLearningDashboard
                subjects={[]} // 실제 데이터 연결하면 여기에 교체
                targetCertification={userProfile.targetCertification || "정보처리기사"}
                onStartMicro={(id, name, type) => console.log(id, name, type)}
                onStartReview={(id, name, type) => console.log(id, name, type)}
              />
            }
          />
          <Route path="/learning/micro" element={<MicroFlowPage />} />
          <Route path="/learning/review-written" element={<ReviewFlowPage />} />
          <Route path="/learning/review-practical" element={<ReviewFlowPracticalPage />} />

          {/* 혼자풀기 */}
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
          <Route path="/solo/category" element={<CategoryQuiz onBack={() => navigate("/solo")} />} />
          <Route path="/solo/play" element={<QuizFlowPage />} />
          <Route path="/solo/difficulty" element={<DifficultyQuiz />} />
          <Route path="/solo/weakness" element={<WeaknessQuiz />} />

          {/* 기타 */}
          <Route path="/report" element={<ReportDashboard />} />
          <Route path="/certinfo" element={<CertInfoDashboard />} />
          <Route path="/community" element={<CommunityDashboard />} />
          <Route path="/settings" element={<SettingsDashboard userProfile={userProfile} userSettings={userSettings} onUpdateProfile={setUserProfile} onUpdateSettings={setUserSettings} />} />
          <Route path="/shop" element={<ShopDashboard shopItems={shopItems} userPoints={userPoints} onPurchase={(id, price) => {
            setUserPoints((prev) => prev - price)
            setShopItems((prev) => prev.map(item => item.id === id ? { ...item, isPurchased: true } : item))
          }} />} />
          <Route path="/levelUp" element={<LevelUpScreen />} />
          <Route path="/levelUp-d" element={<LevelUpScreenDemo />} />

          {/* 없는 주소 → 홈으로 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Toaster />
    </div>
  )
}
