import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion } from "motion/react"
import { Card } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Heart, MessageCircle, Eye, MessageSquare } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination"
import { mockPosts, mockComments } from "./community.mocks"

export function MyPostsScreen() {
  const navigate = useNavigate()
  const location = useLocation()

  const currentUserId = "user123"
  const myPosts = mockPosts.filter(p => p.authorId === currentUserId)
  const myComments = mockComments.filter(c => c.authorId === currentUserId)

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "후기": return "bg-green-100 text-green-700 border-green-300"
      case "꿀팁": return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "스터디": return "bg-blue-100 text-blue-700 border-blue-300"
      case "질문": return "bg-purple-100 text-purple-700 border-purple-300"
      default: return "bg-gray-100 text-gray-700 border-gray-300"
    }
  }

  const [page, setPage] = useState(1)
  const perPage = 10
  const totalPagesRaw = Math.ceil(myPosts.length / perPage)
  const totalPages = Math.max(1, totalPagesRaw)

  useEffect(() => {
    setPage(prev => (prev > totalPages ? totalPages : prev < 1 ? 1 : prev))
  }, [totalPages])

  const current = myPosts.slice((page - 1) * perPage, page * perPage)

  const renderPagination = () => {
    const pages: (number | "ellipsis")[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else if (page <= 3) {
      pages.push(1, 2, 3, 4, "ellipsis", totalPages)
    } else if (page >= totalPages - 2) {
      pages.push(1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages)
    }
    return (
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => page > 1 && setPage(page - 1)}
              className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          {pages.map((p, i) => (
            <PaginationItem key={i}>
              {p === "ellipsis" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  isActive={p === page}
                  onClick={() => setPage(p as number)}
                  className="cursor-pointer"
                >
                  {p}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() => page < totalPages && setPage(page + 1)}
              className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 문구 복원 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-8 h-8 text-purple-600" />
            <h1 className="text-purple-900">커뮤니티 게시판</h1>
          </div>
          <p className="text-gray-600">함께 공부하며 정보를 나눠요 ✨</p>
        </div>

        {/* 상단 메인 탭 게시판 / 내 활동 */}
        <Card className="p-2 border-2 border-purple-200 bg-white/80 backdrop-blur mb-6">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => navigate("/community")}
              className="h-10 px-4 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              📋 게시판
            </button>
            <button
              onClick={() => navigate("/community/myposts")}
              className="h-10 px-4 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm"
            >
              ✍️ 내 활동
            </button>
          </div>
        </Card>

        {/* 내 활동 내부 탭 두 개 */}
        <Card className="p-4 border-2 border-purple-200 bg-white/80 backdrop-blur mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/community/myposts")}
              className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                location.pathname.endsWith("myposts")
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              📝 내가 쓴 글 ({myPosts.length})
            </button>
            <button
              onClick={() => navigate("/community/mycomments")}
              className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                location.pathname.endsWith("mycomments")
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              💬 내가 쓴 댓글 ({myComments.length})
            </button>
          </div>
        </Card>

        {/* 리스트 카드 */}
        <div className="space-y-3">
          {current.map(post => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.01 }}>
              <Card
                className="p-6 border-2 cursor-pointer transition-all hover:shadow-lg border-purple-200 bg-white/80 backdrop-blur hover:border-purple-300"
                onClick={() => navigate(`/community/${post.id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${getCategoryColor(post.category)} border`}>{post.category}</Badge>
                    </div>
                    <h3 className="text-gray-900 mb-3">{post.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{post.author}</span>
                      <span>•</span>
                      <span>{post.createdAt}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-sm">
                    <div className="flex items-center gap-1 text-pink-600">
                      <Heart className={`w-4 h-4 ${post.isLiked ? "fill-pink-500" : ""}`} />
                      <span>{post.likes}</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-600">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}

          {current.length === 0 && (
            <Card className="p-12 text-center border-2 border-purple-200 bg-white/80">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-gray-600">작성한 글이 없습니다</p>
            </Card>
          )}
        </div>

        {renderPagination()}
      </div>
    </div>
  )
}
