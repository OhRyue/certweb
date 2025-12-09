import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { BattleGameWritten } from "./BattleGameWritten"
import { BattleGamePractical } from "./BattleGamePractical"
import { BattleResult } from "./BattleResult"
import { LevelUpScreen } from "../../../LevelUpScreen"
import { getSavedRoomId, getScoreboard } from "../../../api/versusApi"
import { getLevelFromTotalXp, getStartXP } from "../../../utils/leveling"
import axios from "../../../api/axiosConfig"
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
  
  // 결과 화면용 참가자 정보
  const [myNickname, setMyNickname] = useState<string | null>(null)
  const [mySkinId, setMySkinId] = useState<number | null>(null)
  const [opponentNickname, setOpponentNickname] = useState<string | null>(null)
  const [opponentSkinId, setOpponentSkinId] = useState<number | null>(null)

  const opponentName = opponentUserId || state?.opponentName || "상대"
  const topicKey = state?.topicId ?? state?.topicName ?? "db-basic"
  const examType: ExamType = state?.examType ?? "written"
  const roomId = state?.roomId || getSavedRoomId()

  // 현재 사용자 정보 가져오기 (한 번만)
  useEffect(() => {
    const fetchMyUserId = async () => {
      if (!myUserId) {
        try {
          const profileRes = await axios.get("/account/profile")
          const currentUserId = profileRes.data.userId || profileRes.data.id
          setMyUserId(currentUserId)
        } catch (err) {
          console.error("프로필 조회 실패", err)
        }
      }
    }
    fetchMyUserId()
  }, [myUserId])

  // scoreboard 폴링하여 참가자 정보 가져오기
  useEffect(() => {
    if (!roomId) return

    let intervalId: NodeJS.Timeout | null = null

    const pollScoreboardForParticipants = async () => {
      try {
        const scoreboard = await getScoreboard(roomId)
        
        // status가 DONE이면 폴링 중지
        if (scoreboard.status === "DONE") {
          if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
          }
          return
        }
        
        const currentUserId = myUserId || state?.myUserId
        if (!currentUserId) return

        // scoreboard.items에서 참가자 정보 가져오기
        const myItem = scoreboard.items.find(item => item.userId === currentUserId)
        const opponentItem = scoreboard.items.find(item => item.userId !== currentUserId)

        if (myItem) {
          setMyRank(myItem.rank)
        }

        if (opponentItem) {
          setOpponentUserId(opponentItem.userId)
          setOpponentRank(opponentItem.rank)
        }
      } catch (err) {
        console.error("스코어보드 조회 실패", err)
      }
    }

    // 즉시 한 번 조회
    pollScoreboardForParticipants()
    
    // 2초마다 폴링 (참가자 정보가 아직 없을 수 있으므로)
    intervalId = setInterval(pollScoreboardForParticipants, 2000)
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
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

  // xpResults 관련 상태
  const [xpResultData, setXpResultData] = useState<{
    earnedExp: number;
    totalXP: number;
    currentLevel: number;
    isLevelUp: boolean;
  } | null>(null);

  // scoreboard 폴링하여 xpResults 확인
  useEffect(() => {
    if (step !== "game" || !roomId || !myUserId) return;

    let intervalId: NodeJS.Timeout | null = null

    const pollScoreboard = async () => {
      try {
        const scoreboard = await getScoreboard(roomId);
        
        // status가 DONE이면 폴링 중지
        if (scoreboard.status === "DONE") {
          // 참가자 정보 저장 (결과 화면용)
          const currentUserId = myUserId || state?.myUserId
          if (currentUserId) {
            const myItem = scoreboard.items.find(item => item.userId === currentUserId)
            const opponentItem = scoreboard.items.find(item => item.userId !== currentUserId)
            
            if (myItem) {
              setMyNickname(myItem.nickname)
              setMySkinId(myItem.skinId)
            }
            
            if (opponentItem) {
              setOpponentNickname(opponentItem.nickname)
              setOpponentSkinId(opponentItem.skinId)
            }
          }
          
          // 게임 종료 확인 및 xpResults 처리
          if (scoreboard.xpResults && scoreboard.xpResults.length > 0) {
            const myXpResult = scoreboard.xpResults.find(result => result.userId === myUserId);
            if (myXpResult) {
              const earnedExp = myXpResult.xpDelta;
              const totalXP = myXpResult.totalXp;
              const isLevelUp = myXpResult.leveledUp;
              const currentLevel = getLevelFromTotalXp(totalXP);

              setXpResultData({
                earnedExp,
                totalXP,
                currentLevel,
                isLevelUp
              });
              
              // 게임 완료 후 레벨업 화면으로 이동
              setStep("levelUp");
            } else {
              // xpResults가 있지만 내 결과가 없으면 바로 결과 화면으로
              setStep("result");
            }
          } else {
            // xpResults가 없으면 바로 결과 화면으로
            setStep("result");
          }
          
          // 폴링 중지
          if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
          }
          return;
        }
      } catch (error) {
        console.error("스코어보드 조회 실패:", error);
      }
    };

    // 2초마다 폴링
    intervalId = setInterval(pollScoreboard, 2000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    };
  }, [step, roomId, myUserId, state?.myUserId]);

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
          // xpResults는 scoreboard 폴링에서 처리되므로 여기서는 step 변경하지 않음
          // xpResults가 없으면 바로 결과 화면으로 이동
        }}
        onExit={() => navigate("/battle")}
      />
    )
  }
  if (step === "levelUp") {
    // xpResults가 있으면 사용, 없으면 기존 방식 사용 (fallback)
    if (xpResultData) {
      return (
        <LevelUpScreen
          earnedExp={xpResultData.earnedExp}
          totalXP={xpResultData.totalXP}
          currentLevel={xpResultData.currentLevel}
          isLevelUp={xpResultData.isLevelUp}
          earnedPoints={xpResultData.isLevelUp ? 10 : 0}
          onComplete={() => {
            // 레벨업 모달 닫으면 -> 결과 화면
            setStep("result")
          }}
        />
      )
    } else {
      // xpResults가 없는 경우 fallback (기존 로직)
      const beforeTotalXP = getStartXP(5) + 50
      const afterTotalXP = beforeTotalXP + (myScore * 7)
      const newLevel = getLevelFromTotalXp(afterTotalXP)
      const isLevelUp = newLevel > 5
      
      return (
        <LevelUpScreen
          earnedExp={myScore * 7}
          totalXP={afterTotalXP}
          currentLevel={newLevel}
          isLevelUp={isLevelUp}
          earnedPoints={0}
          onComplete={() => {
            // 레벨업 모달 닫으면 -> 결과 화면
            setStep("result")
          }}
        />
      )
    }
  }

  // 결과 화면
  if (step === "result") {
    return (
      <BattleResult
        myScore={myScore}
        opponentScore={opponentScore}
        myNickname={myNickname}
        myUserId={myUserId || ""}
        mySkinId={mySkinId}
        opponentNickname={opponentNickname}
        opponentUserId={opponentUserId || ""}
        opponentSkinId={opponentSkinId}
        onBackToDashboard={() => navigate("/battle")}
      />
    )
  }
}

