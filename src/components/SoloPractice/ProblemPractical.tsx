import { useState } from "react"
import { Card } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"
import { Input } from "../ui/input"
import { motion } from "motion/react"
import { CheckCircle2, XCircle, ArrowRight, Sparkles, Loader2 } from "lucide-react"
import type { Question } from "../../types"
import axios from "../api/axiosConfig"

// props로 받을 타입 정의
interface ReviewProblemSolvingPracticalProps {
  questions: Question[]   // 주관식 문제 배열
  topicName: string
  topicId?: number        // topicId (실기 채점 API에 필요)
  onComplete: (           // 모든 문제 완료 시 호출되는 콜백
    score: number,        //  맞은 개수
    answers: { questionId: string | number; selectedAnswer: string; isCorrect: boolean }[]
  ) => void
}

// 실기 객관식 문제 풀이 컴포넌트

export function ProblemPractical({
  questions,
  topicName,
  topicId = 0,
  onComplete,
}: ReviewProblemSolvingPracticalProps) {
  // 현재 문제 인덱스와 선택 결과 및 점수 상태
  const [currentIndex, setCurrentIndex] = useState(0)     // 현재 문제 인덱스(0부터 시작)
  const [typedAnswer, setTypedAnswer] = useState("")      // 사용자가 입력한 답
  const [showResult, setShowResult] = useState(false)     // 결과(정답 여부) 보여줄지 여부
  const [isGrading, setIsGrading] = useState(false)       // 채점 중 상태
  const [score, setScore] = useState(0)                   // 맞힌 문제 개수
  const [answers, setAnswers] = useState<                 // 사용자가 풀었던 모든 문제 기록(오답노트용)
    { questionId: string | number; selectedAnswer: string; isCorrect: boolean; explanation?: string; score?: number }[]
  >([])
  const [gradingResults, setGradingResults] = useState<  // 채점 결과 저장
    Record<string | number, { score: number; baseExplanation: string; aiExplanation: string; isCorrect: boolean }>
  >({})

  // 문제 배열이 비었을 때 예외 처리
  if (!questions || questions.length === 0) {
    return (
      <div className="p-8 text-center text-gray-600">
        <p>실기 문제가 없습니다 😢</p>
      </div>
    )
  }

  // 현재 문제 추출(인덱스 기준)
  const currentQuestion = questions[currentIndex]

  // 진행률 계산
  const progress = ((currentIndex + 1) / questions.length) * 100

  // 현재 문제의 채점 결과 가져오기
  const currentGradingResult = gradingResults[currentQuestion.id]
  const isCorrect = currentGradingResult?.isCorrect || false
  const explanation = currentGradingResult?.aiExplanation || currentGradingResult?.baseExplanation || ""

  // 실기 채점 API 호출
  const handleSubmit = async () => {
    if (showResult || !typedAnswer.trim() || isGrading) return

    const questionId = Number(currentQuestion.id)
    const userText = typedAnswer.trim()

    setIsGrading(true)

    try {
      // 실기 채점 API 호출 (한 문제씩)
      const response = await axios.post("/study/assist/practical/submit", {
        topicId: topicId || questionId, // topicId가 있으면 사용, 없으면 questionId 사용
        answers: [{
          questionId: questionId,
          userText: userText
        }]
      })

      // 채점 결과 처리
      const gradingItem = response.data.payload?.items?.[0]
      const itemScore = gradingItem?.score || 0
      const isCorrectResult = itemScore > 0 // score > 0이면 정답으로 간주

      // AI 해설을 우선으로 사용하고, 없으면 base 해설 사용
      const finalExplanation = gradingItem?.aiExplanation || gradingItem?.baseExplanation || ""

      // 채점 결과를 상태에 저장
      setGradingResults(prev => ({
        ...prev,
        [questionId]: {
          score: itemScore,
          baseExplanation: gradingItem?.baseExplanation || "",
          aiExplanation: gradingItem?.aiExplanation || "",
          isCorrect: isCorrectResult
        }
      }))

      // 점수 업데이트
      if (isCorrectResult) {
        setScore(prev => prev + 1)
      }

      // 답안 저장
      setAnswers(prev => [
        ...prev,
        {
          questionId: currentQuestion.id,
          selectedAnswer: userText,
          isCorrect: isCorrectResult,
          explanation: finalExplanation,
          score: itemScore
        },
      ])

      setShowResult(true)
    } catch (err: any) {
      console.error("실기 채점 API 오류:", err)
      // 에러 발생 시 기본 처리
      setGradingResults(prev => ({
        ...prev,
        [questionId]: {
          score: 0,
          baseExplanation: "",
          aiExplanation: "",
          isCorrect: false
        }
      }))
      setAnswers(prev => [
        ...prev,
        {
          questionId: currentQuestion.id,
          selectedAnswer: userText,
          isCorrect: false,
          explanation: "",
          score: 0
        },
      ])
      setShowResult(true)
    } finally {
      setIsGrading(false)
    }
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setTypedAnswer("")
      setShowResult(false)
    } else {
      // 오답 데이터 포함하여 전달
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
              정답: {score} / {answers.length}
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
                    <div className="flex items-center justify-between mb-2">
                      <h3
                        className={
                          isCorrect
                            ? "text-green-900"
                            : "text-red-900"
                        }
                      >
                        {isCorrect ? "정답이에요!" : "틀렸어요!"}
                      </h3>
                      {currentGradingResult?.score !== undefined && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                          점수: {currentGradingResult.score}
                        </Badge>
                      )}
                    </div>
                    {explanation && (
                      <>
                        <Badge
                          variant="secondary"
                          className="bg-orange-100 text-orange-700 mb-2"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          {currentGradingResult?.aiExplanation ? "AI 해설" : "해설"}
                        </Badge>
                        <p className="text-gray-700 mt-2 whitespace-pre-line">
                          {explanation}
                        </p>
                      </>
                    )}
                    {!explanation && (
                      <p className="text-gray-700 mt-2">
                        {currentQuestion.explanation || "해설이 없습니다."}
                      </p>
                    )}
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
