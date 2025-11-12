import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import type { Question } from "../../types";

interface MiniCheckProps {
  questions: Question[];
  topicName: string;
  onComplete: (score: number) => void;
}

export function MiniCheck({ questions, topicName, onComplete }: MiniCheckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleAnswer = (answerIndex: number) => {
    if (showResult) return;
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);

    if (answerIndex === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      onComplete(score);
    }
  };

  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Badge className="bg-purple-500 text-white mb-3">{topicName}</Badge>
          <h1 className="text-purple-900 mb-2">미니체크 (O/X)</h1>
          <p className="text-gray-600">개념을 제대로 이해했는지 확인해보세요!</p>
        </div>

        {/* Progress */}
        <Card className="p-4 mb-6 bg-white border-2 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">
              문제 {currentIndex + 1} / {questions.length}
            </span>
            <span className="text-purple-600">
              정답: {score} / {currentIndex + (showResult ? 1 : 0)}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </Card>

        {/* Question */}
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 mb-6">
            <h2 className="text-purple-900 mb-6">{currentQuestion.question}</h2>

            <div className="grid grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrectAnswer = index === currentQuestion.correctAnswer;

                let buttonClass = "p-8 text-center border-2 transition-all text-2xl";

                if (!showResult) {
                  buttonClass += " hover:border-purple-400 hover:bg-white/60 cursor-pointer";
                } else if (isCorrectAnswer) {
                  buttonClass += " border-green-400 bg-green-50";
                } else if (isSelected && !isCorrect) {
                  buttonClass += " border-red-400 bg-red-50";
                } else {
                  buttonClass += " opacity-50";
                }

                return (
                  <motion.button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    className={buttonClass}
                    disabled={showResult}
                    whileHover={!showResult ? { scale: 1.05 } : {}}
                    whileTap={!showResult ? { scale: 0.95 } : {}}
                  >
                    <div className="mb-2">{option === "O" ? "⭕" : "❌"}</div>
                    <div className="text-gray-800">{option}</div>
                  </motion.button>
                );
              })}
            </div>
          </Card>

          {/* Explanation */}
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card
                className={`p-6 mb-6 border-2 ${
                  isCorrect
                    ? "bg-green-50 border-green-300"
                    : "bg-red-50 border-red-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  )}
                  <div>
                    <h3 className={isCorrect ? "text-green-900" : "text-red-900"}>
                      {isCorrect ? "정답이에요! 🎉" : "틀렸어요! 💪"}
                    </h3>
                    <p className="text-gray-700 mt-2">{currentQuestion.explanation}</p>
                  </div>
                </div>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={handleNext}
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  {currentIndex < questions.length - 1 ? "다음 문제" : "문제 풀이로"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
