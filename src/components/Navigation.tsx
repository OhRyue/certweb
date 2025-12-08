import { useNavigate, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { getLevelProgress } from "./utils/leveling"
import axios from "./api/axiosConfig"
import {
  Home,
  BookOpen,
  Dumbbell,
  BarChart3,
  Settings,
  Swords,
  Trophy,
  Flame,
  Award,
  ShoppingBag,
  Users,
  Menu,
  X
} from "lucide-react"

interface NavigationProps {
  userProfile: {
    name: string
    avatar: string
    level: number
    xp: number
    studyStreak: number
  }
  userPoints?: number
}

export function Navigation({ userProfile, userPoints }: NavigationProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [pointBalance, setPointBalance] = useState<number | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // 포인트 데이터 가져오기
  useEffect(() => {
    async function fetchPoints() {
      try {
        const res = await axios.get("/progress/store/points")
        setPointBalance(res.data.pointBalance)
      } catch (err) {
        console.error("포인트 데이터 불러오기 실패", err)
        // 에러 발생 시 기존 userPoints 값 사용 (fallback)
        if (userPoints !== undefined) {
          setPointBalance(userPoints)
        }
      }
    }

    fetchPoints()
  }, [userPoints])

  // 메뉴 항목에 라우트 경로 추가
  const menuItems = [
    { id: "home", label: "홈", icon: Home, path: "/" },
    { id: "main", label: "메인학습", icon: BookOpen, path: "/learning" },
    { id: "solo", label: "보조학습", icon: Dumbbell, path: "/solo" },
    { id: "battle", label: "대전/이벤트", icon: Swords, path: "/battle" },
    { id: "report", label: "학습 리포트", icon: BarChart3, path: "/report" },
    { id: "community", label: "커뮤니티", icon: Users, path: "/community" },
    { id: "rankBadge", label: "랭킹 & 뱃지", icon: Trophy, path: "/rankBadge" },
    { id: "certinfo", label: "자격증 정보", icon: Award, path: "/certinfo" },
    { id: "settings", label: "설정", icon: Settings, path: "/settings" },
  ]

  const isActive = (path: string) => location.pathname === path

  // 모바일에서 메뉴 항목 클릭 시 메뉴 닫기
  const handleNavigation = (path: string) => {
    navigate(path)
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* 모바일 메뉴 버튼 */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="메뉴 열기"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* 오버레이 (모바일) */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 네비게이션 */}
      <div
        className={`
          fixed left-0 top-0 w-64 h-screen bg-gradient-to-b from-blue-600 to-cyan-600 text-white p-6 flex flex-col overflow-y-auto z-40
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* 모바일 닫기 버튼 */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
          aria-label="메뉴 닫기"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
        <img 
          src="/assets/ui/logo_white.png" 
          alt="CertPilot"
          className="h-8 cursor-pointer"
          onClick={() => handleNavigation("/")}
        />
        </div>

        {/* User Profile Card */}
      <div className="bg-white/20 backdrop-blur rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3 mb-3">
          {userProfile.avatar && (userProfile.avatar.startsWith('/') || userProfile.avatar.includes('.png') || userProfile.avatar.includes('.jpg')) ? (
            <img 
              src={userProfile.avatar} 
              alt={userProfile.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="text-4xl">{userProfile.avatar || "🙂"}</div>
          )}
          <div className="flex-1">
            <h3 className="text-white">{userProfile.name}</h3>
            <p className="text-white/80 text-sm">Level {userProfile.level}</p>
          </div>
        </div>
        <div className="space-y-2">
          {(() => {
            const levelProgress = getLevelProgress(userProfile.xp, userProfile.level);
            return (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/80">경험치</span>
                  <span className="text-white">
                    {levelProgress.currentLevelXP} / {levelProgress.requiredXP} XP
                  </span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-300 to-cyan-300"
                    style={{
                      width: `${levelProgress.progress * 100}%`,
                    }}
                  />
                </div>
              </>
            );
          })()}
          <div className="flex items-center gap-2 pt-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm">
              {userProfile.studyStreak}일 연속 학습 🔥
            </span>
          </div>
        </div>

        {/* Shop Button */}
        <Button
          onClick={() => handleNavigation("/shop")}
          className={`w-full mt-3 justify-start bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0 ${isActive("/shop") ? "ring-2 ring-white" : ""
            }`}
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          <span className="flex-1 text-left">상점</span>
          <Badge
            variant="secondary"
            className="bg-white/20 text-white border-0 text-xs"
          >
            {pointBalance !== null ? pointBalance : (userPoints ?? 0)}P
          </Badge>
        </Button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              variant="ghost"
              className={`w-full justify-start text-white hover:bg-white/20 ${isActive(item.path) ? "bg-white/30" : ""
                }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="flex-1 text-left">{item.label}</span>
            </Button>
          )
        })}
      </nav>
      </div>
    </>
  )
}
