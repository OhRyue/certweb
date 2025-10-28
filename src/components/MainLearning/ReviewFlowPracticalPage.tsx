import { useState, useMemo, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { ReviewProblemSolvingPractical } from "./ReviewProblemSolvingPractical"
import { ReviewResult } from "./ReviewResult"
import { LevelUpScreen } from "../LevelUpScreen"
import { questions, topics } from "../../data/mockData"

export function ReviewFlowPracticalPage() {
  const [step, setStep] = useState<"problem" | "result">("problem")
  const [problemScore, setProblemScore] = useState(0)
  const [showLevelUp, setShowLevelUp] = useState(false)

  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const topicParam = searchParams.get("topicId")
  const topicId = topicParam && topicParam.trim() !== "" ? topicParam.trim() : "db-basic"
  const topicName = topics.find(t => t.id === topicId)?.name || "실기 총정리"

  const relatedQuestions = useMemo(() => {
    return questions.filter(q => q.topicId === topicId && q.type === "multiple")
  }, [topicId])

  const totalProblems = relatedQuestions.length
  const percentage = Math.round((problemScore / totalProblems) * 100)

  useEffect(() => {
    const reviewCompleted = false // 나중에 백엔드 연동 시 교체
    if (step === "result" && percentage === 100 && !reviewCompleted) {
      setShowLevelUp(true)
    }
  }, [step, percentage])

  if (step === "problem") {
    return (
      <ReviewProblemSolvingPractical
        key="problem-step"
        questions={relatedQuestions}
        topicName={topicName}
        onComplete={score => {
          setProblemScore(score)
          setStep("result")
        }}
      />
    )
  }

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
