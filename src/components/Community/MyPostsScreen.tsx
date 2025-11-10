import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { Card } from "../ui/card"
import { Badge } from "../ui/badge"
import { Heart, MessageCircle, Eye } from "lucide-react"
import { mockPosts } from "./community.mocks"

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

export function MyPostsScreen() {
  const navigate = useNavigate()
  const currentUserId = "user123"
  const list = mockPosts.filter(p => p.authorId === currentUserId)

  const [page, setPage] = useState(1)
  const perPage = 10
  const totalPages = Math.ceil(list.length / perPage)
  const paged = list.slice((page - 1) * perPage, page * perPage)

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl text-purple-900 font-semibold mb-4">내가 쓴 글</h1>

        {paged.length === 0 ? (
          <Card className="p-12 text-center border-2 border-purple-200 bg-white/80">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-600">작성한 글이 없습니다</p>
          </Card>
        ) : (
          paged.map(post => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card
                className="p-6 border-2 border-purple-200 bg-white/80 backdrop-blur hover:border-purple-300 transition-all cursor-pointer"
                onClick={() => navigate(`/community/${post.id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${getCategoryColor(post.category)} border`}>{post.category}</Badge>
                      {post.isPinned && <Badge className="bg-red-100 text-red-700 border-red-300">공지</Badge>}
                    </div>
                    <h3 className="text-gray-900 mb-2">{post.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{post.createdAt}</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {post.views}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end text-sm">
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
          ))
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className={`px-4 py-2 rounded-lg border ${
                page === 1 ? "opacity-40 cursor-not-allowed" : "border-purple-300 hover:bg-purple-50"
              }`}
            >
              이전
            </button>
            <span className="text-purple-700 font-medium">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className={`px-4 py-2 rounded-lg border ${
                page === totalPages ? "opacity-40 cursor-not-allowed" : "border-purple-300 hover:bg-purple-50"
              }`}
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
