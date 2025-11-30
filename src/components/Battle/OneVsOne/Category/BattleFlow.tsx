import { useMemo, useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { BattleGameWritten } from "./BattleGameWritten"
import { BattleGamePractical } from "./BattleGamePractical"
import { BattleResult } from "./BattleResult"
import { LevelUpScreen } from "../../../LevelUpScreen"
import { questions as allQuestions } from "../../../../data/mockData"
import type { Question } from "../../../../types"

type ExamType = "written" | "practical"

export function BattleFlow() {
  const navigate = useNavigate()

  const { state } = useLocation() as {
    state?: {
      opponentName?: string
      topicId?: string
      topicName?: string
      examType?: ExamType
    }
  }

  const opponentName = state?.opponentName ?? "상대"
  const topicKey = state?.topicId ?? state?.topicName ?? "db-basic"
  const examType: ExamType = state?.examType ?? "written"

  useEffect(() => {
    if (!state || !topicKey) {
      navigate("/battle/onevsone/category/matching")
    }
  }, [state, topicKey, navigate])

  // topic 기준으로 필터링
  const filtered = useMemo<Question[]>(() => {
    const base = allQuestions.filter(q => q.topicId === topicKey)
    if (base.length > 0) return base
    return allQuestions.slice(0, 5)
  }, [topicKey])

  // game → levelUp → result
  const [step, setStep] = useState<"game" | "levelUp" | "result">("game")
  const [myScore, setMyScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)

  const [currentLevel, setCurrentLevel] = useState(5)
  const [currentExp, setCurrentExp] = useState(50)
  const expPerLevel = 100
  const earnedExp = myScore * 7

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
          setStep("levelUp")    // 게임 끝남녀 레벨업으로
        }}
        onExit={() => navigate("/battle")}
      />
    )
  }
  if (step === "levelUp") {
    return (
      <LevelUpScreen
        currentLevel={currentLevel}
        currentExp={currentExp}
        earnedExp={earnedExp}
        expPerLevel={expPerLevel}
        onComplete={() => {
          // 경험치, 레벨 반영
          setCurrentExp(prev => {
            const total = prev + earnedExp
            const newLevel = currentLevel + Math.floor(total / expPerLevel)
            const newExpInLevel = total % expPerLevel
            setCurrentLevel(newLevel)
            return newExpInLevel
          })
          // 레벨업 모달 닫으면 -> 결과 화면
          setStep("result")
        }}
      />
    )
  }

  // 결과 화면
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
}
