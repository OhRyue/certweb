import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Input } from "../ui/input"
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Question } from "../../types";
import axios from "../api/axiosConfig";
import { getTagsByCodes } from "../api/tagApi";

interface ProblemPracticalProps {
  questions: Question[];
  topicName: string;
  topicId: number;
  sessionId?: number | null;
  learningSessionId?: number | null; // 난이도 퀴즈/약점 보완 퀴즈용
  isDifficultyQuiz?: boolean; // 난이도 퀴즈 여부 (하위 호환성 유지)
  quizType?: "category" | "difficulty" | "weakness" | null; // 퀴즈 타입 (우선순위 높음)
  onComplete: (score: number, answers: any[]) => void;
}

export function ProblemPractical({ 
  questions, 
  topicName, 
  topicId,
  sessionId,
  learningSessionId,
  isDifficultyQuiz = false,
  quizType = null,
  onComplete 
}: ProblemPracticalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [gradingResults, setGradingResults] = useState<Record<number, { answerKey: string; baseExplanation: string; aiExplanation: string; isCorrect: boolean; aiExplanationFailed?: boolean }>>({});
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

  // 실기 모드: 타이핑 답안 제출 처리 (즉시 채점)
  const handleSubmitTypedAnswer = async () => {
    if (showResult || !typedAnswer.trim() || isGrading) return;

    const questionId = Number(currentQuestion.id);
    const userText = typedAnswer.trim();

    setIsGrading(true);
    try {
      let res;
      
      // quizType이 있으면 우선 사용, 없으면 isDifficultyQuiz로 판단 (하위 호환성)
      const actualQuizType = quizType || (isDifficultyQuiz ? "difficulty" : null);
      
      if (actualQuizType && learningSessionId) {
        // 카테고리/난이도/약점 보완 퀴즈 실기 채점 API
        let gradeEndpoint = `/study/assist/practical/category/grade-one`;
        if (actualQuizType === "weakness") {
          gradeEndpoint = `/study/assist/practical/weakness/grade-one`;
        } else if (actualQuizType === "difficulty") {
          gradeEndpoint = `/study/assist/practical/difficulty/grade-one`;
        }
        
        res = await axios.post(
          gradeEndpoint,
          {
            questionId: questionId,
            userText: userText
          },
          {
            params: {
              learningSessionId: learningSessionId
            }
          }
        );
      } else {
        // 일반 실기 채점 API
        const config = sessionId
          ? { params: { sessionId } }
          : {}
        
        res = await axios.post(
          `/study/practical/grade-one`,
          {
            topicId: topicId,
            questionId: questionId,
            userText: userText
          },
          config
        );
      }

      // 채점 결과 처리
      const gradingData = res.data;
      const isCorrect = gradingData.correct || false; // correct 필드로 정답 여부 확인
      // 난이도 퀴즈는 aiFailed, 일반은 aiExplanationFailed
      const aiExplanationFailed = gradingData.aiFailed !== undefined 
        ? gradingData.aiFailed 
        : (gradingData.aiExplanationFailed || false);

      // 채점 결과 저장
      const gradingResult = {
        answerKey: gradingData.answerKey || "",
        baseExplanation: gradingData.baseExplanation || "",
        aiExplanation: gradingData.aiExplanation || "",
        isCorrect,
        aiExplanationFailed
      };

      setGradingResults(prev => ({
        ...prev,
        [questionId]: gradingResult
      }));

      // 점수 업데이트
      if (isCorrect) {
        setScore(prev => prev + 1);
      }

      // answers 배열에 추가 (onComplete에 전달할 형식)
      const answerData = {
        questionId: questionId,
        selectedAnswer: userText,
        isCorrect: isCorrect,
        timeSpent: 0,
        explanation: gradingData.aiExplanation || gradingData.baseExplanation || ""
      };

      setAnswers(prev => [...prev, answerData]);
      setIsGrading(false);
      setShowResult(true);
    } catch (err) {
      console.error("실기 채점 API 오류:", err);
      setIsGrading(false);
      // 에러 발생 시 기본 처리
      const answerData = {
        questionId: questionId,
        selectedAnswer: userText,
        isCorrect: false,
        timeSpent: 0,
        explanation: ""
      };
      setAnswers(prev => [...prev, answerData]);
      setShowResult(true);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setTypedAnswer("");
      setShowResult(false);
    } else {
      // 모든 문제를 다 풀었을 때 onComplete 호출
      onComplete(score, answers);
    }
  };

  // 실기 모드: 채점 결과에서 정답 여부 확인
  const currentGradingResult = gradingResults[Number(currentQuestion.id)];
  const isCorrect = currentGradingResult?.isCorrect || false;

  // 퀴즈 타입에 따른 제목과 설명 설정
  const getQuizTitle = () => {
    if (quizType === "category") return "카테고리 퀴즈";
    if (quizType === "difficulty") return "난이도별 퀴즈";
    if (quizType === "weakness") return "약점 보완 퀴즈";
    return "Micro 문제풀이"; // 기본값 (하위 호환성)
  };

  const getQuizDescription = () => {
    if (quizType === "category") return "공부하고 싶은 토픽을 선택해서 공부해요!";
    if (quizType === "difficulty") return "공부하고 싶은 난이도를 선택해서 공부해요!";
    if (quizType === "weakness") return "내가 약한 부분을 위주로 공부해요!";
    return "답을 직접 입력하여 문제를 풀어보세요!"; // 기본값 (하위 호환성)
  };

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
            <h1 className="text-purple-900">{getQuizTitle()}</h1>
          </div>
          <p className="text-gray-600 mt-2">
            {getQuizDescription()}
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

            <div className="text-purple-900 mb-6 prose prose-sm max-w-none overflow-x-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentQuestion.question}
              </ReactMarkdown>
            </div>

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
                {/* SHORT 문제만 사용 (Input) */}
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

              {/* 채점 결과 표시 */}
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
                  {!isCorrect && currentGradingResult.answerKey && (
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <p className="text-sm text-gray-600 mb-1">정답:</p>
                      <p className="text-gray-900 whitespace-pre-wrap">{currentGradingResult.answerKey}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Explanation (해설) */}
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
                      {!currentGradingResult.aiExplanationFailed && currentGradingResult.aiExplanation && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI 해설
                        </Badge>
                      )}
                    </div>
                    <div className="text-gray-700 prose prose-sm max-w-none overflow-x-auto">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {currentGradingResult.aiExplanationFailed
                          ? (currentGradingResult.baseExplanation || currentQuestion.explanation || "해설이 없습니다.")
                          : (currentGradingResult.aiExplanation || currentGradingResult.baseExplanation || currentQuestion.explanation || "해설이 없습니다.")}
                      </ReactMarkdown>
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

