import { useState, useMemo, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { ReviewMiniCheck } from "./ReviewMiniCheck"
import { ReviewProblemSolving } from "./ReviewProblemSolving"
import { ReviewResult } from "./ReviewResult"
import { LevelUpScreen } from "../LevelUpScreen"
import { questions, topics } from "../../data/mockData"

export function ReviewFlowPage() {
  const [step, setStep] = useState<"mini" | "problem" | "result">("mini")
  const [miniScore, setMiniScore] = useState(0)
  const [problemScore, setProblemScore] = useState(0)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const topicParam = searchParams.get("topicId")
  const topicId = topicParam && topicParam.trim() !== "" ? topicParam.trim() : "db-basic"
  const topicName = topics.find(t => t.id === topicId)?.name || "AI 총정리"

  const relatedQuestions = useMemo(() => {
    return questions.filter(q => q.topicId === topicId)
  }, [topicId])

  const oxQuestions = relatedQuestions.filter(q => q.type === "ox")
  const multipleQuestions = relatedQuestions.filter(q => q.type === "multiple")

  const totalProblems = oxQuestions.length + multipleQuestions.length
  const totalScore = miniScore + problemScore
  const percentage = Math.round((totalScore / totalProblems) * 100)

  // ✅ 결과 진입 시 자동 LevelUp
  useEffect(() => {
    if (step === "result" && percentage === 100) {
      setShowLevelUp(true)
    }
  }, [step, percentage])

  if (step === "mini") {
    return (
      <ReviewMiniCheck
        key="mini-step"
        questions={oxQuestions}
        topicName={topicName}
        onComplete={score => {
          setMiniScore(score)
          setStep("problem")
        }}
      />
    )
  }

  if (step === "problem") {
    return (
      <ReviewProblemSolving
        key="problem-step"
        questions={multipleQuestions}
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
          miniCheckScore={miniScore}
          problemScore={problemScore}
          totalMini={oxQuestions.length}
          totalProblem={multipleQuestions.length}
          onRetry={() => setStep("mini")}
          onBackToDashboard={() => navigate("/learning")}
        />

        {showLevelUp && (
          <LevelUpScreen
            currentLevel={2}
            currentExp={60}
            earnedExp={40}
            expPerLevel={100}
            onComplete={() => setShowLevelUp(false)} // 확인 누르면 LevelUp만 닫힘
          />
        )}
      </>
    )
  }

  return null
}
