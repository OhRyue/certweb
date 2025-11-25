import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { ReviewProblemSolving } from "./ReviewProblemSolving"
import { MicroWrongAnswers } from "./MicroWrongAnswers"
import { ReviewResult } from "./ReviewResult"
import { LevelUpScreen } from "../LevelUpScreen"
import axios from "../api/axiosConfig"
import type { Question } from "../../types"

// API 응답 타입
interface ReviewApiResponse {
  sessionId: number
  mode: string
  step: string
  status: string
  nextStep: string | null
  meta: Record<string, any>
  payload: {
    items: Array<{
      questionId: number
      text: string
      choices: Array<{
        label: string
        text: string
      }>
      imageUrl: string | null
    }>
  }
}

export function ReviewFlowPage() {
  const [step, setStep] = useState<"problem" | "wrong" | "result">("problem")
  const [problemScore, setProblemScore] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState<any[]>([])
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [relatedQuestions, setRelatedQuestions] = useState<Question[]>([])
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [topicName, setTopicName] = useState<string>("Review 총정리")
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const mainTopicIdParam = searchParams.get("mainTopicId")
  const rootTopicId = mainTopicIdParam ? parseInt(mainTopicIdParam, 10) : null

  // API에서 Review 문제 가져오기
  useEffect(() => {
    const fetchReviewQuestions = async () => {
      if (!rootTopicId) {
        setError("주제 ID가 없습니다")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await axios.get<ReviewApiResponse>(
          `/study/written/review/${rootTopicId}`
        )

        // API 응답을 Question 타입으로 변환
        const questions: Question[] = response.data.payload.items.map((item, index) => ({
          id: item.questionId.toString(),
          topicId: rootTopicId.toString(),
          tags: [],
          difficulty: "medium" as const,
          type: "multiple" as const,
          examType: "written" as const,
          question: item.text,
          options: item.choices.map(choice => ({
            label: choice.label,
            text: choice.text,
          })),
          // API 응답에 correctAnswer가 없으므로 임시로 0 설정
          // 실제로는 채점 API를 통해 받아야 할 수 있습니다
          correctAnswer: 0,
          explanation: "", // API 응답에 explanation이 없으므로 빈 문자열
          imageUrl: item.imageUrl || undefined,
        }))

        setRelatedQuestions(questions)
        setSessionId(response.data.sessionId)
        setTopicName("Review 총정리")
      } catch (err: any) {
        console.error("Review 문제 로딩 실패:", err)
        setError(err.response?.data?.message || "문제를 불러오는 중 오류가 발생했습니다")
      } finally {
        setLoading(false)
      }
    }

    fetchReviewQuestions()
  }, [rootTopicId])

  const totalProblems = relatedQuestions.length
  const percentage = totalProblems > 0 ? Math.round((problemScore / totalProblems) * 100) : 0

  useEffect(() => {
    const reviewCompleted = false
    if (step === "result" && percentage === 100 && !reviewCompleted) {
      setShowLevelUp(true)
    }
  }, [step, percentage])

  // 로딩 중
  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        문제를 불러오는 중...
      </div>
    )
  }

  // 에러 발생 시
  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => navigate("/learning")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          학습 대시보드로 돌아가기
        </button>
      </div>
    )
  }

  // 문제가 없을 때
  if (relatedQuestions.length === 0) {
    return (
      <div className="p-8 text-center text-gray-600">
        문제가 없습니다
      </div>
    )
  }

  // 문제 풀이 단계
  if (step === "problem") {
    return (
      <ReviewProblemSolving
        key="problem-step"
        questions={relatedQuestions}
        onComplete={(score, answers) => {
          setProblemScore(score)
          const wrongs = answers
            .filter(a => !a.isCorrect)
            .map(a => ({
              question: relatedQuestions.find(q => q.id === a.questionId),
              userAnswer: a.selectedAnswer,
              correctAnswer: relatedQuestions.find(q => q.id === a.questionId)?.correctAnswer,
            }))
          setWrongAnswers(wrongs)
          setStep("wrong")
        }}
      />
    )
  }

  // 오답노트 단계
  if (step === "wrong") {
    return (
      <MicroWrongAnswers
        wrongAnswers={wrongAnswers}
        topicName={topicName}
        examType="written"
        onContinue={() => setStep("result")}
      />
    )
  }

  // 결과 화면
  if (step === "result") {
    return (
      <>
        <ReviewResult
          topicName={topicName}
          problemScore={problemScore}
          totalProblem={totalProblems}
          onRetry={() => setStep("problem")}
          onBackToDashboard={() => navigate("/learning")}
        />

        {showLevelUp && (
          <LevelUpScreen
            currentLevel={2}
            currentExp={60}
            earnedExp={40}
            expPerLevel={100}
            onComplete={() => setShowLevelUp(false)}
          />
        )}
      </>
    )
  }

  return null
}
