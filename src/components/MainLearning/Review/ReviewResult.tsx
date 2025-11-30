import { Card } from "../../ui/card"
import { Button } from "../../ui/button"
import { Badge } from "../../ui/badge"
import { motion } from "motion/react"
import { Trophy, Star, Home, RotateCcw, Sparkles } from "lucide-react"

interface ReviewResultProps {
  topicName: string
  problemScore: number
  totalProblem: number
  summaryText?: string
  aiSummary?: string
  loadingSummary?: boolean
  onBackToDashboard: () => void
  onRetry: () => void
}

export function ReviewResult({
  topicName,
  problemScore,
  totalProblem,
  summaryText = "",
  aiSummary = "",
  loadingSummary = false,
  onBackToDashboard,
  onRetry,
}: ReviewResultProps) {
  const mcqCorrect = problemScore
  const mcqTotal = totalProblem
  const percentage = mcqTotal > 0 ? Math.round((mcqCorrect / mcqTotal) * 100) : 0

  const getMessage = () => {
    if (percentage >= 90) return { emoji: "🎉", text: "완벽해요!", color: "from-yellow-400 to-orange-400" }
    if (percentage >= 70) return { emoji: "😊", text: "잘했어요!", color: "from-green-400 to-emerald-400" }
    if (percentage >= 50) return { emoji: "💪", text: "좋아요!", color: "from-blue-400 to-cyan-400" }
    return { emoji: "📚", text: "다시 도전!", color: "from-purple-400 to-pink-400" }
  }

  const message = getMessage()

  return (
    <div className="p-8 flex items-center justify-center min-h-screen">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <Card className="p-12 bg-white/80 backdrop-blur border-2 border-purple-200 shadow-2xl text-center">
          {/* Trophy */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-6"
          >
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br ${message.color} mb-4`}>
              <Trophy className="w-12 h-12 text-white" />
            </div>
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Badge className="bg-purple-500 text-white mb-4">{topicName}</Badge>
            <div className="text-6xl mb-4">{message.emoji}</div>
            <h1 className="text-purple-900 mb-2">{message.text}</h1>
            <p className="text-gray-600 mb-8">총정리 학습을 완료했습니다!</p>
          </motion.div>

          {/* Score Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                    <span className="text-gray-600">정답률</span>
                  </div>
                  <div className="text-purple-600 text-3xl">{percentage}%</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Sparkles className="w-6 h-6 text-purple-500" />
                    <span className="text-gray-600">문제풀이</span>
                  </div>
                  <div className="text-purple-600 text-3xl">
                    {mcqCorrect} / {mcqTotal}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* AI Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mb-8"
          >
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 text-left">
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-blue-900">AI 학습 요약</h3>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                      Beta
                    </Badge>
                  </div>
                  {loadingSummary ? (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span>요약을 생성하는 중...</span>
                    </div>
                  ) : summaryText || aiSummary ? (
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {aiSummary || summaryText}
                    </p>
                  ) : (
                    <p className="text-gray-700">요약을 불러오지 못했습니다.</p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="grid grid-cols-2 gap-4"
          >
            <Button
              onClick={onRetry}
              variant="outline"
              className="py-6 border-2 border-purple-300 hover:bg-purple-50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              다시 학습하기
            </Button>
            <Button
              onClick={onBackToDashboard}
              className="py-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              <Home className="w-4 h-4 mr-2" />
              메인으로
            </Button>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  )
}
