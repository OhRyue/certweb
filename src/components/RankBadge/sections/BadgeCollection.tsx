import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { Card } from "../../ui/card"
import { Badge as UiBadge } from "../../ui/badge"
import { Progress } from "../../ui/progress"
import { Award, CheckCircle, Lock } from "lucide-react"
import { getRarityColor, getRarityLabel } from "../hooks/useRankingData"
import { getMyBadges, type BadgeInfo } from "../../api/badgeApi"

// 배지 코드별 아이콘과 설명 매핑
const badgeMetadata: Record<string, { icon: string; description: string }> = {
  FIRST_STUDY: { icon: "👣", description: "첫 학습 세션(MICRO/REVIEW) 완료" },
  CONSISTENT_3DAYS: { icon: "📅", description: "3일 연속 학습" },
  CONSISTENT_7DAYS: { icon: "📆", description: "7일 연속 학습" },
  ACCURACY_MASTER: { icon: "🎯", description: "정답률 80% 이상 10회" },
  WRITTEN_EXPERT: { icon: "✍️", description: "필기 REVIEW 90점 이상 5회" },
  PRACTICAL_PERFECT: { icon: "💯", description: "실기 MICRO 100점 3회" },
  DUEL_STREAK_3: { icon: "⚔️", description: "1:1 배틀 3연승" },
  TOURNAMENT_WINNER: { icon: "🏆", description: "8인 토너먼트 우승" },
  GOLDENBELL_WINNER: { icon: "🔔", description: "골든벨 최종 우승" },
  XP_10000: { icon: "⭐", description: "총 XP ≥ 10000" },
}

interface BadgeDisplay extends BadgeInfo {
  icon: string
  description: string
  earned: boolean
  earnedDate?: string
}

export function BadgeCollection() {
  const [badgeFilter, setBadgeFilter] = useState("all")
  const [badges, setBadges] = useState<BadgeDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalEarned: 0, totalAvailable: 0 })

  useEffect(() => {
    fetchBadges()
  }, [])

  const fetchBadges = async () => {
    try {
      setLoading(true)
      const response = await getMyBadges()
      
      // catalog를 기반으로 배지 목록 생성
      const badgeMap = new Map<string, BadgeDisplay>()
      
      // catalog의 모든 배지를 기본으로 추가
      response.catalog.forEach((badge) => {
        const metadata = badgeMetadata[badge.code] || { icon: "🎖️", description: "" }
        badgeMap.set(badge.code, {
          ...badge,
          ...metadata,
          earned: badge.owned || false,
        })
      })
      
      // earned 배열의 정보로 업데이트 (earnedAt 추가)
      response.earned.forEach((earnedBadge) => {
        const existing = badgeMap.get(earnedBadge.code)
        if (existing) {
          existing.earned = true
          existing.earnedAt = earnedBadge.earnedAt
          // earnedAt을 한국어 날짜 형식으로 변환
          if (earnedBadge.earnedAt) {
            const date = new Date(earnedBadge.earnedAt)
            existing.earnedDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`
          }
        }
      })
      
      setBadges(Array.from(badgeMap.values()))
      setStats({
        totalEarned: response.stats.totalEarned,
        totalAvailable: response.stats.totalAvailable,
      })
    } catch (error) {
      console.error("뱃지 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBadges =
    badgeFilter === "all"
      ? badges
      : badgeFilter === "earned"
      ? badges.filter(b => b.earned)
      : badges.filter(b => !b.earned)

  const earned = stats.totalEarned
  const total = stats.totalAvailable

  return (
    <div className="space-y-6">
      <Card className="p-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-purple-600" />
            <div>
              <h3 className="text-purple-900">뱃지 수집 진행도</h3>
              <p className="text-sm text-gray-600">{earned} / {total} 획득</p>
            </div>
          </div>
          <div className="text-3xl">{total > 0 ? Math.round(earned / total * 100) : 0}%</div>
        </div>
        <Progress value={total > 0 ? earned / total * 100 : 0} className="h-3" />
      </Card>

      <Card className="p-4 border-2 border-purple-200 bg-white/80 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: "전체", icon: "🎯" },
            { id: "earned", label: "획득", icon: "✅" },
            { id: "locked", label: "미획득", icon: "🔒" },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setBadgeFilter(f.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                badgeFilter === f.id
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              <span>{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>
      </Card>

      {loading ? (
        <Card className="p-12 text-center border-2 border-purple-200 bg-white/80">
          <div className="text-5xl mb-4">🎖️</div>
          <p className="text-gray-600">뱃지를 불러오는 중...</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBadges.map((badge, i) => (
              <motion.div key={badge.code} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                <Card className={`p-6 border-2 transition-all ${badge.earned ? "border-purple-300 bg-white/90 hover:shadow-lg hover:scale-105" : "border-gray-300 bg-gray-50/50 opacity-75"}`}>
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${getRarityColor(badge.rarity)} flex items-center justify-center text-4xl shadow-lg ${!badge.earned ? "grayscale" : ""}`}>
                        {badge.earned ? badge.icon : <Lock className="w-8 h-8 text-white" />}
                      </div>
                      {badge.earned && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>

                    <UiBadge className={`mb-2 text-xs bg-gradient-to-r ${getRarityColor(badge.rarity)} text-white border-0`}>
                      {getRarityLabel(badge.rarity)}
                    </UiBadge>
                    <h3 className={`text-gray-900 mb-2 ${!badge.earned ? "text-gray-500" : ""}`}>{badge.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{badge.description}</p>

                    {badge.earned && badge.earnedDate ? (
                      <div className="flex items-center gap-2 text-xs text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        {badge.earnedDate} 획득
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Lock className="w-4 h-4" />
                        잠김
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredBadges.length === 0 && (
            <Card className="p-12 text-center border-2 border-purple-200 bg-white/80">
              <div className="text-5xl mb-4">🎖️</div>
              <p className="text-gray-600">해당하는 뱃지가 없습니다</p>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
