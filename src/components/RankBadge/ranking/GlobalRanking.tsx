import { motion } from "motion/react"
import { useState, useEffect } from "react"
import { Card } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { Crown, Medal, Trophy, TrendingUp } from "lucide-react"
import { getRankColor, getRankIcon } from "../hooks/useRankingData"
import { getRankings, type RankingUser } from "../../api/rankingApi"
import { getProfileImage } from "../../../utils/profileUtils"

interface RankingDisplayUser {
  rank: number
  userId: string
  nickname: string
  skinId: number
  xp: number
  score: number
  streak: number
  isCurrentUser: boolean
}

export function GlobalRanking() {
  const [data, setData] = useState<RankingDisplayUser[]>([])
  const [topThree, setTopThree] = useState<RankingDisplayUser[]>([])
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
      
      // top 3개는 항상 첫 페이지에서 가져오기 (포디엄용)
      const fetchTopThree = currentPage === 1
        ? Promise.resolve(null) // 첫 페이지면 현재 요청에서 가져올 예정
        : getRankings({
            scope: "OVERALL",
            page: 0,
            size: 10,
          })

      // 현재 페이지 데이터 가져오기
      const [topThreeResponse, currentPageResponse] = await Promise.all([
        fetchTopThree,
        getRankings({
          scope: "OVERALL",
          page: currentPage - 1, // API는 0-based, UI는 1-based
          size: itemsPerPage,
        }),
      ])

      const response = currentPageResponse
      const topResponse = topThreeResponse || response

      // top 3개는 항상 첫 페이지의 top 3개
      if (currentPage === 1) {
        const top3 = response.top.slice(0, 3).map((user) => ({
          rank: user.rank ?? 0,
          userId: user.userId ?? "",
          nickname: user.nickname ?? "",
          skinId: user.skinId ?? 1,
          xp: user.xp ?? 0,
          score: user.score ?? 0,
          streak: user.streak ?? 0,
          isCurrentUser: response.me?.userId === user.userId,
        }))
        setTopThree(top3)
      } else if (topResponse) {
        const top3 = topResponse.top.slice(0, 3).map((user) => ({
          rank: user.rank ?? 0,
          userId: user.userId ?? "",
          nickname: user.nickname ?? "",
          skinId: user.skinId ?? 1,
          xp: user.xp ?? 0,
          score: user.score ?? 0,
          streak: user.streak ?? 0,
          isCurrentUser: topResponse.me?.userId === user.userId,
        }))
        setTopThree(top3)
      }

      // 현재 페이지 데이터 변환 (현재 사용자 표시 포함)
      const allData = response.top.map((user) => ({
        rank: user.rank ?? 0,
        userId: user.userId ?? "",
        nickname: user.nickname ?? "",
        skinId: user.skinId ?? 1,
        xp: user.xp ?? 0,
        score: user.score ?? 0,
        streak: user.streak ?? 0,
        isCurrentUser: response.me?.userId === user.userId,
      }))

      setData(allData)
      setTotalPages(response.totalPages || 1)
    } catch (error) {
      console.error("랭킹 데이터 불러오기 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  // 페이지네이션 함수 (커뮤니티 동일 버전)
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


  // 레벨 계산 함수 (XP 기반)
  const calculateLevel = (xp: number) => {
    return Math.floor(xp / 500) + 1
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600">랭킹을 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {topThree.length >= 3 && (
        <Card className="p-8 border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50">
          <div className="flex items-end justify-center gap-4 mb-6">
            {/* podium 2,1,3 그대로 유지 */}
            {topThree[1] && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col items-center">
                <div className="relative mb-3">
                  <img 
                    src={getProfileImage(topThree[1].skinId)} 
                    alt={topThree[1].nickname}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                  />
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center text-white shadow-lg">2</div>
                </div>
                <p className="text-gray-900 mb-1">{topThree[1].nickname}</p>
                <Badge className="bg-gradient-to-r from-gray-300 to-gray-400 text-white border-0 mb-2">Level {calculateLevel(topThree[1].xp ?? 0)}</Badge>
                <p className="text-sm text-gray-600">{(topThree[1].xp ?? 0).toLocaleString()} XP</p>
                <div className="w-20 h-24 bg-gradient-to-t from-gray-300 to-gray-200 rounded-t-lg mt-3 flex items-center justify-center">
                  <Medal className="w-8 h-8 text-gray-600" />
                </div>
              </motion.div>
            )}

            {topThree[0] && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
                <div className="relative mb-3">
                  <img 
                    src={getProfileImage(topThree[0].skinId)} 
                    alt={topThree[0].nickname}
                    className="w-20 h-20 rounded-full object-cover border-2 border-yellow-400"
                  />
                  <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center text-white shadow-lg">1</div>
                  <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -top-6 left-1/2 -translate-x-1/2">
                    <Crown className="w-8 h-8 text-yellow-500" />
                  </motion.div>
                </div>
                <p className="text-gray-900 mb-1">{topThree[0].nickname}</p>
                <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-0 mb-2">Level {calculateLevel(topThree[0].xp ?? 0)}</Badge>
                <p className="text-sm text-gray-600">{(topThree[0].xp ?? 0).toLocaleString()} XP</p>
                <div className="w-20 h-32 bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-t-lg mt-3 flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-yellow-700" />
                </div>
              </motion.div>
            )}

            {topThree[2] && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col items-center">
                <div className="relative mb-3">
                  <img 
                    src={getProfileImage(topThree[2].skinId)} 
                    alt={topThree[2].nickname}
                    className="w-16 h-16 rounded-full object-cover border-2 border-orange-400"
                  />
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-amber-600 flex items-center justify-center text-white shadow-lg">3</div>
                </div>
                <p className="text-gray-900 mb-1">{topThree[2].nickname}</p>
                <Badge className="bg-gradient-to-r from-orange-400 to-amber-600 text-white border-0 mb-2">Level {calculateLevel(topThree[2].xp ?? 0)}</Badge>
                <p className="text-sm text-gray-600">{(topThree[2].xp ?? 0).toLocaleString()} XP</p>
                <div className="w-20 h-20 bg-gradient-to-t from-orange-400 to-orange-300 rounded-t-lg mt-3 flex items-center justify-center">
                  <Medal className="w-8 h-8 text-orange-700" />
                </div>
              </motion.div>
            )}
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {data.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">랭킹 데이터가 없습니다.</p>
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
                    <img 
                      src={getProfileImage(user.skinId)} 
                      alt={user.nickname}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-gray-900">{user.nickname}</p>
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
      </div>

      {/* ✅ 페이지네이션 */}
      {renderPagination(currentPage, totalPages, setCurrentPage)}
    </div>
  )
}
