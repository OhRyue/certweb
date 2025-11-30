import { useState } from "react"
import { Card } from "../../ui/card"
import { Button } from "../../ui/button"
import { Badge } from "../../ui/badge"
import { Progress } from "../../ui/progress"
import { motion } from "motion/react"
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react"
import axios from "../../api/axiosConfig"

interface MiniQuestion {
  questionId: number
  text: string
}

interface MiniAnswer {
  questionId: number
  answer: boolean // true = O, false = X
}

interface MiniCheckProps {
  questions: MiniQuestion[]
  topicName: string
  userId: string
  topicId: number
  examType: "written" | "practical"
  sessionId?: number | null
  onComplete: (score: number, learningSessionId?: number, answers?: MiniAnswer[]) => void
}

export function MiniCheck({
  questions,
  topicName,
  userId,
  topicId,
  examType,
  sessionId,
  onComplete
}: MiniCheckProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<"O" | "X" | null>(null)
  const [result, setResult] = useState<{ correct: boolean; explanation: string } | null>(null)
  const [score, setScore] = useState(0)
  const [learningSessionId, setLearningSessionId] = useState<number | null>(null)
  // 모든 문제의 답안을 저장
  const [allAnswers, setAllAnswers] = useState<MiniAnswer[]>([])
  // 채점 중복 호출 방지
  const [isGrading, setIsGrading] = useState(false)

  // 문제가 없을 때 방어
  if (!questions || questions.length === 0) {
    return (
      <div className="p-8 text-center text-gray-600">
        <p>미니체크 문제를 불러오는 중...</p>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  
  // currentQuestion이 없을 때 방어
  if (!currentQuestion) {
    return (
      <div className="p-8 text-center text-gray-600">
        <p>문제를 불러오는 중...</p>
      </div>
    )
  }

  const progress = ((currentIndex + 1) / questions.length) * 100

  // 즉시 채점
  const handleAnswer = async (answer: "O" | "X") => {
    // 이미 채점했거나 채점 중이면 재호출 방지
    if (result || isGrading) return

    setIsGrading(true)
    setSelectedAnswer(answer)

    try {
      // 세션이 있으면 sessionId를 쿼리 파라미터로 전달
      const config = sessionId
        ? { params: { sessionId } }
        : {}
      
      const res = await axios.post(
        `/study/${examType}/mini/grade-one`,
        {
          topicId,
          questionId: currentQuestion.questionId,
          answer: answer === "O"
        },
        config
      )

      const { correct, explanation, learningSessionId: receivedSessionId } = res.data
      setResult({ correct, explanation })

      // learningSessionId 저장 (필기/실기 모두, 첫 번째 문제에서 받은 값이면 저장)
      if (receivedSessionId !== undefined && learningSessionId === null) {
        setLearningSessionId(receivedSessionId)
      }

      if (correct) {
        setScore((prev) => prev + 1)
      }

      // 답안 저장
      setAllAnswers((prev) => [
        ...prev,
        {
          questionId: currentQuestion.questionId,
          answer: answer === "O"
        }
      ])
    } catch (err) {
      console.error("미니체크 채점 에러", err)
    } finally {
      setIsGrading(false)
    }
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setSelectedAnswer(null)
      setResult(null)
    } else {
      // 모든 답안과 함께 완료 콜백 호출
      onComplete(score, learningSessionId || undefined, allAnswers)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <Badge className="bg-purple-500 text-white mb-3">{topicName}</Badge>
          <h1 className="text-purple-900 mb-2">미니체크 O X</h1>
          <p className="text-gray-600">개념을 제대로 이해했는지 확인해보세요!</p>
        </div>

        {/* Progress bar */}
        <Card className="p-4 mb-6 bg-white border-2 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">문제 {currentIndex + 1} / {questions.length}</span>
            <span className="text-purple-600">정답: {score} / {questions.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </Card>

        {/* 문제 */}
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 mb-6">
            <h2 className="text-purple-900 mb-6">{currentQuestion.text}</h2>

            <div className="grid grid-cols-2 gap-4">
              {["O", "X"].map((option) => {
                const selected = selectedAnswer === option
                const correctSelected = result?.correct && selected

                let btnStyle =
                  "p-8 text-center border-2 transition-all text-2xl rounded-lg"

                if (!result && !selected) {
                  btnStyle += " hover:border-purple-400 hover:bg-white/60"
                }

                if (result && correctSelected) {
                  btnStyle += " border-green-400 bg-green-100"
                }

                if (result && selected && !result.correct) {
                  btnStyle += " border-red-400 bg-red-100"
                }

                return (
                  <motion.button
                    key={option}
                    disabled={!!result || isGrading}
                    whileHover={!result && !isGrading ? { scale: 1.05 } : {}}
                    onClick={() => handleAnswer(option as "O" | "X")}
                    className={btnStyle}
                  >
                    {option === "O" ? "⭕" : "❌"}
                  </motion.button>
                )
              })}
            </div>
          </Card>

          {/* 해설 */}
          {/* Explanation */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card
                className={`p-6 mb-6 border-2 ${result.correct
                    ? "bg-green-50 border-green-300"
                    : "bg-red-50 border-red-300"
                  }`}
              >
                <div className="flex items-start gap-3">
                  {result.correct ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  )}

                  <div>
                    <h3 className={result.correct ? "text-green-900" : "text-red-900"}>
                      {result.correct ? "정답이에요" : "틀렸어요"}
                    </h3>

                    <p className="text-gray-700 mt-2">
                      {result.explanation}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}


          {/* 다음 버튼 */}
          {result && (
            <div className="flex justify-end">
              <Button
                onClick={handleNext}
                className="bg-purple-500 text-white"
              >
                {currentIndex < questions.length - 1 
                  ? "다음 문제" 
                  : examType === "practical" 
                    ? "실기 문제 풀러 가기" 
                    : "객관식 문제 풀러 가기"}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
