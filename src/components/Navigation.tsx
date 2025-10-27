import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  Home,
  BookOpen,
  Dumbbell,
  BarChart3,
  Settings,
  Swords,
  Trophy,
  Sparkles,
  Flame,
  Award,
  ShoppingBag,
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

export function Navigation({ userProfile, userPoints = 0 }: NavigationProps) {
  const navigate = useNavigate()
  const location = useLocation()

  // 메뉴 항목에 라우트 경로 추가
  const menuItems = [
    { id: "home", label: "홈", icon: Home, path: "/" },
    { id: "main", label: "메인학습", icon: BookOpen, path: "/learning" },
    { id: "solo", label: "보조학습", icon: Dumbbell, path: "/solo" },
    { id: "report", label: "학습 리포트", icon: BarChart3, path: "/report" },
    { id: "certinfo", label: "자격증 정보", icon: Award, path: "/certinfo" },
    { id: "battle", label: "대전/이벤트", icon: Swords, path: "/battle" },
    { id: "community", label: "커뮤니티", icon: Trophy, path: "/community" },
    { id: "settings", label: "설정", icon: Settings, path: "/settings" },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="fixed left-0 top-0 w-64 h-screen bg-gradient-to-b from-blue-600 to-cyan-600 text-white p-6 flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <Sparkles className="w-8 h-8" />
        <h1 className="text-white text-lg font-bold">자격증 마스터</h1>
      </div>

      {/* User Profile Card */}
      <div className="bg-white/20 backdrop-blur rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-4xl">{userProfile.avatar}</div>
          <div className="flex-1">
            <h3 className="text-white">{userProfile.name}</h3>
            <p className="text-white/80 text-sm">Level {userProfile.level}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/80">경험치</span>
            <span className="text-white">
              {userProfile.xp} / {(userProfile.level + 1) * 500} XP
            </span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-300 to-cyan-300"
              style={{
                width: `${
                  (userProfile.xp / ((userProfile.level + 1) * 500)) * 100
                }%`,
              }}
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm">
              {userProfile.studyStreak}일 연속 학습 🔥
            </span>
          </div>
        </div>

        {/* Shop Button */}
        <Button
          onClick={() => navigate("/shop")}
          className={`w-full mt-3 justify-start bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0 ${
            isActive("/shop") ? "ring-2 ring-white" : ""
          }`}
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          <span className="flex-1 text-left">상점</span>
          <Badge
            variant="secondary"
            className="bg-white/20 text-white border-0 text-xs"
          >
            {userPoints}P
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
              onClick={() => navigate(item.path)}
              variant="ghost"
              className={`w-full justify-start text-white hover:bg-white/20 ${
                isActive(item.path) ? "bg-white/30" : ""
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="flex-1 text-left">{item.label}</span>
            </Button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="text-center text-white/60 text-xs pt-4 border-t border-white/20">
        <p>© 2025 자격증 마스터</p>
        <p>v1.0.0</p>
      </div>
    </div>
  )
}
