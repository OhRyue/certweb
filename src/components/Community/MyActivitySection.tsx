import { Card } from "../ui/card"
import { Badge } from "../ui/badge"
import { motion } from "motion/react"
import { Eye, Heart, MessageCircle, ThumbsUp } from "lucide-react"
import { mockPosts, mockComments } from "./community.mocks"

export function MyActivitySection({
  myActivityTab,
  setMyActivityTab,
  myPostsPage,
  setMyPostsPage,
  myCommentsPage,
  setMyCommentsPage,
  onPostClick, 
  renderPagination,
}: any) {
  const currentUserId = "user123"
  const myPosts = mockPosts.filter(p => p.authorId === currentUserId)
  const myComments = mockComments.filter(c => c.authorId === currentUserId)

  const postsPerPage = 10
  const totalMyPostsPages = Math.ceil(myPosts.length / postsPerPage)
  const totalMyCommentsPages = Math.ceil(myComments.length / postsPerPage)

  const currentMyPosts = myPosts.slice((myPostsPage - 1) * postsPerPage, myPostsPage * postsPerPage)
  const currentMyComments = myComments.slice((myCommentsPage - 1) * postsPerPage, myCommentsPage * postsPerPage)

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
      {/* 탭 버튼 */}
      <Card className="p-4 border-2 border-purple-200 bg-white/80 backdrop-blur mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMyActivityTab("posts")}
            className={`flex-1 px-4 py-2 rounded-lg transition-all ${myActivityTab === "posts"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
          >
            📝 내가 쓴 글 ({myPosts.length})
          </button>
          <button
            onClick={() => setMyActivityTab("comments")}
            className={`flex-1 px-4 py-2 rounded-lg transition-all ${myActivityTab === "comments"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
          >
            💬 내가 쓴 댓글 ({myComments.length})
          </button>
        </div>
      </Card>

      {/* 내가 쓴 글 */}
      {myActivityTab === "posts" && (
        <>
          {currentMyPosts.map(post => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.01 }}>
              <Card
                className="p-6 border-2 cursor-pointer transition-all hover:shadow-lg border-purple-200 bg-white/80 backdrop-blur hover:border-purple-300"
                onClick={() => onPostClick(post.id)} // ✅ 수정됨
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Badge className={`${getCategoryColor(post.category)} border`}>{post.category}</Badge>
                    <h3 className="text-gray-900 mt-2 mb-3">{post.title}</h3>
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
          {renderPagination(myPostsPage, totalMyPostsPages, setMyPostsPage)}
        </>
      )}

      {/* 내가 쓴 댓글 */}
      {myActivityTab === "comments" && (
        <>
          {currentMyComments.map(comment => {
            const relatedPost = mockPosts.find(p => p.id === comment.postId)
            return (
              <motion.div key={comment.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.01 }}>
                <Card
                  className="p-6 border-2 cursor-pointer transition-all hover:shadow-lg border-purple-200 bg-white/80 backdrop-blur hover:border-purple-300"
                  onClick={() => relatedPost && onPostClick(relatedPost.id)} // ✅ 수정됨
                >
                  {relatedPost && (
                    <div className="mb-3 pb-3 border-b border-gray-200">
                      <p className="text-sm text-gray-500 mb-1">댓글 단 게시글</p>
                      <p className="text-sm text-gray-900">{relatedPost.title}</p>
                    </div>
                  )}
                  <p className="text-gray-800 mb-3">{comment.content}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                      <span>{comment.author}</span>•<span>{comment.createdAt}</span>
                    </div>
                    <div className="flex items-center gap-1 text-pink-600">
                      <ThumbsUp className={`w-3 h-3 ${comment.isLiked ? "fill-pink-500" : ""}`} />
                      <span>{comment.likes}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
          {renderPagination(myCommentsPage, totalMyCommentsPages, setMyCommentsPage)}
        </>
      )}
    </div>
  )
}
