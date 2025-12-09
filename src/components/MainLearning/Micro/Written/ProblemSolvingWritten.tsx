import { useState, useEffect } from "react";
import { Card } from "../../../ui/card";
import { Button } from "../../../ui/button";
import { Badge } from "../../../ui/badge";
import { Progress } from "../../../ui/progress";
import { Popover, PopoverTrigger, PopoverContent } from "../../../ui/popover";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, ArrowRight, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Question } from "../../../../types";
import { getTagsByCodes, type TagInfo } from "../../../api/tagApi";

interface ProblemSolvingWrittenProps {
  questions: Question[];
  topicName: string;
  topicId: number;
  userId: string;
  onSubmitOne: (params: { questionId: number; label: string }) => Promise<any>;
  onComplete: (score: number, answers: any[]) => void;
}

export function ProblemSolvingWritten({ 
  questions, 
  topicName, 
  topicId,
  userId,
  onSubmitOne,
  onComplete 
}: ProblemSolvingWrittenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagDescriptions, setTagDescriptions] = useState<Record<string, string>>({});

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  // 태그 설명 로드
  useEffect(() => {
    const loadTagDescriptions = async () => {
      if (!currentQuestion?.tags || currentQuestion.tags.length === 0) return;

      // 태그 코드 추출
      const tagCodes = currentQuestion.tags
        .map(tag => typeof tag === 'object' && tag !== null && 'code' in tag ? tag.code : null)
        .filter((code): code is string => code !== null);

      if (tagCodes.length === 0) return;

      // 이미 로드된 태그는 스킵
      const missingCodes = tagCodes.filter(code => !tagDescriptions[code]);
      if (missingCodes.length === 0) return;

      try {
        const tags = await getTagsByCodes(missingCodes);
        const newDescriptions: Record<string, string> = {};
        tags.forEach(tag => {
          if (tag.description) {
            newDescriptions[tag.code] = tag.description;
          }
        });
        setTagDescriptions(prev => ({ ...prev, ...newDescriptions }));
      } catch (err) {
        console.error("태그 설명 로드 실패:", err);
      }
    };

    loadTagDescriptions();
  }, [currentQuestion?.tags, currentIndex]);

  // 필기 모드: 선택형 답안 처리
  const handleAnswer = async (answerIndex: number) => {
    if (showResult || isSubmitting) return;

    setSelectedAnswer(answerIndex);
    setIsSubmitting(true);

    try {
      // grade-one API 호출
      const option = currentQuestion.options[answerIndex];
      const label = typeof option === 'object' ? option.label : String.fromCharCode(65 + answerIndex); // A, B, C, D
      
      const result = await onSubmitOne({
        questionId: Number(currentQuestion.id),
        label
      });

      // 채점 결과 처리
      // API 응답이 직접 { correct, correctLabel, explanation, aiExplanation } 형태
      const isCorrect = result.correct || false;

      if (isCorrect) {
        setScore(score + 1);
      }

      setAnswers([...answers, {
        questionId: currentQuestion.id,
        selectedAnswer: answerIndex,
        isCorrect,
        timeSpent: 0,
        explanation: result.explanation || "", // explanation 필드 사용 (aiExplanation은 사용하지 않음)
        correctLabel: result.correctLabel || label
      }]);

      setShowResult(true);
    } catch (err) {
      console.error("채점 API 오류:", err);
      // 에러 발생 시 기본 처리
      setAnswers([...answers, {
        questionId: currentQuestion.id,
        selectedAnswer: answerIndex,
        isCorrect: false,
        timeSpent: 0,
        explanation: "",
      }]);
      setShowResult(true);
    } finally {
      setIsSubmitting(false);
    }
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

  const currentAnswer = answers.find(a => a.questionId === currentQuestion.id);
  const isCorrect = currentAnswer?.isCorrect || false;
  const correctAnswerIndex = currentAnswer?.correctLabel 
    ? currentQuestion.options.findIndex((opt: any) => 
        (typeof opt === 'object' ? opt.label : String.fromCharCode(65 + currentQuestion.options.indexOf(opt))) === currentAnswer.correctLabel
      )
    : null;

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-purple-500 text-white">{topicName}</Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              필기
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-purple-900">Micro 문제풀이</h1>
          </div>
          <p className="text-gray-600 mt-2">
            실전 문제로 실력을 다져보세요!
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
            {/* 태그 뱃지 */}
            {currentQuestion.tags && currentQuestion.tags.length > 0 && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {currentQuestion.tags.map((tag, index) => {
                  const tagLabel = typeof tag === 'object' && tag !== null && 'labelKo' in tag 
                    ? tag.labelKo 
                    : typeof tag === 'string' 
                      ? tag 
                      : '';
                  const tagCode = typeof tag === 'object' && tag !== null && 'code' in tag 
                    ? tag.code 
                    : null;
                  const tagKey = tagCode || String(index);
                  const description = tagCode ? tagDescriptions[tagCode] : null;
                  
                  if (!tagLabel) return null;
                  
                  return (
                    <Badge 
                      key={tagKey} 
                      variant="outline" 
                      className="bg-blue-50 text-blue-700 border-blue-300 flex items-center gap-1"
                    >
                      {tagLabel}
                      {tagCode && description && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="ml-1 cursor-pointer hover:text-blue-900 transition-colors text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              ⓘ
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-3 text-sm">
                            <div className="font-semibold mb-1 text-blue-900">{tagLabel}</div>
                            <div className="text-gray-700">{description}</div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </Badge>
                  );
                })}
              </div>
            )}

            <h2 className="text-purple-900 mb-6">{currentQuestion.question}</h2>

            {/* 필기 모드: 선택형 */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const optionLabel = typeof option === 'object' ? option.label : String.fromCharCode(65 + index);
                const optionText = typeof option === 'object' ? option.text : option;
                const isSelected = selectedAnswer === index;
                const isCorrectAnswer = correctAnswerIndex !== null ? index === correctAnswerIndex : false;

                let buttonClass = "w-full p-4 text-left border-2 transition-all";

                if (!showResult && !isSubmitting) {
                  buttonClass += " hover:border-purple-400 hover:bg-white/60 cursor-pointer";
                } else if (isSubmitting && isSelected) {
                  // 제출 중일 때는 로딩 상태 표시 (색상 없이)
                  buttonClass += " border-purple-300 bg-purple-50";
                } else if (showResult && isCorrectAnswer) {
                  // 정답인 경우 초록색 표시 (showResult가 true일 때만)
                  buttonClass += " border-green-400 bg-green-50";
                } else if (showResult && isSelected && !isCorrect) {
                  // 오답인 경우 빨간색 표시 (showResult가 true일 때만)
                  buttonClass += " border-red-400 bg-red-50";
                } else {
                  buttonClass += " opacity-50";
                }

                return (
                  <motion.button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    className={buttonClass}
                    disabled={showResult || isSubmitting}
                    whileHover={!showResult && !isSubmitting ? { scale: 1.02 } : {}}
                    whileTap={!showResult && !isSubmitting ? { scale: 0.98 } : {}}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                          {optionLabel}
                        </div>
                        <span>{optionText}</span>
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

          {/* Explanation (해설) */}
          {showResult && !isSubmitting && (
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
                    </div>
                    <div className="text-gray-700 prose prose-sm max-w-none">
                      <ReactMarkdown>{currentAnswer?.explanation || currentQuestion.explanation || ""}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={handleNext}
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  {currentIndex < questions.length - 1 ? "다음 문제" : "오답 보기"}
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

