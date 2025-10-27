import { useState, useMemo } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { ConceptView } from "./ConceptView"
import { MiniCheck } from "./MiniCheck"
import { ProblemSolving } from "./ProblemSolving"
import { MicroResult } from "./MicroResult"
import { subjects, concepts, questions } from "../../data/mockData"

export function MicroFlowPage() {
  const [step, setStep] = useState<"concept" | "mini" | "problem" | "result">("concept")
  const [miniScore, setMiniScore] = useState(0)
  const [problemScore, setProblemScore] = useState(0)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const detailId = Number(searchParams.get("detailId"))
  const examType = (searchParams.get("type") as "written" | "practical") || "written"

  // detailId로 현재 세부 항목 찾기
  const currentDetail = useMemo(() => {
    for (const subject of subjects) {
      for (const main of subject.mainTopics) {
        for (const sub of main.subTopics) {
          const found = sub.details.find(d => d.id === detailId)
          if (found) return { ...found, subject }
        }
      }
    }
    return null
  }, [detailId])

  // 관련 concept 찾기
  const concept = concepts.find(c => c.id === currentDetail?.conceptId)

  // 관련 문제 가져오기 (OX → MiniCheck, Multiple → ProblemSolving)
  const relatedQuestions = questions.filter(q => q.topicId === concept?.topicId)
  const oxQuestions = relatedQuestions.filter(q => q.type === "ox")
  const multipleQuestions = relatedQuestions.filter(q => q.type === "multiple")

  if (!currentDetail || !concept) {
    return <div className="p-8 text-center text-red-500">데이터를 불러올 수 없습니다</div>
  }

  // 단계 전환 흐름
  if (step === "concept") {
    return (
      <ConceptView
        concept={concept}
        topicName={currentDetail.name}
        onNext={() => setStep("mini")}
      />
    )
  }

  if (step === "mini") {
    return (
      <MiniCheck
        questions={oxQuestions}
        topicName={currentDetail.name}
        onComplete={score => {
          setMiniScore(score)
          setStep("problem")
        }}
      />
    )
  }

  if (step === "problem") {
    return (
      <ProblemSolving
        questions={multipleQuestions}
        topicName={currentDetail.name}
        examType={examType}
        onComplete={score => {
          setProblemScore(score)
          setStep("result")
        }}
      />
    )
  }

  if (step === "result") {
    return (
      <MicroResult
        topicName={currentDetail.name}
        miniCheckScore={miniScore}
        problemScore={problemScore}
        totalProblems={oxQuestions.length + multipleQuestions.length}
        onRetry={() => setStep("concept")}
        onBackToDashboard={() => navigate("/learning")}
      />
    )
  }

  return null
}
