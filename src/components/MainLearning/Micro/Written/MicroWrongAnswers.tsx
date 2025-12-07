import { useState, useEffect, useRef } from "react";
import { Card } from "../../../ui/card";
import { Button } from "../../../ui/button";
import { Badge } from "../../../ui/badge";
import { motion } from "motion/react";
import { XCircle, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, BookOpen } from "lucide-react";
import axios from "../../../api/axiosConfig";
import type { Question } from "../../../../types";

interface WrongAnswer {
  questionId: number;
  userAnswer: string; // "A", "B", "O", "X" 또는 실기 답안 텍스트
  correctAnswer: string; // "A", "B", "O", "X" 또는 빈 문자열 (실기)
  explanation?: string; // 해설 (baseExplanation 또는 aiExplanation)
  text?: string; // 문제 본문 (실기 모드에서 사용)
  imageUrl?: string | null; // 문제 이미지 (실기 모드에서 사용)
  type?: string; // 문제 유형 (SHORT 타입만 사용, 실기 모드에서 사용)
  score?: number; // 채점 점수 (실기 모드에서 사용)
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
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isPractical = examType === "practical";
  // onContinue를 useRef로 안정적인 참조 유지
  const onContinueRef = useRef(onContinue);
  
  // onContinue가 변경될 때마다 ref 업데이트
  useEffect(() => {
    onContinueRef.current = onContinue;
  }, [onContinue]);
  
  const currentWrong = wrongAnswers[currentIndex];

  // 현재 문제의 상세 정보를 API로 받아오기 (필기 모드만)
  // 실기 모드는 오답 목록에 이미 모든 정보가 포함되어 있음
  useEffect(() => {
    if (wrongAnswers.length === 0) {
      onContinueRef.current();
      return;
    }

    // 실기 모드: 오답 목록에서 직접 정보 사용
    if (isPractical && currentWrong) {
      const question: Question = {
        id: String(currentWrong.questionId),
        topicId: "",
        tags: [],
        difficulty: "medium",
        type: "typing",
        examType: "practical",
        question: currentWrong.text || "",
        options: [],
        correctAnswer: currentWrong.correctAnswer || "",
        explanation: currentWrong.explanation || "",
        imageUrl: currentWrong.imageUrl || null
      };
      setCurrentQuestion(question);
      setLoading(false);
      return;
    }

    // 필기 모드: API로 문제 상세 정보 가져오기
    const fetchQuestion = async () => {
      if (!currentWrong) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const res = await axios.get(`/study/written/question/${currentWrong.questionId}`);
        const data = res.data;
        
        // API 응답을 Question 형태로 변환
        const options = (data.choices || []).map((choice: any) => ({
          label: choice.label || "",
          text: choice.content || choice.text || ""
        }));
        
        const question: Question = {
          id: String(data.questionId),
          topicId: "",
          tags: [],
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
  }, [currentIndex, currentWrong?.questionId, wrongAnswers.length, isPractical]);

  if (wrongAnswers.length === 0) {
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
                    {currentQuestion.options && currentQuestion.options.length > 0 ? (
                      currentQuestion.options.map((option, index) => {
                      // 라벨로 비교 (A, B, C, D 또는 O, X)
                      // option은 { label, text } 형태의 객체이거나 string일 수 있음
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
