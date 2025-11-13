import { Card } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { motion } from "motion/react"
import { Search, TrendingUp, Eye, Heart, MessageCircle, Pin, Clock } from "lucide-react"
import { mockPosts } from "./community.mocks"

export function PostListSection({ activeTab, setActiveTab, searchQuery, setSearchQuery, currentPage, setCurrentPage, setShowWritePost, renderPagination,  onPostClick}: any) {
  const categories = ["전체", "후기", "꿀팁", "스터디", "질문", "자유"]

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "후기": return "bg-green-100 text-green-700 border-green-300"
      case "꿀팁": return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "스터디": return "bg-blue-100 text-blue-700 border-blue-300"
      case "질문": return "bg-purple-100 text-purple-700 border-purple-300"
      default: return "bg-gray-100 text-gray-700 border-gray-300"
    }
  }

  const filteredPosts = mockPosts.filter(post => {
    if (activeTab !== "all" && post.category !== activeTab) return false
    if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const perPage = 10
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / perPage))
  const currentPosts = filteredPosts.slice((currentPage - 1) * perPage, currentPage * perPage)

  return (
    <div className="space-y-4">
      {/* 카테고리 / 글쓰기 */}
      <Card className="p-4 border-2 border-purple-200 bg-white/80 backdrop-blur mb-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 flex flex-wrap items-center gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setActiveTab(cat === "전체" ? "all" : cat)
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
            onClick={() => setShowWritePost(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg whitespace-nowrap"
          >
            글쓰기
          </Button>
        </div>
      </Card>

      {/* 검색 */}
      <Card className="p-4 border-2 border-purple-200 bg-white/80 backdrop-blur">
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

      {/* 인기글 */}
      <Card className="p-6 border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="flex items-center gap-3 mb-3">
          <TrendingUp className="w-5 h-5 text-orange-600" />
          <h3 className="text-orange-900">🔥 인기 게시글</h3>
        </div>
        <div className="space-y-2">
          {mockPosts.slice(0, 3).map((post, idx) => (
            <button
              key={post.id}
              onClick={() => onPostClick(post.id)}
              className="w-full text-left text-sm text-gray-700 hover:text-orange-700 transition-colors"
            >
              {idx + 1}. {post.title}
            </button>
          ))}
        </div>
      </Card>

      {/* 게시글 목록 */}
      <div className="space-y-3">
        {currentPosts.map(post => (
          <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.01 }}>
            <Card
              className={`p-6 border-2 cursor-pointer transition-all hover:shadow-lg ${post.isPinned
                ? "border-red-200 bg-gradient-to-r from-red-50 to-pink-50"
                : "border-purple-200 bg-white/80 backdrop-blur hover:border-purple-300"
                }`}
              onClick={() => onPostClick(post.id)}
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
                    <span>{post.author}</span>•<span>{post.createdAt}</span>•
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

        {currentPosts.length === 0 && (
          <Card className="p-12 text-center border-2 border-purple-200 bg-white/80">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-600">게시글이 없습니다</p>
          </Card>
        )}
      </div>

      {renderPagination(currentPage, totalPages, setCurrentPage)}
    </div>
  )
}
