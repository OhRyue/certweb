import { useState } from "react"
import { Card } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"
import { motion } from "motion/react"
import { ArrowRight } from "lucide-react"
import axios from "../api/axiosConfig"

interface MiniQuestion {
  questionId: number
  text: string
}

interface MiniCheckProps {
  questions: MiniQuestion[]
  topicName: string
  userId: string
  topicId: number
  examType: "written" | "practical"
  onComplete: (score: number) => void
}

export function MiniCheck({
  questions,
  topicName,
  userId,
  topicId,
  examType,
  onComplete
}: MiniCheckProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<"O" | "X" | null>(null)
  const [result, setResult] = useState<{ correct: boolean; explanation: string } | null>(null)
  const [score, setScore] = useState(0)

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100

  // 즉시 채점
  const handleAnswer = async (answer: "O" | "X") => {
    if (result) return // 이미 채점했으면 재클릭 금지

    setSelectedAnswer(answer)

    try {
      const res = await axios.post(`/study/${examType}/mini/grade-one`, {
        userId,
        topicId,
        questionId: currentQuestion.questionId,
        answer: answer === "O"
      })

      const { correct, explanation } = res.data
      setResult({ correct, explanation })

      if (correct) {
        setScore((prev) => prev + 1)
      }
    } catch (err) {
      console.error("미니체크 채점 에러", err)
    }
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setSelectedAnswer(null)
      setResult(null)
    } else {
      onComplete(score)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <Badge className="bg-purple-500 text-white mb-3">{topicName}</Badge>
          <h1 className="text-purple-900 mb-2">미니체크 O X</h1>
          <p className="text-gray-600">바로 채점되는 방식</p>
        </div>

        {/* Progress bar */}
        <Card className="p-4 mb-6 bg-white border-2 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span>문제 {currentIndex + 1} / {questions.length}</span>
            <span className="text-purple-600">정답 {score}</span>
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
                    disabled={!!result}
                    whileHover={!result ? { scale: 1.05 } : {}}
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
          {result && (
            <Card
              className={`p-6 mb-6 border-2 ${
                result.correct ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <p className="font-semibold">
                {result.correct ? "정답입니다" : "틀렸습니다"}
              </p>
              <p className="mt-2 text-gray-700">{result.explanation}</p>
            </Card>
          )}

          {/* 다음 버튼 */}
          {result && (
            <div className="flex justify-end">
              <Button
                onClick={handleNext}
                className="bg-purple-500 text-white"
              >
                {currentIndex < questions.length - 1 ? "다음 문제" : "객관식 문제 풀러 가기"}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
