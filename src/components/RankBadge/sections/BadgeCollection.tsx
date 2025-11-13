import { useState } from "react"
import { motion } from "motion/react"
import { Card } from "../../ui/card"
import { Badge as UiBadge } from "../../ui/badge"
import { Progress } from "../../ui/progress"
import { Award, CheckCircle, Lock } from "lucide-react"
import { mockBadges, getRarityColor, getRarityLabel } from "../hooks/useRankingData"

export function BadgeCollection() {
  const [badgeFilter, setBadgeFilter] = useState("all")

  const filteredBadges =
    badgeFilter === "all"
      ? mockBadges
      : badgeFilter === "earned"
      ? mockBadges.filter(b => b.earned)
      : badgeFilter === "locked"
      ? mockBadges.filter(b => !b.earned)
      : mockBadges.filter(b => b.category === badgeFilter)

  const earned = mockBadges.filter(b => b.earned).length
  const total = mockBadges.length

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
          <div className="text-3xl">{Math.round(earned / total * 100)}%</div>
        </div>
        <Progress value={earned / total * 100} className="h-3" />
      </Card>

      <Card className="p-4 border-2 border-purple-200 bg-white/80 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: "전체", icon: "🎯" },
            { id: "earned", label: "획득", icon: "✅" },
            { id: "locked", label: "미획득", icon: "🔒" },
            { id: "학습", label: "학습", icon: "📚" },
            { id: "출석", label: "출석", icon: "📅" },
            { id: "배틀", label: "배틀", icon: "⚔️" },
            { id: "이벤트", label: "이벤트", icon: "🎉" },
            { id: "커뮤니티", label: "커뮤니티", icon: "💬" },
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBadges.map((badge, i) => (
          <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
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

                {badge.earned ? (
                  <div className="flex items-center gap-2 text-xs text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    {badge.earnedDate} 획득
                  </div>
                ) : badge.progress !== undefined ? (
                  <div className="w-full">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>진행도</span>
                      <span>{badge.progress} / {badge.total}</span>
                    </div>
                    <Progress value={badge.progress / badge.total * 100} className="h-2" />
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
    </div>
  )
}
