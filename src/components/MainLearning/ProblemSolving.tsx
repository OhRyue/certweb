import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, ArrowRight, Sparkles } from "lucide-react";
import { Question } from "../../types";

interface ProblemSolvingProps {
  questions: Question[];
  topicName: string;
  onComplete: (score: number, answers: any[]) => void;
}

export function ProblemSolving({ questions, topicName, onComplete }: ProblemSolvingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleAnswer = (answerIndex: number) => {
    if (showResult) return;

    setSelectedAnswer(answerIndex);
    setShowResult(true);

    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore(score + 1);
    }

    setAnswers([...answers, {
      questionId: currentQuestion.id,
      selectedAnswer: answerIndex,
      isCorrect,
      timeSpent: 0,
    }]);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      onComplete(score, answers);
    }
  };

  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Badge className="bg-purple-500 text-white mb-3">{topicName}</Badge>
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-purple-900">Micro 문제풀이</h1>
          </div>
          <p className="text-gray-600 mt-2">실전 문제로 실력을 다져보세요!</p>
        </div>

        {/* Progress */}
        <Card className="p-4 mb-6 bg-white border-2 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">
              문제 {currentIndex + 1} / {questions.length}
            </span>
            <span className="text-purple-600">
              정답: {score} / {answers.length}
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
            <div className="flex items-start gap-3 mb-6">
              <Badge 
                variant="secondary"
                className={
                  currentQuestion.difficulty === "easy" 
                    ? "bg-green-100 text-green-700"
                    : currentQuestion.difficulty === "medium"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }
              >
                {currentQuestion.difficulty === "easy" ? "쉬움" : 
                 currentQuestion.difficulty === "medium" ? "보통" : "어려움"}
              </Badge>
              {currentQuestion.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  #{tag}
                </Badge>
              ))}
            </div>

            <h2 className="text-purple-900 mb-6">{currentQuestion.question}</h2>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrectAnswer = index === currentQuestion.correctAnswer;

                let buttonClass = "w-full p-4 text-left border-2 transition-all";

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
                    whileHover={!showResult ? { scale: 1.02 } : {}}
                    whileTap={!showResult ? { scale: 0.98 } : {}}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </div>
                        <span>{option}</span>
                      </div>
                      {showResult && isCorrectAnswer && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                      {showResult && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </Card>

          {/* AI Explanation */}
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
                  <div className="flex-shrink-0">
                    {isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={isCorrect ? "text-green-900" : "text-red-900"}>
                        {isCorrect ? "정답이에요!" : "아쉽네요!"}
                      </h3>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI 해설
                      </Badge>
                    </div>
                    <p className="text-gray-700">{currentQuestion.explanation}</p>
                  </div>
                </div>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={handleNext}
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  {currentIndex < questions.length - 1 ? "다음 문제" : "결과 보기"}
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
