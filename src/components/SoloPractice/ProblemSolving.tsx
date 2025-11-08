import { useState } from "react"
import { Card } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"
import { motion } from "motion/react"
import { CheckCircle2, XCircle, ArrowRight, Sparkles } from "lucide-react"
import { Question } from "../../types"

// props로 받을 타입 정의
interface ReviewProblemSolvingProps {
  questions: Question[]   // 문제 배열
  // 모든 문제 완료 시 호출되는 콜백
  onComplete: (
    score: number,      // 맞은 개수
    answers: { questionId: number; selectedAnswer: number; isCorrect: boolean }[]
  ) => void
}

// 카테고리 퀴즈의 필기(객관식) 문제 풀이 컴포넌트

export function ProblemSolving({ questions, onComplete }: ReviewProblemSolvingProps) {
  const [currentIndex, setCurrentIndex] = useState(0)                             // 현재 문제 인덱스(0부터 시작)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)       // 사용자가 선택한 보기 번호
  const [showResult, setShowResult] = useState(false)                             // 결과(정답 여부) 보여줄지 여부
  const [score, setScore] = useState(0)                                           // 맞힌 문제 개수
  const [answers, setAnswers] = useState<                                         // 사용자가 풀었던 모든 문제 기록(오답노트용)
    { questionId: string | number; selectedAnswer: number; isCorrect: boolean }[]
  >([])

  // 문제 배열이 비었을 때 예외 처리
  if (!questions || questions.length === 0) {
    return (
      <div className="p-8 text-center text-gray-600">
        <p>문제가 없습니다 😢</p>
      </div>
    )
  }

  // 현재 문제 추출(인덱스 기준)
  const currentQuestion = questions[currentIndex]

  // 혹시라도 인덱스 오류 방지
  if (!currentQuestion) {
    return (
      <div className="p-8 text-center text-gray-600">
        <p>문제를 불러오는 중이에요...</p>
      </div>
    )
  }

  // 현재 선택한 답이 정답인지 여부
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer
  // 진행률 계산
  const progress = ((currentIndex + 1) / questions.length) * 100

  // 보기 클릭 시 실행되는 함수
  const handleAnswer = (index: number) => {
    // 이미 답을 골랐으면 무시
    if (showResult) return
    // 현재 선택한 보기 저장
    setSelectedAnswer(index)
    // 결과 표시 켜기
    setShowResult(true)
    
    // 정답 여부 판단
    const isCorrect = index === currentQuestion.correctAnswer
    if (isCorrect) {    // 정답이면 점수 1 증가
      setScore(prev => prev + 1)
    }

    // 오답노트용 데이터 저장
    setAnswers(prev => [
      ...prev,
      {
        questionId: currentQuestion.id,   // 문제 id
        selectedAnswer: index,            // 선택한 보기 번호
        isCorrect,                        // 정답 여부
      },
    ])
  }

  // "다음 문제" 버튼 눌렀을 때
  const handleNext = () => {
    // 마지막 문제 아니면 다음으로 이동
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      // 마지막 문제면 결과 반환
      onComplete(score, answers)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          {/* 카테고리 뱃지 */}
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-blue-500 text-white">총정리</Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              객관식
            </Badge>
          </div>

          {/* 타이틀 + 아이콘  */}
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-blue-600" />
            <h1 className="text-blue-900">Review 문제풀이</h1>
          </div>

          {/* 텍스트 */}
          <p className="text-gray-600 mt-2">OX 이후 단계의 객관식 문제입니다!</p>
        </div>

        {/* 진행도 바 */}
        <Card className="p-4 mb-6 bg-white border-2 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">
              문제 {currentIndex + 1} / {questions.length}
            </span>
            <span className="text-blue-600">
              정답: {score} / {answers.length}
            </span>
          </div>
          {/* 진행도 */}
          <Progress value={progress} className="h-2" />
        </Card>

        {/* Question */}
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* 문제 카드 */}
          <Card className="p-8 bg-gradient-to-br from-blue-50 to-sky-50 border-2 border-blue-200 mb-6">
            {/* 상단 난이도 및 태그 */}
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
