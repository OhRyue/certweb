import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, ArrowLeft, Sparkles } from "lucide-react";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizModeProps {
  categoryName: string;
  questions: Question[];
  onExit: () => void;
  onComplete: (score: number) => void;
}

export function QuizMode({ categoryName, questions, onExit, onComplete }: QuizModeProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
    setShowResult(true);

    if (answerIndex === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }
    setAnsweredQuestions(answeredQuestions + 1);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      onComplete(Math.round((score / questions.length) * 100));
    }
  };

  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={onExit}
            variant="ghost"
            className="hover:bg-white/80"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2">
            {categoryName}
          </Badge>
        </div>

        {/* Progress */}
        <Card className="p-6 mb-6 bg-white/80 backdrop-blur border-2 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">
              문제 {currentQuestionIndex + 1} / {questions.length}
            </span>
            <span className="text-purple-600">
              점수: {score} / {answeredQuestions}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </Card>

        {/* Question */}
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8 bg-white/80 backdrop-blur border-2 border-purple-200 shadow-xl mb-6">
            <div className="flex items-start gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-purple-500 flex-shrink-0 mt-1" />
              <h2 className="text-purple-900">{currentQuestion.question}</h2>
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrectAnswer = index === currentQuestion.correctAnswer;
                
                let buttonClass = "w-full p-4 text-left border-2 transition-all hover:shadow-md";
                
                if (!showResult) {
                  buttonClass += " hover:border-purple-400 hover:bg-purple-50";
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
                    onClick={() => handleAnswerSelect(index)}
                    className={buttonClass}
                    disabled={showResult}
                    whileHover={!showResult ? { scale: 1.02 } : {}}
                    whileTap={!showResult ? { scale: 0.98 } : {}}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
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
                      {isCorrect ? "정답입니다! 🎉" : "아쉽네요! 😅"}
                    </h3>
                    <p className="text-gray-700 mt-2">{currentQuestion.explanation}</p>
                  </div>
                </div>
              </Card>

              <Button
                onClick={handleNext}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-6"
              >
                {currentQuestionIndex < questions.length - 1 ? "다음 문제" : "결과 보기"}
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
