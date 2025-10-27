import { useState, useMemo } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { ReviewMiniCheck } from "./ReviewMiniCheck"
import { ReviewProblemSolving } from "./ReviewProblemSolving"
import { ReviewResult } from "./ReviewResult"
import { questions, topics } from "../../data/mockData"

export function ReviewFlowPage() {
  const [step, setStep] = useState<"mini" | "problem" | "result">("mini")
  const [miniScore, setMiniScore] = useState(0)
  const [problemScore, setProblemScore] = useState(0)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const topicParam = searchParams.get("topicId")
  const topicId = topicParam && topicParam.trim() !== "" ? topicParam.trim() : "db-basic"
  const topicName = topics.find((t) => t.id === topicId)?.name || "AI 총정리"

  const relatedQuestions = useMemo(() => {
    return questions.filter((q) => q.topicId === topicId)
  }, [topicId])

  const oxQuestions = relatedQuestions.filter((q) => q.type === "ox")
  const multipleQuestions = relatedQuestions.filter((q) => q.type === "multiple")

  // OX 단계
  if (step === "mini") {
    return (
      <ReviewMiniCheck
        key="mini-step"
        questions={oxQuestions}
        topicName={topicName}
        onComplete={(score) => {
          setMiniScore(score)
          setStep("problem")
        }}
      />
    )
  }

  // 객관식 단계 (새로 렌더되도록 key 다르게)
  if (step === "problem") {
    return (
      <ReviewProblemSolving
        key="problem-step"
        questions={multipleQuestions}
        topicName={topicName}
        onComplete={(score) => {
          setProblemScore(score)
          setStep("result")
        }}
      />
    )
  }

  // 결과 화면
  if (step === "result") {
    return (
      <ReviewResult
        topicName={topicName}
        miniCheckScore={miniScore}
        problemScore={problemScore}
        totalMini={oxQuestions.length}
        totalProblem={multipleQuestions.length}
        onRetry={() => setStep("mini")}
        onBackToDashboard={() => navigate("/learning")}
      />
    )
  }

  return null
}
