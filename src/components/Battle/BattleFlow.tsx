// src/pages/battle/BattleFlow.tsx
import { useMemo, useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { BattleGameWritten } from "./BattleGameWritten"
import { BattleGamePractical } from "./BattleGamePractical"
import { BattleResult } from "./BattleResult"
import { LevelUpScreen } from "../../components/LevelUpScreen" // 경로 맞춰야 함
import { questions as allQuestions } from "../../data/mockData"
import type { Question } from "../../types"

type ExamType = "written" | "practical"

export function BattleFlow() {
  const navigate = useNavigate()
  const { state } = useLocation() as {
    state?: {
      opponentName?: string
      topicId?: string
      topicName?: string
      difficulty?: "easy" | "medium" | "hard"
      examType?: ExamType
    }
  }

  const opponentName = state?.opponentName ?? "상대"
  const topicKey = state?.topicId ?? state?.topicName ?? "db-basic"
  const difficulty = state?.difficulty ?? "medium"
  const examType: ExamType = state?.examType ?? "written"

  useEffect(() => {
    if (!state || !topicKey || !difficulty) {
      navigate("/battle/onevsone/matching")
    }
  }, [state, topicKey, difficulty, navigate])

  const filtered = useMemo<Question[]>(() => {
    const base = allQuestions.filter(q => q.topicId === topicKey && q.difficulty === difficulty)
    if (base.length > 0) return base
    return allQuestions.slice(0, 5)
  }, [topicKey, difficulty])

  // ✅ 3단계: game → result → levelUp
  const [step, setStep] = useState<"game" | "result" | "levelUp">("game")
  const [myScore, setMyScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)

  // ✅ 유저 정보(추후 API 연동 가능하도록 state로 분리)
  const [currentLevel, setCurrentLevel] = useState(5)
  const [currentExp, setCurrentExp] = useState(50)
  const expPerLevel = 100

  // ✅ 경험치 획득 공식 (여기서 임시로 점수 기반)
  const earnedExp = myScore * 7 // 점수 x7을 경험치로 줬다고 가정

  if (step === "game") {
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

  if (step === "result") {
    return (
      <BattleResult
        myScore={myScore}
        opponentScore={opponentScore}
        opponentName={opponentName}
        onRematch={() => navigate("/battle/onevsone/matching")}
        onBackToDashboard={() => setStep("levelUp")} // ✅ 결과 → 경험치 화면
      />
    )
  }

  // ✅ 마지막: 경험치/레벨업 화면 (오버레이)
  return (
    <LevelUpScreen
      currentLevel={currentLevel}
      currentExp={currentExp}
      earnedExp={earnedExp}
      expPerLevel={expPerLevel}
      onComplete={() => {
        // 실제로는 여기서 API 저장하면 됨
        setCurrentExp(prev => {
          const total = prev + earnedExp
          const newLevel = currentLevel + Math.floor(total / expPerLevel)
          const newExpInLevel = total % expPerLevel
          setCurrentLevel(newLevel)
          return newExpInLevel
        })
        navigate("/battle") // ✅ 경험치 다 보고 나서 다시 배틀 메뉴로
      }}
    />
  )
}
