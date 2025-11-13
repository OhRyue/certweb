import { useState, useEffect } from "react";
import { Card } from "../../../ui/card";
import { Button } from "../../../ui/button";
import { Badge } from "../../../ui/badge";
import { Progress } from "../../../ui/progress";
import { Input } from "../../../ui/input";
import { Swords, Clock, Zap, Sparkles, Target } from "lucide-react";
import type { Question } from "../../../../types";
import { OpponentLeftOverlay } from "../../OpponentLeftOverlay";

interface BattleGamePracticalProps {
  questions: Question[];
  opponentName: string;
  onComplete: (myScore: number, opponentScore: number) => void;
  onExit: () => void;
}

export function BattleGamePractical({
  questions,
  opponentName,
  onComplete,
  onExit,
}: BattleGamePracticalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [typingAnswer, setTypingAnswer] = useState("");
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showOpponentAnswer, setShowOpponentAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // 오버레이 상태 추가
  const [opponentLeft, setOpponentLeft] = useState(false);

  const totalQuestions = questions.length;
  const question = questions[currentQuestion];

  // 테스트: ESC 누르면 상대 나간 상황 테스트
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpponentLeft(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Timer
  useEffect(() => {
    if (timeLeft === 0 && !isAnswered) {
      handleAnswer();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isAnswered]);

  // Handle answer - 랜덤 채점 (UI용)
  const handleAnswer = () => {
    setIsAnswered(true);
    setShowOpponentAnswer(true);

    const answeredCorrectly = typingAnswer.trim().length > 0 && Math.random() > 0.3;
    setIsCorrect(answeredCorrectly);

    if (answeredCorrectly) {
      const speedBonus = Math.floor(timeLeft / 3);
      setMyScore((prev) => prev + 10 + speedBonus);
    }

    const opponentCorrect = Math.random() > 0.3;
    const opponentTime = Math.floor(Math.random() * 25) + 5;
    if (opponentCorrect) {
      const opponentSpeedBonus = Math.floor(opponentTime / 3);
      setOpponentScore((prev) => prev + 10 + opponentSpeedBonus);
    }

    setShowResult(true);
    setTimeout(() => {
      if (currentQuestion < totalQuestions - 1) {
        setCurrentQuestion((prev) => prev + 1);
        setTypingAnswer("");
        setIsAnswered(false);
        setShowResult(false);
        setShowOpponentAnswer(false);
        setTimeLeft(30);
        setIsCorrect(false);
      } else {
        const finalMyScore = answeredCorrectly
          ? myScore + 10 + Math.floor(timeLeft / 3)
          : myScore;
        const finalOpponentScore = opponentCorrect
          ? opponentScore + 10 + Math.floor(opponentTime / 3)
          : opponentScore;
        onComplete(finalMyScore, finalOpponentScore);
      }
    }, 2500);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Swords className="w-8 h-8 text-purple-600 animate-pulse" />
              <Sparkles className="w-4 h-4 text-yellow-500 absolute -top-1 -right-1" />
            </div>
            <h1 className="text-purple-900">1:1 배틀 ⚔️</h1>
          </div>
        </div>

        {/* 여기까지 기존 UI 유지 (생략 가능) */}
        
        {/* Score Board */}
        <div className="mb-6 relative">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 shadow-lg animate-pulse">
              VS
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 내 스코어 */}
            <Card className={`p-6 border-2 transition-all duration-300 ${
              showResult && isCorrect
                ? "bg-gradient-to-br from-green-100 to-emerald-100 border-green-400 shadow-lg scale-105"
                : "bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-700">나</p>
                  <p className="text-3xl text-purple-700">{myScore}점</p>
                </div>
                <div className="text-5xl">👨‍💻</div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Target className="w-3 h-3" />
                <span>문제 {currentQuestion + 1}/{totalQuestions}</span>
              </div>
            </Card>

            {/* 상대 */}
            <Card className={`p-6 border-2 transition-all duration-300 ${
              showResult && !isCorrect
                ? "bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-400 shadow-lg scale-105"
                : "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-700 mb-1">{opponentName}</p>
                  <p className="text-3xl text-blue-700">{opponentScore}점</p>
                </div>
                <div className="text-5xl relative">
                  🤖
                  {!isAnswered && (
                    <div className="absolute -top-2 -right-2">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Timer */}
        <Card className="p-5 mb-6 border-2 border-purple-200 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                실기 모드 ⌨️
              </Badge>
              <span className="text-sm text-gray-600">
                {currentQuestion + 1} / {totalQuestions}
              </span>
            </div>
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                timeLeft <= 10
                  ? "bg-red-100 text-red-700 animate-pulse"
                  : timeLeft <= 20
                  ? "bg-orange-100 text-orange-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="font-mono">{timeLeft}초</span>
            </div>
          </div>
          <Progress
            value={((currentQuestion + 1) / totalQuestions) * 100}
            className="h-2.5"
          />
        </Card>

        {/* 2단 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 문제 */}
          <Card className="p-8 border-2 border-purple-200 bg-white/90 backdrop-blur-sm shadow-lg">
            <div className="mb-4">
              <h2 className="text-gray-900 text-base">{question.question}</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-lg border-2 border-orange-200">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-orange-500 text-white">AI 채점 🤖</Badge>
                  <p className="text-sm text-gray-700">코드나 답변을 입력하세요</p>
                </div>
                <Input
                  value={typingAnswer}
                  onChange={(e) => setTypingAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isAnswered && typingAnswer.trim()) {
                      handleAnswer();
                    }
                  }}
                  placeholder="답변을 입력하세요..."
                  disabled={isAnswered}
                  className="bg-white border-2 border-orange-300 focus:border-orange-500 disabled:opacity-60"
                />
              </div>
              {!isAnswered && typingAnswer.trim() && (
                <Button
                  onClick={handleAnswer}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  제출하기
                </Button>
              )}
            </div>
          </Card>

          {/* 해설 */}
          <Card className="p-8 border-2 border-purple-200 bg-white/90 backdrop-blur-sm shadow-lg">
            {!showResult ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="text-6xl mb-4">🤔</div>
                <p className="text-gray-600">답변을 제출하면</p>
                <p className="text-gray-600">이곳에 AI 해설이 표시됩니다</p>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div
                  className={`p-5 rounded-xl border-2 flex-1 ${
                    isCorrect
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300"
                      : "bg-gradient-to-r from-red-50 to-rose-50 border-red-300"
                  }`}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-5xl">
                      {isCorrect ? "🎉" : "💭"}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-xl mb-2 ${
                          isCorrect ? "text-green-900" : "text-red-900"
                        }`}
                      >
                        {isCorrect ? "정답입니다! ✨" : "아쉽네요! 😢"}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-white/70 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-orange-500 text-white text-xs">AI 해설</Badge>
                      <p className="text-sm text-gray-700">📚 해설</p>
                    </div>
                    <p className="text-sm text-gray-800">{question.explanation}</p>
                  </div>

                  {showOpponentAnswer && (
                    <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
                      <span>🤖</span>
                      <span>{opponentName}님도 문제를 풀었습니다!</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* 상대방 나감 오버레이 표시 */}
      {opponentLeft && (
        <OpponentLeftOverlay
          opponentName={opponentName}
          myScore={myScore}
          opponentScore={opponentScore}
          onConfirm={() => {
            setOpponentLeft(false);
            onExit(); // 홈으로 나가기
          }}
        />
      )}
    </div>
  );
}
