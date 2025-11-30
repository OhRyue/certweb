import { motion } from "motion/react"
import { useState, useEffect } from "react"
import { Card } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { TrendingUp } from "lucide-react"
import { getRankColor, getRankIcon } from "../hooks/useRankingData"
import { getRankings } from "../../api/rankingApi"

interface RankingDisplayUser {
  rank: number
  userId: string
  xp: number
  score: number
  streak: number
  isCurrentUser: boolean
}

export function WeeklyRanking() {
  const [data, setData] = useState<RankingDisplayUser[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const itemsPerPage = 10

  useEffect(() => {
    fetchRankings()
  }, [currentPage])

  const fetchRankings = async () => {
    try {
      setLoading(true)
      const response = await getRankings({
        scope: "WEEKLY",
        page: currentPage - 1, // API는 0-based, UI는 1-based
        size: itemsPerPage,
      })

      // 전체 데이터 변환 (현재 사용자 표시 포함)
      const allData = response.top.map((user) => ({
        rank: user.rank ?? 0,
        userId: user.userId ?? "",
        xp: user.xp ?? 0,
        score: user.score ?? 0,
        streak: user.streak ?? 0,
        isCurrentUser: response.me?.userId === user.userId,
      }))

      setData(allData)
      setTotalPages(response.totalPages || 1)
    } catch (error) {
      console.error("주간 랭킹 데이터 불러오기 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  // 사용자 아바타 생성 함수 (userId 기반)
  const getUserAvatar = (userId: string) => {
    const avatars = ["🦸‍♂️", "🧙‍♀️", "🦊", "🐻", "🐱", "🎓", "💪", "🐝", "🎯", "😊"]
    const hash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return avatars[hash % avatars.length]
  }

  // 사용자 이름 생성 함수 (userId 기반)
  const getUserName = (userId: string) => {
    return userId.length > 10 ? `${userId.substring(0, 8)}...` : userId
  }

  // 레벨 계산 함수 (XP 기반)
  const calculateLevel = (xp: number) => {
    return Math.floor(xp / 500) + 1
  }

  const renderPagination = (
    currentPageNum: number,
    totalPagesNum: number,
    onPageChange: (p: number) => void
  ) => {
    if (totalPagesNum === 0) return null
    const pages: (number | string)[] = []
    const maxVisible = 5
    if (totalPagesNum <= maxVisible) {
      for (let i = 1; i <= totalPagesNum; i++) pages.push(i)
    } else {
      if (currentPageNum <= 3) {
        pages.push(1, 2, 3, 4, "ellipsis", totalPagesNum)
      } else if (currentPageNum >= totalPagesNum - 2) {
        pages.push(1, "ellipsis", totalPagesNum - 3, totalPagesNum - 2, totalPagesNum - 1, totalPagesNum)
      } else {
        pages.push(1, "ellipsis", currentPageNum - 1, currentPageNum, currentPageNum + 1, "ellipsis", totalPagesNum)
      }
    }

    return (
      <div className="flex justify-center mt-6">
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(currentPageNum - 1)}
            disabled={currentPageNum === 1}
            className={`px-3 py-1 rounded-lg ${currentPageNum === 1 ? "opacity-40" : "hover:bg-gray-100"}`}
          >
            {"<"}
          </button>
          {pages.map((page, idx) =>
            page === "ellipsis" ? (
              <span key={idx} className="px-2">…</span>
            ) : (
              <button
                key={idx}
                onClick={() => onPageChange(page as number)}
                className={`px-3 py-1 rounded-lg ${page === currentPageNum ? "bg-purple-500 text-white" : "hover:bg-gray-100"}`}
              >
                {page}
              </button>
            )
          )}
          <button
            onClick={() => onPageChange(currentPageNum + 1)}
            disabled={currentPageNum === totalPagesNum}
            className={`px-3 py-1 rounded-lg ${currentPageNum === totalPagesNum ? "opacity-40" : "hover:bg-gray-100"}`}
          >
            {">"}
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600">주간 랭킹을 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600">주간 랭킹 데이터가 없습니다.</p>
        </Card>
      ) : (
        data.map((user, index) => (
          <motion.div key={`${user.userId}-${user.rank}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
            <Card className={`p-4 border-2 transition-all ${user.isCurrentUser ? "border-purple-400 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg" : "border-gray-200 bg-white/80 backdrop-blur hover:border-yellow-300 hover:shadow-md"}`}>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {user.rank <= 3 ? (
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getRankColor(user.rank)} flex items-center justify-center text-white shadow-lg`}>
                      {getRankIcon(user.rank)}
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center text-gray-700">
                      #{user.rank}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-1">
                  <div className="text-3xl">{getUserAvatar(user.userId)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-900">{getUserName(user.userId)}</p>
                      {user.isCurrentUser && <Badge className="bg-purple-500 text-white text-xs">나</Badge>}
                    </div>
                      <p className="text-sm text-gray-600">Level {calculateLevel(user.xp ?? 0)}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-purple-600">{(user.xp ?? 0).toLocaleString()} XP</p>
                  <p className="text-xs text-gray-500">{user.streak ?? 0}일 연속</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))
      )}

      {/* ✅ 페이지네이션 */}
      {renderPagination(currentPage, totalPages, setCurrentPage)}
    </div>
  )
}
