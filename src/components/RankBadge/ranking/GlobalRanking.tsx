import { motion } from "motion/react"
import { Card } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { Crown, Medal, Trophy, TrendingUp } from "lucide-react"
import { getRankColor, getRankIcon } from "../hooks/useRankingData"

export function GlobalRanking({ data }: { data: any[] }) {
  return (
    <div className="space-y-6">
      {data.length >= 3 && (
        <Card className="p-8 border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50">
          <div className="flex items-end justify-center gap-4 mb-6">
            {/* 2 */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col items-center">
              <div className="relative mb-3">
                <div className="text-5xl">{data[1].avatar}</div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center text-white shadow-lg">2</div>
              </div>
              <p className="text-gray-900 mb-1">{data[1].name}</p>
              <Badge className="bg-gradient-to-r from-gray-300 to-gray-400 text-white border-0 mb-2">Level {data[1].level}</Badge>
              <p className="text-sm text-gray-600">{data[1].xp.toLocaleString()} XP</p>
              <div className="w-20 h-24 bg-gradient-to-t from-gray-300 to-gray-200 rounded-t-lg mt-3 flex items-center justify-center">
                <Medal className="w-8 h-8 text-gray-600" />
              </div>
            </motion.div>

            {/* 1 */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
              <div className="relative mb-3">
                <div className="text-6xl">{data[0].avatar}</div>
                <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center text-white shadow-lg">1</div>
                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -top-6 left-1/2 -translate-x-1/2">
                  <Crown className="w-8 h-8 text-yellow-500" />
                </motion.div>
              </div>
              <p className="text-gray-900 mb-1">{data[0].name}</p>
              <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-0 mb-2">Level {data[0].level}</Badge>
              <p className="text-sm text-gray-600">{data[0].xp.toLocaleString()} XP</p>
              <div className="w-20 h-32 bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-t-lg mt-3 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-yellow-700" />
              </div>
            </motion.div>

            {/* 3 */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col items-center">
              <div className="relative mb-3">
                <div className="text-5xl">{data[2].avatar}</div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-amber-600 flex items-center justify-center text-white shadow-lg">3</div>
              </div>
              <p className="text-gray-900 mb-1">{data[2].name}</p>
              <Badge className="bg-gradient-to-r from-orange-400 to-amber-600 text-white border-0 mb-2">Level {data[2].level}</Badge>
              <p className="text-sm text-gray-600">{data[2].xp.toLocaleString()} XP</p>
              <div className="w-20 h-20 bg-gradient-to-t from-orange-400 to-orange-300 rounded-t-lg mt-3 flex items-center justify-center">
                <Medal className="w-8 h-8 text-orange-700" />
              </div>
            </motion.div>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {data.map((user, index) => (
          <motion.div key={user.rank} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
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
                  <div className="text-3xl">{user.avatar}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-900">{user.name}</p>
                      {user.isCurrentUser && <Badge className="bg-purple-500 text-white text-xs">나</Badge>}
                    </div>
                    <p className="text-sm text-gray-600">Level {user.level}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-purple-600">{user.xp.toLocaleString()} XP</p>
                  <div className="flex items-center gap-1 justify-end text-xs">
                    {user.change > 0 ? (
                      <>
                        <TrendingUp className="w-3 h-3 text-green-600" />
                        <span className="text-green-600">+{user.change}</span>
                      </>
                    ) : user.change < 0 ? (
                      <>
                        <TrendingUp className="w-3 h-3 text-red-600 rotate-180" />
                        <span className="text-red-600">{user.change}</span>
                      </>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
