import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Swords, Clock, Zap, Trophy, X, Sparkles, Flame, Target } from "lucide-react";
import { Question } from "../../types";

interface BattleGameWrittenProps {
  questions: Question[];
  opponentName: string;
  onComplete: (myScore: number, opponentScore: number) => void;
  onExit: () => void;
}

export function BattleGameWritten({ questions, opponentName, onComplete, onExit }: BattleGameWrittenProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showOpponentAnswer, setShowOpponentAnswer] = useState(false);
  const [combo, setCombo] = useState(0);

  const totalQuestions = questions.length;
  const question = questions[currentQuestion];

  // Timer
  useEffect(() => {
    if (timeLeft === 0 && !isAnswered) {
      handleAnswer(null);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isAnswered]);

  // Handle answer
  const handleAnswer = (answer: number | null) => {
    setIsAnswered(true);
    setShowOpponentAnswer(true);
    
    const isCorrect = answer === question.correctAnswer;
    
    // Update my score with combo bonus
    if (isCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      const speedBonus = Math.floor(timeLeft / 3);
      const comboBonus = Math.min(newCombo * 2, 20); // 최대 20점 콤보 보너스
      setMyScore((prev) => prev + 10 + speedBonus + comboBonus);
    } else {
      setCombo(0);
    }

    // Simulate opponent (70% chance to answer correctly, random speed)
    const opponentCorrect = Math.random() > 0.3;
    const opponentTime = Math.floor(Math.random() * 25) + 5;
    
    if (opponentCorrect) {
      const opponentSpeedBonus = Math.floor(opponentTime / 3);
      setOpponentScore((prev) => prev + 10 + opponentSpeedBonus);
    }

    // Show result for 2.5 seconds then move to next question
    setShowResult(true);
    setTimeout(() => {
      if (currentQuestion < totalQuestions - 1) {
        setCurrentQuestion((prev) => prev + 1);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setShowResult(false);
        setShowOpponentAnswer(false);
        setTimeLeft(30);
      } else {
        // Battle complete
        const finalMyScore = isCorrect ? myScore + 10 + Math.floor(timeLeft / 3) + Math.min(combo * 2, 20) : myScore;
        const finalOpponentScore = opponentCorrect 
          ? opponentScore + 10 + Math.floor(opponentTime / 3)
          : opponentScore;
        onComplete(finalMyScore, finalOpponentScore);
      }
    }, 2500);
  };

  const getIsCorrect = () => {
    return selectedAnswer === question.correctAnswer;
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-5xl mx-auto">
        {/* Header with Exit Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Swords className="w-8 h-8 text-purple-600 animate-pulse" />
              <Sparkles className="w-4 h-4 text-yellow-500 absolute -top-1 -right-1" />
            </div>
            <h1 className="text-purple-900">1:1 배틀 ⚔️</h1>
          </div>
          <Button
            onClick={onExit}
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-2" />
            나가기
          </Button>
        </div>

        {/* Battle Arena */}
        <div className="mb-6 relative">
          {/* VS Badge */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 shadow-lg animate-pulse">
              VS
            </Badge>
          </div>

          {/* Score Board */}
          <div className="grid grid-cols-2 gap-4">
            {/* My Score */}
            <Card className={`p-6 border-2 transition-all duration-300 ${
              showResult && getIsCorrect()
                ? "bg-gradient-to-br from-green-100 to-emerald-100 border-green-400 shadow-lg scale-105"
                : "bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm text-gray-700">나</p>
                    {combo > 0 && (
                      <Badge className="bg-orange-500 text-white text-xs px-2 py-0 flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        {combo} 콤보
                      </Badge>
                    )}
                  </div>
                  <p className="text-3xl text-purple-700">{myScore}점</p>
                </div>
                <div className="text-5xl">👨‍💻</div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Target className="w-3 h-3" />
                <span>문제 {currentQuestion + 1}/{totalQuestions}</span>
              </div>
            </Card>

            {/* Opponent Score */}
            <Card className={`p-6 border-2 transition-all duration-300 ${
              showResult && !getIsCorrect()
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

        {/* Timer and Progress */}
        <Card className="p-5 mb-6 border-2 border-purple-200 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                필기 모드 ✏️
              </Badge>
              <span className="text-sm text-gray-600">
                {currentQuestion + 1} / {totalQuestions}
              </span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              timeLeft <= 10 
                ? "bg-red-100 text-red-700 animate-pulse" 
                : timeLeft <= 20
                ? "bg-orange-100 text-orange-700"
                : "bg-blue-100 text-blue-700"
            }`}>
              <Clock className="w-5 h-5" />
              <span className="font-mono">{timeLeft}초</span>
            </div>
          </div>
          <Progress 
            value={((currentQuestion + 1) / totalQuestions) * 100} 
            className="h-2.5" 
          />
        </Card>

        {/* 2단 레이아웃: 왼쪽 문제, 오른쪽 해설 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽: 문제 & 답변 */}
          <Card className="p-8 border-2 border-purple-200 bg-white/90 backdrop-blur-sm shadow-lg">
            <div className="mb-4">
              <h2 className="text-gray-900 text-base">{question.question}</h2>
            </div>

            {/* 4지선다 답변 */}
            <div className="space-y-3">
              {question.options?.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === question.correctAnswer;
                const showCorrect = showResult && isCorrect;
                const showWrong = showResult && isSelected && !isCorrect;

                return (
                  <button
                    key={index}
                    onClick={() => !isAnswered && handleAnswer(index)}
                    disabled={isAnswered}
                    className={`w-full p-5 rounded-xl border-2 text-left transition-all transform ${
                      showCorrect
                        ? "border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 scale-[1.02] shadow-lg"
                        : showWrong
                        ? "border-red-500 bg-gradient-to-r from-red-50 to-rose-50 scale-95"
                        : isSelected
                        ? "border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 scale-[1.01]"
                        : "border-gray-200 hover:border-purple-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-purple-50/30 hover:scale-[1.01]"
                    } ${isAnswered ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          showCorrect
                            ? "bg-green-500 text-white"
                            : showWrong
                            ? "bg-red-500 text-white"
                            : isSelected
                            ? "bg-purple-500 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}>
                          {showCorrect ? "✓" : showWrong ? "✗" : index + 1}
                        </div>
                        <span className="text-gray-800">{option}</span>
                      </div>
                      {showCorrect && (
                        <div className="flex items-center gap-2 text-green-600">
                          <Zap className="w-5 h-5" />
                          <span className="text-sm">정답!</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* 오른쪽: 결과 & 해설 */}
          <Card className="p-8 border-2 border-purple-200 bg-white/90 backdrop-blur-sm shadow-lg">
            {!showResult ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="text-6xl mb-4">🤔</div>
                <p className="text-gray-600">답을 선택하면</p>
                <p className="text-gray-600">이곳에 해설이 표시됩니다</p>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className={`p-5 rounded-xl border-2 flex-1 ${
                  getIsCorrect()
                    ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300"
                    : "bg-gradient-to-r from-red-50 to-rose-50 border-red-300"
                }`}>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-5xl">
                      {getIsCorrect() ? "🎉" : "💭"}
                    </div>
                    <div className="flex-1">
                      <p className={`text-xl mb-2 ${
                        getIsCorrect()
                          ? "text-green-900"
                          : "text-red-900"
                      }`}>
                        {getIsCorrect()
                          ? combo > 1 
                            ? `정답입니다! 🔥 ${combo}콤보 달성!` 
                            : "정답입니다! ✨"
                          : `아쉽네요! 😢`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-white/70 mb-4">
                    <p className="text-sm text-gray-700 mb-2">📚 해설</p>
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
    </div>
  );
}
