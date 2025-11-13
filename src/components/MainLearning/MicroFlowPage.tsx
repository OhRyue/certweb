import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { ConceptView } from "./ConceptView"
import { MiniCheck } from "./MiniCheck"
import { ProblemSolving } from "./ProblemSolving"
import { MicroWrongAnswers } from "./MicroWrongAnswers"
import { MicroResult } from "./MicroResult"
import { LevelUpScreen } from "../LevelUpScreen"


export function MicroFlowPage() {
  const [step, setStep] = useState<"concept" | "mini" | "problem" | "wrong" | "result">("concept")
  const [conceptData, setData] = useState<any>(null)
  const [miniData, setMiniData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [miniScore, setMiniScore] = useState(0)
  const [problemScore, setProblemScore] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState<any[]>([])
  const [showLevelUp, setShowLevelUp] = useState(false)

  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const subTopicId = Number(searchParams.get("subTopicId"))
  const examType = (searchParams.get("type") as "written" | "practical") || "written"

  const userId = "string"    // debug

  // subTopicId로 백엔드에서 데이터 불러오기
  useEffect(() => {
    const fetchConcepts = async () => {
      try {
        const res = await axios.get(`/api/study/practical/concept/${subTopicId}`)
        setData(res.data)
      } catch (err) {
        console.error(err)
        setError("데이터를 불러오는 중 오류가 발생했습니다.")
      } finally {
        setLoading(false)
      }
    }
    fetchConcepts()
  }, [subTopicId])

  if (loading) return <div className="p-8 text-center text-gray-500">불러오는 중...</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>
  if (!conceptData) return null

  // 섹션(개념) 단계 → Mini → 문제 → 결과
  if (step === "concept") {
    return (
      <ConceptView
        data={conceptData} 
        onNext={async () => {
          try {
            const res = await axios.get(`/api/study/practical/mini/${subTopicId}`)
            setMiniData(res.data)
            setStep("mini")
          } catch (err) {
            console.error(err)
            setError("Mini Quiz 데이터 불러오기 실패")
          }
        }}
      />
    )
  }

  if (step === "mini") {
    return (
      <MiniCheck
        questions={miniData} // TODO: 백엔드 문제 API 연결 시 교체
        topicName={conceptData.title}
        userId={userId}
        topicId={subTopicId}
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
        questions={[]} // TODO: 백엔드 문제 API 연결 시 교체
        topicName={conceptData.title}
        examType={examType}
        onComplete={(score, answers) => {
          setProblemScore(score)
          setWrongAnswers(answers.filter(a => !a.isCorrect))
          setStep("wrong")
        }}
      />
    )
  }

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

  if (step === "result") {
    return (
      <>
        <MicroResult
          topicName={conceptData.title}
          miniCheckScore={miniScore}
          problemScore={problemScore}
          totalProblems={10} // 임시값, 나중에 문제 수 연동
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
