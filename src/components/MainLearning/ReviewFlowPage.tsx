import { useState, useMemo, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { ReviewProblemSolving } from "./ReviewProblemSolving"
import { ReviewResult } from "./ReviewResult"
import { LevelUpScreen } from "../LevelUpScreen"
import { questions, topics } from "../../data/mockData"

export function ReviewFlowPage() {
  const [step, setStep] = useState<"problem" | "result">("problem")
  const [problemScore, setProblemScore] = useState(0)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const topicParam = searchParams.get("topicId")
  const topicId = topicParam && topicParam.trim() !== "" ? topicParam.trim() : "db-basic"
  const topicName = topics.find(t => t.id === topicId)?.name || "AI 총정리"

  const relatedQuestions = useMemo(() => {
    return questions.filter(q => q.topicId === topicId && q.type === "multiple")
  }, [topicId])

  const totalProblems = relatedQuestions.length
  const percentage = Math.round((problemScore / totalProblems) * 100)

  useEffect(() => {
    const reviewCompleted = false
    if (step === "result" && percentage === 100 && !reviewCompleted) {
      setShowLevelUp(true)
    }
  }, [step, percentage])

  // 문제 풀이 단계
  if (step === "problem") {
    return (
      <ReviewProblemSolving
        key="problem-step"
        questions={relatedQuestions}
        onComplete={score => {
          setProblemScore(score)
          setStep("result")
        }}
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
