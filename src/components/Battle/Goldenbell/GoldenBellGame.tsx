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
  onComplete: (survived: boolean, rank: number) => void;
  onExit: () => void;
}

export function GoldenBellGame({ sessionId, onComplete, onExit }: GoldenBellGameProps) {
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

  const survivorsCount = characters.filter(c => c.status !== "eliminated").length;
  const maxTime = currentQuestion?.type === "OX" ? 10 : currentQuestion?.type === "SHORT" ? 20 : 30;

  // 초기 방 상태 조회 (questions 배열 가져오기)
  useEffect(() => {
    if (!roomId || isNaN(roomId)) return;

    const fetchInitialState = async () => {
      try {
        const state = await getRoomState(roomId);
        setRoomState(state);
        console.log("초기 방 상태 조회:", state);
        
        // myUserId 설정
        if (state.detail.participants.length > 0) {
          // alive인 참가자 중 첫 번째 또는 첫 번째 참가자
          const myParticipant = state.detail.participants.find(p => p.alive) || state.detail.participants[0];
          if (myParticipant) {
            setMyUserId(myParticipant.userId);
          }
        }

        // 첫 번째 문제가 있으면 questions 배열에서 가져오기
        if (state.detail.questions && state.detail.questions.length > 0) {
          const firstQuestion = state.detail.questions.sort((a, b) => a.order - b.order)[0];
          if (firstQuestion) {
            try {
              const questionData = await getVersusQuestion(firstQuestion.questionId);
              setCurrentQuestion(questionData);
              setAnswerStartTime(Date.now());
              setGameStage("answering");
              setTimeLeft(questionData.type === "OX" ? 10 : questionData.type === "SHORT" ? 20 : 30);
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

  // 스코어보드 폴링 (1초마다)
  useEffect(() => {
    if (!roomId || isNaN(roomId)) return;

    const pollScoreboard = async () => {
      try {
        const scoreboardData = await getScoreboard(roomId);
        setScoreboard(scoreboardData);
        
        // myUserId 설정 (첫 번째 호출 시)
        if (!myUserId && scoreboardData.items.length > 0) {
          // 첫 번째 항목이 사용자일 가능성이 높음 (또는 alive인 항목 중 첫 번째)
          const myItem = scoreboardData.items.find(item => item.alive) || scoreboardData.items[0];
          if (myItem) {
            setMyUserId(myItem.userId);
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

    return () => clearInterval(interval);
  }, [roomId, myUserId]);

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
        setTimeLeft(questionData.type === "OX" ? 10 : questionData.type === "SHORT" ? 20 : 30);
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
      const row = Math.floor(index / 8);
      const col = index % 8;
      
      if (row < 2 && col < 8) {
        const isUser = participant.userId === myUserId;
        // API의 alive 필드만 사용
        const status: GoldenBellCharacter["status"] = 
          !participant.alive ? "eliminated" : "normal";
        
        newCharacters.push({
          id: index + 1,
          name: isUser ? "나" : `참가자 ${index + 1}`,
          status,
          gridPosition: { row, col },
        });
      }
    });

    // 빈 자리 채우기 (20명 미만인 경우)
    while (newCharacters.length < 20) {
      const index = newCharacters.length;
      const row = Math.floor(index / 8);
      const col = index % 8;
      if (row < 2 && col < 8) {
        newCharacters.push({
          id: index + 1,
          name: `참가자 ${index + 1}`,
          status: "eliminated",
          gridPosition: { row, col },
        });
      } else {
        break;
      }
    }

    setCharacters(newCharacters);

    // 사용자의 정답 여부는 스코어보드에서 확인
    const myItem = scoreboard.items.find(item => item.userId === myUserId);
    if (myItem && submittedQuestionId) {
      // 최근 제출한 문제의 정답 여부는 스코어보드 업데이트로 확인
      // correctCount가 증가했으면 정답, 아니면 오답
    }
  }, [scoreboard, myUserId, submittedQuestionId]);

  // endTime 기반 타이머 업데이트
  useEffect(() => {
    if (!scoreboard?.currentQuestion?.endTime) return;

    const updateTimer = () => {
      const endTime = new Date(scoreboard.currentQuestion!.endTime).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100); // 100ms마다 업데이트

    return () => clearInterval(interval);
  }, [scoreboard?.currentQuestion?.endTime]);

  // Countdown timer for ready stage
  useEffect(() => {
    if (gameStage !== "ready") return;

    if (countdown <= 0) {
      // Start the game
      setGameStage("answering");
      setTimeLeft(maxTime);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [gameStage, countdown, maxTime]);

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
    if (!currentQuestion || !roomId || !answerStartTime || !scoreboard?.currentQuestion) return;
    if (submittedQuestionId === currentQuestion.questionId) return; // 이미 제출한 문제

    const timeMs = Date.now() - answerStartTime;

    try {
      // 답안 제출 (1:1 배틀과 동일한 파라미터 사용)
      // roundNo와 phase를 포함하여 1:1 배틀과 동일한 형식으로 전송
      await submitAnswer(roomId, {
        questionId: currentQuestion.questionId,
        userAnswer: answer,
        correct: false, // API에서 판단하므로 임시값
        timeMs,
        roundNo: scoreboard.currentQuestion.roundNo,
        phase: scoreboard.currentQuestion.phase as "MAIN",
      });

      setSubmittedQuestionId(currentQuestion.questionId);
      setGameStage("waiting");
      // 정답 여부는 스코어보드 폴링으로 업데이트됨
    } catch (error) {
      console.error("답안 제출 실패:", error);
      setGameStage("waiting");
    }
  };

  // 스코어보드 업데이트로 결과 확인 (API 데이터만 사용)
  useEffect(() => {
    if (!scoreboard || !myUserId || !submittedQuestionId) return;

    const myItem = scoreboard.items.find(item => item.userId === myUserId);
    if (!myItem) return;

    // 스코어보드의 alive 상태로 탈락 여부 확인
    if (!myItem.alive) {
      // 사용자가 탈락함
      setGameStage("result");
      setTimeout(() => {
        const myRank = myItem.rank;
        onComplete(false, myRank);
      }, 1500);
      return;
    }

    // 생존자 수 확인
    const aliveCount = scoreboard.items.filter(item => item.alive).length;
    if (aliveCount <= 1 && myItem.alive) {
      // 사용자가 우승
      showWinnerScreen();
      return;
    }

    // 다음 문제로 진행 (스코어보드의 currentQuestion이 변경되면 자동으로 처리됨)
  }, [scoreboard, myUserId, submittedQuestionId]);

  // checkAnswer 함수 제거 - API에서 정답 여부 판단



  const addEffect = (effect: CanvasEffect) => {
    setEffects(prev => [...prev, effect]);
  };

  const addParticleEffect = (characterId: number) => {
    const character = characters.find(c => c.id === characterId);
    if (!character || !containerRef.current) return;

    const { row, col } = character.gridPosition;
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Calculate character position (approximate) for 8x2 grid at bottom
    const gridWidth = containerRect.width * 0.9;
    const gridHeight = containerRect.height * 0.25; // Smaller height for 2 rows
    const cellWidth = gridWidth / 8;
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

    setTimeout(() => {
      onComplete(true, 1);
    }, 3000);
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
                    <Card className="p-8 border-2 border-purple-300 bg-white/95 backdrop-blur">
                      <div className="mb-6">
                        <Badge className="mb-4 bg-purple-500 text-white">
                          {currentQuestion.type === "OX" ? "OX 퀴즈" : currentQuestion.type === "SHORT" ? "단답형" : "서술형"}
                        </Badge>
                        <h2 className="text-gray-900 mb-4">{currentQuestion.stem}</h2>
                      </div>

                      {currentQuestion.type === "OX" ? (
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => handleOXAnswer("O")}
                            className={`p-8 rounded-xl border-2 transition-all ${
                              userAnswer === "O"
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-blue-300"
                            }`}
                          >
                            <div className="text-6xl mb-2">⭕</div>
                            <p className="text-xl text-gray-800">O</p>
                          </button>
                          <button
                            onClick={() => handleOXAnswer("X")}
                            className={`p-8 rounded-xl border-2 transition-all ${
                              userAnswer === "X"
                                ? "border-red-500 bg-red-50"
                                : "border-gray-200 hover:border-red-300"
                            }`}
                          >
                            <div className="text-6xl mb-2">❌</div>
                            <p className="text-xl text-gray-800">X</p>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Input
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            placeholder="답을 입력하세요..."
                            className="text-lg p-4 border-2 border-purple-200"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && userAnswer.trim()) {
                                handleShortAnswer();
                              }
                            }}
                          />
                          <Button
                            onClick={handleShortAnswer}
                            disabled={!userAnswer.trim()}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-6"
                          >
                            답안 제출
                          </Button>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

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

