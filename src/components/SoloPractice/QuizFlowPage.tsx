import { useState, useMemo, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ProblemSolving } from "./ProblemSolving"
import { ProblemPractical } from "./ProblemPractical"
import { ReviewResult } from "./ReviewResult"
import { LevelUpScreen } from "../LevelUpScreen"
import { questions } from "../../data/mockData"
import type { Question } from "../../types"

// 카테고리 퀴즈의 플로우 컨테이너
// 1. 문제 풀이 (컴포넌트 분기: 필기 / 실기)
// 2. 결과 화면 및 레벨업 오버레이

// API 응답을 Question 형식으로 변환하는 함수들
function normalizeMcq(items: any[]): Question[] {
  return items.map((q) => ({
    id: String(q.questionId),
    topicId: "",
    question: q.text,
    options: q.choices
      ? q.choices.map((c: any) => ({
        label: c.label,
        text: c.text,
      }))
      : [],
    correctAnswer: null as any, // 채점 API에서 받아야 함
    explanation: "",
    difficulty: q.difficulty ?? "medium",
    tags: q.tags ?? [],
    type: "multiple" as const,
    examType: "written" as const,
    imageUrl: q.imageUrl,
  }))
}

function normalizePractical(items: any[]): Question[] {
  return items.map((q) => ({
    id: String(q.questionId),
    topicId: "",
    question: q.text,
    options: [],
    correctAnswer: null as any, // 채점 API에서 받아야 함
    explanation: "",
    difficulty: "medium" as const,
    tags: [],
    type: "typing" as const,
    examType: "practical" as const,
    imageUrl: q.imageUrl,
  }))
}

export function QuizFlowPage() {
  const location = useLocation()
  const navigate = useNavigate()

  // navigate로 전달된 상태값 (CategoryQuiz, DifficultyQuiz, WeaknessQuiz 모두 가능)
  const {
    selectedDetails,
    questionCount,
    examType,
    quizType,
    questions: apiQuestions, // API에서 받은 문제 목록
    apiResponse, // 전체 API 응답 (필요시 사용)
    topicId, // topicId (API 응답이나 다른 곳에서 전달)
  } = location.state || {}

  // 문제 데이터 준비
  const relatedQuestions = useMemo<Question[]>(() => {
    // API에서 받은 문제가 있으면 변환하여 사용 (DifficultyQuiz, WeaknessQuiz 등)
    if (apiQuestions && Array.isArray(apiQuestions) && apiQuestions.length > 0) {
      if (examType === "practical") {
        return normalizePractical(apiQuestions)
      } else {
        return normalizeMcq(apiQuestions)
      }
    }

    // CategoryQuiz에서 온 경우: mockData에서 필터링
    const detailIds = Array.isArray(selectedDetails) ? selectedDetails : []
    const filtered = questions.filter((q) =>
      detailIds.map(String).includes(q.topicId)
    )
    return filtered.slice(0, questionCount || 10)
  }, [apiQuestions, selectedDetails, questionCount, examType])

  // 단계 상태 문제 -> 결과
  const [step, setStep] = useState<"problem" | "result">("problem")
  const [problemScore, setProblemScore] = useState(0)
  const [showLevelUp, setShowLevelUp] = useState(false)

  // 점수 비율로 레벨업 조건 판단
  const totalProblems = relatedQuestions.length
  const percentage = Math.round((problemScore / totalProblems) * 100)

  useEffect(() => {
    if (step === "result" && percentage === 100) {
      setShowLevelUp(true)
    }
  }, [step, percentage])

  // 문제가 없거나 examType이 없을 때 처리
  if (!relatedQuestions || relatedQuestions.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600 mb-4">문제를 불러올 수 없습니다.</p>
        <button
          onClick={() => navigate("/solo")}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          돌아가기
        </button>
      </div>
    )
  }

  if (!examType) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600 mb-4">시험 유형 정보가 없습니다.</p>
        <button
          onClick={() => navigate("/solo")}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          돌아가기
        </button>
      </div>
    )
  }

  // 문제 풀이 단계 필기/실기 분기
  if (step === "problem") {
    if (examType === "written") {
      return (
        <ProblemSolving
          questions={relatedQuestions}
          quizType={quizType}
          onComplete={(score) => {
            setProblemScore(score)
            setStep("result")
          }}
        />
      )
    } else if (examType === "practical") {
      const quizTitle =
        quizType === "difficulty"
          ? "난이도별 퀴즈"
          : quizType === "weakness"
          ? "약점 퀴즈"
          : "카테고리 퀴즈"

      // topicId 추출: location.state에서 받거나, API 응답에서 추출하거나, 문제 데이터에서 추출
      const extractedTopicId = topicId || 
        apiResponse?.meta?.topicId || 
        (apiQuestions && apiQuestions.length > 0 && (apiQuestions[0] as any).topicId) ||
        (relatedQuestions && relatedQuestions.length > 0 && Number(relatedQuestions[0].topicId) || 0) ||
        0

      return (
        <ProblemPractical
          questions={relatedQuestions}
          topicName={quizTitle}
          topicId={typeof extractedTopicId === 'number' ? extractedTopicId : Number(extractedTopicId) || 0}
          onComplete={(score) => {
            setProblemScore(score)
            setStep("result")
          }}
        />
      )
    }
  }

  // 결과 화면
  if (step === "result") {
    // 퀴즈 타입에 따른 제목 결정
    const quizTitle =
      quizType === "difficulty"
        ? "난이도별 퀴즈"
        : quizType === "weakness"
        ? "약점 퀴즈"
        : "카테고리 퀴즈"

    return (
      <>
        <ReviewResult
          topicName={quizTitle}
          problemScore={problemScore}
          totalProblem={totalProblems}
          onRetry={() => setStep("problem")}
          onBackToDashboard={() => navigate("/solo")}
        />
        {showLevelUp && (
          <LevelUpScreen
            currentLevel={3}
            currentExp={80}
            earnedExp={20}
            expPerLevel={100}
            onComplete={() => setShowLevelUp(false)}
          />
        )}
      </>
    )
  }

  // 방어 return
  return null
}
