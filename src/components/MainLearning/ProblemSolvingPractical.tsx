import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Input } from "../ui/input";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import type { Question } from "../../types";
import axios from "../api/axiosConfig";

interface ProblemSolvingPracticalProps {
  questions: Question[];
  topicName: string;
  topicId: number;
  onComplete: (score: number, answers: any[]) => void;
}

export function ProblemSolvingPractical({ 
  questions, 
  topicName, 
  topicId,
  onComplete 
}: ProblemSolvingPracticalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [practicalAnswers, setPracticalAnswers] = useState<Array<{ questionId: number; userText: string }>>([]);
  const [gradingResults, setGradingResults] = useState<Record<number, { score: number; baseExplanation: string; aiExplanation: string; isCorrect: boolean }>>({});

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  // 실기 모드: 타이핑 답안 제출 처리
  const handleSubmitTypedAnswer = async () => {
    if (showResult || !typedAnswer.trim() || isGrading) return;

    const questionId = Number(currentQuestion.id);
    const userText = typedAnswer.trim();

    // 답안 저장
    const newAnswer = { questionId, userText };
    const updatedAnswers = [...practicalAnswers, newAnswer];
    setPracticalAnswers(updatedAnswers);

    // 마지막 문제인지 확인
    const isLastQuestion = currentIndex === questions.length - 1;

    if (isLastQuestion) {
      // 마지막 문제: 모든 답안을 한 번에 채점 API로 제출
      setIsGrading(true);
      try {
        const res = await axios.post(`/study/practical/submit`, {
          topicId: topicId,
          answers: updatedAnswers
        });

        // 채점 결과 저장
        const results: Record<number, { score: number; baseExplanation: string; aiExplanation: string; isCorrect: boolean }> = {};
        let totalScore = 0;

        res.data.payload.items.forEach((item: any) => {
          const isCorrect = item.score > 0; // score > 0이면 정답으로 간주
          results[item.questionId] = {
            score: item.score,
            baseExplanation: item.baseExplanation || "",
            aiExplanation: item.aiExplanation || "",
            isCorrect
          };
          if (isCorrect) totalScore++;
        });

        setGradingResults(results);
        setScore(totalScore);

        // answers 배열 생성 (onComplete에 전달할 형식)
        const finalAnswers = updatedAnswers.map(answer => {
          const result = results[answer.questionId];
          return {
            questionId: answer.questionId,
            selectedAnswer: answer.userText,
            isCorrect: result?.isCorrect || false,
            timeSpent: 0,
            explanation: result?.aiExplanation || result?.baseExplanation || "",
            score: result?.score || 0
          };
        });

        setAnswers(finalAnswers);
        setIsGrading(false);
        setShowResult(true);
      } catch (err) {
        console.error("실기 채점 API 오류:", err);
        setIsGrading(false);
        // 에러 발생 시 기본 처리
        setShowResult(true);
        setAnswers(updatedAnswers.map(answer => ({
          questionId: answer.questionId,
          selectedAnswer: answer.userText,
          isCorrect: false,
          timeSpent: 0,
          explanation: "",
          score: 0
        })));
      }
    } else {
      // 중간 문제: 답안만 저장하고 다음 문제로
      setShowResult(true);
      setAnswers([...answers, {
        questionId: currentQuestion.id,
        selectedAnswer: typedAnswer,
        isCorrect: false, // 채점 전이므로 임시로 false
        timeSpent: 0,
      }]);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setTypedAnswer("");
      setShowResult(false);
    } else {
      // 실기 모드이고 채점이 완료된 경우에만 onComplete 호출
      if (Object.keys(gradingResults).length > 0) {
        onComplete(score, answers);
      }
    }
  };

  // 실기 모드: 채점 결과에서 정답 여부 확인
  const currentGradingResult = gradingResults[Number(currentQuestion.id)];
  const isCorrect = currentGradingResult?.isCorrect || false;

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-purple-500 text-white">{topicName}</Badge>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              실기
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-purple-900">Micro 문제풀이</h1>
          </div>
          <p className="text-gray-600 mt-2">
            답을 직접 입력하여 문제를 풀어보세요!
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

            {/* 이미지가 있는 경우 표시 */}
            {currentQuestion.imageUrl && (
              <div className="mb-6">
                <img 
                  src={currentQuestion.imageUrl} 
                  alt="문제 이미지" 
                  className="max-w-full h-auto rounded-lg border-2 border-purple-200"
                />
              </div>
            )}

            {/* 실기 모드: 타이핑 입력 */}
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
                  {currentIndex === questions.length - 1 ? "모든 답안 제출 및 채점" : "답안 저장"}
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

              {/* 중간 문제: 답안 저장 완료 표시 */}
              {showResult && !currentGradingResult && currentIndex < questions.length - 1 && (
                <div className="p-4 rounded-lg border-2 bg-blue-50 border-blue-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-900">답안이 저장되었습니다. 다음 문제로 진행하세요.</span>
                  </div>
                </div>
              )}

              {/* 마지막 문제: 채점 결과 표시 */}
              {showResult && currentGradingResult && (
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
                  {currentGradingResult.score > 0 && (
                    <p className="text-gray-700">
                      점수: <span className="text-purple-700 font-semibold">{currentGradingResult.score}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Explanation (해설) - 마지막 문제에서만 표시 */}
          {showResult && !isGrading && currentGradingResult && (
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
                    <p className="text-gray-700">
                      {currentGradingResult.aiExplanation || currentGradingResult.baseExplanation || currentQuestion.explanation}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={handleNext}
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  오답 보기
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* 중간 문제: 다음 문제로 버튼 */}
          {showResult && !currentGradingResult && currentIndex < questions.length - 1 && (
            <div className="flex justify-end">
              <Button
                onClick={handleNext}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                다음 문제
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

