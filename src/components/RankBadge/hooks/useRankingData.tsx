import { ReactElement } from "react"
import { Crown, Medal, Trophy } from "lucide-react"

export const mockRankings = {
  overall: [
    { rank: 1, name: "공부왕👑", avatar: "🦸‍♂️", xp: 15240, level: 28, change: 0 },
    { rank: 2, name: "합격제조기", avatar: "🧙‍♀️", xp: 14890, level: 27, change: 1 },
    { rank: 3, name: "자격증헌터", avatar: "🦊", xp: 14250, level: 26, change: -1 },
    { rank: 4, name: "스터디마스터", avatar: "🐻", xp: 13890, level: 25, change: 2 },
    { rank: 5, name: "열공러", avatar: "🐱", xp: 13456, level: 25, change: 0 },
    { rank: 6, name: "합격왕", avatar: "🎓", xp: 12998, level: 24, change: -2 },
    { rank: 7, name: "끈기왕", avatar: "💪", xp: 12567, level: 24, change: 0 },
    { rank: 8, name: "나", avatar: "😊", xp: 12340, level: 23, change: 3, isCurrentUser: true },
    { rank: 9, name: "공부벌레", avatar: "🐝", xp: 12105, level: 23, change: -1 },
    { rank: 10, name: "집중왕", avatar: "🎯", xp: 11890, level: 22, change: 0 },
  ],
  weekly: [
    { rank: 1, name: "열공러", avatar: "🐱", xp: 2340, level: 25, change: 2 },
    { rank: 2, name: "공부왕👑", avatar: "🦸‍♂️", xp: 2210, level: 28, change: 0 },
    { rank: 3, name: "나", avatar: "😊", xp: 1890, level: 23, change: 5, isCurrentUser: true },
    { rank: 4, name: "합격제조기", avatar: "🧙‍♀️", xp: 1780, level: 27, change: -2 },
    { rank: 5, name: "스터디마스터", avatar: "🐻", xp: 1650, level: 25, change: 1 },
    { rank: 6, name: "자격증헌터", avatar: "🦊", xp: 1540, level: 26, change: 0 },
    { rank: 7, name: "합격왕", avatar: "🎓", xp: 1430, level: 24, change: -1 },
    { rank: 8, name: "끈기왕", avatar: "💪", xp: 1320, level: 24, change: 2 },
    { rank: 9, name: "공부벌레", avatar: "🐝", xp: 1210, level: 23, change: -2 },
    { rank: 10, name: "집중왕", avatar: "🎯", xp: 1150, level: 22, change: 0 },
  ],
  hallOfFame: [
    { rank: 1, name: "전설의 공부왕", avatar: "🦸‍♂️", totalXP: 125840, level: 65, achievements: 89 },
    { rank: 2, name: "자격증 마스터", avatar: "🧙‍♀️", totalXP: 118920, level: 62, achievements: 85 },
    { rank: 3, name: "지식의 수호자", avatar: "🦊", totalXP: 112450, level: 59, achievements: 82 },
  ],
}

export const mockBadges = [
  { id: 1, name: "첫 만점", description: "처음으로 만점을 받았어요!", icon: "🎯", category: "학습", earned: true, earnedDate: "2025-01-15", rarity: "common" },
  { id: 2, name: "10일 연속 학습", description: "10일 연속으로 학습했어요!", icon: "🔥", category: "출석", earned: true, earnedDate: "2025-01-20", rarity: "rare" },
  { id: 3, name: "배틀 첫 승리", description: "배틀에서 첫 승리를 거뒀어요!", icon: "⚔️", category: "배틀", earned: true, earnedDate: "2025-01-10", rarity: "common" },
  { id: 4, name: "100문제 풀이", description: "총 100문제를 풀었어요!", icon: "📚", category: "학습", earned: true, earnedDate: "2025-01-18", rarity: "common" },
  { id: 5, name: "30일 연속 학습", description: "30일 연속으로 학습했어요!", icon: "💪", category: "출석", earned: false, progress: 23, total: 30, rarity: "epic" },
  { id: 6, name: "배틀 마스터", description: "배틀에서 50회 승리했어요!", icon: "🏆", category: "배틀", earned: false, progress: 15, total: 50, rarity: "legendary" },
  { id: 7, name: "완벽주의자", description: "10번 연속 만점을 받았어요!", icon: "✨", category: "학습", earned: false, progress: 4, total: 10, rarity: "epic" },
  { id: 8, name: "속도왕", description: "30초 안에 문제를 풀었어요!", icon: "⚡", category: "학습", earned: true, earnedDate: "2025-01-12", rarity: "rare" },
  { id: 9, name: "지식의 탑", description: "1000문제를 풀었어요!", icon: "🗼", category: "학습", earned: false, progress: 342, total: 1000, rarity: "legendary" },
  { id: 10, name: "도전자", description: "100번의 배틀에 참여했어요!", icon: "🎮", category: "배틀", earned: false, progress: 67, total: 100, rarity: "rare" },
  { id: 11, name: "골든벨 우승", description: "골든벨에서 우승했어요!", icon: "🔔", category: "이벤트", earned: false, progress: 0, total: 1, rarity: "legendary" },
  { id: 12, name: "커뮤니티 리더", description: "게시글 좋아요를 100개 받았어요!", icon: "💬", category: "커뮤니티", earned: false, progress: 42, total: 100, rarity: "epic" },
]

export const getRankColor = (rank: number) => {
  if (rank === 1) return "from-yellow-400 to-amber-500"
  if (rank === 2) return "from-gray-300 to-gray-400"
  if (rank === 3) return "from-orange-400 to-amber-600"
  return "from-purple-400 to-pink-400"
}

export const getRankIcon = (rank: number): ReactElement => {
  if (rank === 1) return <Crown className="w-5 h-5" />
  if (rank === 2) return <Medal className="w-5 h-5" />
  if (rank === 3) return <Medal className="w-5 h-5" />
  return <Trophy className="w-4 h-4" />
}

export const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case "common":
      return "from-gray-400 to-gray-500"
    case "rare":
      return "from-blue-400 to-blue-600"
    case "epic":
      return "from-purple-400 to-purple-600"
    case "legendary":
      return "from-orange-400 to-yellow-500"
    default:
      return "from-gray-400 to-gray-500"
  }
}

export const getRarityLabel = (rarity: string) => {
  switch (rarity) {
    case "common":
      return "일반"
    case "rare":
      return "희귀"
    case "epic":
      return "영웅"
    case "legendary":
      return "전설"
    default:
      return "일반"
  }
}
