import type { ReactElement } from "react"
import { Crown, Medal, Trophy } from "lucide-react"

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
