import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { motion } from "motion/react";
import { XCircle, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, BookOpen } from "lucide-react";
import type { Question } from "../../types";

interface WrongAnswer {
  question: Question;
  userAnswer: number | string;
  correctAnswer: number | string;
}

interface MicroWrongAnswersProps {
  wrongAnswers: WrongAnswer[];
  topicName: string;
  examType: "written" | "practical";
  onContinue: () => void;
}

export function MicroWrongAnswers({ 
  wrongAnswers, 
  topicName, 
  examType,
  onContinue 
}: MicroWrongAnswersProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isPractical = examType === "practical";
  
  if (wrongAnswers.length === 0) {
    // 틀린 문제가 없으면 바로 다음으로
    onContinue();
    return null;
  }

  const currentWrong = wrongAnswers[currentIndex];
  const currentQuestion = currentWrong.question;

  const handleNext = () => {
    if (currentIndex < wrongAnswers.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onContinue();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="p-8 min-h-screen">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-red-500 text-white">오답 노트</Badge>
            <Badge variant="secondary" className={isPractical ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}>
              {isPractical ? "실기" : "필기"}
            </Badge>
            <Badge variant="outline">{topicName}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-red-600" />
            <h1 className="text-red-900">틀린 문제 다시 보기</h1>
          </div>
          <p className="text-gray-600 mt-2">
            틀린 문제를 복습하고 이해해보세요! 💪
          </p>
        </div>

        {/* Progress */}
        <Card className="p-4 mb-6 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">
              틀린 문제 {currentIndex + 1} / {wrongAnswers.length}
            </span>
            <div className="text-2xl">😢</div>
          </div>
        </Card>

        {/* Wrong Answer Card */}
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Question */}
          <Card className="p-8 bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 mb-6">
            <div className="flex items-start gap-3 mb-6">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
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

                <h2 className="text-red-900 mb-6">{currentQuestion.question}</h2>

                {/* 필기 모드: 선택형 */}
                {!isPractical && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => {
                      const isUserAnswer = index === currentWrong.userAnswer;
                      const isCorrectAnswer = index === currentQuestion.correctAnswer;

                      let cardClass = "p-4 border-2 rounded-lg ";
                      
                      if (isCorrectAnswer) {
                        cardClass += "bg-green-50 border-green-400";
                      } else if (isUserAnswer) {
                        cardClass += "bg-red-50 border-red-400";
                      } else {
                        cardClass += "bg-white/60 border-gray-200 opacity-50";
                      }

                      return (
                        <div key={index} className={cardClass}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                isCorrectAnswer ? "bg-green-100 text-green-700" :
                                isUserAnswer ? "bg-red-100 text-red-700" :
                                "bg-gray-100 text-gray-600"
                              }`}>
                                {index + 1}
                              </div>
                              <span className={
                                isCorrectAnswer ? "text-green-900" :
                                isUserAnswer ? "text-red-900" :
                                "text-gray-600"
                              }>{option}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {isCorrectAnswer && (
                                <>
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                  <span className="text-sm text-green-700">정답</span>
                                </>
                              )}
                              {isUserAnswer && !isCorrectAnswer && (
                                <>
                                  <XCircle className="w-5 h-5 text-red-600" />
                                  <span className="text-sm text-red-700">내 답</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 실기 모드: 타이핑 답안 */}
                {isPractical && (
                  <div className="space-y-4">
                    {/* 내가 입력한 답 */}
                    <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="text-red-900">내가 입력한 답</span>
                      </div>
                      <p className="text-red-700 ml-7">{currentWrong.userAnswer}</p>
                    </div>

                    {/* 정답 */}
                    <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-green-900">정답</span>
                      </div>
                      <p className="text-green-700 ml-7">{currentQuestion.correctAnswer}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Explanation */}
          <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-blue-900">해설</h3>
                  {isPractical && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI 해설
                    </Badge>
                  )}
                </div>
                <p className="text-gray-700">{currentQuestion.explanation}</p>
              </div>
            </div>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4">
            <Button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              variant="outline"
              className="border-2 border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              이전 문제
            </Button>

            <div className="text-center text-sm text-gray-600">
              {currentIndex + 1} / {wrongAnswers.length}
            </div>

            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              {currentIndex < wrongAnswers.length - 1 ? "다음 문제" : "결과 보기"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
