import { useState } from "react"
import { Card } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"
import { motion } from "motion/react"
import { CheckCircle2, XCircle, ArrowRight, Sparkles } from "lucide-react"
import { Question } from "../../types"

interface ReviewProblemSolvingProps {
  questions: Question[]
  onComplete: (score: number, answers: { questionId: number; selectedAnswer: number; isCorrect: boolean }[]) => void
}

export function CategoryProblemSolving({ questions, onComplete }: ReviewProblemSolvingProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<
    { questionId: string | number; selectedAnswer: number; isCorrect: boolean }[]
  >([])

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100

  const handleAnswer = (index: number) => {
    if (showResult) return
    setSelectedAnswer(index)
    setShowResult(true)

    const isCorrect = index === currentQuestion.correctAnswer
    if (isCorrect) {
      setScore(prev => prev + 1)
    }

    // 오답노트용 데이터 저장
    setAnswers(prev => [
      ...prev,
      {
        questionId: currentQuestion.id,
        selectedAnswer: index,
        isCorrect,
      },
    ])
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      // 문제 다 풀면 score + answers 함께 전달
      onComplete(score, answers)
    }
  }

  const isCorrect = selectedAnswer === currentQuestion.correctAnswer

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-blue-500 text-white">총정리</Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              객관식
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-blue-600" />
            <h1 className="text-blue-900">Review 문제풀이</h1>
          </div>
          <p className="text-gray-600 mt-2">OX 이후 단계의 객관식 문제입니다!</p>
        </div>

        {/* Progress */}
        <Card className="p-4 mb-6 bg-white border-2 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">
              문제 {currentIndex + 1} / {questions.length}
            </span>
            <span className="text-blue-600">
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
          <Card className="p-8 bg-gradient-to-br from-blue-50 to-sky-50 border-2 border-blue-200 mb-6">
            <div className="flex items-start gap-3 mb-6">
              <Badge
                variant="secondary"
                className={
                  currentQuestion.difficulty === "easy"
                    ? "bg-green-100 text-green-700"
                    : currentQuestion.difficulty === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                }
              >
                {currentQuestion.difficulty === "easy"
                  ? "쉬움"
                  : currentQuestion.difficulty === "medium"
                    ? "보통"
                    : "어려움"}
              </Badge>
              {currentQuestion.tags.map(tag => (
                <Badge key={tag} variant="outline">
                  #{tag}
                </Badge>
              ))}
            </div>

            <h2 className="text-blue-900 mb-6">{currentQuestion.question}</h2>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index
                const isCorrectAnswer = index === currentQuestion.correctAnswer

                let buttonClass = "w-full p-4 text-left border-2 transition-all"

                if (!showResult) {
                  buttonClass += " hover:border-blue-400 hover:bg-white/60 cursor-pointer"
                } else if (isCorrectAnswer) {
                  buttonClass += " border-green-400 bg-green-50"
                } else if (isSelected && !isCorrect) {
                  buttonClass += " border-red-400 bg-red-50"
                } else {
                  buttonClass += " opacity-50"
                }

                return (
                  <motion.button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    className={buttonClass}
                    disabled={showResult}
                    whileHover={!showResult ? { scale: 1.02 } : {}}
                    whileTap={!showResult ? { scale: 0.98 } : {}}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </div>
                        <span>{option}</span>
                      </div>
                      {showResult && isCorrectAnswer && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                      {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600" />}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </Card>

          {/* Explanation */}
          {showResult && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card
                className={`p-6 mb-6 border-2 ${isCorrect ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"
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
                    <h3 className={isCorrect ? "text-green-900 mb-2" : "text-red-900 mb-2"}>
                      {isCorrect ? "정답이에요!" : "틀렸어요!"}
                    </h3>
                    <p className="text-gray-700">{currentQuestion.explanation}</p>
                  </div>
                </div>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={handleNext}
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                >
                  {currentIndex < questions.length - 1 ? "다음 문제" : "결과 보기"}
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
