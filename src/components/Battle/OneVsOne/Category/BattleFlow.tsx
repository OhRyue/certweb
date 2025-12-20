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
      isBotMatch?: boolean // 봇전 여부
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
  const isBotMatch = state?.isBotMatch || false // 봇전 여부

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
  // 봇전인 경우에만 폴링 사용, PvP는 WebSocket 사용
  useEffect(() => {
    if (!roomId) return

    // 봇전이 아닌 경우 폴링 비활성화 (PvP는 WebSocket 사용)
    if (!isBotMatch) return;

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
  }, [roomId, myUserId, state?.myUserId, isBotMatch])

  useEffect(() => {
    if (!state || !topicKey) {
      navigate("/battle/onevsone/category/matching")
    }
  }, [state, topicKey, navigate])

  // WebSocket 연결 및 이벤트 핸들러 설정
  // 봇전인 경우 WebSocket 연결하지 않음 (REST API 폴링 사용)
  useEffect(() => {
    if (!roomId) return;
    
    // 봇전인 경우 WebSocket 연결하지 않음
    if (isBotMatch) {
      console.log('[BattleFlow] 봇전 모드: WebSocket 연결하지 않음, REST API 폴링 사용');
      return;
    }

    // PvP 전인 경우에만 WebSocket 연결
    console.log('[BattleFlow] PvP 모드: WebSocket 연결 시작');
    const wsClient = new BattleWebSocketClient();

    // JOIN_ROOM snapshot 핸들러 설정 (상태 복구)
    wsClient.setSnapshotCallback((snapshot) => {
      console.log('[BattleFlow] JOIN_ROOM snapshot 수신, roomId:', roomId, snapshot);

      // snapshot 기반 상태 복구 (방어 코드 포함)
      const room = snapshot?.room;
      const scoreboard = snapshot?.scoreboard;

      if (!room || !scoreboard) {
        console.warn('[BattleFlow] snapshot 구조가 올바르지 않습니다. roomId:', roomId, snapshot);
        return;
      }

      // 초기 스코어보드 데이터 설정
      const currentUserId = myUserId || state?.myUserId;
      if (currentUserId && scoreboard.items) {
        const myItem = scoreboard.items.find((item: any) => item.userId === currentUserId);
        const opponentItem = scoreboard.items.find((item: any) => item.userId !== currentUserId);
        
        if (myItem) {
          setMyScore(myItem.score);
          setMyNickname(myItem.nickname);
          setMySkinId(myItem.skinId);
        }
        if (opponentItem) {
          setOpponentScore(opponentItem.score);
          setOpponentNickname(opponentItem.nickname);
          setOpponentSkinId(opponentItem.skinId);
          setOpponentUserId(opponentItem.userId);
        }
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

          console.log('[BattleFlow] snapshot에서 currentQuestion 추출:', {
            startedAt,
            timeLimitSec,
            questionId,
            currentQuestion
          });

          if (questionId) {
            setCurrentQuestionId(questionId);
            console.log('[BattleFlow] snapshot에서 questionId 설정:', questionId);
          }

          if (startedAt && timeLimitSec) {
            const startedAtMs = new Date(startedAt).getTime();
            if (!isNaN(startedAtMs)) {
              const endTimeMs = startedAtMs + (timeLimitSec * 1000);
              setQuestionEndTimeMs(endTimeMs);
              console.log('[BattleFlow] snapshot 복구 완료 - endTimeMs:', endTimeMs, 'questionId:', questionId, 'roomId:', roomId);
            } else {
              console.warn('[BattleFlow] startedAt 파싱 실패, roomId:', roomId, startedAt);
            }
          } else {
            console.warn('[BattleFlow] currentQuestion에 startedAt 또는 timeLimitSec이 없습니다. roomId:', roomId, currentQuestion);
            // startedAt이 없어도 questionId만 있으면 문제는 불러올 수 있음
            if (questionId) {
              console.log('[BattleFlow] questionId만으로 문제 불러오기 시도:', questionId);
            }
          }
        } else {
          setBattleStatus('WAITING');
          console.log('[BattleFlow] snapshot 복구 - WAITING 상태 (currentQuestion 없음), roomId:', roomId);
        }
      } else if (room.status === 'COMPLETED') {
        setBattleStatus('MATCH_FINISHED');
        setStep('result');
        console.log('[BattleFlow] snapshot 복구 - MATCH_FINISHED, roomId:', roomId);
      } else {
        setBattleStatus('WAITING');
        console.log('[BattleFlow] snapshot 복구 - WAITING 상태, roomId:', roomId, 'room.status:', room.status);
      }
    });

    // 이벤트 핸들러 설정
    wsClient.setEventCallback((eventType, event) => {
      console.log('[BattleFlow] WebSocket 이벤트 수신:', eventType, event);

      // 이벤트 타입에 따라 battleStatus 업데이트
      switch (eventType) {
        case 'QUESTION_STARTED': {
          console.log('[BattleFlow] QUESTION_STARTED 이벤트 수신:', event);
          setBattleStatus('QUESTION_PLAYING');
          // step이 "game"이 아니면 "game"으로 전환
          setStep('game');
          
          // payload에서 startedAt, timeLimitSec 추출하여 endTimeMs 계산
          const startedAt = event.startedAt as string; // ISO 8601 형식
          const timeLimitSec = event.timeLimitSec as number;
          const questionId = event.questionId as number;
          
          console.log('[BattleFlow] QUESTION_STARTED 데이터:', {
            startedAt,
            timeLimitSec,
            questionId,
            event
          });
          
          if (startedAt && timeLimitSec && questionId) {
            const startedAtMs = new Date(startedAt).getTime();
            const endTimeMs = startedAtMs + (timeLimitSec * 1000);
            setQuestionEndTimeMs(endTimeMs);
            setCurrentQuestionId(questionId);
            console.log('[BattleFlow] QUESTION_STARTED 처리 완료 - endTimeMs:', endTimeMs, 'questionId:', questionId);
          } else {
            console.error('[BattleFlow] QUESTION_STARTED 데이터 불완전:', {
              startedAt,
              timeLimitSec,
              questionId
            });
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
          console.log('[BattleFlow] 답안 제출 이벤트:', event);
          break;

        case 'SCOREBOARD_UPDATED':
          // 스코어보드 업데이트 이벤트 처리
          console.log('[BattleFlow] 스코어보드 업데이트:', event);
          if (event.scoreboard && event.scoreboard.items) {
            const currentUserId = myUserId || state?.myUserId;
            if (currentUserId) {
              const myItem = event.scoreboard.items.find((item: any) => item.userId === currentUserId);
              const opponentItem = event.scoreboard.items.find((item: any) => item.userId !== currentUserId);
              
              if (myItem) {
                setMyScore(myItem.score);
              }
              if (opponentItem) {
                setOpponentScore(opponentItem.score);
              }
            }
          }
          break;

        default:
          console.log('[BattleFlow] 알 수 없는 이벤트 타입:', eventType);
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
  }, [roomId, isBotMatch]);

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
  // 봇전인 경우에만 폴링 사용, PvP는 WebSocket 이벤트 사용
  useEffect(() => {
    if (step !== "game" || !roomId || !myUserId) return;

    // 봇전이 아닌 경우 폴링 비활성화 (PvP는 WebSocket 이벤트 사용)
    if (!isBotMatch) return;

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
  }, [step, roomId, myUserId, state?.myUserId, isBotMatch]);

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
        wsClient={isBotMatch ? null : wsClientRef.current} // 봇전인 경우 WebSocket 클라이언트 전달하지 않음
        isBotMatch={isBotMatch} // 봇전 여부 전달
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

