import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar } from "./ui/avatar";
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
  Award
} from "lucide-react";

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  userProfile: {
    name: string;
    avatar: string;
    level: number;
    xp: number;
    studyStreak: number;
  };
}

export function Navigation({ currentView, onViewChange, userProfile }: NavigationProps) {
  const menuItems = [
    { id: "home", label: "홈", icon: Home, status: "active" },
    { id: "main", label: "메인학습", icon: BookOpen, status: "active" },
    { id: "solo", label: "보조학습", icon: Dumbbell, status: "active" },
    { id: "report", label: "학습 리포트", icon: BarChart3, status: "active" },
    { id: "certinfo", label: "자격증 정보", icon: Award, status: "active" },
    { id: "battle", label: "대전/이벤트", icon: Swords, status: "active" },
    { id: "community", label: "커뮤니티", icon: Trophy, status: "active" },
    { id: "settings", label: "설정", icon: Settings, status: "active" },
  ];

  return (
    <div className="w-64 h-screen bg-gradient-to-b from-purple-600 to-pink-600 text-white p-6 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <Sparkles className="w-8 h-8" />
        <h1 className="text-white">자격증 마스터</h1>
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
            <span className="text-white">{userProfile.xp} / {(userProfile.level + 1) * 500} XP</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-400"
              style={{ width: `${(userProfile.xp / ((userProfile.level + 1) * 500)) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm">{userProfile.studyStreak}일 연속 학습 🔥</span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isComingSoon = item.status === "coming";

          return (
            <Button
              key={item.id}
              onClick={() => !isComingSoon && onViewChange(item.id)}
              variant="ghost"
              className={`w-full justify-start text-white hover:bg-white/20 ${
                isActive ? "bg-white/30" : ""
              } ${isComingSoon ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={isComingSoon}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="flex-1 text-left">{item.label}</span>
              {isComingSoon && (
                <Badge variant="secondary" className="text-xs bg-white/20 text-white border-0">
                  🚧
                </Badge>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="text-center text-white/60 text-xs pt-4 border-t border-white/20">
        <p>© 2025 자격증 마스터</p>
        <p>v1.0.0</p>
      </div>
    </div>
  );
}