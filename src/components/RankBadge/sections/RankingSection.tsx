import { useState } from "react"
import { Card } from "../../ui/card"
import { Calendar, TrendingUp, Users } from "lucide-react"
import { mockRankings } from "../hooks/useRankingData"
import { GlobalRanking } from "../ranking/GlobalRanking"
import { WeeklyRanking } from "../ranking/WeeklyRanking"
import { HallOfFame } from "../ranking/HallofFame"

export function RankingSection() {
  const [rankingTab, setRankingTab] = useState("overall")
  const current = mockRankings[rankingTab as "overall" | "weekly" | "hallOfFame"]

  return (
    <div className="space-y-6">
      <Card className="p-4 border-2 border-yellow-200 bg-white/80 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setRankingTab("overall")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              rankingTab === "overall"
                ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            종합 랭킹
          </button>
          <button
            onClick={() => setRankingTab("weekly")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              rankingTab === "weekly"
                ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            <Calendar className="w-4 h-4" />
            주간 랭킹
          </button>
          <button
            onClick={() => setRankingTab("hallOfFame")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              rankingTab === "hallOfFame"
                ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            <Users className="w-4 h-4" />
            명예의 전당
          </button>
        </div>
      </Card>

      {rankingTab === "overall" && <GlobalRanking data={current as any[]} />}
      {rankingTab === "weekly" && <WeeklyRanking data={current as any[]} />}
      {rankingTab === "hallOfFame" && <HallOfFame data={mockRankings.hallOfFame} />}
    </div>
  )
}
