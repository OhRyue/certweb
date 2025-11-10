import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { Card } from "../ui/card"
import { ThumbsUp } from "lucide-react"
import { mockPosts, mockComments } from "./community.mocks"

export function MyCommentsScreen() {
  const navigate = useNavigate()
  const currentUserId = "user123"
  const list = mockComments.filter(c => c.authorId === currentUserId)

  const [page, setPage] = useState(1)
  const perPage = 10
  const totalPages = Math.ceil(list.length / perPage)
  const paged = list.slice((page - 1) * perPage, page * perPage)

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl text-purple-900 font-semibold mb-4">내가 쓴 댓글</h1>

        {paged.length === 0 ? (
          <Card className="p-12 text-center border-2 border-purple-200 bg-white/80">
            <div className="text-5xl mb-4">😶</div>
            <p className="text-gray-600">작성한 댓글이 없습니다</p>
          </Card>
        ) : (
          paged.map(comment => {
            const relatedPost = mockPosts.find(p => p.id === comment.postId)
            return (
              <motion.div key={comment.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card
                  className="p-6 border-2 border-purple-200 bg-white/80 backdrop-blur hover:border-purple-300 transition-all cursor-pointer"
                  onClick={() => relatedPost && navigate(`/community/${relatedPost.id}`)}
                >
                  {relatedPost && (
                    <div className="mb-3 pb-3 border-b border-gray-200">
                      <p className="text-sm text-gray-500 mb-1">댓글 단 게시글</p>
                      <p className="text-sm text-gray-900">{relatedPost.title}</p>
                    </div>
                  )}
                  <p className="text-gray-800 mb-3">{comment.content}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{comment.createdAt}</span>
                    <div className="flex items-center gap-1 text-pink-600">
                      <ThumbsUp className={`w-3 h-3 ${comment.isLiked ? "fill-pink-500" : ""}`} />
                      <span>{comment.likes}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })
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
