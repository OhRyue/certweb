import { useNavigate, useParams } from "react-router-dom"
import { mockPosts, mockComments } from "./community.mocks"
import { motion } from "motion/react"
import { X, Heart, MessageCircle, Eye, Clock, Send, ThumbsUp, Pin } from "lucide-react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Textarea } from "../ui/textarea"

export function CommunityDetailModal() {
  const navigate = useNavigate()
  const { postId } = useParams()
  const post = mockPosts.find((p) => p.id === Number(postId))
  const comments = mockComments.filter((c) => c.postId === Number(postId))

  if (!post) return null

  // ✅ 대시보드와 동일한 배지 색 함수 추가
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

  return (
    <motion.div
      key="detail"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={() => navigate("/community")}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* 헤더 */}
        <div className="flex justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {/* ✅ 카테고리 색상 적용 */}
              <Badge className={`${getCategoryColor(post.category)} border`}>
                {post.category}
              </Badge>

              {post.isPinned && (
                <Badge className="bg-red-100 text-red-700 border-red-300">
                  <Pin className="w-3 h-3 mr-1" /> 공지
                </Badge>
              )}
            </div>
            <h2 className="text-gray-900 mb-3">{post.title}</h2>
            <div className="flex gap-4 text-sm text-gray-600">
              <span>{post.author}</span>•{" "}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {post.createdAt}
              </span>
              •
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" /> {post.views}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/community")}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* 본문 */}
        <div className="mb-6 p-6 bg-gray-50 rounded-lg text-gray-800 whitespace-pre-wrap">
          {post.content}
        </div>

        {/* 좋아요 / 댓글 */}
        <div className="flex gap-3 mb-8 pb-6 border-b">
          <Button
            variant="outline"
            className={`flex-1 ${
              post.isLiked
                ? "border-pink-300 bg-pink-50 text-pink-700"
                : "border-gray-200 hover:border-pink-300"
            }`}
          >
            <Heart
              className={`w-4 h-4 mr-2 ${
                post.isLiked ? "fill-pink-500 text-pink-500" : ""
              }`}
            />
            좋아요 {post.likes}
          </Button>
          <Button variant="outline" className="flex-1 border-gray-200">
            <MessageCircle className="w-4 h-4 mr-2" />
            댓글 {comments.length}
          </Button>
        </div>

        {/* 댓글 목록 */}
        <h3 className="text-purple-900 mb-4">💬 댓글 {comments.length}</h3>
        {comments.map((c) => (
          <div key={c.id} className="p-4 bg-gray-50 rounded-lg mb-3">
            <div className="flex justify-between mb-1">
              <div className="text-sm text-gray-900">{c.author}</div>
              <div className="flex items-center text-pink-600 text-xs">
                <ThumbsUp className={`w-3 h-3 mr-1 ${c.isLiked ? "fill-pink-500" : ""}`} />
                {c.likes}
              </div>
            </div>
            <p className="text-sm text-gray-700">{c.content}</p>
          </div>
        ))}

        {/* 댓글 입력 */}
        <div className="mt-4 space-y-3">
          <Textarea
            placeholder="댓글을 입력하세요..."
            className="border-purple-200 focus:border-purple-400"
          />
          <div className="flex justify-end">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <Send className="w-4 h-4 mr-2" />
              댓글 작성
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
