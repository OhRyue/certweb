import { useMemo, useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { BattleGameWritten } from "./BattleGameWritten"
import { BattleGamePractical } from "./BattleGamePractical"
import { BattleResult } from "./BattleResult"
import { LevelUpScreen } from "../../../LevelUpScreen"
import { getSavedRoomId, getRoomState } from "../../../api/versusApi"
import axios from "../../../api/axiosConfig"
import { getStartXP } from "../../../utils/leveling"
import type { Question } from "../../../../types"

type ExamType = "written" | "practical"

export function BattleFlow() {
  const navigate = useNavigate()

  const { state } = useLocation() as {
    state?: {
      opponentName?: string
      opponentId?: string
      myUserId?: string
      roomId?: number
      topicId?: string
      topicName?: string
      examType?: ExamType
    }
  }

  const [myUserId, setMyUserId] = useState<string | null>(state?.myUserId || null)
  const [opponentUserId, setOpponentUserId] = useState<string | null>(state?.opponentId || null)
  const [myRank, setMyRank] = useState<number | null>(null)
  const [opponentRank, setOpponentRank] = useState<number | null>(null)
  const [questions, setQuestions] = useState<Question[]>([]) // 빈 배열로 시작, 문제는 하나씩 가져옴

  const opponentName = opponentUserId || state?.opponentName || "상대"
  const topicKey = state?.topicId ?? state?.topicName ?? "db-basic"
  const examType: ExamType = state?.examType ?? "written"
  const roomId = state?.roomId || getSavedRoomId()

  // 방 정보 조회하여 참가자 정보 가져오기
  useEffect(() => {
    const fetchRoomInfo = async () => {
      if (!roomId) return

      try {
        const roomState = await getRoomState(roomId)
        const roomDetail = roomState.detail
        
        // 현재 사용자 정보 가져오기
        if (!myUserId) {
          const profileRes = await axios.get("/account/profile")
          const currentUserId = profileRes.data.userId || profileRes.data.id
          setMyUserId(currentUserId)
        }

        const currentUserId = myUserId || state?.myUserId
        if (!currentUserId) return

        // 참가자 목록에서 자신과 상대 구분
        const myParticipant = roomDetail.participants.find(p => p.userId === currentUserId)
        const opponentParticipant = roomDetail.participants.find(p => p.userId !== currentUserId)

        if (myParticipant) {
          setMyRank(myParticipant.rank)
        }

        if (opponentParticipant) {
          setOpponentUserId(opponentParticipant.userId)
          setOpponentRank(opponentParticipant.rank)
        }
      } catch (err) {
        console.error("방 정보 조회 실패", err)
      }
    }

    fetchRoomInfo()
  }, [roomId, myUserId, state?.myUserId])

  useEffect(() => {
    if (!state || !topicKey) {
      navigate("/battle/onevsone/category/matching")
    }
  }, [state, topicKey, navigate])

  // 문제는 BattleGame 컴포넌트에서 currentQuestion을 확인하고 하나씩 가져옴

  // game → levelUp → result
  const [step, setStep] = useState<"game" | "levelUp" | "result">("game")
  const [myScore, setMyScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)

  const [currentLevel, setCurrentLevel] = useState(5)
  const [currentExp, setCurrentExp] = useState(50)
  const earnedExp = myScore * 7

  if (step === "game") {
    const GameComponent =
      examType === "practical" ? BattleGamePractical : BattleGameWritten

    return (
      <GameComponent
        questions={questions} // 빈 배열로 시작, 문제는 하나씩 가져옴
        setQuestions={setQuestions} // 문제 업데이트용
        roomId={roomId}
        opponentName={opponentName}
        myUserId={myUserId || undefined}
        opponentUserId={opponentUserId || undefined}
        myRank={myRank}
        opponentRank={opponentRank}
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
    // totalXP 계산: 현재 레벨 시작 경험치 + 현재 레벨 내 경험치 + 획득 경험치
    const beforeTotalXP = getStartXP(currentLevel) + currentExp
    const afterTotalXP = beforeTotalXP + earnedExp
    
    // 레벨업 후 레벨 계산
    let newLevel = currentLevel
    let remainingXP = afterTotalXP
    while (remainingXP >= getStartXP(newLevel + 1)) {
      newLevel++
    }
    const isLevelUp = newLevel > currentLevel
    
    return (
      <LevelUpScreen
        earnedExp={earnedExp}
        totalXP={afterTotalXP}
        currentLevel={newLevel}
        isLevelUp={isLevelUp}
        earnedPoints={0}
        onComplete={() => {
          // 경험치, 레벨 반영
          setCurrentLevel(newLevel)
          const newStartXP = getStartXP(newLevel)
          setCurrentExp(afterTotalXP - newStartXP)
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
