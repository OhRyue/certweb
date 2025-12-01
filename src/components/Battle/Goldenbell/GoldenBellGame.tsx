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

interface GoldenBellGameProps {
  sessionId: string;
  onComplete: (survived: boolean, rank: number) => void;
  onExit: () => void;
}

// TODO: 실제 문제 데이터로 대체 필요
const mockQuestions: any[] = [];

export function GoldenBellGame({ sessionId, onComplete, onExit }: GoldenBellGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 1000, height: 800 });
  
  // Game state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [characters, setCharacters] = useState<GoldenBellCharacter[]>([]);
  const [effects, setEffects] = useState<CanvasEffect[]>([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [gameStage, setGameStage] = useState<"ready" | "answering" | "waiting" | "showingAnswers" | "result" | "winner">("ready");
  const [timeLeft, setTimeLeft] = useState(10);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const currentQuestion = mockQuestions[currentQuestionIndex] || null;
  const survivorsCount = characters.filter(c => c.status !== "eliminated").length;
  const maxTime = currentQuestion?.type === "ox" ? 10 : currentQuestion?.type === "short" ? 15 : 10;

  // Initialize characters in 8x2 grid
  useEffect(() => {
    const initialCharacters: GoldenBellCharacter[] = [];
    let id = 1;
    
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 8; col++) {
        initialCharacters.push({
          id,
          name: `참가자 ${id}`,
          status: "normal",
          gridPosition: { row, col },
        });
        id++;
      }
    }
    
    setCharacters(initialCharacters);
  }, []);

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

  // Timer
  useEffect(() => {
    if (gameStage !== "answering" && gameStage !== "waiting") return;
    
    if (timeLeft <= 0) {
      if (gameStage === "answering") {
        // Time up while answering - auto submit empty answer
        const correct = checkAnswer("");
        setIsCorrect(correct);
        setGameStage("waiting");
      } else if (gameStage === "waiting") {
        // Time up while waiting - show results
        showResults();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStage, timeLeft]);

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
    setIsCorrect(false);
    
    // Reset all non-eliminated characters to normal
    setCharacters(prev =>
      prev.map(char => ({
        ...char,
        status: char.status === "eliminated" ? "eliminated" : "normal",
      }))
    );
  };

  const handleAnswer = (answer: string) => {
    if (gameStage !== "answering") return;

    const correct = checkAnswer(answer);
    setIsCorrect(correct);
    
    // Close popup and wait for time to end
    setGameStage("waiting");
  };

  const showResults = () => {
    // Step 1: Show all answers in bubbles
    setGameStage("showingAnswers");
    
    setCharacters(prev =>
      prev.map(char => {
        if (char.status === "eliminated") return char;
        
        // Generate random answer for other characters
        let answer = "";
        if (char.id === 1) {
          // User's answer
          answer = userAnswer || "(답 없음)";
        } else {
          // Random answers for NPCs
          if (currentQuestion.type === "ox") {
            answer = Math.random() > 0.3 ? currentQuestion.answer : (currentQuestion.answer === "O" ? "X" : "O");
          } else {
            // For short answer, some get it right, some wrong
            answer = Math.random() > 0.4 ? currentQuestion.answer : "오답";
          }
        }
        
        return {
          ...char,
          answer,
          showAnswer: true,
        };
      })
    );

    // Step 2: After 2 seconds, show correct/wrong status
    setTimeout(() => {
      setShowFeedback(true);
      setGameStage("result");
      
      setCharacters(prev =>
        prev.map(char => {
          if (char.status === "eliminated") return char;
          
          const correct = char.answer === currentQuestion.answer;
          
          if (char.id === 1) {
            // User character
            return { ...char, status: isCorrect ? "correct" : "wrong", showAnswer: false };
          } else {
            // NPC characters - use their generated answer
            return { 
              ...char, 
              status: correct ? "correct" : "wrong",
              showAnswer: false,
            };
          }
        })
      );

      if (isCorrect) {
        // Radial light effect
        addEffect({
          id: `light-${Date.now()}`,
          type: "radial-light",
          timestamp: Date.now(),
        });

        // Eliminate wrong characters
        setTimeout(() => {
          eliminateWrongCharacters();
        }, 800);
      } else {
        // User is wrong - eliminate user
        addParticleEffect(1);

        setTimeout(() => {
          setCharacters(prev =>
            prev.map(char => {
              if (char.id === 1) {
                return { ...char, status: "eliminated" };
              }
              return char;
            })
          );

          // Game over
          setTimeout(() => {
            onComplete(false, survivorsCount);
          }, 1500);
        }, 1000);
      }
    }, 2000);
  };

  const eliminateWrongCharacters = () => {
    // Add particle effects for wrong characters
    setCharacters(prev => {
      prev.forEach(char => {
        if (char.status === "wrong") {
          setTimeout(() => addParticleEffect(char.id), Math.random() * 300);
        }
      });
      return prev;
    });

    // Actually eliminate after animation
    setTimeout(() => {
      setCharacters(prev =>
        prev.map(char => ({
          ...char,
          status: char.status === "wrong" ? "eliminated" : char.status,
        }))
      );

      // Check if user won
      setTimeout(() => {
        const remainingCount = characters.filter(c => c.status !== "eliminated" && c.status !== "wrong").length;
        if (remainingCount <= 1) {
          showWinnerScreen();
        } else {
          moveToNextQuestion();
        }
      }, 500);
    }, 1000);
  };

  const checkAnswer = (answer: string): boolean => {
    const correctAnswer = currentQuestion.answer.toLowerCase().trim();
    const userAnswerNormalized = answer.toLowerCase().trim();
    
    return correctAnswer === userAnswerNormalized;
  };



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
    if (currentQuestionIndex < mockQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeout(() => {
        startNewQuestion();
      }, 1500);
    } else {
      // No more questions - user wins
      showWinnerScreen();
    }
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
                <p className="text-2xl text-purple-600">{currentQuestionIndex + 1}/{mockQuestions.length}</p>
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
                      문제 {currentQuestionIndex + 1}
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Question Modal Overlay - Layer 4 */}
            <AnimatePresence mode="wait">
              {gameStage === "answering" && currentQuestion && currentQuestion.question && (
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
                          {currentQuestion.type === "ox" ? "OX 퀴즈" : "단답형"}
                        </Badge>
                        <h2 className="text-gray-900 mb-4">{currentQuestion.question}</h2>
                      </div>

                      {currentQuestion.type === "ox" ? (
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
