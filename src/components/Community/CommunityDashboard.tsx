import { useState } from "react"
import { useNavigate, Outlet } from "react-router-dom"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs"
import { MessageSquare } from "lucide-react"
import { AnimatePresence } from "motion/react"
import { CommunityWriteModal } from "./CommunityWriteModal"
import { PostListSection } from "./PostListSection"
import { MyActivitySection } from "./MyActivitySection"

export function CommunityDashboard() {
  const [mainTab, setMainTab] = useState<"board" | "myActivity">("board")
  const [activeTab, setActiveTab] = useState("all")
  const [showWritePost, setShowWritePost] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [myActivityTab, setMyActivityTab] = useState<"posts" | "comments">("posts")
  const [currentPage, setCurrentPage] = useState(1)
  const [myPostsPage, setMyPostsPage] = useState(1)
  const [myCommentsPage, setMyCommentsPage] = useState(1)
  const navigate = useNavigate()

  // 게시글 클릭 시 URL 이동 (ex: /community/1)
  const handlePostClick = (id: number) => navigate(`/community/${id}`)

  // Pagination 공통 함수
  const renderPagination = (currentPageNum: number, totalPagesNum: number, onPageChange: (p: number) => void) => {
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
          <button onClick={() => onPageChange(currentPageNum - 1)} disabled={currentPageNum === 1} className={`px-3 py-1 rounded-lg ${currentPageNum === 1 ? "opacity-40" : "hover:bg-gray-100"}`}>
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
          <button onClick={() => onPageChange(currentPageNum + 1)} disabled={currentPageNum === totalPagesNum} className={`px-3 py-1 rounded-lg ${currentPageNum === totalPagesNum ? "opacity-40" : "hover:bg-gray-100"}`}>
            {">"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-8 h-8 text-purple-600" />
            <h1 className="text-purple-900">커뮤니티 게시판</h1>
          </div>
          <p className="text-gray-600">함께 공부하며 정보를 나눠요! ✨</p>
        </div>

        {/* 글쓰기 모달 */}
        <AnimatePresence>
          {showWritePost && (
            <CommunityWriteModal onClose={() => setShowWritePost(false)} />
          )}
        </AnimatePresence>

        {/* 게시판 & 내활동 탭 */}
        <Tabs value={mainTab} onValueChange={v => setMainTab(v as any)} className="mb-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur border-2 border-purple-200">
            <TabsTrigger value="board" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              📋 게시판
            </TabsTrigger>
            <TabsTrigger value="myActivity" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              ✍️ 내 활동
            </TabsTrigger>
          </TabsList>

          <TabsContent value="board" className="mt-6">
            <PostListSection
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              setShowWritePost={setShowWritePost}
              onPostClick={handlePostClick}
              renderPagination={renderPagination}
            />
          </TabsContent>

          <TabsContent value="myActivity" className="mt-6">
            <MyActivitySection
              myActivityTab={myActivityTab}
              setMyActivityTab={setMyActivityTab}
              myPostsPage={myPostsPage}
              setMyPostsPage={setMyPostsPage}
              myCommentsPage={myCommentsPage}
              setMyCommentsPage={setMyCommentsPage}
              onPostClick={handlePostClick}
              renderPagination={renderPagination}
            />
          </TabsContent>
        </Tabs>

        {/* 모달 라우팅 */}
        <Outlet />
      </div>
    </div>
  )
}
