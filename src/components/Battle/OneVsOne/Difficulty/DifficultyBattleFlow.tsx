import { useState, useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { BattleGameWritten } from "./BattleGameWritten"
import { BattleGamePractical } from "./BattleGamePractical"
import { BattleResult } from "./BattleResult"
import { LevelUpScreen } from "../../../LevelUpScreen"
import { getSavedRoomId, getScoreboard } from "../../../api/versusApi"
import { getLevelFromTotalXp, getStartXP } from "../../../utils/leveling"
import axios from "../../../api/axiosConfig"
import type { Question, BattleStatus } from "../../../../types"
import { BattleWebSocketClient, type JoinRoomSnapshot } from "../../../../ws/BattleWebSocketClient"

type ExamType = "written" | "practical"

export function DifficultyBattleFlow() {
  const navigate = useNavigate()

  const { state } = useLocation() as {
    state?: {
      opponentName?: string
      opponentId?: string
      myUserId?: string
      roomId?: number
      difficulty?: "easy" | "medium" | "hard"
      examType?: ExamType
      questionCount?: number
    }
  }

  const [myUserId, setMyUserId] = useState<string | null>(state?.myUserId || null)
  const [opponentUserId, setOpponentUserId] = useState<string | null>(state?.opponentId || null)
  const [myRank, setMyRank] = useState<number | null>(null)
  const [opponentRank, setOpponentRank] = useState<number | null>(null)
  const [questions, setQuestions] = useState<Question[]>([]) // 빈 배열로 시작, 문제는 하나씩 가져옴

  const opponentName = opponentUserId || state?.opponentName || "상대"
  const difficulty = state?.difficulty ?? "medium"
  const examType: ExamType = state?.examType ?? "written"
  const questionCount = state?.questionCount ?? 20
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
  // [WebSocket 전환] Polling 무력화: WebSocket 이벤트에서만 상태가 변경되도록 함
  useEffect(() => {
    if (!roomId) return

    // Polling 비활성화 - WebSocket 이벤트에서만 상태 변경
    const POLLING_DISABLED = true;
    if (POLLING_DISABLED) return;

    const pollScoreboardForParticipants = async () => {
      try {
        const scoreboard = await getScoreboard(roomId)
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
    const interval = setInterval(pollScoreboardForParticipants, 2000)
    
    return () => clearInterval(interval)
  }, [roomId, myUserId, state?.myUserId])

  useEffect(() => {
    if (!state) navigate("/battle/onevsone/difficulty/matching")
  }, [state, navigate])

  // 문제는 BattleGame 컴포넌트에서 currentQuestion을 확인하고 하나씩 가져옴

  // WebSocket 클라이언트 인스턴스 관리
  const wsClientRef = useRef<BattleWebSocketClient | null>(null);

  // Battle 상태 관리 (WebSocket 이벤트 기반)
  const [battleStatus, setBattleStatus] = useState<BattleStatus>("WAITING");

  // 문제 타이머 관리 (QUESTION_STARTED 이벤트에서 받은 endTimeMs)
  const [questionEndTimeMs, setQuestionEndTimeMs] = useState<number | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);

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
  // [WebSocket 전환] Polling 무력화: WebSocket 이벤트에서만 상태가 변경되도록 함
  useEffect(() => {
    if (step !== "game" || !roomId || !myUserId) return;

    // Polling 비활성화 - WebSocket 이벤트에서만 상태 변경
    const POLLING_DISABLED = true;
    if (POLLING_DISABLED) return;

    const pollScoreboard = async () => {
      try {
        const scoreboard = await getScoreboard(roomId);
        
        // 게임 종료 확인 및 xpResults 처리
        if (scoreboard.status === "DONE" && scoreboard.xpResults && scoreboard.xpResults.length > 0) {
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
          }
        }
      } catch (error) {
        console.error("스코어보드 조회 실패:", error);
      }
    };

    // 2초마다 폴링
    const interval = setInterval(pollScoreboard, 2000);

    return () => clearInterval(interval);
  }, [step, roomId, myUserId]);

  // WebSocket 연결 및 이벤트 핸들러 설정
  useEffect(() => {
    if (!roomId) return;

    // WebSocket 클라이언트 생성
    const wsClient = new BattleWebSocketClient();

    // JOIN_ROOM snapshot 핸들러 설정 (상태 복구)
    wsClient.setSnapshotCallback((snapshot) => {
      console.log('[DifficultyBattleFlow] JOIN_ROOM snapshot 수신, roomId:', roomId, snapshot);

      // snapshot 기반 상태 복구 (방어 코드 포함)
      const room = snapshot?.room;
      const scoreboard = snapshot?.scoreboard;

      if (!room || !scoreboard) {
        console.warn('[DifficultyBattleFlow] snapshot 구조가 올바르지 않습니다. roomId:', roomId, snapshot);
        return;
      }

      // currentQuestion 추출 (우선순위: currentQuestion > scoreboard.currentQuestion > room.currentQuestion)
      const currentQuestion = snapshot.currentQuestion 
        || scoreboard?.currentQuestion 
        || room?.currentQuestion;

      // 방 상태에 따라 battleStatus 업데이트
      if (room.status === 'IN_PROGRESS' || room.status === 'ONGOING') {
        // 현재 문제가 있으면 QUESTION_PLAYING, 없으면 WAITING
        if (currentQuestion && currentQuestion.questionId) {
          setBattleStatus('QUESTION_PLAYING');
          setStep('game');

          // currentQuestion에서 endTimeMs 계산 (방어 코드)
          const startedAt = currentQuestion.startedAt as string | undefined;
          const timeLimitSec = currentQuestion.timeLimitSec as number | undefined;
          const questionId = currentQuestion.questionId as number;

          if (startedAt && timeLimitSec) {
            const startedAtMs = new Date(startedAt).getTime();
            if (!isNaN(startedAtMs)) {
              const endTimeMs = startedAtMs + (timeLimitSec * 1000);
              setQuestionEndTimeMs(endTimeMs);
              setCurrentQuestionId(questionId);
              console.log('[DifficultyBattleFlow] snapshot 복구 완료 - endTimeMs:', endTimeMs, 'questionId:', questionId, 'roomId:', roomId);
            } else {
              console.warn('[DifficultyBattleFlow] startedAt 파싱 실패, roomId:', roomId, startedAt);
            }
          } else {
            console.warn('[DifficultyBattleFlow] currentQuestion에 startedAt 또는 timeLimitSec이 없습니다. roomId:', roomId, currentQuestion);
          }
        } else {
          setBattleStatus('WAITING');
          console.log('[DifficultyBattleFlow] snapshot 복구 - WAITING 상태 (currentQuestion 없음), roomId:', roomId);
        }
      } else if (room.status === 'COMPLETED') {
        setBattleStatus('MATCH_FINISHED');
        setStep('result');
        console.log('[DifficultyBattleFlow] snapshot 복구 - MATCH_FINISHED, roomId:', roomId);
      } else {
        setBattleStatus('WAITING');
        console.log('[DifficultyBattleFlow] snapshot 복구 - WAITING 상태, roomId:', roomId, 'room.status:', room.status);
      }
    });

    // 이벤트 핸들러 설정
    wsClient.setEventCallback((eventType, event) => {
      console.log('[DifficultyBattleFlow] WebSocket 이벤트 수신:', eventType, event);

      // 이벤트 타입에 따라 battleStatus 업데이트
      switch (eventType) {
        case 'QUESTION_STARTED': {
          setBattleStatus('QUESTION_PLAYING');
          // step이 "game"이 아니면 "game"으로 전환
          setStep('game');
          
          // payload에서 startedAt, timeLimitSec 추출하여 endTimeMs 계산
          const startedAt = event.startedAt as string; // ISO 8601 형식
          const timeLimitSec = event.timeLimitSec as number;
          const questionId = event.questionId as number;
          
          if (startedAt && timeLimitSec) {
            const startedAtMs = new Date(startedAt).getTime();
            const endTimeMs = startedAtMs + (timeLimitSec * 1000);
            setQuestionEndTimeMs(endTimeMs);
            setCurrentQuestionId(questionId);
            console.log('[DifficultyBattleFlow] QUESTION_STARTED - endTimeMs:', endTimeMs, 'questionId:', questionId);
          }
          break;
        }

        case 'QUESTION_FINISHED':
          setBattleStatus('QUESTION_FINISHED');
          // 문제 종료 UI는 기존 step 분기에서 처리
          // 여기서는 상태만 업데이트
          break;

        case 'MATCH_FINISHED':
          setBattleStatus('MATCH_FINISHED');
          // 매치 종료 시 결과 화면으로 전환
          setStep('result');
          break;

        case 'ANSWER_SUBMITTED':
          // ANSWER_SUBMITTED는 상태 변경 없이 로깅만
          console.log('[DifficultyBattleFlow] 답안 제출 이벤트:', event);
          break;

        default:
          console.log('[DifficultyBattleFlow] 알 수 없는 이벤트 타입:', eventType);
          break;
      }
    });

    // 연결 및 방 구독
    // connect 내부에서 roomId를 설정하고, onConnect에서 joinRoom을 자동 호출하므로
    // 여기서는 connect만 호출
    wsClient.connect(roomId);
    wsClientRef.current = wsClient;

    // cleanup
    return () => {
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
        wsClientRef.current = null;
      }
    };
  }, [roomId]);

  // 1) 게임 화면
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
        questionEndTimeMs={questionEndTimeMs}
        currentQuestionId={currentQuestionId}
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

  // 2) 레벨업 화면 (게임 끝나고 바로)
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
            // 레벨업 모달 닫으면 → 결과 화면으로 전환
            setStep("result")
          }}
        />
      )
    } else {
      // xpResults가 없는 경우 fallback (기존 로직)
      const beforeTotalXP = getStartXP(5) + 20
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
            // 레벨업 모달 닫으면 → 결과 화면으로 전환
            setStep("result")
          }}
        />
      )
    }
  }

  // 3) 최종 결과 화면 (나중에)
  if (step === "result") {
    return (
      <BattleResult
        myScore={myScore}
        opponentScore={opponentScore}
        opponentName={opponentName}
        onBackToDashboard={() => navigate("/battle")}
      />
    )
  }

  return null
}
