import { useState, useEffect, useRef } from "react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import { Progress } from "../../ui/progress";
import { Bell, Trophy, Clock, Users } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { GoldenBellCharacter, CanvasEffect } from "../../../types";
import { CharacterGrid } from "./CharacterGrid";
import { EffectCanvas } from "./EffectCanvas";
import { LevelUpScreen } from "../../LevelUpScreen";
import { getLevelFromTotalXp } from "../../utils/leveling";
import { 
  getScoreboard, 
  getRoomState,
  getVersusQuestion, 
  submitAnswer,
  type Scoreboard,
  type RoomStateResponse,
  type VersusQuestionResponse 
} from "../../api/versusApi";

interface GoldenBellGameProps {
  sessionId: string; // roomId as string
  myUserId?: string; // API에서 받은 사용자 ID
  onComplete: (survived: boolean, rank: number) => void;
  onExit: () => void;
}

export function GoldenBellGame({ sessionId, myUserId: propMyUserId, onComplete, onExit }: GoldenBellGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 1000, height: 800 });
  const roomId = Number(sessionId);
  
  // API state
  const [scoreboard, setScoreboard] = useState<Scoreboard | null>(null);
  const [roomState, setRoomState] = useState<RoomStateResponse | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<VersusQuestionResponse | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // 초기 로딩 여부
  
  // Game state
  const [characters, setCharacters] = useState<GoldenBellCharacter[]>([]);
  const [effects, setEffects] = useState<CanvasEffect[]>([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [gameStage, setGameStage] = useState<"ready" | "answering" | "waiting" | "showingAnswers" | "result" | "winner">("ready");
  const [timeLeft, setTimeLeft] = useState(10);
  const [showFeedback, setShowFeedback] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [answerStartTime, setAnswerStartTime] = useState<number | null>(null);
  const [submittedQuestionId, setSubmittedQuestionId] = useState<number | null>(null);
  const autoSubmittedRef = useRef<number | null>(null); // 자동 제출한 questionId 추적
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null); // 폴링 interval 추적
  
  // 관전자 모드 및 부활 관련 상태
  const [isSpectator, setIsSpectator] = useState(false);
  const [prevAlive, setPrevAlive] = useState<boolean | null>(null);
  const [showEliminationNotice, setShowEliminationNotice] = useState(false);
  const [showRevivalNotice, setShowRevivalNotice] = useState(false);
  const [showNoRevivalNotice, setShowNoRevivalNotice] = useState(false); // 부활 자격 없음 알림
  const [myRevived, setMyRevived] = useState<boolean | null>(null); // 사용자의 부활 상태
  const [prevPhase, setPrevPhase] = useState<string | null>(null); // 이전 phase 추적
  const [noRevivalNoticeShown, setNoRevivalNoticeShown] = useState(false); // 부활 자격 없음 알림을 이미 표시했는지 추적
  
  // LevelUpScreen 관련 상태
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{
    earnedExp: number;
    totalXP: number;
    currentLevel: number;
    isLevelUp: boolean;
    earnedPoints: number;
  } | null>(null);

  // 생존자 수는 반드시 scoreboard에서 확인
  const survivorsCount = scoreboard?.items?.filter(item => item.alive).length || 0;
  const maxTime = scoreboard?.currentQuestion?.timeLimitSec || 30;

  // 초기 방 상태 조회 (questions 배열 가져오기)
  useEffect(() => {
    if (!roomId || isNaN(roomId)) return;

    const fetchInitialState = async () => {
      try {
        const state = await getRoomState(roomId);
        setRoomState(state);
        console.log("초기 방 상태 조회:", state);
        
        // myUserId 설정 (스코어보드에서 설정하므로 여기서는 스코어보드가 없으면 설정하지 않음)
        // 탈락 여부는 반드시 scoreboard에서만 확인하므로 초기 설정은 스코어보드 폴링에서 처리

        // 첫 번째 문제가 있으면 questions 배열에서 가져오기
        if (state.detail.questions && state.detail.questions.length > 0) {
          const firstQuestion = state.detail.questions.sort((a, b) => a.order - b.order)[0];
          if (firstQuestion) {
            try {
              const questionData = await getVersusQuestion(firstQuestion.questionId);
              setCurrentQuestion(questionData);
              setAnswerStartTime(Date.now());
              setGameStage("answering");
              setUserAnswer(""); // 초기 문제 시작 시 답안 초기화
              // timeLeft는 endTime 기반 타이머에서 자동으로 업데이트됨
              setIsInitialLoad(false);
            } catch (error) {
              console.error("초기 문제 조회 실패:", error);
            }
          }
        }
      } catch (error) {
        console.error("초기 방 상태 조회 실패:", error);
      }
    };

    fetchInitialState();
  }, [roomId]);

  // myUserId 설정 (prop 우선 사용)
  useEffect(() => {
    if (propMyUserId && !myUserId) {
      setMyUserId(propMyUserId);
    }
  }, [propMyUserId, myUserId]);

  // 스코어보드 폴링 (1초마다)
  useEffect(() => {
    if (!roomId || isNaN(roomId)) return;
    // status가 "DONE"이면 폴링 중지
    if (scoreboard?.status === "DONE") {
      // 기존 interval 정리
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    const pollScoreboard = async () => {
      try {
        const scoreboardData = await getScoreboard(roomId);
        setScoreboard(scoreboardData);
        
        // status가 "DONE"이면 폴링 중지
        if (scoreboardData.status === "DONE") {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          return;
        }
        
        // myUserId 설정 (prop에서 받은 값 우선 사용, 없으면 scoreboard에서 찾기)
        const currentMyUserId = propMyUserId || myUserId;
        if (!currentMyUserId && scoreboardData.items.length > 0) {
          // localStorage에서 userId 가져오기 시도
          const localStorageUserId = localStorage.getItem("userId");
          if (localStorageUserId) {
            // localStorage의 userId가 scoreboard에 있는지 확인
            const foundItem = scoreboardData.items.find(item => item.userId === localStorageUserId);
            if (foundItem) {
              setMyUserId(localStorageUserId);
            } else {
              // 없으면 첫 번째 항목 사용 (fallback)
              console.warn("localStorage의 userId가 scoreboard에 없습니다. 첫 번째 항목을 사용합니다.");
              setMyUserId(scoreboardData.items[0].userId);
            }
          } else {
            // localStorage에도 없으면 첫 번째 항목 사용 (fallback)
            console.warn("myUserId를 찾을 수 없습니다. 첫 번째 항목을 사용합니다.");
            setMyUserId(scoreboardData.items[0].userId);
          }
        }
        
        // alive 상태 변경 감지 및 관전자 모드 처리 - 반드시 scoreboard에서만 확인
        // propMyUserId 또는 myUserId 중 하나를 사용
        const userIdToCheck = propMyUserId || myUserId;
        if (userIdToCheck && scoreboardData.items.length > 0) {
          const myItem = scoreboardData.items.find(item => item.userId === userIdToCheck);
          if (myItem) {
            // 탈락 여부는 반드시 scoreboard의 alive 필드만 사용
            const currentAlive = myItem.alive;
            const currentRevived = myItem.revived;
            const currentPhase = scoreboardData.currentQuestion?.phase || null;
            
            // 이전 상태와 비교하여 탈락 감지 (scoreboard의 alive 필드만 확인)
            if (prevAlive !== null && prevAlive === true && currentAlive === false) {
              // 탈락 알림 표시
              setShowEliminationNotice(true);
              setIsSpectator(true);
              // 3초 후 알림 자동 닫기
              setTimeout(() => {
                setShowEliminationNotice(false);
              }, 3000);
            }
            
            // 부활전 시작 감지 및 부활 자격 확인 (한 번만 표시)
            // prevPhase가 "REVIVAL"이 아니고 currentPhase가 "REVIVAL"로 변경될 때만 감지
            const phaseChangedToRevival = prevPhase !== "REVIVAL" && currentPhase === "REVIVAL";
            
            if (phaseChangedToRevival && !currentAlive && !noRevivalNoticeShown) {
              // 부활전이 시작되었고 사용자가 탈락 상태인 경우 (scoreboard의 alive 필드 확인)
              if (currentRevived === false) {
                // 부활 자격이 없음 알림 표시 (한 번만)
                setShowNoRevivalNotice(true);
                setNoRevivalNoticeShown(true); // 알림 표시 플래그 설정
                setTimeout(() => {
                  setShowNoRevivalNotice(false);
                }, 5000); // 5초 후 알림 자동 닫기
              }
            }
            
            // 부활전이 끝나면 플래그 리셋 (다음 부활전을 위해)
            if (prevPhase === "REVIVAL" && currentPhase !== "REVIVAL") {
              setNoRevivalNoticeShown(false);
            }
            
            // 부활 감지 (scoreboard의 alive 필드가 false에서 true로 변경)
            if (prevAlive === false && currentAlive === true) {
              // 부활 알림 표시
              setShowRevivalNotice(true);
              setIsSpectator(false);
              setNoRevivalNoticeShown(false); // 부활했으면 알림 플래그 리셋
              // 3초 후 알림 자동 닫기
              setTimeout(() => {
                setShowRevivalNotice(false);
              }, 3000);
            }
            
            // 현재 상태 저장 (scoreboard의 alive 필드만 사용)
            // prevPhase를 먼저 업데이트하여 다음 폴링에서 중복 감지 방지
            setPrevPhase(currentPhase);
            setPrevAlive(currentAlive);
            setMyRevived(currentRevived);
            
            // 관전자 모드 상태 업데이트 (scoreboard의 alive 필드만 사용)
            setIsSpectator(!currentAlive);
          }
        }
      } catch (error) {
        console.error("스코어보드 조회 실패:", error);
      }
    };

    // 즉시 한 번 호출
    pollScoreboard();

    // 1초마다 폴링
    const interval = setInterval(pollScoreboard, 1000);
    pollingIntervalRef.current = interval;

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [roomId, propMyUserId, myUserId, prevAlive, scoreboard?.status]);

  // currentQuestion이 변경되면 문제 상세 정보 조회 (초기 로딩 이후)
  useEffect(() => {
    // 초기 로딩 중이면 스코어보드의 currentQuestion을 사용하지 않음
    if (isInitialLoad) return;
    if (!scoreboard?.currentQuestion?.questionId) return;
    if (submittedQuestionId === scoreboard.currentQuestion.questionId) return; // 이미 제출한 문제는 조회하지 않음

    const fetchQuestion = async () => {
      try {
        const questionData = await getVersusQuestion(scoreboard.currentQuestion!.questionId);
        setCurrentQuestion(questionData);
        setAnswerStartTime(Date.now());
        setGameStage("answering");
        setUserAnswer(""); // 새로운 문제 시작 시 답안 초기화
        // timeLeft는 endTime 기반 타이머에서 자동으로 업데이트됨
      } catch (error) {
        console.error("문제 조회 실패:", error);
      }
    };

    fetchQuestion();
  }, [scoreboard?.currentQuestion?.questionId, submittedQuestionId, isInitialLoad]);

  // 스코어보드 데이터로 캐릭터 상태 업데이트 (API 데이터만 사용)
  useEffect(() => {
    if (!scoreboard || !myUserId) return;

    // 스코어보드의 items를 그대로 사용 (API에서 받은 데이터)
    const allParticipants = scoreboard.items;
    const newCharacters: GoldenBellCharacter[] = [];
    
    allParticipants.forEach((participant, index) => {
      const row = Math.floor(index / 10);
      const col = index % 10;
      
      if (row < 2 && col < 10) {
        const userIdToUse = propMyUserId || myUserId;
        const isUser = participant.userId === userIdToUse;
        // API의 alive 필드만 사용
        const status: GoldenBellCharacter["status"] = 
          !participant.alive ? "eliminated" : "normal";
        
        // 닉네임이 null이면 userId 사용
        const displayName = participant.nickname || participant.userId;
        
        newCharacters.push({
          id: index + 1,
          name: isUser ? "나" : displayName,
          status,
          gridPosition: { row, col },
          nickname: participant.nickname,
          skinId: participant.skinId,
          userId: participant.userId,
        });
      }
    });

    // 빈 자리 채우기 (20명 미만인 경우)
    while (newCharacters.length < 20) {
      const index = newCharacters.length;
      const row = Math.floor(index / 10);
      const col = index % 10;
      if (row < 2 && col < 10) {
        newCharacters.push({
          id: index + 1,
          name: `참가자 ${index + 1}`,
          status: "eliminated",
          gridPosition: { row, col },
          skinId: 1, // 기본 스킨 ID
        });
      } else {
        break;
      }
    }

    setCharacters(newCharacters);

    // 사용자의 정답 여부는 스코어보드에서 확인
    const userIdToUse = propMyUserId || myUserId;
    const myItem = scoreboard.items.find(item => item.userId === userIdToUse);
    if (myItem && submittedQuestionId) {
      // 최근 제출한 문제의 정답 여부는 스코어보드 업데이트로 확인
      // correctCount가 증가했으면 정답, 아니면 오답
    }
  }, [scoreboard, propMyUserId, myUserId, submittedQuestionId]);

  // endTime 기반 타이머 업데이트 (백엔드에서 제공하는 endTime만 사용)
  useEffect(() => {
    if (!scoreboard?.currentQuestion?.endTime) return;

    const currentQuestionId = scoreboard.currentQuestion.questionId;
    
    // 새로운 문제가 시작되면 autoSubmittedRef 초기화
    if (autoSubmittedRef.current !== currentQuestionId) {
      autoSubmittedRef.current = null;
    }

    const updateTimer = () => {
      const endTime = new Date(scoreboard.currentQuestion!.endTime).getTime();
      const now = Date.now();
      // Math.ceil을 사용하여 0.1초 남아도 1초로 표시
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
      setTimeLeft(remaining);
      
      // 시간이 지나면 빈 답안 자동 제출 (한 번만)
      if (remaining === 0 && 
          gameStage === "answering" && 
          !isSpectator &&
          scoreboard.currentQuestion &&
          submittedQuestionId !== currentQuestionId &&
          autoSubmittedRef.current !== currentQuestionId &&
          answerStartTime) {
        // 자동 제출 플래그 설정 (중복 호출 방지)
        autoSubmittedRef.current = currentQuestionId;
        // 빈 답안으로 자동 제출
        handleAnswer("");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100); // 100ms마다 업데이트

    return () => clearInterval(interval);
  }, [scoreboard?.currentQuestion?.endTime, scoreboard?.currentQuestion?.questionId, gameStage, isSpectator, submittedQuestionId, answerStartTime]);

  // Countdown timer for ready stage
  useEffect(() => {
    if (gameStage !== "ready") return;

    if (countdown <= 0) {
      // Start the game
      setGameStage("answering");
      // timeLeft는 endTime 기반 타이머에서 자동으로 업데이트됨
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [gameStage, countdown]);

  // Update container size for canvas
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Timer (endTime 기반으로 이미 업데이트되므로 여기서는 제거)
  // 타이머는 endTime 기반 useEffect에서 처리됨

  // Clean up old effects
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setEffects(prev => prev.filter(effect => now - effect.timestamp < 3000));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const startNewQuestion = () => {
    setCountdown(3);
    setGameStage("ready");
    setUserAnswer("");
    setShowFeedback(false);
    
    // 캐릭터 상태는 스코어보드 데이터로만 업데이트 (API 데이터만 사용)
  };

  const handleAnswer = async (answer: string) => {
    if (gameStage !== "answering") return;
    if (isSpectator) return; // 관전자 모드에서는 답안 제출 불가
    if (!scoreboard?.currentQuestion || !roomId || !answerStartTime) return;
    
    const currentQuestionId = scoreboard.currentQuestion.questionId;
    
    // 이미 제출한 문제인지 확인 (중복 제출 방지)
    if (submittedQuestionId === currentQuestionId) return;
    if (autoSubmittedRef.current === currentQuestionId) return; // 자동 제출도 이미 했는지 확인

    const timeMs = Date.now() - answerStartTime;

    try {
      // 자동 제출인 경우 플래그 설정
      if (answer === "") {
        autoSubmittedRef.current = currentQuestionId;
      }
      
      // 답안 제출 (1:1 배틀과 동일한 파라미터 사용)
      // scoreboard.currentQuestion.questionId를 사용 (API에서 제공하는 questionId)
      await submitAnswer(roomId, {
        questionId: currentQuestionId,
        userAnswer: answer,
        correct: false, // API에서 판단하므로 임시값
        timeMs,
        roundNo: scoreboard.currentQuestion.roundNo,
        phase: scoreboard.currentQuestion.phase as "MAIN" | "REVIVAL",
      });

      setSubmittedQuestionId(currentQuestionId);
      setGameStage("waiting");
      // 정답 여부는 스코어보드 폴링으로 업데이트됨
    } catch (error) {
      console.error("답안 제출 실패:", error);
      // 에러 발생 시 자동 제출 플래그도 리셋
      if (answer === "" && autoSubmittedRef.current === currentQuestionId) {
        autoSubmittedRef.current = null;
      }
      setGameStage("waiting");
    }
  };

  // xpResults 처리 함수
  const handleXpResult = (result: { userId: string; xpDelta: number; reason: string; totalXp: number; leveledUp: boolean }) => {
    const earnedExp = result.xpDelta;
    const totalXP = result.totalXp;
    const isLevelUp = result.leveledUp;

    // totalXP로 현재 레벨 계산
    const currentLevel = getLevelFromTotalXp(totalXP);

    // LevelUpScreen 열기 위한 상태 설정
    setLevelUpData({
      earnedExp,
      totalXP,
      currentLevel,
      isLevelUp,
      earnedPoints: isLevelUp ? 10 : 0 // 포인트는 예시
    });

    setShowLevelUp(true);
  };

  // 스코어보드 업데이트로 결과 확인 (API 데이터만 사용)
  useEffect(() => {
    const userIdToUse = propMyUserId || myUserId;
    if (!scoreboard || !userIdToUse) return;

    // 게임 종료 확인 (scoreboard.status === "DONE")
    if (scoreboard.status === "DONE") {
      const myItem = scoreboard.items.find(item => item.userId === userIdToUse);
      if (!myItem) return;

      // xpResults 처리
      if (scoreboard.xpResults && scoreboard.xpResults.length > 0) {
        const myXpResult = scoreboard.xpResults.find(result => result.userId === userIdToUse);
        if (myXpResult) {
          handleXpResult(myXpResult);
          return; // LevelUpScreen이 표시되는 동안은 결과 화면으로 이동하지 않음
        }
      }

      // 승자는 scoreboard.items[0].userId (점수 순서대로 정렬됨)
      const winnerUserId = scoreboard.items[0]?.userId;
      const isWinner = winnerUserId === userIdToUse;

      // 사용자의 순위는 items 배열에서의 인덱스 + 1 (배열이 점수 순서대로 정렬됨)
      const myRank = scoreboard.items.findIndex(item => item.userId === userIdToUse) + 1;

      if (isWinner) {
        // 사용자가 우승
        showWinnerScreen();
      } else {
        // 사용자가 탈락 또는 낮은 순위
        setGameStage("result");
        setTimeout(() => {
          onComplete(false, myRank);
        }, 1500);
      }
      return;
    }

    // 게임이 진행 중일 때는 탈락해도 게임 종료하지 않고 관전자 모드로 계속 진행
    // 다음 문제로 진행 (스코어보드의 currentQuestion이 변경되면 자동으로 처리됨)
  }, [scoreboard, propMyUserId, myUserId, isSpectator, onComplete]);

  // checkAnswer 함수 제거 - API에서 정답 여부 판단



  const addEffect = (effect: CanvasEffect) => {
    setEffects(prev => [...prev, effect]);
  };

  const addParticleEffect = (characterId: number) => {
    const character = characters.find(c => c.id === characterId);
    if (!character || !containerRef.current) return;

    const { row, col } = character.gridPosition;
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Calculate character position (approximate) for 10x2 grid at bottom
    const gridWidth = containerRect.width * 0.9;
    const gridHeight = containerRect.height * 0.25; // Smaller height for 2 rows
    const cellWidth = gridWidth / 10;
    const cellHeight = gridHeight / 2;
    
    const x = (containerRect.width - gridWidth) / 2 + col * cellWidth + cellWidth / 2;
    const y = containerRect.height - gridHeight + row * cellHeight + cellHeight / 2;

    addEffect({
      id: `particle-${characterId}-${Date.now()}`,
      type: "particles",
      timestamp: Date.now(),
      position: { x, y },
    });
  };

  const moveToNextQuestion = () => {
    // 다음 문제는 스코어보드 폴링으로 자동으로 감지됨
    setSubmittedQuestionId(null);
    setUserAnswer("");
    setShowFeedback(false);
    startNewQuestion();
  };

  const showWinnerScreen = () => {
    setGameStage("winner");
    
    // Spotlight effect on user character
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const x = containerRect.width / 2;
      const y = containerRect.height / 2;

      addEffect({
        id: `spotlight-${Date.now()}`,
        type: "spotlight",
        timestamp: Date.now(),
        position: { x, y },
      });
    }

    // 우승 화면을 잠시 보여준 후 결과 화면으로 이동
    setTimeout(() => {
      onComplete(true, 1);
    }, 2000); // 2초로 단축
  };

  const handleOXAnswer = (answer: "O" | "X") => {
    setUserAnswer(answer);
    setTimeout(() => {
      handleAnswer(answer);
    }, 300);
  };

  const handleShortAnswer = () => {
    handleAnswer(userAnswer);
  };

  // LevelUpScreen이 표시되는 경우
  if (showLevelUp && levelUpData) {
    return (
      <LevelUpScreen
        earnedExp={levelUpData.earnedExp}
        totalXP={levelUpData.totalXP}
        currentLevel={levelUpData.currentLevel}
        isLevelUp={levelUpData.isLevelUp}
        earnedPoints={levelUpData.earnedPoints}
        onComplete={() => {
          setShowLevelUp(false);
          // LevelUpScreen 닫은 후 결과 화면으로 이동
          const userIdToUse = propMyUserId || myUserId;
          if (scoreboard && userIdToUse) {
            const winnerUserId = scoreboard.items[0]?.userId;
            const isWinner = winnerUserId === userIdToUse;
            const myRank = scoreboard.items.findIndex(item => item.userId === userIdToUse) + 1;

            if (isWinner) {
              showWinnerScreen();
            } else {
              setGameStage("result");
              setTimeout(() => {
                onComplete(false, myRank);
              }, 1500);
            }
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8 text-yellow-600" />
              <h1 className="text-purple-900">골든벨 🔔</h1>
            </div>
            <Button onClick={onExit} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
              포기하기
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 border-2 border-purple-200 bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">문제</p>
                <p className="text-2xl text-purple-600">
                  {scoreboard?.currentQuestion ? `${scoreboard.currentQuestion.roundNo}-${scoreboard.currentQuestion.orderNo}` : "-"}
                </p>
              </div>
              <Bell className="w-8 h-8 text-purple-600" />
            </div>
          </Card>

          <Card className="p-4 border-2 border-blue-200 bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">생존자</p>
                <p className="text-2xl text-blue-600">{survivorsCount}명</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          <Card className={`p-4 border-2 ${
            timeLeft <= 3 ? "border-red-300 bg-red-50" : "border-orange-200 bg-white/80"
          } backdrop-blur`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">남은 시간</p>
                <p className={`text-2xl ${timeLeft <= 3 ? "text-red-600" : "text-orange-600"}`}>
                  {timeLeft}초
                </p>
              </div>
              <Clock className={`w-8 h-8 ${timeLeft <= 3 ? "text-red-600" : "text-orange-600"}`} />
            </div>
          </Card>
        </div>

        {/* Progress */}
        <Card className="p-4 border-2 border-purple-200 bg-white/80 backdrop-blur mb-6">
          <Progress value={(timeLeft / maxTime) * 100} className="h-2" />
        </Card>

        {/* Main Game Area - Hybrid Structure */}
        <div className="relative w-full" style={{ height: "750px" }}>
          <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden rounded-2xl border-4 border-purple-300 shadow-2xl"
          >
            {/* Background Image - Layer 1 */}
            <div
              className="absolute inset-0 z-10 bg-cover bg-center"
              style={{ backgroundImage: `url("/assets/backgrounds/background.png")` }}
            />

            {/* Character Grid - Layer 2 */}
            <CharacterGrid characters={characters} />

            {/* Canvas Effects - Layer 3 */}
            <EffectCanvas
              effects={effects}
              width={containerSize.width}
              height={containerSize.height}
            />

            {/* Ready Countdown Overlay - Layer 4 */}
            <AnimatePresence mode="wait">
              {gameStage === "ready" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: "spring", damping: 20 }}
                    className="text-center"
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="text-8xl mb-6"
                    >
                      🔔
                    </motion.div>
                    <motion.p 
                      className="text-3xl text-white drop-shadow-lg mb-2"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      곧 문제가 시작됩니다
                    </motion.p>
                    <p className="text-xl text-white/80 drop-shadow-lg">
                      {scoreboard?.currentQuestion ? `문제 ${scoreboard.currentQuestion.roundNo}-${scoreboard.currentQuestion.orderNo}` : "문제"}
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Question Modal Overlay - Layer 4 */}
            <AnimatePresence mode="wait">
              {gameStage === "answering" && currentQuestion && currentQuestion.stem && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-8"
                >
                  <motion.div
                    key="answering"
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: -20 }}
                    transition={{ type: "spring", damping: 20 }}
                    className="w-full max-w-2xl"
                  >
                    <Card className={`p-8 border-2 backdrop-blur ${
                      isSpectator ? "border-gray-300 bg-gray-50/95" : "border-purple-300 bg-white/95"
                    }`}>
                      <div className="mb-6">
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge className={`${
                            scoreboard?.currentQuestion?.phase === "REVIVAL" 
                              ? "bg-pink-500 text-white" 
                              : "bg-purple-500 text-white"
                          }`}>
                            {scoreboard?.currentQuestion?.phase === "REVIVAL" ? "부활전" : "본전"}
                          </Badge>
                          <Badge className="bg-purple-500 text-white">
                            {currentQuestion.type === "OX" ? "OX 퀴즈" 
                              : currentQuestion.type === "MCQ" || currentQuestion.type === "MULTIPLE" ? "객관식" 
                              : currentQuestion.type === "SHORT" ? "단답형" 
                              : "서술형"}
                          </Badge>
                          {isSpectator && (
                            <Badge className="bg-gray-600 text-white">
                              👁️ 관전자 모드
                            </Badge>
                          )}
                        </div>
                        <h2 className="text-gray-900 mb-4">{currentQuestion.stem}</h2>
                        {isSpectator && (
                          <div className={`rounded-lg p-4 mb-4 border-2 ${
                            scoreboard?.currentQuestion?.phase === "REVIVAL" && myRevived === false
                              ? "bg-red-50 border-red-300"
                              : "bg-yellow-50 border-yellow-300"
                          }`}>
                            <p className={`text-sm ${
                              scoreboard?.currentQuestion?.phase === "REVIVAL" && myRevived === false
                                ? "text-red-800"
                                : "text-yellow-800"
                            }`}>
                              ⚠️ 관전자 모드입니다. 문제는 볼 수 있지만 답안을 제출할 수 없습니다.
                            </p>
                            {scoreboard?.currentQuestion?.phase === "REVIVAL" && (
                              myRevived === true ? (
                                <p className="text-purple-700 text-sm mt-2 font-semibold">
                                  💫 부활전이 진행 중입니다. 부활 기회를 노려보세요!
                                </p>
                              ) : myRevived === false ? (
                                <p className="text-red-700 text-sm mt-2 font-semibold">
                                  ❌ 부활 자격이 없습니다. 정답을 맞춘 문제가 없어 부활할 수 없습니다.
                                </p>
                              ) : (
                                <p className="text-purple-700 text-sm mt-2 font-semibold">
                                  💫 부활전이 진행 중입니다. 부활 기회를 노려보세요!
                                </p>
                              )
                            )}
                          </div>
                        )}
                      </div>

                      {currentQuestion.type === "OX" ? (
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => handleOXAnswer("O")}
                            disabled={isSpectator}
                            className={`p-8 rounded-xl border-2 transition-all ${
                              isSpectator
                                ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-50"
                                : userAnswer === "O"
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-blue-300"
                            }`}
                          >
                            <div className="text-6xl mb-2">⭕</div>
                            <p className="text-xl text-gray-800">O</p>
                          </button>
                          <button
                            onClick={() => handleOXAnswer("X")}
                            disabled={isSpectator}
                            className={`p-8 rounded-xl border-2 transition-all ${
                              isSpectator
                                ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-50"
                                : userAnswer === "X"
                                ? "border-red-500 bg-red-50"
                                : "border-gray-200 hover:border-red-300"
                            }`}
                          >
                            <div className="text-6xl mb-2">❌</div>
                            <p className="text-xl text-gray-800">X</p>
                          </button>
                        </div>
                      ) : currentQuestion.type === "MCQ" || currentQuestion.type === "MULTIPLE" ? (
                        <div className="space-y-3">
                          {currentQuestion.payloadJson?.choices?.map((choice: any, index: number) => (
                            <button
                              key={choice.label || index}
                              onClick={() => {
                                if (!isSpectator) {
                                  setUserAnswer(choice.label);
                                  setTimeout(() => {
                                    handleAnswer(choice.label);
                                  }, 300);
                                }
                              }}
                              disabled={isSpectator}
                              className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
                                isSpectator
                                  ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-50"
                                  : userAnswer === choice.label
                                  ? "border-purple-500 bg-purple-50 shadow-md"
                                  : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                                  userAnswer === choice.label
                                    ? "bg-purple-500 text-white"
                                    : "bg-gray-200 text-gray-700"
                                }`}>
                                  {choice.label}
                                </div>
                                <p className="text-gray-800 flex-1">{choice.content}</p>
                                {userAnswer === choice.label && (
                                  <div className="text-purple-500 text-xl">✓</div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Input
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            placeholder={isSpectator ? "관전자 모드입니다. 답안을 제출할 수 없습니다." : "답을 입력하세요..."}
                            disabled={isSpectator}
                            className={`text-lg p-4 border-2 ${
                              isSpectator ? "border-gray-200 bg-gray-100 cursor-not-allowed" : "border-purple-200"
                            }`}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && userAnswer.trim() && !isSpectator) {
                                handleShortAnswer();
                              }
                            }}
                          />
                          <Button
                            onClick={handleShortAnswer}
                            disabled={!userAnswer.trim() || isSpectator}
                            className={`w-full py-6 ${
                              isSpectator
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                            } text-white`}
                          >
                            {isSpectator ? "관전자 모드 - 답안 제출 불가" : "답안 제출"}
                          </Button>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 탈락 알림 Overlay */}
            <AnimatePresence>
              {showEliminationNotice && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: -20 }}
                    transition={{ type: "spring", damping: 20 }}
                    className="text-center bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl"
                  >
                    <div className="text-8xl mb-4">💔</div>
                    <h2 className="text-3xl font-bold text-red-600 mb-4">탈락하셨습니다</h2>
                    <p className="text-gray-700 mb-2">이제 관전자 모드로 전환됩니다.</p>
                    <p className="text-sm text-gray-500">문제는 계속 볼 수 있지만 답안을 제출할 수는 없습니다.</p>
                    {scoreboard?.currentQuestion?.phase === "REVIVAL" && (
                      <div className="mt-4">
                        {myRevived === true ? (
                          <p className="text-sm text-purple-600 font-semibold">
                            💫 부활전이 진행 중입니다. 부활 기회를 노려보세요!
                          </p>
                        ) : myRevived === false ? (
                          <p className="text-sm text-red-600 font-semibold">
                            ❌ 부활 자격이 없습니다. 정답을 맞춘 문제가 없어 부활할 수 없습니다.
                          </p>
                        ) : (
                          <p className="text-sm text-purple-600 font-semibold">
                            부활전이 진행 중입니다. 부활 기회를 노려보세요!
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 부활 알림 Overlay */}
            <AnimatePresence>
              {showRevivalNotice && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: -20 }}
                    transition={{ type: "spring", damping: 20 }}
                    className="text-center bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl"
                  >
                    <div className="text-8xl mb-4">✨</div>
                    <h2 className="text-3xl font-bold text-purple-600 mb-4">부활하셨습니다!</h2>
                    <p className="text-gray-700 mb-2">다시 게임에 참여할 수 있습니다.</p>
                    <p className="text-sm text-gray-500">이제 답안을 제출할 수 있습니다.</p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 부활 자격 없음 알림 Overlay */}
            <AnimatePresence>
              {showNoRevivalNotice && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: -20 }}
                    transition={{ type: "spring", damping: 20 }}
                    className="text-center bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl"
                  >
                    <div className="text-8xl mb-4">😢</div>
                    <h2 className="text-3xl font-bold text-red-600 mb-4">부활 자격이 없습니다</h2>
                    <p className="text-gray-700 mb-2">정답을 맞춘 문제가 없어 부활할 수 없습니다.</p>
                    <p className="text-sm text-gray-500">부활전이 진행 중이지만 관전자 모드로 계속 진행됩니다.</p>
                    <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-lg p-3">
                      <p className="text-xs text-red-700">
                        💡 부활 조건: 탈락자 중 정답을 맞춘 문제가 있고, 가장 빠른 시간을 가진 1명만 부활합니다.
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 관전자 모드 배지 */}
            {isSpectator && gameStage === "answering" && (
              <div className="absolute top-4 right-4 z-45">
                <Badge className="bg-gray-600 text-white text-lg px-4 py-2">
                  👁️ 관전자 모드
                </Badge>
              </div>
            )}

            {/* Winner Overlay - Layer 5 */}
            <AnimatePresence>
              {gameStage === "winner" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="text-center"
                  >
                    <div className="text-8xl mb-4">🏆</div>
                    <h2 className="text-white mb-2 drop-shadow-lg">골든벨을 울리셨습니다!</h2>
                    <Badge className="bg-yellow-500 text-white text-xl px-6 py-2">
                      <Trophy className="w-5 h-5 mr-2" />
                      우승!
                    </Badge>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

