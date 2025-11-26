import { useState } from "react"
import { Card } from "../../ui/card"
import { Button } from "../../ui/button"
import { Badge } from "../../ui/badge"
import { Progress } from "../../ui/progress"
import { Input } from "../../ui/input"
import { motion } from "motion/react"
import { CheckCircle2, XCircle, ArrowRight, Sparkles, Loader2 } from "lucide-react"
import type { Question } from "../../../types"

interface ReviewProblemSolvingPracticalProps {
  questions: Question[]
  topicName: string
  onComplete: (
    score: number,
    answers: { questionId: string | number; selectedAnswer: string; isCorrect: boolean }[]
  ) => void
}

export function ReviewProblemSolvingPractical({
  questions,
  topicName,
  onComplete,
}: ReviewProblemSolvingPracticalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [typedAnswer, setTypedAnswer] = useState("")
  const [showResult, setShowResult] = useState(false)
  const [isGrading, setIsGrading] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<
    { questionId: string | number; selectedAnswer: string; isCorrect: boolean }[]
  >([])

  // 문제 비었을 때 방어
  if (!questions || questions.length === 0) {
    return (
      <div className="p-8 text-center text-gray-600">
        <p>실기 문제가 없습니다 😢</p>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100
  const isCorrect =
    typedAnswer.trim().toLowerCase() ===
    String(currentQuestion.correctAnswer).toLowerCase()

  const handleSubmit = async () => {
    if (showResult || !typedAnswer.trim()) return
    setIsGrading(true)
    await new Promise((r) => setTimeout(r, 1000))
    setIsGrading(false)
    setShowResult(true)
    if (isCorrect) setScore((prev) => prev + 1)

    // ✅ 오답노트용 데이터 저장
    setAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        selectedAnswer: typedAnswer.trim(),
        isCorrect,
      },
    ])
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setTypedAnswer("")
      setShowResult(false)
    } else {
      // ✅ 오답 데이터 포함하여 전달
      onComplete(score, answers)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-orange-500 text-white">{topicName}</Badge>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              실기
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-orange-600" />
            <h1 className="text-orange-900">Review 실기 문제풀이</h1>
          </div>
          <p className="text-gray-600 mt-2">OX 이후 단계의 주관식 문제입니다!</p>
        </div>

        {/* Progress */}
        <Card className="p-4 mb-6 bg-white border-2 border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">
              문제 {currentIndex + 1} / {questions.length}
            </span>
            <span className="text-orange-600">
              정답: {score} / {currentIndex}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </Card>

        {/* Question */}
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 mb-6">
            <h2 className="text-orange-900 mb-6">{currentQuestion.question}</h2>

            <div className="space-y-4">
              <Input
                type="text"
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !showResult && !isGrading) handleSubmit()
                }}
                placeholder="정답을 입력하세요..."
                disabled={showResult || isGrading}
                className="w-full p-4 text-lg border-2 border-orange-200 focus:border-orange-400"
              />

              {!showResult && !isGrading && (
                <Button
                  onClick={handleSubmit}
                  disabled={!typedAnswer.trim()}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                >
                  답안 제출
                </Button>
              )}

              {isGrading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-3 p-6 bg-orange-100 rounded-lg"
                >
                  <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />
                  <span className="text-orange-800">채점 중...</span>
                </motion.div>
              )}

              {showResult && (
                <div
                  className={`p-4 rounded-lg border-2 ${
                    isCorrect
                      ? "bg-green-50 border-green-300"
                      : "bg-red-50 border-red-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span
                      className={isCorrect ? "text-green-900" : "text-red-900"}
                    >
                      {isCorrect ? "정답입니다!" : "오답입니다!"}
                    </span>
                  </div>
                  {!isCorrect && (
                    <p className="text-gray-700">
                      정답:{" "}
                      <span className="text-green-700">
                        {currentQuestion.correctAnswer}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card
                className={`p-6 mb-6 border-2 ${
                  isCorrect
                    ? "bg-green-50 border-green-300"
                    : "bg-red-50 border-red-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3
                      className={
                        isCorrect
                          ? "text-green-900 mb-2"
                          : "text-red-900 mb-2"
                      }
                    >
                      {isCorrect ? "정답이에요!" : "틀렸어요!"}
                    </h3>
                    <Badge
                      variant="secondary"
                      className="bg-orange-100 text-orange-700"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI 해설
                    </Badge>
                    <p className="text-gray-700 mt-2">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={handleNext}
                  size="lg"
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                >
                  {currentIndex < questions.length - 1 ? "다음 문제" : "오답 보기"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
