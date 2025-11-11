import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { RankingSection } from "./sections/RankingSection"
import { BadgeCollection } from "./sections/BadgeCollection"

export function RankBadgeDashboard() {
  const [activeTab, setActiveTab] = useState("ranking")

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            {/* 원본 그대로 아이콘 */}
            <svg className="w-8 h-8 text-yellow-600" viewBox="0 0 24 24" fill="none"><path d="M8 21h8M12 17v4M7 4h10v3a5 5 0 1 0 0 10H7a5 5 0 1 0 0-10V4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <h1 className="text-purple-900">랭킹 & 뱃지</h1>
          </div>
          <p className="text-gray-600">최고의 학습자가 되어보세요! 🏆✨</p>
        </div>

        <Tabs defaultValue="ranking" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur border-2 border-purple-200">
            <TabsTrigger
              value="ranking"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white"
            >
              🏆 랭킹
            </TabsTrigger>
            <TabsTrigger
              value="badges"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
            >
              🎖️ 뱃지
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ranking">
            <RankingSection />
          </TabsContent>

          <TabsContent value="badges">
            <BadgeCollection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
