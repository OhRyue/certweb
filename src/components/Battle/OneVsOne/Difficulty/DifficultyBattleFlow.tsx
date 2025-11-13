import { useMemo, useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { BattleGameWritten } from "./BattleGameWritten"
import { BattleGamePractical } from "./BattleGamePractical"
import { BattleResult } from "./BattleResult"
import { LevelUpScreen } from "../../../LevelUpScreen"
import { questions as allQuestions } from "../../../../data/mockData"
import type { Question } from "../../../../types"

type ExamType = "written" | "practical"

export function DifficultyBattleFlow() {
  const navigate = useNavigate()

  const { state } = useLocation() as {
    state?: {
      opponentName?: string
      difficulty?: "easy" | "medium" | "hard"
      examType?: ExamType
      questionCount?: number
    }
  }

  // 전달된 값들
  const opponentName = state?.opponentName ?? "상대"
  const difficulty = state?.difficulty ?? "medium"
  const examType: ExamType = state?.examType ?? "written"
  const questionCount = state?.questionCount ?? 20

  // 잘못 들어왔을 때
  useEffect(() => {
    if (!state) {
      navigate("/battle/onevsone/difficulty/matching")
    }
  }, [state, navigate])

  // 난이도 기반 문제 필터링
  const filtered = useMemo<Question[]>(() => {
    const base = allQuestions.filter(q => q.difficulty === difficulty)
    if (base.length > 0) return base.slice(0, questionCount)
    return allQuestions.slice(0, questionCount)
  }, [difficulty, questionCount])

  // 단계: game → result → levelUp
  const [step, setStep] = useState<"game" | "result" | "levelUp">("game")
  const [myScore, setMyScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)

  // 경험치
  const [currentLevel, setCurrentLevel] = useState(5)
  const [currentExp, setCurrentExp] = useState(20)
  const expPerLevel = 100
  const earnedExp = myScore * 7

  // GAME
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

  // RESULT 화면
  if (step === "result") {
    return (
      <BattleResult
        myScore={myScore}
        opponentScore={opponentScore}
        opponentName={opponentName}
        onRematch={() => navigate("/battle/onevsone/difficulty/matching")}
        onBackToDashboard={() => setStep("levelUp")}
      />
    )
  }

  // LEVEL UP 화면
  return (
    <LevelUpScreen
      currentLevel={currentLevel}
      currentExp={currentExp}
      earnedExp={earnedExp}
      expPerLevel={expPerLevel}
      onComplete={() => {
        setCurrentExp(prev => {
          const total = prev + earnedExp
          const newLevel = currentLevel + Math.floor(total / expPerLevel)
          const newExpInLevel = total % expPerLevel
          setCurrentLevel(newLevel)
          return newExpInLevel
        })
        navigate("/battle")
      }}
    />
  )
}