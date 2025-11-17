import { useEffect, useState } from "react"
import axios from "../api/axiosConfig"
import { Card } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { motion } from "motion/react"
import { Search, TrendingUp, Eye, Heart, MessageCircle, Pin } from "lucide-react"

export function PostListSection({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  currentPage,
  setCurrentPage,
  setShowWritePost,
  renderPagination,
  onPostClick
}: any) {

  const [categories, setCategories] = useState([])
  const [posts, setPosts] = useState([])
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [activeTab, searchQuery, currentPage])

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/community/categories")
      setCategories(res.data.categories || [])
    } catch (err) {
      console.error("카테고리 불러오기 실패", err)
    }
  }

  const fetchPosts = async () => {
    try {
      const params: any = {
        page: currentPage - 1,
        size: 10,
        sort: "LATEST",
        today: false,
        anonymousOnly: false,
        mine: false
      }

      if (activeTab !== "all") params.category = activeTab
      if (searchQuery) params.keyword = searchQuery

      const res = await axios.get("/community/posts", { params })

      setPosts(res.data.items || [])
      setTotalPages(res.data.page?.totalPages || 1)

    } catch (err) {
      console.error("게시글 목록 불러오기 실패", err)
    }
  }


  const getCategoryColor = (category: string) => {
    switch (category) {
      case "후기": return "bg-green-100 text-green-700 border-green-300"
      case "꿀팁": return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "스터디": return "bg-blue-100 text-blue-700 border-blue-300"
      case "질문": return "bg-purple-100 text-purple-700 border-purple-300"
      default: return "bg-gray-100 text-gray-700 border-gray-300"
    }
  }

  return (
    <div className="space-y-4">

      {/* 카테고리 UI 그대로 */}
      <Card className="p-4 border-2 border-purple-200 bg-white/80 backdrop-blur mb-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 flex flex-wrap items-center gap-2">

            <button
              onClick={() => {
                setActiveTab("all")
                setCurrentPage(1)
              }}
              className={`px-4 py-2 rounded-lg transition-all ${activeTab === "all"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
            >
              전체
            </button>

            {categories.map(cat => (
              <button
                key={cat.code}
                onClick={() => {
                  setActiveTab(cat.code)
                  setCurrentPage(1)
                }}
                className={`px-4 py-2 rounded-lg transition-all ${activeTab === cat.code
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
              >
                {cat.name}
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

      {/* 검색창 UI 그대로 */}
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

      {/* 인기글 UI 그대로 (mockPosts → posts로 대체 가능하지만 변경 안 함) */}
      <Card className="p-6 border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="flex items-center gap-3 mb-3">
          <TrendingUp className="w-5 h-5 text-orange-600" />
          <h3 className="text-orange-900">🔥 인기 게시글</h3>
        </div>
        <div className="space-y-2">
          {posts.slice(0, 3).map((post, idx) => (
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

      {/* 실제 게시글 목록 */}
      <div className="space-y-3">
        {posts.map(post => (
          <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.01 }}>
            <Card
              className={`p-6 border-2 cursor-pointer transition-all hover:shadow-lg ${false
                ? "border-red-200 bg-gradient-to-r from-red-50 to-pink-50"
                : "border-purple-200 bg-white/80 backdrop-blur hover:border-purple-300"
                }`}
              onClick={() => onPostClick(post.id)}
            >
              <div className="flex items-start justify-between gap-4">

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`${getCategoryColor(post.categoryName)} border`}>
                      {post.categoryName}
                    </Badge>
                  </div>

                  <h3 className="text-gray-900 mb-3">{post.title}</h3>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{post.authorDisplayName}</span>
                    •
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    •
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {post.viewCount}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 text-sm">
                  <div className="flex items-center gap-1 text-pink-600">
                    <Heart className="w-4 h-4" />
                    <span>{post.likeCount}</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600">
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.commentCount}</span>
                  </div>
                </div>

              </div>
            </Card>
          </motion.div>
        ))}

        {posts.length === 0 && (
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
