// InnerApp.tsx
import { Routes, Route, Navigate, useNavigate } from "react-router-dom"
import { Navigation } from "./components/Navigation"
import { Toaster } from "./components/ui/sonner"
import { useState } from "react"
import { userProfile as initialProfile, userSettings as initialSettings, shopItems as initialShopItems } from "./data/mockData"

// Home
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

// Battle
import { BattleDashboard } from "./components/Battle/BattleDashboard"
// 1대1 배틀
import { OneVsOneDashboard } from "./components/Battle/OneVsOne/OneVsOneDashboard"
// 카테고리
import { CategoryBattleSelect } from "./components/Battle/OneVsOne/Category/CategoryBattleSelect"
import { BattleFlow } from "./components/Battle/OneVsOne/Category/BattleFlow"
import { CategoryMatching} from "./components/Battle/OneVsOne/Category/CategoryMatching"
// 난이도
import { DifficultyBattleSelect } from "./components/Battle/OneVsOne/Difficulty/DifficultyBattleSelect"
import { DifficultyBattleFlow } from "./components/Battle/OneVsOne/Difficulty/DifficultyBattleFlow"
import { DifficultyMatching } from "./components/Battle/OneVsOne/Difficulty/DifficultyMatching"
//기타
import { BattleResult } from "./components/Battle/OneVsOne/Category/BattleResult"
// 토너먼트
// import { Tournament } from "./components/Battle/Tournament"
// import { TournamentBracket } from "./components/Battle/TournamentBracket"
// 골든벨
import { GoldenBell } from "./components/Battle/Goldenbell/GoldenBell"
import { GoldenBellGameWrapper } from "./components/Battle/Goldenbell/GoldenBellGameWrapper"


// Community
import { CommunityDashboard } from "./components/Community/CommunityDashboard"
import { CommunityDetailModal } from "./components/Community/CommunityDetailModal"

// Rank & Badge
import { RankBadgeDashboard } from "./components/RankBadge/RankBadgeDashboard"
import { GlobalRanking } from "./components/RankBadge/ranking/GlobalRanking"
import { WeeklyRanking } from "./components/RankBadge/ranking/WeeklyRanking"
import { HallOfFame } from "./components/RankBadge/ranking/HallofFame"

// report
import { ReportDashboard } from "./components/Report/ReportDashboard"

// cert info
import { CertInfoDashboard } from "./components/CertInfo/CertInfoDashboard"

// setting
import { SettingsDashboard } from "./components/Settings/SettingsDashboard"

// shop
import { ShopDashboard } from "./components/Shop/ShopDashboard"

//etc
import { LevelUpScreen } from "./components/LevelUpScreen"
import { LevelUpScreenDemo } from "./components/LevelUpScreenDemo"

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
          {/* 메인 학습 */}
          <Route path="/" element={<HomeDashboard userProfile={userProfile} />} />
          <Route path="/learning" element={<MainLearningDashboard />}/>
          <Route path="/learning/micro" element={<MicroFlowPage />} />
          <Route path="/learning/review-written" element={<ReviewFlowPage />} />
          <Route path="/learning/review-practical" element={<ReviewFlowPracticalPage />} />

          {/* 보조 학습 */}
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
          <Route
            path="/solo/category"
            element={
              <CategoryQuiz
                targetCertification="정보처리기사"
                onStart={(detailIds, count) => console.log(detailIds, count)}
                onBack={() => navigate("/solo")}
              />
            }
          />
          <Route path="/solo/play" element={<QuizFlowPage />} />
          <Route path="/solo/difficulty" element={<DifficultyQuiz />} />
          <Route path="/solo/weakness" element={<WeaknessQuiz />} />

          {/* 배틀 */}
          <Route path="/battle" element={<BattleDashboard />} />
          <Route path="/battle/onevsone/dashboard" element={<OneVsOneDashboard/>}/>
          <Route path="battle/onevsone/category/select" element={<CategoryBattleSelect/>}/>
          <Route path="/battle/onevsone/category/matching" element={<CategoryMatching />} />
          <Route path="/battle/onevsone/difficulty/start" element={<DifficultyBattleFlow/>}/>
          <Route path="/battle/onevsone/category/start" element={<BattleFlow />} />
          <Route path="/battle/result" element={<BattleResult />} />
          <Route path="battle/onevsone/difficulty/select" element={<DifficultyBattleSelect/>}/>
          <Route path="battle/onevsone/difficulty/matching" element={<DifficultyMatching/>}/>
          {/* <Route path="/battle/tournament" element={<Tournament />} /> */}
          {/* <Route path="/battle/tournament/bracket" element={<TournamentBracket />} /> */}
          <Route path="/battle/goldenbell" element={<GoldenBell />} />
          <Route
            path="/battle/goldenbell/game/:sessionId"
            element={<GoldenBellGameWrapper />}
          />


          {/* 커뮤니티 */}
          <Route path="/community" element={<CommunityDashboard />}>
            <Route path=":postId" element={<CommunityDetailModal />} />
          </Route>

          {/* 랭크 & 뱃지 */}
          <Route path="/rankBadge" element={<RankBadgeDashboard />} />
          <Route path="/rankBadge/global" element={<GlobalRanking />} />
          <Route path="/rankBadge/weekly" element={<WeeklyRanking />} />
          <Route path="/rankBadge/hall" element={<HallOfFame />} />

          {/* 기타 그대로 */}
          <Route path="/report" element={<ReportDashboard />} />
          <Route path="/certinfo" element={<CertInfoDashboard />} />
          <Route path="/settings" element={<SettingsDashboard userProfile={userProfile} userSettings={userSettings} onUpdateProfile={setUserProfile} onUpdateSettings={setUserSettings} />} />
          <Route path="/shop" element={<ShopDashboard shopItems={shopItems} userPoints={userPoints} onPurchase={(id, price) => {
            setUserPoints(prev => prev - price)
            setShopItems(prev => prev.map(item => item.id === id ? { ...item, isPurchased: true } : item))
          }} />} />
          <Route
            path="/levelUp"
            element={
              <LevelUpScreen
                currentLevel={1}
                currentExp={50}
                earnedExp={30}
                expPerLevel={100}
                onComplete={() => console.log("레벨업 완료")}
              />
            }
          />
          <Route path="/levelUp-d" element={<LevelUpScreenDemo />} />

          {/* 없는 주소 → 홈으로 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Toaster />
    </div>
  )
}
