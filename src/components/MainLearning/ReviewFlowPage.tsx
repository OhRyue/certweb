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

  // 이게 경험치 화면 띄울지 말지
  const [showLevelUp, setShowLevelUp] = useState(false)

  // 이게 핵심 추가 부분
  // 특정 topicId에 대한 review 총정리가 이미 클리어된 적 있는지 기록
  // 실제 서비스에서는 이걸 유저별로 백엔드에 저장해야 되는데
  // 지금은 프론트 임시 상태로만 들고 감
  const [completedTopics, setCompletedTopics] = useState<Record<string, boolean>>({})

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

  // 결과 단계 들어왔을 때 경험치 줄지 말지 판단
  useEffect(() => {
    // 조건
    // 1. 지금 단계가 result
    // 2. 100퍼 다 맞았다
    // 3. 아직 이 topicId는 처음 클리어다  completedTopics[topicId] 가 false 또는 undefined
    if (step === "result" && percentage === 100 && !completedTopics[topicId]) {
      // 경험치 화면 띄우기
      setShowLevelUp(true)

      // 이 토픽은 이제 클리어된 걸로 기록
      setCompletedTopics(prev => ({
        ...prev,
        [topicId]: true,
      }))
    }
  }, [step, percentage, topicId, completedTopics])

  // 1단계 OX
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

  // 2단계 객관식
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

  // 3단계 결과 + 레벨업 화면
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
            onComplete={() => {
              // 확인 누르면 레벨업 팝업만 닫힘
              setShowLevelUp(false)
            }}
          />
        )}
      </>
    )
  }

  return null
}
