import { useState, useMemo, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { ConceptView } from "./ConceptView"
import { MiniCheck } from "./MiniCheck"
import { ProblemSolving } from "./ProblemSolving"
import { MicroWrongAnswers } from "./MicroWrongAnswers"
import { MicroResult } from "./MicroResult"
import { LevelUpScreen } from "../LevelUpScreen"
import { subjects, concepts, questions } from "../../data/mockData"

export function MicroFlowPage() {
  const [step, setStep] = useState<"concept" | "mini" | "problem" | "wrong" | "result">("concept")
  const [miniScore, setMiniScore] = useState(0)
  const [problemScore, setProblemScore] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState<any[]>([])
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const subTopicId = Number(searchParams.get("subTopicId"))
  const examType = (searchParams.get("type") as "written" | "practical") || "written"

  // subTopicId로 현재 subTopic 찾기
  const currentSubTopic = useMemo(() => {
    for (const subject of subjects) {
      for (const main of subject.mainTopics) {
        const found = main.subTopics.find((s) => s.id === subTopicId)
        if (found) return { ...found, subject }
      }
    }
    return null
  }, [subTopicId])

  // ✅ subTopic 밑의 detail들이 참조하는 concept 전부 모으기
  const conceptList = useMemo(() => {
    if (!currentSubTopic) return []
    const ids = currentSubTopic.details.map((d) => d.conceptId)
    return concepts.filter((c) => ids.includes(c.id))
  }, [currentSubTopic])

  // 관련 문제 (subTopic의 첫 concept 기준)
  const firstConcept = conceptList[0]
  const relatedQuestions = questions.filter((q) => q.topicId === firstConcept?.topicId)
  const oxQuestions = relatedQuestions.filter((q) => q.type === "ox")
  const multipleQuestions = relatedQuestions.filter((q) => q.type === "multiple")

  const totalProblems = oxQuestions.length + multipleQuestions.length
  const totalScore = miniScore + problemScore
  const percentage = Math.round((totalScore / totalProblems) * 100)

  // 100% 정답 시 subTopic 완료 처리
  useEffect(() => {
    if (!currentSubTopic) return

    if (step === "result" && percentage === 100) {
      if (!currentSubTopic.completed) {
        setShowLevelUp(true)

        const subjectIndex = subjects.findIndex((s) => s.id === currentSubTopic.subject.id)
        const mainTopic = subjects[subjectIndex].mainTopics.find((m) =>
          m.subTopics.some((sub) => sub.id === currentSubTopic.id)
        )

        if (mainTopic) {
          const target = mainTopic.subTopics.find((s) => s.id === currentSubTopic.id)
          if (target) target.completed = true
        }
      }
    }
  }, [step, percentage, currentSubTopic])

  // 데이터 없을 때
  if (!currentSubTopic || conceptList.length === 0) {
    return (
      <div className="p-8 text-center text-red-500">
        데이터를 불러올 수 없습니다
      </div>
    )
  }

  // 단계별 렌더링
  if (step === "concept") {
    return (
      <ConceptView
        concepts={conceptList} // ✅ 여러 개의 개념 배열 전달
        topicName={currentSubTopic.name}
        onNext={() => setStep("mini")}
      />
    )
  }

  if (step === "mini") {
    return (
      <MiniCheck
        questions={oxQuestions}
        topicName={currentSubTopic.name}
        onComplete={(score) => {
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
        topicName={currentSubTopic.name}
        examType={examType}
        onComplete={(score, answers) => {
          setProblemScore(score)
          const wrongs = answers
            .filter((a) => !a.isCorrect)
            .map((a) => ({
              question: multipleQuestions.find((q) => q.id === a.questionId),
              userAnswer: a.selectedAnswer,
              correctAnswer: multipleQuestions.find((q) => q.id === a.questionId)?.correctAnswer,
            }))
          setWrongAnswers(wrongs)
          setStep("wrong")
        }}
      />
    )
  }

  if (step === "wrong") {
    return (
      <MicroWrongAnswers
        wrongAnswers={wrongAnswers}
        topicName={currentSubTopic.name}
        examType={examType}
        onContinue={() => setStep("result")}
      />
    )
  }

  if (step === "result") {
    return (
      <>
        <MicroResult
          topicName={currentSubTopic.name}
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
            onComplete={() => setShowLevelUp(false)}
          />
        )}
      </>
    )
  }
}
