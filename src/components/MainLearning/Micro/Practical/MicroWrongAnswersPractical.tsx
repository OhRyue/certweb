import { useState, useEffect, useRef } from "react";
import { Card } from "../../../ui/card";
import { Button } from "../../../ui/button";
import { Badge } from "../../../ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "../../../ui/popover";
import { motion } from "motion/react";
import { XCircle, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, BookOpen } from "lucide-react";
import axios from "../../../api/axiosConfig";
import { getTagsByCodes } from "../../../api/tagApi";

interface PracticalWrongAnswer {
  questionId: number;
  type: string; // SHORT 타입만 사용
  text: string; // 문제 본문
  myAnswer: string; // 내가 입력한 답
  correctAnswer: string; // 정답 (호환성을 위해 유지)
  answerKey?: string; // 정답 (answer_key, 우선 사용)
  baseExplanation: string;
  imageUrl?: string | null;
  aiExplanation: string;
  aiExplanationFailed?: boolean; // AI 해설 생성 실패 여부
  tags?: Array<{ code: string; labelKo: string; labelEn?: string; description?: string; domain: string; orderNo: number }> | string[];
}

interface MicroWrongAnswersPracticalProps {
  sessionId: number | null;
  learningSessionId: number | null;
  topicName: string;
  onContinue: () => void;
  wrongAnswers?: PracticalWrongAnswer[]; // props로 전달된 경우 API 호출 스킵
}

export function MicroWrongAnswersPractical({ 
  sessionId,
  learningSessionId,
  topicName, 
  onContinue,
  wrongAnswers: propWrongAnswers
}: MicroWrongAnswersPracticalProps) {
  const [wrongAnswers, setWrongAnswers] = useState<PracticalWrongAnswer[]>(propWrongAnswers || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(!propWrongAnswers); // props로 전달되면 로딩 불필요
  const [error, setError] = useState<string | null>(null);
  const [wrongAnswersLoaded, setWrongAnswersLoaded] = useState(false); // 오답 목록 로딩 완료 여부
  const [tagDescriptions, setTagDescriptions] = useState<Record<string, string>>({});
  const onContinueRef = useRef(onContinue);
  
  useEffect(() => {
    onContinueRef.current = onContinue;
  }, [onContinue]);

  // props로 wrongAnswers가 전달되면 API 호출 스킵
  useEffect(() => {
    if (propWrongAnswers && propWrongAnswers.length > 0) {
      setWrongAnswers(propWrongAnswers);
      setLoading(false);
      setWrongAnswersLoaded(true);
      return;
    }
  }, [propWrongAnswers]);

  // 실기 모드: API로 오답 목록 가져오기 (props로 전달되지 않은 경우만)
  useEffect(() => {
    // props로 데이터가 전달되면 API 호출 스킵
    if (propWrongAnswers && propWrongAnswers.length > 0) {
      setLoading(false);
      setWrongAnswersLoaded(true);
      return;
    }

    const fetchWrongAnswers = async () => {
      // learningSessionId가 없으면 (review 모드 등) 다음 단계로 진행
      if (!learningSessionId) {
        setLoading(false);
        setWrongAnswersLoaded(true);
        onContinueRef.current();
        return;
      }

      if (!sessionId) {
        setError("세션 ID가 없습니다");
        setLoading(false);
        setWrongAnswersLoaded(true);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // 백엔드가 오답 존재 여부를 자동으로 처리하므로 바로 API 호출
        const res = await axios.get(`/study/wrong/practical/learning-session`, {
          params: { 
            learningSessionId: learningSessionId
          }
        });
        
        const items = res.data.items || [];
        
        // 오답 목록 로딩 완료 표시
        setWrongAnswersLoaded(true);
        
        // 오답이 없으면 다음 단계로 진행 (로딩 완료 후)
        if (items.length === 0) {
          setLoading(false);
          onContinueRef.current();
          return;
        }
        
        // myAnswer가 JSON 문자열인 경우 파싱하여 answer 값만 추출
        const processedItems = items.map((item: {
          questionId: number;
          myAnswer: string;
          correctAnswer?: string;
          answerKey?: string; // answer_key 필드 추가
          aiExplanation?: string;
          baseExplanation?: string;
          text?: string;
          imageUrl?: string | null;
          type?: string | null;
          aiExplanationFailed?: boolean; // AI 해설 생성 실패 여부
        }) => {
          let parsedAnswer = item.myAnswer || "";
          
          // JSON 문자열인 경우 파싱
          if (typeof item.myAnswer === "string" && item.myAnswer.trim().startsWith("{")) {
            try {
              const parsed = JSON.parse(item.myAnswer);
              parsedAnswer = parsed.answer || item.myAnswer;
            } catch {
              // JSON 파싱 실패 시 원본 문자열 사용
              parsedAnswer = item.myAnswer;
            }
          }
          
          return {
            ...item,
            myAnswer: parsedAnswer,
            // answerKey가 있으면 우선 사용, 없으면 correctAnswer 사용
            correctAnswer: item.answerKey || item.correctAnswer || "",
            tags: item.tags || [] // 태그 포함
          };
        });
        
        setWrongAnswers(processedItems);
      } catch (err: unknown) {
        console.error("오답 목록 불러오기 실패:", err);
        const errorMessage = err && typeof err === 'object' && 'response' in err && 
          typeof err.response === 'object' && err.response !== null && 'data' in err.response &&
          typeof err.response.data === 'object' && err.response.data !== null && 'message' in err.response.data
          ? String(err.response.data.message)
          : "오답 목록을 불러오는 중 오류가 발생했습니다";
        setError(errorMessage);
        setWrongAnswersLoaded(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWrongAnswers();
  }, [sessionId, learningSessionId, propWrongAnswers]);

  if (loading) {
    return (
      <div className="p-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-2">오답 목록을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-2">{error}</div>
        </div>
      </div>
    );
  }

  // 오답이 없고 로딩이 완료된 경우에만 null 반환
  if (wrongAnswers.length === 0 && wrongAnswersLoaded) {
    return null;
  }

  const currentWrong = wrongAnswers[currentIndex];

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
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              실기
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
                {/* 태그 뱃지 */}
                {currentWrong.tags && currentWrong.tags.length > 0 && (
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {currentWrong.tags.map((tag, index) => {
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

                <h2 className="text-red-900 mb-6">{currentWrong.text}</h2>

                {/* 이미지가 있는 경우 표시 */}
                {currentWrong.imageUrl && (
                  <div className="mb-6">
                    <img 
                      src={currentWrong.imageUrl} 
                      alt="문제 이미지" 
                      className="max-w-full h-auto rounded-lg border-2 border-red-200"
                    />
                  </div>
                )}

                {/* 실기 모드: 타이핑 답안 */}
                <div className="space-y-4">
                  {/* 내가 입력한 답 */}
                  <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="text-red-900">내가 입력한 답</span>
                    </div>
                    <p className="text-red-700 ml-7 whitespace-pre-wrap">{currentWrong.myAnswer}</p>
                  </div>

                  {/* 정답 */}
                  <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-green-900">정답</span>
                    </div>
                    <p className="text-green-700 ml-7 whitespace-pre-wrap">
                      {currentWrong.answerKey || currentWrong.correctAnswer || "정답 정보가 없습니다."}
                    </p>
                  </div>
                </div>
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
                  {!currentWrong.aiExplanationFailed && currentWrong.aiExplanation && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI 해설
                    </Badge>
                  )}
                </div>
                <p className="text-gray-700">
                  {currentWrong.aiExplanationFailed
                    ? (currentWrong.baseExplanation || "해설이 없습니다.")
                    : (currentWrong.aiExplanation || currentWrong.baseExplanation || "해설이 없습니다.")}
                </p>
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

