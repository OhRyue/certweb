import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import axios from "../api/axiosConfig"

import { ConceptView } from "./ConceptView"
import { MiniCheck } from "./MiniCheck"
import { ProblemSolving } from "./ProblemSolving"
import { MicroWrongAnswers } from "./MicroWrongAnswers"
import { MicroResult } from "./MicroResult"
import { LevelUpScreen } from "../LevelUpScreen"

export function MicroFlowPage() {
  const [step, setStep] = useState("concept")
  const [conceptData, setConceptData] = useState(null)
  const [miniData, setMiniData] = useState(null)
  const [mcqData, setMcqData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [miniScore, setMiniScore] = useState(0)
  const [problemScore, setProblemScore] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState([])
  const [showLevelUp, setShowLevelUp] = useState(false)

  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const subTopicId = Number(searchParams.get("subTopicId"))
  const userId = localStorage.getItem("userId") || "guest"
  const rawType = (searchParams.get("type") || "written").toLowerCase()
  const examType = (rawType === "practical" ? "practical" : "written") as "written" | "practical"

  function normalizeMcq(items) {
    return items.map((q) => ({
      id: q.questionId,
      question: q.text,

      // 선택지 변환
      options: q.choices
        ? q.choices.map(c => `${c.label}. ${c.text}`)
        : [],

      // 아직 정답 모름 → grade-one 때 판단
      correctAnswer: null,

      explanation: "",
      difficulty: q.difficulty ?? "medium",
      tags: q.tags ?? []
    }))
  }

  // 1. 개념 불러오기
  useEffect(() => {
    const fetchConcepts = async () => {
      try {
        const res = await axios.get(`/cert/concepts/${subTopicId}`)
        const parsed = JSON.parse(res.data.sectionsJson)

        setConceptData({
          topicId: res.data.topicId,
          sections: parsed.sections,
          title: parsed.title || ""   // 없으면 빈 문자열
        })

      } catch (err) {
        console.error(err)
        setError("개념을 불러오는 중 오류가 발생했습니다")
      } finally {
        setLoading(false)
      }
    }

    fetchConcepts()
  }, [subTopicId])


  if (loading) return <div className="p-8 text-center">불러오는 중</div>
  if (error) return <div className="p-8 text-red-500 text-center">{error}</div>
  if (!conceptData) return null

  // 2. 개념
  if (step === "concept") {
    return (
      <ConceptView
        data={conceptData}
        onNext={async () => {
          try {
            const res = await axios.get(`/study/${examType}/mini/${subTopicId}`)
            setMiniData(res.data.payload.items)
            setStep("mini")
          } catch (err) {
            console.error(err)
            setError("미니체크 불러오기 실패")
          }
        }}
      />
    )
  }

  // 3. 미니체크
  if (step === "mini") {
    return (
      <MiniCheck
        questions={miniData}
        topicName={conceptData.title}
        userId={userId}
        topicId={subTopicId}
        examType={examType}
        onComplete={async (score) => {
          setMiniScore(score)
          try {
            const res = await axios.get(`/study/${examType}/mcq/${subTopicId}`)
            setMcqData(normalizeMcq(res.data.payload.items))
            setStep("problem")
          } catch (err) {
            console.error(err)
            setError("객관식 문제 불러오기 실패")
          }
        }}
      />
    )
  }

  // 4. MCQ
  if (!mcqData) return <div>불러오는 중...</div>
  if (step === "problem") {
    return (
      <ProblemSolving
        questions={mcqData}
        topicName={conceptData.title}
        topicId={subTopicId}
        userId={userId}
        examType={examType}
        onSubmitOne={async ({ questionId, label }) => {
          const res = await axios.post(`/study/${examType}/mcq/grade-one`, {
            userId,
            topicId: subTopicId,
            questionId,
            label
          })
          console.log("mcqData:", res.data.payload.items)     // 디버깅
          return res.data // { correct, correctLabel, explanation, aiExplanation }
        }}
        onComplete={(score, answers) => {
          setProblemScore(score)
          setWrongAnswers(answers.filter(a => !a.isCorrect))
          setStep("wrong")
        }}
      />
    )
  }

  // 5. 오답 정리
  if (step === "wrong") {
    return (
      <MicroWrongAnswers
        wrongAnswers={wrongAnswers}
        topicName={conceptData.title}
        examType={examType}
        onContinue={() => setStep("result")}
      />
    )
  }

  // 6. 결과 화면
  if (step === "result") {
    return (
      <>
        <MicroResult
          topicName={conceptData.title}
          miniCheckScore={miniScore}
          problemScore={problemScore}
          totalProblems={mcqData.length}
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
