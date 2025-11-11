import { useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { Button } from "../ui/button.tsx"
import { Input } from "../ui/input.tsx"
import { Label } from "../ui/label.tsx"
import { Switch } from "../ui/switch.tsx"
import { Textarea } from "../ui/textarea.tsx"
import { X, PenSquare } from "lucide-react"
import { useState } from "react"

export function CommunityWriteModal() {
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)

  return (
    <motion.div
      key="write"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={() => navigate("/community")}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-8 max-w-2xl w-full"
      >
        <div className="flex justify-between mb-6">
          <h2 className="text-purple-900">✍️ 게시글 작성</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/community")}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label>제목</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
            />
          </div>
          <div>
            <Label>내용</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요..."
              className="min-h-[200px]"
            />
          </div>
          <div className="flex justify-between items-center p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
            <div>
              <Label htmlFor="anonymous">익명 작성</Label>
              <p className="text-sm text-gray-500">내 닉네임을 숨길 수 있어요</p>
            </div>
            <Switch id="anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>
          <Button
            onClick={() => navigate("/community")}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
          >
            <PenSquare className="w-4 h-4 mr-2" /> 게시글 작성하기
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
