import { useEffect, useState } from "react"
import axios from "../api/axiosConfig"
import { Card } from "../ui/card"
import { Badge } from "../ui/badge"
import { motion } from "motion/react"
import { Eye, Heart, MessageCircle, ThumbsUp, Loader2 } from "lucide-react"
import { AxiosError } from "axios"

interface MyPost {
  id: number
  categoryCode: string
  categoryName: string
  title: string
  excerpt: string
  anonymous: boolean
  authorId: string
  authorDisplayName: string
  likeCount: number
  commentCount: number
  viewCount: number
  createdAt: string
}

interface MyComment {
  id: number
  postId: number
  anonymous: boolean
  authorId: string
  authorDisplayName: string
  content: string
  likeCount: number
  likedByMe: boolean
  createdAt: string
  updatedAt: string | null
}

interface PostTitle {
  postId: number
  title: string
}

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
  const [myPosts, setMyPosts] = useState<MyPost[]>([])
  const [myComments, setMyComments] = useState<MyComment[]>([])
  const [postTitles, setPostTitles] = useState<PostTitle[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const postsPerPage = 10

  // 내 활동 데이터 가져오기
  useEffect(() => {
    fetchMyActivity()
  }, [])

  // 댓글의 게시글 제목 가져오기
  useEffect(() => {
    if (myComments.length > 0) {
      fetchPostTitles()
    }
  }, [myComments])

  const fetchMyActivity = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await axios.get("/community/posts/my/activity", {
        params: {
          // 파라미터를 전달하지 않으면 모든 데이터를 불러옴
        }
      })
      setMyPosts(res.data.myPosts || [])
      setMyComments(res.data.myComments || [])
    } catch (err) {
      console.error("내 활동 불러오기 실패", err)
      const errorMessage =
        err instanceof AxiosError && err.response?.data?.message
          ? err.response.data.message
          : "내 활동을 불러오는데 실패했습니다."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // 각 댓글의 postId로 게시글 제목 가져오기 (병렬 처리)
  const fetchPostTitles = async () => {
    // 중복 제거된 postId 목록
    const uniquePostIds = Array.from(new Set(myComments.map(c => c.postId)))
    
    // 이미 가져온 postId는 제외
    const existingPostIds = postTitles.map(pt => pt.postId)
    const postIdsToFetch = uniquePostIds.filter(id => !existingPostIds.includes(id))
    
    if (postIdsToFetch.length === 0) return

    try {
      const titleResponses = await Promise.all(
        postIdsToFetch.map(postId =>
          axios.get(`/community/posts/${postId}`, {
            params: {
              commentSize: 1 // 최소 1이 필요함
            }
          })
            .then(res => ({ postId, title: res.data.post?.title || "제목 없음" }))
            .catch(() => ({ postId, title: "제목을 불러올 수 없습니다" }))
        )
      )
      
      setPostTitles(prev => [...prev, ...titleResponses])
    } catch (err) {
      console.error("게시글 제목 불러오기 실패", err)
    }
  }

  const getPostTitle = (postId: number): string => {
    const postTitle = postTitles.find(pt => pt.postId === postId)
    return postTitle?.title || "로딩 중..."
  }

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

      {/* 에러 메시지 */}
      {error && (
        <Card className="p-4 border-2 border-red-200 bg-red-50">
          <p className="text-red-700 text-sm">{error}</p>
        </Card>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <Card className="p-12 text-center border-2 border-purple-200 bg-white/80">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-gray-600">내 활동을 불러오는 중...</p>
        </Card>
      )}

      {/* 내가 쓴 글 */}
      {!isLoading && myActivityTab === "posts" && (
        <>
          {currentMyPosts.length === 0 ? (
            <Card className="p-12 text-center border-2 border-purple-200 bg-white/80">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-gray-600">작성한 게시글이 없습니다</p>
            </Card>
          ) : (
            <>
              {currentMyPosts.map(post => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.01 }}>
                  <Card
                    className="p-6 border-2 cursor-pointer transition-all hover:shadow-lg border-purple-200 bg-white/80 backdrop-blur hover:border-purple-300"
                    onClick={() => onPostClick(post.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Badge className={`${getCategoryColor(post.categoryName)} border`}>
                          {post.categoryName}
                        </Badge>
                        <h3 className="text-gray-900 mt-2 mb-3">{post.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{post.excerpt}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{post.authorDisplayName}</span>•
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>•
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
              {renderPagination(myPostsPage, totalMyPostsPages, setMyPostsPage)}
            </>
          )}
        </>
      )}

      {/* 내가 쓴 댓글 */}
      {!isLoading && myActivityTab === "comments" && (
        <>
          {currentMyComments.length === 0 ? (
            <Card className="p-12 text-center border-2 border-purple-200 bg-white/80">
              <div className="text-5xl mb-4">💬</div>
              <p className="text-gray-600">작성한 댓글이 없습니다</p>
            </Card>
          ) : (
            <>
              {currentMyComments.map(comment => {
                const postTitle = getPostTitle(comment.postId)
                return (
                  <motion.div key={comment.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.01 }}>
                    <Card
                      className="p-6 border-2 cursor-pointer transition-all hover:shadow-lg border-purple-200 bg-white/80 backdrop-blur hover:border-purple-300"
                      onClick={() => onPostClick(comment.postId)}
                    >
                      <div className="mb-3 pb-3 border-b border-gray-200">
                        <p className="text-sm text-gray-500 mb-1">댓글 단 게시글</p>
                        <p className="text-sm text-gray-900">{postTitle}</p>
                      </div>
                      <p className="text-gray-800 mb-3">{comment.content}</p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                          <span>{comment.authorDisplayName}</span>•
                          <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-pink-600">
                          <ThumbsUp className={`w-3 h-3 ${comment.likedByMe ? "fill-pink-500" : ""}`} />
                          <span>{comment.likeCount}</span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
              {renderPagination(myCommentsPage, totalMyCommentsPages, setMyCommentsPage)}
            </>
          )}
        </>
      )}
    </div>
  )
}
