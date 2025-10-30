import { useState, useMemo, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ProblemSolving } from "./ProblemSolving"
import { ProblemPractical } from "./ProblemPractical"
import { ReviewResult } from "../MainLearning/ReviewResult"
import { LevelUpScreen } from "../LevelUpScreen"
import { questions } from "../../data/mockData"

// 카테고리 퀴즈의 플로우 컨테이너
// 1. 문제 풀이 (컴포넌트 분기: 필기 / 실기)
// 2. 결과 화면 및 레벨업 오버레이

export function QuizFlowPage() {
  const location = useLocation()
  const navigate = useNavigate()

  // CategoryQuiz에서 navigate로 전달된 상태값
  const { selectedDetails, questionCount, examType } = location.state || {}
  // 선택된 detail id 배열 보정
  const detailIds = Array.isArray(selectedDetails) ? selectedDetails : []

  // mockData에서 필터링
  const relatedQuestions = useMemo(() => {
    const filtered = questions.filter(q => detailIds.map(String).includes(q.topicId))
    return filtered.slice(0, questionCount || 10)
  }, [detailIds, questionCount])

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

  // 문제 풀이 단계 필기/실기 분기
  if (step === "problem") {
    if (examType === "written") {
      return (
        <ProblemSolving
          questions={relatedQuestions}
          onComplete={(score) => {
            setProblemScore(score)
            setStep("result")
          }}
        />
      )
    } else if (examType === "practical") {
      return (
        <ProblemPractical
          questions={relatedQuestions}
          topicName="카테고리 퀴즈"
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
    return (
      <>
        <ReviewResult
          topicName="카테고리 퀴즈"
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
