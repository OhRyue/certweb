import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { RankingSection } from "./sections/RankingSection"
import { BadgeCollection } from "./sections/BadgeCollection"

export function RankBadgeDashboard() {
  const [activeTab, setActiveTab] = useState("ranking")

  // ✅ Pagination 공통 함수 (커뮤니티 동일 버전)
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
        pages.push(
          1,
          "ellipsis",
          totalPagesNum - 3,
          totalPagesNum - 2,
          totalPagesNum - 1,
          totalPagesNum
        )
      } else {
        pages.push(
          1,
          "ellipsis",
          currentPageNum - 1,
          currentPageNum,
          currentPageNum + 1,
          "ellipsis",
          totalPagesNum
        )
      }
    }

    return (
      <div className="flex justify-center mt-6">
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(currentPageNum - 1)}
            disabled={currentPageNum === 1}
            className={`px-3 py-1 rounded-lg ${
              currentPageNum === 1 ? "opacity-40" : "hover:bg-gray-100"
            }`}
          >
            {"<"}
          </button>

          {pages.map((page, idx) =>
            page === "ellipsis" ? (
              <span key={idx} className="px-2">
                …
              </span>
            ) : (
              <button
                key={idx}
                onClick={() => onPageChange(page as number)}
                className={`px-3 py-1 rounded-lg ${
                  page === currentPageNum
                    ? "bg-purple-500 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(currentPageNum + 1)}
            disabled={currentPageNum === totalPagesNum}
            className={`px-3 py-1 rounded-lg ${
              currentPageNum === totalPagesNum
                ? "opacity-40"
                : "hover:bg-gray-100"
            }`}
          >
            {">"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <svg
              className="w-8 h-8 text-yellow-600"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M8 21h8M12 17v4M7 4h10v3a5 5 0 1 0 0 10H7a5 5 0 1 0 0-10V4z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h1 className="text-purple-900">랭킹 & 뱃지</h1>
          </div>
          <p className="text-gray-600">최고의 학습자가 되어보세요! 🏆✨</p>
        </div>

        <Tabs
          defaultValue="ranking"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
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

          {/* 랭킹 섹션 */}
          <TabsContent value="ranking">
            {/* renderPagination을 props로 넘길 수 있게 준비 */}
            <RankingSection renderPagination={renderPagination} />
          </TabsContent>

          {/* 뱃지 섹션 */}
          <TabsContent value="badges">
            <BadgeCollection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
