import { useState, useMemo, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { CategoryProblemSolving } from "./CategoryProblemSolving"
import { CategoryProblemPractical } from "./CategoryProblemPractical"
import { ReviewResult } from "../MainLearning/ReviewResult"
import { LevelUpScreen } from "../LevelUpScreen"
import { questions } from "../../data/mockData"

export function CategoryQuizFlowPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { selectedDetails, questionCount, examType } = location.state || {}

  const detailIds = Array.isArray(selectedDetails) ? selectedDetails : []

  // mockData에서 필터링
  const relatedQuestions = useMemo(() => {
    const filtered = questions.filter(q => detailIds.includes(q.detailId))
    return filtered.slice(0, questionCount || 10)
  }, [detailIds, questionCount])

  const [step, setStep] = useState<"problem" | "result">("problem")
  const [problemScore, setProblemScore] = useState(0)
  const [showLevelUp, setShowLevelUp] = useState(false)

  const totalProblems = relatedQuestions.length
  const percentage = Math.round((problemScore / totalProblems) * 100)

  useEffect(() => {
    if (step === "result" && percentage === 100) {
      setShowLevelUp(true)
    }
  }, [step, percentage])

  // 🧠 examType에 따라 문제풀이 컴포넌트 분기
  if (step === "problem") {
    if (examType === "written") {
      return (
        <CategoryProblemSolving
          questions={relatedQuestions}
          onComplete={(score) => {
            setProblemScore(score)
            setStep("result")
          }}
        />
      )
    } else if (examType === "practical") {
      return (
        <CategoryProblemPractical
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

  return null
}
