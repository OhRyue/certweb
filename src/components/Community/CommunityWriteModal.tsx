import { useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { Button } from "../ui/button.tsx"
import { Input } from "../ui/input.tsx"
import { Label } from "../ui/label.tsx"
import { Switch } from "../ui/switch.tsx"
import { Textarea } from "../ui/textarea.tsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select.tsx"
import { X, PenSquare, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import axios from "../api/axiosConfig"
import { AxiosError } from "axios"

interface Category {
  code: string
  name: string
}

interface CommunityWriteModalProps {
  onClose?: () => void
}

export function CommunityWriteModal({ onClose }: CommunityWriteModalProps) {
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [categoryCode, setCategoryCode] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 카테고리 목록 가져오기
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("/community/categories")
        setCategories(res.data.categories || [])
        // 첫 번째 카테고리를 기본값으로 설정
        if (res.data.categories && res.data.categories.length > 0) {
          setCategoryCode(res.data.categories[0].code)
        }
      } catch (err) {
        console.error("카테고리 불러오기 실패", err)
        setError("카테고리를 불러오는데 실패했습니다.")
      }
    }
    fetchCategories()
  }, [])

  // 게시글 작성 함수
  const handleSubmit = async () => {
    // 유효성 검사
    if (!title.trim()) {
      setError("제목을 입력해주세요.")
      return
    }
    if (!content.trim()) {
      setError("내용을 입력해주세요.")
      return
    }
    if (!categoryCode) {
      setError("카테고리를 선택해주세요.")
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      await axios.post("/community/posts", {
        categoryCode,
        title: title.trim(),
        content: content.trim(),
        anonymous: isAnonymous,
      })

      // 성공 시 모달 닫기 및 목록 새로고침
      if (onClose) {
        onClose()
      } else {
        navigate("/community")
      }
      // 페이지 새로고침으로 목록 업데이트
      window.location.reload()
    } catch (err) {
      console.error("게시글 작성 실패", err)
      const errorMessage =
        err instanceof AxiosError && err.response?.data?.message
          ? err.response.data.message
          : "게시글 작성에 실패했습니다. 다시 시도해주세요."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      navigate("/community")
    }
  }

  return (
    <motion.div
      key="write"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between mb-6">
          <h2 className="text-purple-900 text-2xl font-bold">✍️ 게시글 작성</h2>
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={isLoading}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* 카테고리 선택 */}
          <div>
            <Label htmlFor="category">카테고리</Label>
            <Select value={categoryCode} onValueChange={setCategoryCode} disabled={isLoading}>
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="카테고리를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.code} value={category.code}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 제목 입력 */}
          <div>
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              disabled={isLoading}
            />
          </div>

          {/* 내용 입력 */}
          <div>
            <Label htmlFor="content">내용</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요..."
              className="min-h-[200px]"
              disabled={isLoading}
            />
          </div>

          {/* 익명 작성 옵션 */}
          <div className="flex justify-between items-center p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
            <div>
              <Label htmlFor="anonymous">익명 작성</Label>
              <p className="text-sm text-gray-500">내 닉네임을 숨길 수 있어요</p>
            </div>
            <Switch
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
              disabled={isLoading}
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* 제출 버튼 */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 작성 중...
              </>
            ) : (
              <>
                <PenSquare className="w-4 h-4 mr-2" /> 게시글 작성하기
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
