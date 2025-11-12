import { motion } from "motion/react"
import { Card } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { Star, Sparkles, Medal, Crown } from "lucide-react"
import { mockRankings, getRankColor } from "../hooks/useRankingData"

export function HallOfFame() {
  const data = mockRankings.hallOfFame

  return (
    <div className="space-y-6">
      <Card className="p-6 border-2 border-yelloaw-300 bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-100">
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">🏛️</div>
          <h2 className="text-amber-900 mb-2">명예의 전당</h2>
          <p className="text-amber-700">역대 최고의 학습자들을 기립니다</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.map((legend, index) => (
          <motion.div key={legend.rank} initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: index * 0.2 }}>
            <Card className="p-8 border-4 border-yellow-400 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 hover:shadow-2xl transition-all relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }} transition={{ duration: 20, repeat: Infinity }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Star className="w-64 h-64 text-yellow-500" />
                </motion.div>
              </div>

              <div className="absolute top-4 right-4">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${getRankColor(legend.rank)} flex items-center justify-center shadow-xl`}>
                  {legend.rank === 1 && <Crown className="w-8 h-8 text-white" />}
                  {legend.rank === 2 && <Medal className="w-7 h-7 text-white" />}
                  {legend.rank === 3 && <Medal className="w-7 h-7 text-white" />}
                </div>
              </div>

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-6">
                  <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-8xl">
                    {legend.avatar}
                  </motion.div>
                  {legend.rank === 1 && (
                    <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -top-12 left-1/2 -translate-x-1/2">
                      <Crown className="w-12 h-12 text-yellow-500" />
                    </motion.div>
                  )}
                </div>

                <h3 className="text-amber-900 mb-4">{legend.name}</h3>

                <div className="w-full space-y-3 mb-6">
                  <div className="bg-white/60 backdrop-blur rounded-lg p-3">
                    <p className="text-xs text-amber-700 mb-1">누적 경험치</p>
                    <p className="text-xl text-amber-900">{legend.totalXP.toLocaleString()} XP</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/60 backdrop-blur rounded-lg p-3">
                      <p className="text-xs text-amber-700 mb-1">레벨</p>
                      <p className="text-lg text-amber-900">{legend.level}</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur rounded-lg p-3">
                      <p className="text-xs text-amber-700 mb-1">업적</p>
                      <p className="text-lg text-amber-900">{legend.achievements}</p>
                    </div>
                  </div>
                </div>

                <Badge className={`bg-gradient-to-r ${getRankColor(legend.rank)} text-white border-0 px-4 py-1`}>
                  {legend.rank === 1 ? "🏆 전설의 1위" : legend.rank === 2 ? "🥈 전설의 2위" : "🥉 전설의 3위"}
                </Badge>
              </div>

              {legend.rank === 1 && (
                <>
                  <motion.div animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0 }} className="absolute top-8 left-8">
                    <Sparkles className="w-6 h-6 text-yellow-500" />
                  </motion.div>
                  <motion.div animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.7 }} className="absolute bottom-8 right-8">
                    <Sparkles className="w-6 h-6 text-yellow-500" />
                  </motion.div>
                </>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
