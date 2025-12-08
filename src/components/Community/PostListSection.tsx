import { useEffect, useState, useRef, useCallback } from "react"
import axios from "../api/axiosConfig"
import { Card } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { motion } from "motion/react"
import { Search, TrendingUp, Eye, Heart, MessageCircle, X } from "lucide-react"

interface PostListSectionProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  currentPage: number
  setCurrentPage: (page: number) => void
  setShowWritePost: (show: boolean) => void
  renderPagination: (current: number, total: number, onChange: (page: number) => void) => React.ReactNode
  onPostClick: (id: number) => void
}

interface PopularPost {
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
}: PostListSectionProps) {

  const [categories, setCategories] = useState([])
  const [posts, setPosts] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [popularPosts, setPopularPosts] = useState<PopularPost[]>([])
  const [inputValue, setInputValue] = useState(searchQuery || "") // 입력 필드 값
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // searchQuery가 외부에서 변경될 때 inputValue 동기화 (예: 카테고리 변경 시)
  useEffect(() => {
    if (searchQuery === "") {
      setInputValue("")
    }
  }, [searchQuery])

  useEffect(() => {
    fetchCategories()
    fetchPopularPosts()
  }, [])

  const fetchPosts = useCallback(async () => {
    try {
      interface SearchParams {
        page: number
        size: number
        sort: string
        today: boolean
        anonymousOnly: boolean
        mine: boolean
        category?: string
        keyword?: string
      }

      const params: SearchParams = {
        page: currentPage - 1,
        size: 10,
        sort: "LATEST",
        today: false,
        anonymousOnly: false,
        mine: false
      }

      if (activeTab !== "all") params.category = activeTab
      if (searchQuery) params.keyword = searchQuery

      // 1차: 기본 posts 불러오기
      const res = await axios.get("/community/posts", { params })
      const basePosts = res.data.items || []

      // 2차: metrics 병렬 호출
      const metricsResponses = await Promise.all(
        basePosts.map(post =>
          axios.get(`/community/posts/${post.id}/metrics`)
            .then(r => ({ postId: post.id, ...r.data }))
            .catch(() => ({ postId: post.id })) // 실패해도 전체 중단 X
        )
      )

      // 3차: basePosts에 metrics merge
      const merged = basePosts.map(post => {
        const metrics = metricsResponses.find(m => m.postId === post.id) || {}
        return {
          ...post,
          likeCount: metrics.likeCount ?? post.likeCount ?? 0,
          commentCount: metrics.commentCount ?? post.commentCount ?? 0,
          viewCount: metrics.viewCount ?? post.viewCount ?? 0,
        }
      })

      setPosts(merged)
      setTotalPages(res.data.page?.totalPages || 1)

    } catch (err) {
      console.error("게시글 목록 불러오기 실패", err)
    }
  }, [activeTab, searchQuery, currentPage])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Debounce: 입력이 멈춘 후 500ms 후에 검색 실행
  useEffect(() => {
    // 이전 타이머 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // 빈 값이면 즉시 검색어 초기화
    if (inputValue.trim() === "") {
      if (searchQuery !== "") {
        setSearchQuery("")
        setCurrentPage(1)
      }
      return
    }

    // 최소 2자 이상일 때만 검색
    if (inputValue.trim().length < 2) {
      return
    }

    // 500ms 후에 검색 실행
    debounceTimerRef.current = setTimeout(() => {
      if (inputValue.trim() !== searchQuery) {
        setSearchQuery(inputValue.trim())
        setCurrentPage(1)
      }
    }, 500)

    // cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]) // searchQuery, setSearchQuery, setCurrentPage는 의존성에서 제외 (무한 루프 방지)

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/community/categories")
      setCategories(res.data.categories || [])
    } catch (err) {
      console.error("카테고리 불러오기 실패", err)
    }
  }

  // 인기 게시글 가져오기
  const fetchPopularPosts = async () => {
    try {
      const res = await axios.get("/community/posts/hot", {
        params: {
          days: 3, // 최근 3일간
          limit: 5 // 상위 5개
        }
      })
      setPopularPosts(res.data.items || [])
    } catch (err) {
      console.error("인기 게시글 불러오기 실패", err)
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

  // 검색 실행 함수
  const handleSearch = () => {
    const trimmedValue = inputValue.trim()
    if (trimmedValue.length >= 2) {
      setSearchQuery(trimmedValue)
      setCurrentPage(1)
    } else if (trimmedValue === "") {
      setSearchQuery("")
      setCurrentPage(1)
    }
  }

  // Enter 키 처리
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      // Debounce 타이머 취소
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      handleSearch()
    }
  }

  // 검색어 초기화
  const handleClear = () => {
    setInputValue("")
    setSearchQuery("")
    setCurrentPage(1)
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
                ? "bg-gradient-to-r from-purple-500 to-purple-500 text-white shadow-md"
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
                  ? "bg-gradient-to-r from-purple-500 to-purple-500 text-white shadow-md"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <Button
            onClick={() => setShowWritePost(true)}
            className="bg-gradient-to-r from-purple-500 to-purple-500 hover:from-purple-600 hover:to-purple-600 text-white shadow-lg whitespace-nowrap"
          >
            글쓰기
          </Button>
        </div>
      </Card>

      {/* 검색창 UI 개선 */}
      <Card className="p-4 border-2 border-purple-200 bg-white/80 backdrop-blur">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="게시글 검색... (최소 2자 이상)"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              className={`pl-10 ${inputValue ? "pr-10" : ""} border-purple-200 focus:border-purple-400`}
            />
            {inputValue && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="검색어 초기화"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            onClick={handleSearch}
            className="bg-gradient-to-r from-purple-500 to-purple-500 hover:from-purple-600 hover:to-purple-600 text-white whitespace-nowrap"
          >
            <Search className="w-4 h-4 mr-2" />
            검색
          </Button>
        </div>
        {inputValue.trim().length > 0 && inputValue.trim().length < 2 && (
          <p className="text-xs text-gray-500 mt-2 ml-1">최소 2자 이상 입력해주세요</p>
        )}
      </Card>

      {/* 인기 게시글 */}
      <Card className="p-6 border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="flex items-center gap-3 mb-3">
          <TrendingUp className="w-5 h-5 text-orange-600" />
          <h3 className="text-orange-900">🔥 인기 게시글</h3>
        </div>
        {popularPosts.length > 0 ? (
          <div className="space-y-2">
            {popularPosts.map((post, idx) => (
              <button
                key={post.id}
                onClick={() => onPostClick(post.id)}
                className="w-full text-left text-sm text-gray-700 hover:text-orange-700 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-bold text-orange-600 flex-shrink-0">{idx + 1}.</span>
                    <span className="truncate">
                      {post.title} <span className="text-gray-500">({post.commentCount})</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 flex-shrink-0">
                    <Heart className="w-4 h-4" />
                    <span>{post.likeCount}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">인기 게시글이 없습니다</p>
        )}
      </Card>

      {/* 실제 게시글 목록 */}
      <div className="space-y-3">
        {posts.map(post => (
          <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.01 }}>
            <Card
              className="p-6 border-2 cursor-pointer transition-all hover:shadow-lg border-purple-200 bg-white/80 backdrop-blur hover:border-purple-300"
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
