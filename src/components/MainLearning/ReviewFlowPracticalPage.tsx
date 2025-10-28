import { useState, useMemo, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { ReviewMiniCheck } from "./ReviewMiniCheck"
import { ReviewProblemSolvingPractical } from "./ReviewProblemSolvingPractical"
import { ReviewResult } from "./ReviewResult"
import { LevelUpScreen } from "../LevelUpScreen"
import { questions, topics } from "../../data/mockData"

export function ReviewFlowPracticalPage() {
  const [step, setStep] = useState<"mini" | "problem" | "result">("mini")
  const [miniScore, setMiniScore] = useState(0)
  const [problemScore, setProblemScore] = useState(0)
  const [showLevelUp, setShowLevelUp] = useState(false)

  // topic별 완료 상태 기록
  const [completedTopics, setCompletedTopics] = useState<Record<string, boolean>>({})

  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const topicParam = searchParams.get("topicId")
  const topicId = topicParam && topicParam.trim() !== "" ? topicParam.trim() : "db-basic"
  const topicName = topics.find(t => t.id === topicId)?.name || "실기 총정리"

  const relatedQuestions = useMemo(() => {
    return questions.filter(q => q.topicId === topicId)
  }, [topicId])

  const oxQuestions = relatedQuestions.filter(q => q.type === "ox")
  const practicalQuestions = relatedQuestions.filter(q => q.type === "multiple")

  const totalProblems = oxQuestions.length + practicalQuestions.length
  const totalScore = miniScore + problemScore
  const percentage = Math.round((totalScore / totalProblems) * 100)

  // ✅ 결과 들어왔을 때 경험치 조건 확인
  useEffect(() => {
    if (step === "result" && percentage === 100 && !completedTopics[topicId]) {
      setShowLevelUp(true)
      setCompletedTopics(prev => ({
        ...prev,
        [topicId]: true,
      }))
    }
  }, [step, percentage, topicId, completedTopics])

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
      <ReviewProblemSolvingPractical
        key="problem-step"
        questions={practicalQuestions}
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
          miniCheckScore={miniScore}
          problemScore={problemScore}
          totalMini={oxQuestions.length}
          totalProblem={practicalQuestions.length}
          onRetry={() => setStep("mini")}
          onBackToDashboard={() => navigate("/learning")}
        />

        {showLevelUp && (
          <LevelUpScreen
            currentLevel={2}
            currentExp={60}
            earnedExp={40}
            expPerLevel={100}
            onComplete={() => setShowLevelUp(false)} // “확인” 누르면 닫힘
          />
        )}
      </>
    )
  }

  return null
}
