import { useState, useMemo } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { ReviewMiniCheck } from "./ReviewMiniCheck"
import { ReviewProblemSolvingPractical } from "./ReviewProblemSolvingPractical"
import { ReviewResult } from "./ReviewResult"
import { questions, topics } from "../../data/mockData"

export function ReviewFlowPracticalPage() {
    const [step, setStep] = useState<"mini" | "problem" | "result">("mini")
    const [miniScore, setMiniScore] = useState(0)
    const [problemScore, setProblemScore] = useState(0)
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const topicParam = searchParams.get("topicId")
    const topicId = topicParam && topicParam.trim() !== "" ? topicParam.trim() : "db-basic"
    const topicName = topics.find((t) => t.id === topicId)?.name || "실기 총정리"

    const relatedQuestions = useMemo(() => {
        return questions.filter((q) => q.topicId === topicId)
    }, [topicId])

    const oxQuestions = relatedQuestions.filter((q) => q.type === "ox")
    const practicalQuestions = relatedQuestions.filter((q) => q.type === "multiple")            // 데이터 연결 시 변경

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

    if (step === "problem") {
        return (
            <ReviewProblemSolvingPractical
                key="problem-step"
                questions={practicalQuestions}
                topicName={topicName}
                onComplete={(score) => {
                    setProblemScore(score)
                    setStep("result")
                }}
            />
        )
    }

    if (step === "result") {
        return (
            <ReviewResult
                topicName={topicName}
                miniCheckScore={miniScore}
                problemScore={problemScore}
                totalMini={oxQuestions.length}
                totalProblem={practicalQuestions.length}
                onRetry={() => setStep("mini")}
                onBackToDashboard={() => navigate("/learning")}
            />
        )
    }

    return null
}
