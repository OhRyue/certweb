import { useNavigate, Outlet } from "react-router-dom"
import { useEffect, useState } from "react"
import { Card } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination"
import { PenSquare, Search, TrendingUp, Eye, Heart, MessageCircle, Pin, Clock, MessageSquare } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { mockPosts } from "./community.mocks"

export function CommunityListPage() {
  const navigate = useNavigate()

  const categories = ["전체", "후기", "꿀팁", "스터디", "질문", "자유"]
  const [activeTab, setActiveTab] = useState<"all" | "후기" | "꿀팁" | "스터디" | "질문" | "자유">("all")
  const [searchQuery, setSearchQuery] = useState("")

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "후기":
        return "bg-green-100 text-green-700 border-green-300"
      case "꿀팁":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "스터디":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "질문":
        return "bg-purple-100 text-purple-700 border-purple-300"
      default:
        return "bg-gray-100 text-gray-700 border-gray-300"
    }
  }

  const filteredPosts = mockPosts.filter(p => {
    if (activeTab !== "all" && p.category !== activeTab) return false
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 10

  // 총 페이지 최소 1 보장
  const totalPagesRaw = Math.ceil(filteredPosts.length / perPage)
  const totalPages = Math.max(1, totalPagesRaw)

  // 현재 페이지 보정
  useEffect(() => {
    setCurrentPage((prev) => {
      if (prev < 1) return 1
      if (prev > totalPages) return totalPages
      return prev
    })
  }, [totalPages])

  // 현재 페이지의 아이템
  const pageItems = filteredPosts.slice((currentPage - 1) * perPage, currentPage * perPage)

 const renderPagination = () => {
  // 이제 최소 1이라서 바로 진행
  const pages = [] as (number | "ellipsis")[]
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, "ellipsis", totalPages)
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages)
    }
  }
  return (
    <Pagination className="mt-6">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>

        {pages.map((p, i) => (
          <PaginationItem key={i}>
            {p === "ellipsis" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                isActive={p === currentPage}
                onClick={() => setCurrentPage(p as number)}
                className="cursor-pointer"
              >
                {p}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-6xl mx-auto relative">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-8 h-8 text-purple-600" />
            <h1 className="text-purple-900">커뮤니티 게시판</h1>
          </div>
          <p className="text-gray-600">함께 공부하며 정보를 나눠요! ✨</p>
        </div>

        <Card className="p-4 border-2 border-purple-200 bg-white/80 backdrop-blur mb-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 flex flex-wrap items-center gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveTab(cat === "전체" ? "all" : (cat as any))
                    setCurrentPage(1)
                  }}
                  className={`px-4 py-2 rounded-lg transition-all ${(cat === "전체" && activeTab === "all") || activeTab === cat
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <Button
              onClick={() => navigate("write")}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg whitespace-nowrap"
            >
              <PenSquare className="w-4 h-4 mr-2" />
              글쓰기
            </Button>
          </div>
        </Card>

        <Card className="p-4 border-2 border-purple-200 bg-white/80 backdrop-blur mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="게시글 검색..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10 border-purple-200 focus:border-purple-400"
            />
          </div>
        </Card>

        <Card className="p-6 border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <h3 className="text-orange-900">인기 게시글</h3>
          </div>
          <div className="space-y-2">
            {mockPosts.slice(0, 3).map((post, idx) => (
              <button
                key={post.id}
                onClick={() => navigate(`${post.id}`)}
                className="w-full text-left text-sm text-gray-700 hover:text-orange-700 transition-colors"
              >
                {idx + 1}. {post.title}
              </button>
            ))}
          </div>
        </Card>

        <div className="space-y-3">
          {pageItems.map(post => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.01 }}>
              <Card
                className={`p-6 border-2 cursor-pointer transition-all hover:shadow-lg ${post.isPinned
                    ? "border-red-200 bg-gradient-to-r from-red-50 to-pink-50"
                    : "border-purple-200 bg-white/80 backdrop-blur hover:border-purple-300"
                  }`}
                onClick={() => navigate(`${post.id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${getCategoryColor(post.category)} border`}>{post.category}</Badge>
                      {post.isPinned && (
                        <Badge className="bg-red-100 text-red-700 border-red-300">
                          <Pin className="w-3 h-3 mr-1" /> 공지
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-gray-900 mb-3">{post.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{post.author}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {post.createdAt}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {post.views}
                      </span>
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
        </div>

        {renderPagination()}

        <AnimatePresence mode="wait">
          <Outlet />
        </AnimatePresence>
      </div>
    </div>
  )
}
