// src/pages/battle/BattleFlow.tsx
import { useMemo, useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { BattleGameWritten } from "./BattleGameWritten"
import { BattleGamePractical } from "./BattleGamePractical"
import { BattleResult } from "./BattleResult"
import { questions as allQuestions } from "../../data/mockData"
import { Question } from "../../types"

type ExamType = "written" | "practical"

export function BattleFlow() {
  const navigate = useNavigate()
  const { state } = useLocation() as {
    state?: {
      opponentName?: string
      topicId?: string   // ex) "db-basic" "network" "oop"
      topicName?: string // 혹시 이렇게 넘겼으면 fallback
      difficulty?: "easy" | "medium" | "hard"
      examType?: ExamType
    }
  }

  const opponentName = state?.opponentName ?? "상대"
  const topicKey = state?.topicId ?? state?.topicName ?? "db-basic"
  const difficulty = state?.difficulty ?? "medium"
  const examType: ExamType = state?.examType ?? "written"

  // state 안왔으면 매칭으로
  useEffect(() => {
    if (!state || !topicKey || !difficulty) {
      navigate("/battle/onevsone/matching")
    }
  }, [state, topicKey, difficulty, navigate])

  const filtered = useMemo<Question[]>(() => {
    // 기본 필터
    const base = allQuestions.filter(q => q.topicId === topicKey && q.difficulty === difficulty)
    if (base.length > 0) return base
    // 비어있을 때 최소한 5개 뽑아서 데모로라도 보이게
    return allQuestions.slice(0, 5)
  }, [topicKey, difficulty])

  const [step, setStep] = useState<"game" | "result">("game")
  const [myScore, setMyScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)

  if (step === "game") {
    // 실기면 타이핑, 필기면 객관식
    return examType === "practical" ? (
      <BattleGamePractical
        questions={filtered}
        opponentName={opponentName}
        onComplete={(me, opp) => {
          setMyScore(me)
          setOpponentScore(opp)
          setStep("result")
        }}
        onExit={() => navigate("/battle")}
      />
    ) : (
      <BattleGameWritten
        questions={filtered}
        opponentName={opponentName}
        onComplete={(me, opp) => {
          setMyScore(me)
          setOpponentScore(opp)
          setStep("result")
        }}
        onExit={() => navigate("/battle")}
      />
    )
  }

  return (
    <BattleResult
      myScore={myScore}
      opponentScore={opponentScore}
      opponentName={opponentName}
      onRematch={() => navigate("/battle/onevsone/matching")}
      onBackToDashboard={() => navigate("/battle")}
    />
  )
}
