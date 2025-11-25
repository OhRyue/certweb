import { motion } from "motion/react"
import { useNavigate, useParams } from "react-router-dom"
import { useEffect, useState, useCallback } from "react"
import axios from "../api/axiosConfig"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Textarea } from "../ui/textarea"
import { Input } from "../ui/input"
import { Checkbox } from "../ui/checkbox"
import { Label } from "../ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { X, Heart, MessageCircle, Eye, Send, ThumbsUp, Share2, MoreVertical, Edit, Trash2 } from "lucide-react"

export function CommunityDetailModal() {
  const navigate = useNavigate()
  const { postId } = useParams()

  const [post, setPost] = useState<any>(null)
  const [postContent, setPostContent] = useState("") // 게시글 본문 (API 응답의 content 필드)
  const [comments, setComments] = useState<any[]>([])
  const [content, setContent] = useState("") // 댓글 작성용
  const [isAnonymous, setIsAnonymous] = useState(false) // 익명 체크박스
  const [pending, setPending] = useState(false)
  const [likedByMe, setLikedByMe] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  
  // 게시글 수정 관련 상태
  const [isEditingPost, setIsEditingPost] = useState(false)
  const [editPostTitle, setEditPostTitle] = useState("")
  const [editPostContent, setEditPostContent] = useState("")
  const [editPostAnonymous, setEditPostAnonymous] = useState(false)
  const [editPostPending, setEditPostPending] = useState(false)
  
  // 댓글 수정 관련 상태
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState("")
  const [editIsAnonymous, setEditIsAnonymous] = useState(false)
  const [editPending, setEditPending] = useState(false)

  const fetchPostDetail = useCallback(async () => {
    if (!postId) return
    try {
      const res = await axios.get(`/community/posts/${postId}`, {
        params: {
          commentSize: 100 // 기본값 100
        }
      })
      const data = res.data

      setPost(data.post)
      setPostContent(data.content || "") // API 응답의 content 필드
      setComments(data.comments || [])
      setLikedByMe(data.likedByMe || false)
      setCanEdit(data.canEdit || false)
      
      // 디버깅: canEdit 값 확인
      console.log("게시글 상세 데이터:", data)
      console.log("canEdit 값:", data.canEdit)
    } catch (err) {
      console.error("게시글 상세 불러오기 실패", err)
    }
  }, [postId])

  // load post detail
  useEffect(() => {
    fetchPostDetail()
  }, [fetchPostDetail])

  // 게시글 수정 시작
  const startEditPost = () => {
    if (!post) return
    
    // 권한 체크: canEdit이 false면 수정 불가
    if (!canEdit) {
      alert("작성자만 수정/삭제할 수 있습니다.")
      return
    }
    
    setIsEditingPost(true)
    setEditPostTitle(post.title || "")
    setEditPostContent(postContent)
    setEditPostAnonymous(post.anonymous || false)
  }

  // 게시글 수정 취소
  const cancelEditPost = () => {
    setIsEditingPost(false)
    setEditPostTitle("")
    setEditPostContent("")
    setEditPostAnonymous(false)
  }

  // 게시글 수정 API
  const updatePost = async () => {
    if (!postId || !editPostTitle.trim() || !editPostContent.trim() || editPostPending) return
    setEditPostPending(true)

    try {
      const res = await axios.put(
        `/community/posts/${postId}`,
        {
          title: editPostTitle.trim(),
          content: editPostContent.trim(),
          anonymous: editPostAnonymous
        }
      )

      // 게시글 정보 업데이트
      setPost(res.data)
      setPostContent(editPostContent.trim())

      // 수정 모드 종료
      cancelEditPost()
      
      // 상세 정보 다시 불러오기 (최신 데이터 반영)
      fetchPostDetail()
    } catch (err: any) {
      console.error("게시글 수정 실패", err)
      if (err.response?.data?.message) {
        alert(err.response.data.message)
      }
    } finally {
      setEditPostPending(false)
    }
  }

  // 게시글 삭제 API
  const deletePost = async () => {
    if (!postId || !confirm("정말 삭제하시겠습니까?")) return

    try {
      await axios.delete(`/community/posts/${postId}`)
      
      // 삭제 성공 시 커뮤니티 페이지로 이동
      navigate("/community")
    } catch (err: any) {
      console.error("게시글 삭제 실패", err)
      if (err.response?.data?.message) {
        alert(err.response.data.message)
      }
    }
  }

  // 댓글 작성 API
  const submitComment = async () => {
    if (!content.trim() || pending || !postId) return
    setPending(true)

    try {
      const res = await axios.post(
        `/community/posts/${postId}/comments`,
        {
          anonymous: isAnonymous,
          content: content.trim()
        }
      )

      // 새 댓글을 기존 comments 리스트 맨 위에 추가
      setComments(prev => [res.data, ...prev])
      
      // 게시글의 댓글 개수 증가
      setPost((prev: any) => ({
        ...prev,
        commentCount: (prev?.commentCount || 0) + 1
      }))

      // 입력창 비우기 및 익명 체크박스 초기화
      setContent("")
      setIsAnonymous(false)
    } catch (err) {
      console.error("댓글 작성 실패", err)
    } finally {
      setPending(false)
    }
  }

  // 댓글 수정 시작 (권한 체크 포함)
  const startEditComment = async (comment: any) => {
    try {
      // 권한 체크: 먼저 댓글 수정 API를 호출해서 권한 확인
      // 실제 데이터는 변경하지 않고 권한만 체크하기 위해
      // 현재 내용과 동일한 데이터로 시도
      await axios.put(
        `/community/comments/${comment.id}`,
        {
          anonymous: comment.anonymous || false,
          content: comment.content
        }
      )
      
      // 권한이 있으면 수정 모드로 진입
      setEditingCommentId(comment.id)
      setEditContent(comment.content)
      setEditIsAnonymous(comment.anonymous || false)
    } catch (err: any) {
      console.error("댓글 수정 권한 체크 실패", err)
      if (err.response?.data?.message) {
        alert(err.response.data.message)
      } else {
        alert("작성자만 수정/삭제할 수 있습니다.")
      }
      // 권한이 없으면 수정 모드로 진입하지 않음
    }
  }

  // 댓글 수정 취소
  const cancelEditComment = () => {
    setEditingCommentId(null)
    setEditContent("")
    setEditIsAnonymous(false)
  }

  // 댓글 수정 API
  const updateComment = async (commentId: number) => {
    if (!editContent.trim() || editPending) return
    setEditPending(true)

    try {
      const res = await axios.put(
        `/community/comments/${commentId}`,
        {
          anonymous: editIsAnonymous,
          content: editContent.trim()
        }
      )

      // 댓글 목록 업데이트
      setComments(prev =>
        prev.map(c => (c.id === commentId ? res.data : c))
      )

      // 수정 모드 종료
      cancelEditComment()
    } catch (err: any) {
      console.error("댓글 수정 실패", err)
      if (err.response?.data?.message) {
        alert(err.response.data.message)
      }
    } finally {
      setEditPending(false)
    }
  }

  // 댓글 삭제 API
  const deleteComment = async (commentId: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return

    try {
      await axios.delete(`/community/comments/${commentId}`)

      // 댓글 목록에서 제거
      setComments(prev => prev.filter(c => c.id !== commentId))
      
      // 게시글의 댓글 개수 감소
      setPost((prev: any) => ({
        ...prev,
        commentCount: Math.max(0, (prev?.commentCount || 0) - 1)
      }))
    } catch (err: any) {
      console.error("댓글 삭제 실패", err)
      if (err.response?.data?.message) {
        alert(err.response.data.message)
      }
    }
  }

  if (!post) return null

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
    <motion.div
      key="detail"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={() => navigate("/community")}
    >
      <motion.div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* 헤더 */}
        <div className="flex justify-between mb-6">
          <div className="flex-1">
            <Badge className={`${getCategoryColor(post.categoryName)} border`}>
              {post.categoryName}
            </Badge>
            {isEditingPost ? (
              // 수정 모드 - 제목 입력
              <div className="mt-2">
                <Input
                  placeholder="제목을 입력하세요"
                  className="text-xl font-semibold mb-3"
                  value={editPostTitle}
                  onChange={e => setEditPostTitle(e.target.value)}
                />
              </div>
            ) : (
              // 일반 모드
              <h2 className="text-gray-900 mb-3">{post.title}</h2>
            )}
            <div className="flex gap-4 text-sm text-gray-600">
              <span>{post.authorDisplayName}</span>
              •
              <span>{new Date(post.createdAt).toLocaleString()}</span>
              •
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" /> {post.viewCount}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            {/* 임시로 항상 메뉴 표시 - canEdit이 false인 경우도 확인 가능하도록 */}
            {!isEditingPost && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={startEditPost}>
                    <Edit className="w-4 h-4 mr-2" />
                    수정하기
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={deletePost}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    삭제하기
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate("/community")}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* 본문 */}
        {isEditingPost ? (
          // 수정 모드 - 본문 입력
          <div className="mb-6 space-y-3">
            <Textarea
              placeholder="내용을 입력하세요..."
              className="min-h-[300px] border-purple-200"
              value={editPostContent}
              onChange={e => setEditPostContent(e.target.value)}
            />
            <div className="flex items-center justify-between p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
              <div>
                <Label htmlFor="edit-post-anonymous">익명 작성</Label>
                <p className="text-sm text-gray-500">내 닉네임을 숨길 수 있어요</p>
              </div>
              <Checkbox
                id="edit-post-anonymous"
                checked={editPostAnonymous}
                onCheckedChange={(checked) => setEditPostAnonymous(checked === true)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={cancelEditPost}
                disabled={editPostPending}
              >
                취소
              </Button>
              <Button
                onClick={updatePost}
                disabled={editPostPending || !editPostTitle.trim() || !editPostContent.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              >
                수정 완료
              </Button>
            </div>
          </div>
        ) : (
          // 일반 모드
          <div className="mb-6 p-6 bg-gray-50 rounded-lg text-gray-800 whitespace-pre-wrap">
            {postContent}
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3 mb-8 pb-6 border-b">
          <Button 
            variant="outline" 
            className={`flex-1 border-gray-200 ${likedByMe ? 'border-pink-300 bg-pink-50' : 'hover:border-pink-300'}`}
          >
            <Heart className={`w-4 h-4 mr-2 ${likedByMe ? 'fill-pink-500 text-pink-500' : ''}`} /> 
            좋아요 {post.likeCount || 0}
          </Button>
          <Button variant="outline" className="flex-1 border-gray-200">
            <MessageCircle className="w-4 h-4 mr-2" /> 댓글 {post.commentCount || 0}
          </Button>
          <Button variant="outline" className="border-gray-200">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>

        {/* 댓글 */}
        <h3 className="text-purple-900 mb-4">💬 댓글 {comments.length}</h3>
        {comments.map(c => (
          <div key={c.id} className="p-4 bg-gray-50 rounded-lg mb-3">
            {editingCommentId === c.id ? (
              // 수정 모드
              <div className="space-y-3">
                <Textarea
                  placeholder="댓글을 입력하세요..."
                  className="border-purple-200"
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-anonymous-${c.id}`}
                      checked={editIsAnonymous}
                      onCheckedChange={(checked) => setEditIsAnonymous(checked === true)}
                    />
                    <Label
                      htmlFor={`edit-anonymous-${c.id}`}
                      className="text-sm text-gray-600 cursor-pointer"
                    >
                      익명
                    </Label>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelEditComment}
                      disabled={editPending}
                    >
                      취소
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateComment(c.id)}
                      disabled={editPending || !editContent.trim()}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    >
                      수정 완료
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              // 일반 모드
              <>
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-gray-900 font-medium">
                        {c.authorDisplayName}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-pink-600 text-xs">
                      <ThumbsUp className={`w-3 h-3 mr-1 ${c.likedByMe ? 'fill-pink-600' : ''}`} /> 
                      {c.likeCount || 0}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEditComment(c)}>
                          <Edit className="w-4 h-4 mr-2" />
                          수정하기
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => deleteComment(c.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          삭제하기
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(c.createdAt).toLocaleString()}
                  {c.updatedAt && c.updatedAt !== c.createdAt && (
                    <span className="ml-2">(수정됨)</span>
                  )}
                </div>
              </>
            )}
          </div>
        ))}

        {/* 댓글 입력 */}
        <div className="mt-4 space-y-3">
          <Textarea
            placeholder="댓글을 입력하세요..."
            className="border-purple-200"
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                submitComment()
              }
            }}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={(checked) => setIsAnonymous(checked === true)}
              />
              <Label
                htmlFor="anonymous"
                className="text-sm text-gray-600 cursor-pointer"
              >
                익명
              </Label>
            </div>
            <Button
              disabled={pending || !content.trim()}
              onClick={submitComment}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            >
              <Send className="w-4 h-4 mr-2" /> 댓글 작성
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
