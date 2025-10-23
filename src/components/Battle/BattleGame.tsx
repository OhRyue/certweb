import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Swords, Clock, Zap, Trophy, X } from "lucide-react";
import { Question } from "../../types";

interface BattleGameProps {
  questions: Question[];
  opponentName: string;
  onComplete: (myScore: number, opponentScore: number) => void;
  onExit: () => void;
}

export function BattleGame({ questions, opponentName, onComplete, onExit }: BattleGameProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showResult, setShowResult] = useState(false);

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

  // Simulate opponent answer
  const handleAnswer = (answer: string | null) => {
    setIsAnswered(true);
    setSelectedAnswer(answer);

    const isCorrect = answer === question.correctAnswer;
    
    // Update my score
    if (isCorrect) {
      const speedBonus = Math.floor(timeLeft / 3); // Speed bonus
      setMyScore((prev) => prev + 10 + speedBonus);
    }

    // Simulate opponent (70% chance to answer correctly, random speed)
    const opponentCorrect = Math.random() > 0.3;
    const opponentTime = Math.floor(Math.random() * 25) + 5;
    
    if (opponentCorrect) {
      const opponentSpeedBonus = Math.floor(opponentTime / 3);
      setOpponentScore((prev) => prev + 10 + opponentSpeedBonus);
    }

    // Show result for 2 seconds then move to next question
    setShowResult(true);
    setTimeout(() => {
      if (currentQuestion < totalQuestions - 1) {
        setCurrentQuestion((prev) => prev + 1);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setShowResult(false);
        setTimeLeft(30);
      } else {
        // Battle complete
        const finalOpponentScore = opponentCorrect 
          ? opponentScore + 10 + Math.floor(opponentTime / 3)
          : opponentScore;
        onComplete(isCorrect ? myScore + 10 + Math.floor(timeLeft / 3) : myScore, finalOpponentScore);
      }
    }, 2000);
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Swords className="w-6 h-6 text-purple-600" />
              <h2 className="text-purple-900">1:1 배틀</h2>
            </div>
            <Button
              onClick={onExit}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4 mr-2" />
              나가기
            </Button>
          </div>

          {/* Score Board */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">나</p>
                  <p className="text-2xl text-purple-600">{myScore}</p>
                </div>
                <div className="text-3xl">👨‍💻</div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{opponentName}</p>
                  <p className="text-2xl text-blue-600">{opponentScore}</p>
                </div>
                <div className="text-3xl">🤖</div>
              </div>
            </Card>
          </div>
        </div>

        {/* Progress */}
        <Card className="p-4 mb-6 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              문제 {currentQuestion + 1} / {totalQuestions}
            </span>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className={`text-sm ${timeLeft <= 10 ? "text-red-600" : "text-gray-800"}`}>
                {timeLeft}초
              </span>
            </div>
          </div>
          <Progress value={((currentQuestion + 1) / totalQuestions) * 100} className="h-2" />
        </Card>

        {/* Question */}
        <Card className="p-8 border-2 border-purple-200">
          <div className="mb-6">
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 mb-4">
              {question.category}
            </Badge>
            <h2 className="text-gray-900 mb-2">{question.question}</h2>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {question.options?.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === question.correctAnswer;
              const showCorrect = showResult && isCorrect;
              const showWrong = showResult && isSelected && !isCorrect;

              return (
                <button
                  key={index}
                  onClick={() => !isAnswered && handleAnswer(option)}
                  disabled={isAnswered}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    showCorrect
                      ? "border-green-500 bg-green-50"
                      : showWrong
                      ? "border-red-500 bg-red-50"
                      : isSelected
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                  } ${isAnswered ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-800">{option}</span>
                    {showCorrect && <Zap className="w-5 h-5 text-green-600" />}
                    {showWrong && <X className="w-5 h-5 text-red-600" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Result Feedback */}
          {showResult && (
            <div className={`mt-6 p-4 rounded-lg ${
              selectedAnswer === question.correctAnswer
                ? "bg-green-50 border-2 border-green-200"
                : "bg-red-50 border-2 border-red-200"
            }`}>
              <p className={`${
                selectedAnswer === question.correctAnswer
                  ? "text-green-900"
                  : "text-red-900"
              }`}>
                {selectedAnswer === question.correctAnswer
                  ? "정답입니다! ✨"
                  : `오답입니다. 정답: ${question.correctAnswer}`}
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
