import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Input } from "../ui/input";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { Question } from "../../types";

interface ProblemSolvingProps {
  questions: Question[];
  topicName: string;
  examType: "written" | "practical"; // 필기 or 실기
  onComplete: (score: number, answers: any[]) => void;
}

export function ProblemSolving({ questions, topicName, examType, onComplete }: ProblemSolvingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState(""); // 실기용 타이핑 답안
  const [showResult, setShowResult] = useState(false);
  const [isGrading, setIsGrading] = useState(false); // 실기 채점 중 상태
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isPractical = examType === "practical";

  // 필기 모드: 선택형 답안 처리
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

  // 실기 모드: 타이핑 답안 제출 처리
  const handleSubmitTypedAnswer = async () => {
    if (showResult || !typedAnswer.trim()) return;

    // 채점 중 표시
    setIsGrading(true);

    // AI 채점 시뮬레이션 (1.5초 대기)
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsGrading(false);
    setShowResult(true);

    // 실제로는 AI API를 호출하겠지만, 여기서는 단순 비교
    const isCorrect = typedAnswer.trim().toLowerCase() === String(currentQuestion.correctAnswer).toLowerCase();
    if (isCorrect) {
      setScore(score + 1);
    }

    setAnswers([...answers, {
      questionId: currentQuestion.id,
      selectedAnswer: typedAnswer,
      isCorrect,
      timeSpent: 0,
    }]);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setTypedAnswer("");
      setShowResult(false);
    } else {
      onComplete(score, answers);
    }
  };

  const isCorrect = isPractical 
    ? typedAnswer.trim().toLowerCase() === String(currentQuestion.correctAnswer).toLowerCase()
    : selectedAnswer === currentQuestion.correctAnswer;

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-purple-500 text-white">{topicName}</Badge>
            <Badge variant="secondary" className={isPractical ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}>
              {isPractical ? "실기" : "필기"}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-purple-900">Micro 문제풀이</h1>
          </div>
          <p className="text-gray-600 mt-2">
            {isPractical ? "답을 직접 입력하여 문제를 풀어보세요!" : "실전 문제로 실력을 다져보세요!"}
          </p>
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

            {/* 필기 모드: 선택형 */}
            {!isPractical && (
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
            )}

            {/* 실기 모드: 타이핑 입력 */}
            {isPractical && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2 text-purple-800">
                    답안을 입력하세요
                  </label>
                  <Input
                    type="text"
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !showResult && !isGrading) {
                        handleSubmitTypedAnswer();
                      }
                    }}
                    placeholder="정답을 입력하세요..."
                    disabled={showResult || isGrading}
                    className="w-full p-4 text-lg border-2 border-purple-200 focus:border-purple-400"
                  />
                </div>

                {!showResult && !isGrading && (
                  <Button
                    onClick={handleSubmitTypedAnswer}
                    disabled={!typedAnswer.trim()}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    답안 제출
                  </Button>
                )}

                {/* 채점 중 표시 */}
                {isGrading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center gap-3 p-6 bg-purple-100 rounded-lg"
                  >
                    <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                    <span className="text-purple-800">채점 중...</span>
                  </motion.div>
                )}

                {/* 정답 표시 (실기) */}
                {showResult && (
                  <div className={`p-4 rounded-lg border-2 ${
                    isCorrect ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className={isCorrect ? "text-green-900" : "text-red-900"}>
                        {isCorrect ? "정답입니다!" : "오답입니다!"}
                      </span>
                    </div>
                    {!isCorrect && (
                      <p className="text-gray-700">
                        정답: <span className="text-green-700">{currentQuestion.correctAnswer}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Explanation (해설) */}
          {showResult && !isGrading && (
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
                      {/* 실기만 AI 해설 태그 표시 */}
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
