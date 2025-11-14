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

  const opponentName = state?.opponentName ?? "상대"
  const difficulty = state?.difficulty ?? "medium"
  const examType: ExamType = state?.examType ?? "written"
  const questionCount = state?.questionCount ?? 20

  useEffect(() => {
    if (!state) navigate("/battle/onevsone/difficulty/matching")
  }, [state, navigate])

  // 난이도 기준으로 필터링
  const filtered = useMemo<Question[]>(() => {
    const base = allQuestions.filter(q => q.difficulty === difficulty)
    if (base.length > 0) return base.slice(0, questionCount)
    return allQuestions.slice(0, questionCount)
  }, [difficulty, questionCount])

  // game → levelUp → result
  const [step, setStep] = useState<"game" | "levelUp" | "result">("game")
  const [myScore, setMyScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)

  const [currentLevel, setCurrentLevel] = useState(5)
  const [currentExp, setCurrentExp] = useState(20)
  const expPerLevel = 100
  const earnedExp = myScore * 7

  // 1) 게임 화면
  if (step === "game") {
    const GameComponent =
      examType === "practical" ? BattleGamePractical : BattleGameWritten

    return (
      <GameComponent
        questions={filtered}
        opponentName={opponentName}
        onComplete={(me, opp) => {
          setMyScore(me)
          setOpponentScore(opp)
          // 게임 끝나자마자 레벨업으로
          setStep("levelUp")
        }}
        onExit={() => navigate("/battle")}
      />
    )
  }

  // 2) 레벨업 화면 (게임 끝나고 바로)
  if (step === "levelUp") {
    return (
      <LevelUpScreen
        currentLevel={currentLevel}
        currentExp={currentExp}
        earnedExp={earnedExp}
        expPerLevel={expPerLevel}
        onComplete={() => {
          // 경험치/레벨 반영
          setCurrentExp(prevExp => {
            const total = prevExp + earnedExp
            const levelUpCount = Math.floor(total / expPerLevel)

            if (levelUpCount > 0) {
              setCurrentLevel(prevLevel => prevLevel + levelUpCount)
            }

            return total % expPerLevel
          })

          // 레벨업 모달 닫으면 → 결과 화면으로 전환
          setStep("result")
        }}
      />
    )
  }

  // 3) 최종 결과 화면 (나중에)
  if (step === "result") {
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

  return null
}
