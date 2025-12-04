import { useState, useEffect } from "react"
import { Card } from "../../../ui/card"
import { Button } from "../../../ui/button"
import { Badge } from "../../../ui/badge"
import { Progress } from "../../../ui/progress"
import { Swords, Clock, Zap, X } from "lucide-react"
import type { Question } from "../../../../types"

interface BattleGameProps {
  questions: Question[]
  opponentName: string
  myUserId?: string
  opponentUserId?: string
  myRank?: number | null
  opponentRank?: number | null
  onComplete: (myScore: number, opponentScore: number) => void
  onExit: () => void
}

export function BattleGame({ questions, opponentName, myUserId, opponentUserId, myRank, opponentRank, onComplete, onExit }: BattleGameProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [myScore, setMyScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [isAnswered, setIsAnswered] = useState(false)
  const [showResult, setShowResult] = useState(false)

  const totalQuestions = questions.length
  const question = questions[currentQuestion]

  // Timer
  useEffect(() => {
    if (timeLeft === 0 && !isAnswered) {
      handleAnswer(null)
      return
    }
    const timer = setInterval(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000)
    return () => clearInterval(timer)
  }, [timeLeft, isAnswered])

  // questions가 비었거나 로딩 중이면 예외처리
  // 질문 데이터 안정성 체크
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-semibold">문제를 불러올 수 없습니다.</p>
        <Button onClick={onExit} className="mt-4">뒤로가기</Button>
      </div>
    )
  }
  if (!question) return null


  // 정답 판별 함수
  const isCorrectAnswer = (answer: string | null) => {
    if (answer === null) return false
    if (Array.isArray(question.options)) {
      // 객관식: correctAnswer는 인덱스
      return question.options[question.correctAnswer] === answer
    }
    // OX 형식일 때 (answer는 "O" or "X" / correctAnswer은 0 or 1이면 options[0] = "O")
    return question.options?.[question.correctAnswer] === answer
  }

  const handleAnswer = (answer: string | null) => {
    setIsAnswered(true)
    setSelectedAnswer(answer)

    const meCorrect = isCorrectAnswer(answer)

    // 점수 반영 (본인)
    if (meCorrect) {
      const speedBonus = Math.floor(timeLeft / 3)
      setMyScore(prev => prev + 10 + speedBonus)
    }


    setShowResult(true)

    // 다음 문제 또는 게임 종료
    setTimeout(() => {
      if (currentQuestion < totalQuestions - 1) {
        setCurrentQuestion(prev => prev + 1)
        setSelectedAnswer(null)
        setIsAnswered(false)
        setShowResult(false)
        setTimeLeft(30)
      } else {
        const finalMyScore = meCorrect
          ? myScore + 10 + Math.floor(timeLeft / 3)
          : myScore
        onComplete(finalMyScore, opponentScore)
      }
    }, 1500)
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* --- Header --- */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Swords className="w-6 h-6 text-purple-600" />
            <h2 className="text-purple-900">1:1 배틀</h2>
          </div>
          <Button variant="ghost" onClick={onExit} className="text-red-600">
            <X className="w-4 h-4 mr-2" />
            나가기
          </Button>
        </div>

        {/* --- Score --- */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-4 border-2 border-purple-200 bg-purple-50">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-900 text-sm font-semibold">{myUserId || "나"}</p>
                {myRank !== null && myRank !== undefined && (
                  <p className="text-xs text-purple-600">순위: {myRank}위</p>
                )}
              </div>
              <p className="text-2xl text-purple-600">{myScore}</p>
            </div>
          </Card>
          <Card className="p-4 border-2 border-blue-200 bg-blue-50">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-900 text-sm font-semibold">{opponentUserId || opponentName}</p>
                {opponentRank !== null && opponentRank !== undefined && (
                  <p className="text-xs text-blue-600">순위: {opponentRank}위</p>
                )}
              </div>
              <p className="text-2xl text-blue-600">{opponentScore}</p>
            </div>
          </Card>
        </div>

        {/* --- Timer / Progress --- */}
        <Card className="p-4 border-2 border-purple-200 mb-6">
          <div className="flex justify-between mb-2">
            <span>문제 {currentQuestion + 1} / {totalQuestions}</span>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className={timeLeft <= 10 ? "text-red-600" : ""}>
                {timeLeft}초
              </span>
            </div>
          </div>
          <Progress value={((currentQuestion + 1) / totalQuestions) * 100} />
        </Card>

        {/* --- Question --- */}
        <Card className="p-8 border-2 border-purple-200">
          <Badge className="bg-purple-100 text-purple-700 mb-4">{question.category}</Badge>
          <h2 className="text-gray-900 mb-6">{question.question}</h2>

          {/* --- Options --- */}
          <div className="space-y-3">
            {question.options?.map((option, i) => {
              const correct = question.options[question.correctAnswer] === option
              const chosen = selectedAnswer === option
              const showCorrect = showResult && correct
              const showWrong = showResult && chosen && !correct

              return (
                <button
                  key={i}
                  onClick={() => !isAnswered && handleAnswer(option)}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${showCorrect ? "border-green-500 bg-green-50" :
                    showWrong ? "border-red-500 bg-red-50" :
                      chosen ? "border-purple-500 bg-purple-50" :
                        "border-gray-200 hover:bg-gray-50"
                    }`}
                >
                  <div className="flex justify-between">
                    <span>{option}</span>
                    {showCorrect && <Zap className="w-5 h-5 text-green-600" />}
                    {showWrong && <X className="w-5 h-5 text-red-500" />}
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
