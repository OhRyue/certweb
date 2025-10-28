import { useState, useMemo, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { ConceptView } from "./ConceptView"
import { MiniCheck } from "./MiniCheck"
import { ProblemSolving } from "./ProblemSolving"
import { MicroResult } from "./MicroResult"
import { LevelUpScreen } from "../LevelUpScreen"
import { subjects, concepts, questions } from "../../data/mockData"

export function MicroFlowPage() {
  const [step, setStep] = useState<"concept" | "mini" | "problem" | "result">("concept")
  const [miniScore, setMiniScore] = useState(0)
  const [problemScore, setProblemScore] = useState(0)
  const [showLevelUp, setShowLevelUp] = useState(false)
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

  // 관련 문제 가져오기
  const relatedQuestions = questions.filter(q => q.topicId === concept?.topicId)
  const oxQuestions = relatedQuestions.filter(q => q.type === "ox")
  const multipleQuestions = relatedQuestions.filter(q => q.type === "multiple")

  const totalProblems = oxQuestions.length + multipleQuestions.length
  const totalScore = miniScore + problemScore
  const percentage = Math.round((totalScore / totalProblems) * 100)

  // Hook은 항상 컴포넌트 상단에서 호출
  useEffect(() => {
    if (!currentDetail || !concept) return

    // 결과 단계 + 정답률 100%일 때만 체크
    if (step === "result" && percentage === 100) {
      // 이미 완료된 detail이 아닐 경우에만 경험치 지급
      if (!currentDetail.completed) {
        setShowLevelUp(true)

        // detail.completed를 true로 업데이트
        const subjectIndex = subjects.findIndex(s => s.id === currentDetail.subject.id)
        const mainTopic = subjects[subjectIndex].mainTopics.find(m =>
          m.subTopics.some(sub => sub.details.some(d => d.id === currentDetail.id))
        )

        if (mainTopic) {
          for (const sub of mainTopic.subTopics) {
            const target = sub.details.find(d => d.id === currentDetail.id)
            if (target) target.completed = true
          }
        }
      }
    }
  }, [step, percentage, currentDetail, concept])

  // 데이터 없을 때 예외 처리
  if (!currentDetail || !concept) {
    return <div className="p-8 text-center text-red-500">데이터를 불러올 수 없습니다</div>
  }

  // 단계별 흐름
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
      <>
        <MicroResult
          topicName={currentDetail.name}
          miniCheckScore={miniScore}
          problemScore={problemScore}
          totalProblems={totalProblems}
          onRetry={() => setStep("concept")}
          onBackToDashboard={() => navigate("/learning")}
        />

        {showLevelUp && (
          <LevelUpScreen
            currentLevel={2}
            currentExp={60}
            earnedExp={40}
            expPerLevel={100}
            onComplete={() => {
              // LevelUp 닫기
              setShowLevelUp(false)
            }}
          />
        )}
      </>
    )
  }
}
