// InnerApp.tsx
import { Routes, Route, Navigate, useNavigate } from "react-router-dom"
import { Navigation } from "./components/Navigation"
import { Toaster } from "./components/ui/sonner"
import { userProfile as initialProfile, userSettings as initialSettings, shopItems as initialShopItems } from "./data/mockData"
import { useEffect, useState } from "react"
import axios from "./components/api/axiosConfig"
import { CERT_MAP } from "./constants/certMap"

// 프로필 이미지 import
import girlBasicProfile from "./components/assets/profile/girl_basic_profile.png"
import boyNerdProfile from "./components/assets/profile/boy_nerd_profile.png"
import girlUniformProfile from "./components/assets/profile/girl_uniform_profile.jpg"
import girlPajamaProfile from "./components/assets/profile/girl_pajama_profile.png"
import girlMarriedProfile from "./components/assets/profile/girl_married_profile.png"
import girlNerdProfile from "./components/assets/profile/girl_nerd_profile.png"
import girlIdolProfile from "./components/assets/profile/girl_idol_profile.png"
import girlGhostProfile from "./components/assets/profile/girl_ghost_profile.png"
import girlCyberpunkProfile from "./components/assets/profile/girl_cyberpunk_profile.png"
import girlChinaProfile from "./components/assets/profile/girl_china_profile.jpg"
import girlCatProfile from "./components/assets/profile/girl_cat_profile.png"
import boyWorkerProfile from "./components/assets/profile/boy_worker_profile.png"
import boyPoliceofficerProfile from "./components/assets/profile/boy_policeofficer_profile.png"
import boyHiphopProfile from "./components/assets/profile/boy_hiphop_profile.png"
import boyDogProfile from "./components/assets/profile/boy_dog_profile.png"
import boyBasicProfile from "./components/assets/profile/boy_basic_profile.png"
import boyAgentProfile from "./components/assets/profile/boy_agent_profile.png"

// skinId를 프로필 이미지로 매핑
const PROFILE_IMAGE_MAP: Record<number, string> = {
  1: girlBasicProfile,
  2: boyNerdProfile,
  3: girlUniformProfile,
  4: girlPajamaProfile,
  5: girlMarriedProfile,
  6: girlNerdProfile,
  7: girlIdolProfile,
  8: girlGhostProfile,
  9: girlCyberpunkProfile,
  10: girlChinaProfile,
  11: girlCatProfile,
  12: boyWorkerProfile,
  13: boyPoliceofficerProfile,
  14: boyHiphopProfile,
  15: boyDogProfile,
  16: boyBasicProfile,
  17: boyAgentProfile,
}

// skinId로 프로필 이미지 경로 가져오기
function getProfileImage(skinId: number): string {
  return PROFILE_IMAGE_MAP[skinId] || PROFILE_IMAGE_MAP[1] // 기본값: girl_basic_profile
}

// Home
import { HomeDashboard } from "./components/HomeDashboard"

// main Learning
import { MainLearningDashboard } from "./components/MainLearning/MainLearningDashboard"
import { MicroFlowPage as WrittenMicroFlowPage } from "./components/MainLearning/Micro/Written/MicroFlowPage"
import { MicroFlowPage as PracticalMicroFlowPage } from "./components/MainLearning/Micro/Practical/MicroFlowPage"
import { ReviewFlowPage } from "./components/MainLearning/Review/ReviewFlowPage"
import { ReviewFlowPracticalPage } from "./components/MainLearning/Review/ReviewFlowPracticalPage"

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
import { CategoryMatching } from "./components/Battle/OneVsOne/Category/CategoryMatching"
// 난이도
import { DifficultyBattleSelect } from "./components/Battle/OneVsOne/Difficulty/DifficultyBattleSelect"
import { DifficultyBattleFlow } from "./components/Battle/OneVsOne/Difficulty/DifficultyBattleFlow"
import { DifficultyMatching } from "./components/Battle/OneVsOne/Difficulty/DifficultyMatching"
//기타
import { BattleResult } from "./components/Battle/OneVsOne/Category/BattleResult"
// 토너먼트
import { Tournament } from "./components/Battle/Tournament/Tournament"
import { TournamentBracket } from "./components/Battle/Tournament/TournamentBracket"
import { TournamentMatching } from "./components/Battle/Tournament/TournamentMatching"
import { TournamentGameFlow } from "./components/Battle/Tournament/TournamentGameFlow"
// 골든벨
import { GoldenBell } from "./components/Battle/Goldenbell/GoldenBell"
import { GoldenBellBotGameWrapper } from "./components/Battle/Goldenbell/GoldenBellBotGameWrapper"
import { GoldenBellPvPGameWrapper } from "./components/Battle/Goldenbell/GoldenBellPvPGameWrapper"


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
import { FullHistoryView } from "./components/Report/FullHistoryView"

// cert info
import { CertInfoDashboard } from "./components/CertInfo/CertInfoDashboard"

// setting
import { SettingsDashboard } from "./components/Settings/SettingsDashboard"

// shop
import { ShopDashboard } from "./components/Shop/ShopDashboard"

//etc
import { LevelUpScreen } from "./components/LevelUpScreen"
import { LevelUpScreenDemo } from "./components/LevelUpScreenDemo"
import { useSearchParams } from "react-router-dom"

interface InnerAppProps {
  onLogout: () => void
}

// MicroFlowPage 라우터: type 파라미터에 따라 필기/실기 컴포넌트 분기
function MicroFlowPageRouter() {
  const [searchParams] = useSearchParams()
  const type = (searchParams.get("type") || "written").toLowerCase()
  
  if (type === "practical") {
    return <PracticalMicroFlowPage />
  }
  
  return <WrittenMicroFlowPage />
}

export default function InnerApp({ onLogout }: InnerAppProps) {
  const navigate = useNavigate()
  const [userSettings, setUserSettings] = useState(initialSettings)
  const [userPoints, setUserPoints] = useState(5000)
  const [shopItems, setShopItems] = useState(initialShopItems)
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true)

  // 유저 프로필 
  const [userProfile, setUserProfile] = useState({
    id: "",
    name: "",
    avatar: "🙂",
    level: 1,
    xp: 120,
    studyStreak: 3,
    targetCertificationId: 0,
    targetCertification: ""
  })

  useEffect(() => {
    async function fetchProfile() {
      try {
        // 기본 프로필 정보 (timezone, lang 등 설정 페이지에서 필요한 정보)
        const profileRes = await axios.get("/account/profile")
        
        // 디버깅: 프로필 응답 전체 확인
        console.log("프로필 API 응답:", profileRes.data)
        console.log("onboardingCompleted 값:", profileRes.data.onboardingCompleted)
        console.log("nickname 값:", profileRes.data.nickname)

        // 온보딩 완료 여부 확인
        // onboardingCompleted가 명시적으로 true이면 온보딩 완료로 간주
        // onboardingCompleted 필드가 없거나 false인 경우, 닉네임이 없으면 온보딩 미완료로 간주
        const onboardingCompleted = profileRes.data.onboardingCompleted
        const hasNickname = profileRes.data.nickname && profileRes.data.nickname.trim() !== ""
        
        // onboardingCompleted가 명시적으로 true이면 완료로 간주
        // 그렇지 않으면 닉네임 존재 여부로 판단 (하위 호환성)
        const isOnboardingCompleted = onboardingCompleted === true || 
          (onboardingCompleted === undefined && hasNickname)
        
        console.log("온보딩 완료 여부 체크:", { 
          onboardingCompleted, 
          hasNickname, 
          isOnboardingCompleted,
          willRedirect: !isOnboardingCompleted
        })
        
        if (!isOnboardingCompleted) {
          console.log("온보딩 미완료 감지, 온보딩 화면으로 이동")
          navigate("/onboarding", { replace: true })
          return
        }

        // 홈 개요 데이터 호출 (경험치, 연속 학습일 등)
        const overviewRes = await axios.get("/progress/home/overview")

        setUserProfile(prev => ({
          ...prev,
          id: profileRes.data.userId || overviewRes.data.user.userId,              // userId
          name: profileRes.data.nickname || overviewRes.data.user.nickname,      // 닉네임
          avatar: getProfileImage(profileRes.data.skinId || overviewRes.data.user.skinId),  // skinId로 프로필 이미지 경로 가져오기
          level: overviewRes.data.user.level,            // 레벨 (overview에서)
          xp: overviewRes.data.user.xpTotal,             // 경험치 (overview에서)
          studyStreak: overviewRes.data.user.streakDays, // 연속 학습일 (overview에서)
          targetCertificationId: overviewRes.data.goal?.certId || 0,
          targetCertification: overviewRes.data.goal?.certId ? CERT_MAP[overviewRes.data.goal.certId] : ""
        }))
        
        // 온보딩 체크 완료
        setIsCheckingOnboarding(false)
      } catch (err: any) {
        console.error("유저 프로필 불러오기 실패", err)
        // 프로필 로드 실패 시 온보딩으로 리다이렉트
        // (온보딩 미완료 상태일 가능성이 높음)
        if (err.response?.status !== 401) {
          // 401 에러가 아니면 온보딩으로 리다이렉트 시도
          navigate("/onboarding", { replace: true })
        } else {
          // 401 에러인 경우에도 온보딩 체크는 완료 처리
          setIsCheckingOnboarding(false)
        }
      }
    }
    fetchProfile()

    // 스킨 변경 이벤트 리스너 추가
    const handleSkinChanged = async () => {
      try {
        const profileRes = await axios.get("/account/profile")
        setUserProfile(prev => ({
          ...prev,
          avatar: getProfileImage(profileRes.data.skinId),
        }))
      } catch (err) {
        console.error("프로필 업데이트 실패", err)
      }
    }

    window.addEventListener('skinChanged', handleSkinChanged)
    
    return () => {
      window.removeEventListener('skinChanged', handleSkinChanged)
    }
  }, [navigate])

  // 온보딩 체크가 완료될 때까지 로딩 화면 표시
  if (isCheckingOnboarding) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">프로필 확인 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
      <Navigation userProfile={userProfile} userPoints={userPoints} />
      <main className="ml-64 flex-1">
        <Routes>
          {/* 메인 학습 */}
          <Route path="/" element={<HomeDashboard userProfile={userProfile} />} />
          <Route path="/learning" element={<MainLearningDashboard />} />
          <Route 
            path="/learning/micro" 
            element={
              <MicroFlowPageRouter />
            } 
          />
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
          <Route path="/battle/result" element={<BattleResult />} />
          
          {/* 1:1 배틀 */}
          <Route path="/battle/onevsone/dashboard" element={<OneVsOneDashboard />} />
          <Route path="battle/onevsone/category/select" element={<CategoryBattleSelect />} />
          <Route path="/battle/onevsone/category/matching" element={<CategoryMatching />} />
          <Route path="/battle/onevsone/difficulty/start" element={<DifficultyBattleFlow />} />
          <Route path="/battle/onevsone/category/start" element={<BattleFlow />} />
          <Route path="battle/onevsone/difficulty/select" element={<DifficultyBattleSelect />} />
          <Route path="battle/onevsone/difficulty/matching" element={<DifficultyMatching />} />
          {/* 토너먼트 */}
          <Route path="/battle/tournament" element={<Tournament />} />
          <Route path="/battle/tournament/matching" element={<TournamentMatching />} />
          <Route path="/battle/tournament/game/practical" element={<TournamentGameFlow />} />
          <Route path="/battle/tournament/game/written" element={<TournamentGameFlow />} />
          <Route path="/battle/tournament/bracket" element={<TournamentBracket />} />
          <Route path="/battle/goldenbell" element={<GoldenBell />} />
          <Route
            path="/battle/goldenbell/bot/:sessionId"
            element={<GoldenBellBotGameWrapper />}
          />
          <Route
            path="/battle/goldenbell/game/:roomId"
            element={<GoldenBellPvPGameWrapper />}
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

          {/* 학습 리포트 */}
          <Route path="/report" element={<ReportDashboard />} />
          <Route path="/report/history" element={<FullHistoryView />} />
          
          {/* 기타 그대로 */}
          <Route path="/certinfo" element={<CertInfoDashboard />} />
          <Route
            path="/settings"
            element={
              <SettingsDashboard
                userProfile={userProfile}
                userSettings={userSettings}
                onUpdateProfile={setUserProfile}
                onUpdateSettings={setUserSettings}
                onLogout={onLogout}
              />
            }
          />
          <Route path="/shop" element={<ShopDashboard onPurchase={(itemId, price) => {
            // 구매 후 포인트 업데이트는 API에서 자동으로 반영됨
            console.log("아이템 구매:", itemId, price);
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
