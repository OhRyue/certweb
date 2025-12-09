import { useState, useEffect, useRef } from "react";
import { Card } from "../../../ui/card";
import { Button } from "../../../ui/button";
import { Badge } from "../../../ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "../../../ui/popover";
import { motion } from "motion/react";
import { XCircle, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import axios from "../../../api/axiosConfig";
import type { Question } from "../../../../types";
import { getTagsByCodes } from "../../../api/tagApi";

interface WrongAnswer {
  questionId: number;
  userAnswer: string; // "A", "B", "O", "X"
  correctAnswer?: string; // "A", "B", "O", "X"
  explanation?: string;
  text?: string;
  imageUrl?: string | null;
}

interface MicroWrongAnswersWrittenProps {
  sessionId: number | null;
  learningSessionId: number | null;
  topicName: string;
  onContinue: () => void;
  wrongAnswers?: WrongAnswer[]; // props로 전달된 경우 API 호출 스킵
}

export function MicroWrongAnswersWritten({ 
  sessionId,
  learningSessionId,
  topicName, 
  onContinue,
  wrongAnswers: propWrongAnswers
}: MicroWrongAnswersWrittenProps) {
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>(propWrongAnswers || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
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

  // 필기 모드: API로 오답 목록 가져오기 (props로 전달되지 않은 경우만)
  useEffect(() => {
    // props로 데이터가 전달되면 API 호출 스킵
    if (propWrongAnswers && propWrongAnswers.length > 0) {
      setLoading(false);
      setWrongAnswersLoaded(true);
      return;
    }

    const fetchWrongAnswers = async () => {
      // learningSessionId가 없으면 다음 단계로 진행
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
        const res = await axios.get(`/study/wrong/written/learning-session`, {
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
        
        // API 응답을 WrongAnswer 형태로 변환
        const processedItems: WrongAnswer[] = items.map((item: {
          questionId: number;
          myAnswer?: string;
          correctAnswer?: string;
          baseExplanation?: string;
          text?: string;
          imageUrl?: string | null;
        }) => ({
          questionId: item.questionId,
          userAnswer: item.myAnswer || "",
          correctAnswer: item.correctAnswer || "",
          explanation: item.baseExplanation || "", // 필기는 항상 baseExplanation 사용
          text: item.text || "",
          imageUrl: item.imageUrl || null
        }));
        
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
  
  const currentWrong = wrongAnswers[currentIndex];

  // 필기 모드: API로 문제 상세 정보 가져오기
  useEffect(() => {
    // 오답 목록이 로딩되지 않았거나 로딩 중이면 실행하지 않음
    if (!wrongAnswersLoaded || loading) return;
    
    // 오답이 없고 로딩이 완료된 경우에만 다음 단계로 진행
    if (wrongAnswers.length === 0) {
      onContinueRef.current();
      return;
    }

    // currentWrong이 없으면 실행하지 않음
    if (!currentWrong) return;

    const fetchQuestion = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const res = await axios.get(`/study/written/question/${currentWrong.questionId}`);
        const data = res.data;
        
        // API 응답을 Question 형태로 변환
        const options = (data.choices || []).map((choice: any) => ({
          label: choice.label || "",
          text: choice.text || ""
        }));
        
        const question: Question = {
          id: String(data.questionId),
          topicId: "",
          tags: data.tags || [], // API 응답의 태그 포함
          difficulty: "medium",
          type: data.type === "OX" ? "ox" : "multiple",
          examType: "written",
          question: data.stem,
          options: options,
          correctAnswer: data.correctAnswer,
          explanation: data.explanation || currentWrong.explanation || ""
        };
        
        setCurrentQuestion(question);
      } catch (err: any) {
        console.error("문제 상세 정보 불러오기 실패:", err);
        setError(err.response?.data?.message || "문제를 불러오는 중 오류가 발생했습니다");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [currentIndex, currentWrong?.questionId, wrongAnswers.length, wrongAnswersLoaded]);

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

  // 오답이 없고 로딩이 완료된 경우에만 null 반환
  if (wrongAnswers.length === 0 && wrongAnswersLoaded && !loading) {
    return null;
  }

  if (loading) {
    return (
      <div className="p-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-2">문제를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error || !currentQuestion) {
    return (
      <div className="p-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-2">{error || "문제를 불러올 수 없습니다"}</div>
        </div>
      </div>
    );
  }

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
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              필기
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
                {currentQuestion.tags && currentQuestion.tags.length > 0 && (
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
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

                <h2 className="text-red-900 mb-6">{currentQuestion.question}</h2>

                {/* 필기 모드: 선택형 */}
                <div className="space-y-3">
                  {currentQuestion.options && currentQuestion.options.length > 0 ? (
                    currentQuestion.options.map((option, index) => {
                      const optionObj = typeof option === 'object' && option !== null 
                        ? option as { label?: string; text?: string }
                        : null;
                      const optionLabel = optionObj?.label || String.fromCharCode(65 + index);
                      const optionText = optionObj?.text || (typeof option === 'string' ? option : "");
                      const isUserAnswer = currentWrong.userAnswer === optionLabel;
                      const isCorrectAnswer = currentQuestion.correctAnswer === optionLabel;

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
                                {optionLabel}
                              </div>
                              <span className={
                                isCorrectAnswer ? "text-green-900" :
                                isUserAnswer ? "text-red-900" :
                                "text-gray-600"
                              }>{optionText}</span>
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
                    })
                  ) : (
                    <div className="text-gray-500 text-center py-4">선택지 정보를 불러올 수 없습니다.</div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Explanation */}
          <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-blue-900 mb-2">해설</h3>
                <div className="text-gray-700 prose prose-sm max-w-none">
                  <ReactMarkdown>{currentQuestion.explanation || ""}</ReactMarkdown>
                </div>
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



