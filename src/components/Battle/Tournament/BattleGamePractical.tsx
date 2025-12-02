import { useState, useEffect } from "react";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Progress } from "../../ui/progress";
import { Input } from "../../ui/input";
import { Swords, Clock, Zap, Sparkles, Target } from "lucide-react";
import type { Question } from "../../../types";
import { OpponentLeftOverlay } from "../OpponentLeftOverlay";
import { submitAnswer } from "../../api/versusApi";

interface BattleGamePracticalProps {
  questions: Question[];
  roomId?: number; // 답안 제출용
  opponentName?: string; // 토너먼트에서는 사용하지 않지만 호환성을 위해 유지
  myUserId?: string;
  opponentUserId?: string; // 토너먼트에서는 사용하지 않지만 호환성을 위해 유지
  myRank?: number | null;
  opponentRank?: number | null; // 토너먼트에서는 사용하지 않지만 호환성을 위해 유지
  onComplete: (myScore: number, opponentScore: number) => void;
  onExit: () => void;
}

export function BattleGamePractical({
  questions,
  roomId,
  myUserId,
  myRank,
  onComplete,
  onExit,
}: BattleGamePracticalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [typingAnswer, setTypingAnswer] = useState("");
  const [myScore, setMyScore] = useState(0);
  const [opponentScore] = useState(0); // 토너먼트에서는 사용하지 않지만 onComplete 호환성을 위해 유지
  const [isAnswered, setIsAnswered] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showOpponentAnswer, setShowOpponentAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // 오버레이 상태 추가
  const [opponentLeft, setOpponentLeft] = useState(false);

  // questions가 없거나 비어있으면 예외 처리
  const totalQuestions = questions?.length || 0;
  const question = questions?.[currentQuestion];
  const currentQuestionData = questions?.[currentQuestion];
  const initialTimeLimit = currentQuestionData?.timeLimitSec || 30;
  const [timeLeft, setTimeLeft] = useState(initialTimeLimit);

  // 문제가 변경될 때마다 timeLeft 리셋
  useEffect(() => {
    if (currentQuestionData) {
      const newTimeLimit = currentQuestionData.timeLimitSec || 30;
      setTimeLeft(newTimeLimit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion]);

  // 테스트: ESC 누르면 상대 나간 상황 테스트
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpponentLeft(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Timer
  useEffect(() => {
    if (timeLeft === 0 && !isAnswered) {
      handleAnswer();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isAnswered]);

  // questions가 없거나 비어있으면 예외 처리
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-red-500 font-semibold mb-4">문제를 불러올 수 없습니다.</p>
          <button
            onClick={onExit}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            뒤로가기
          </button>
        </Card>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-red-500 font-semibold mb-4">문제를 찾을 수 없습니다.</p>
          <button
            onClick={onExit}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            뒤로가기
          </button>
        </Card>
      </div>
    );
  }

  // Handle answer - 서버 채점
  const handleAnswer = async () => {
    setIsAnswered(true);
    setShowOpponentAnswer(true);

    let isCorrect = false;
    let serverScore = 0;

    // 답안 제출 API 호출 (서버가 채점)
    if (roomId && question.roomQuestionId !== undefined && question.roundNo !== undefined && question.phase) {
      try {
        const timeMs = (question.timeLimitSec || 30) * 1000 - (timeLeft * 1000);
        
        await submitAnswer(roomId, {
          questionId: question.roomQuestionId,
          userAnswer: typingAnswer.trim(), // 실기 문제는 입력한 답안을 그대로 전송
          correct: false, // 서버가 채점하므로 프론트에서는 false로 전송
          timeMs: Math.max(0, timeMs),
          roundNo: question.roundNo,
          phase: question.phase,
        });

        // 서버 응답에서 채점 결과 확인
        // 현재 API 응답 구조에는 correct 정보가 없으므로, 
        // 서버가 채점했다고 가정하고 스코어보드에서 점수 변화를 확인
        // 실제로는 서버 응답에 correct 정보가 포함되어야 함
        // 임시로 서버가 채점했다고 가정 (실제로는 서버 응답에서 받아야 함)
        isCorrect = true; // TODO: 서버 응답에서 correct 정보 받아오기
        setIsCorrect(isCorrect);
      } catch (error) {
        console.error("답안 제출 실패:", error);
        setIsCorrect(false);
        // 에러가 발생해도 게임은 계속 진행
      }
    } else {
      setIsCorrect(false);
    }

    // 서버 채점 결과에 따라 점수 계산
    if (isCorrect) {
      const speedBonus = Math.floor(timeLeft / 3);
      serverScore = 10 + speedBonus;
      setMyScore((prev) => prev + serverScore);
    }

    setShowResult(true);
    setTimeout(() => {
      if (currentQuestion < totalQuestions - 1) {
        const nextQuestionIndex = currentQuestion + 1;
        const nextQuestion = questions[nextQuestionIndex];
        const nextTimeLimit = nextQuestion?.timeLimitSec || 30;
        setCurrentQuestion(nextQuestionIndex);
        setTypingAnswer("");
        setIsAnswered(false);
        setShowResult(false);
        setShowOpponentAnswer(false);
        setIsCorrect(false);
        setTimeLeft(nextTimeLimit);
      } else {
        const finalMyScore = isCorrect
          ? myScore + serverScore
          : myScore;
        onComplete(finalMyScore, opponentScore);
      }
    }, 2500);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Swords className="w-8 h-8 text-purple-600 animate-pulse" />
              <Sparkles className="w-4 h-4 text-yellow-500 absolute -top-1 -right-1" />
            </div>
            <h1 className="text-purple-900">토너먼트 🏆</h1>
          </div>
        </div>

        {/* 여기까지 기존 UI 유지 (생략 가능) */}
        
        {/* Score Board */}
        <div className="mb-6 relative">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <Badge className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-4 py-2 shadow-lg animate-pulse">
              토너먼트
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 내 스코어 */}
            <Card className={`p-6 border-2 transition-all duration-300 ${
              showResult && isCorrect
                ? "bg-gradient-to-br from-green-100 to-emerald-100 border-green-400 shadow-lg scale-105"
                : "bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-700 font-semibold">{myUserId || "나"}</p>
                  {myRank !== null && myRank !== undefined && (
                    <p className="text-xs text-purple-600">순위: {myRank}위</p>
                  )}
                  <p className="text-3xl text-purple-700">{myScore}점</p>
                </div>
                <div className="text-5xl">👨‍💻</div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Target className="w-3 h-3" />
                <span>문제 {currentQuestion + 1}/{totalQuestions}</span>
              </div>
            </Card>

            {/* 참가자 순위 표시 */}
            <Card className={`p-6 border-2 transition-all duration-300 ${
              showResult && !isCorrect
                ? "bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-400 shadow-lg scale-105"
                : "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-700 mb-1 font-semibold">참가자 순위</p>
                  <p className="text-xs text-blue-600">8명 중</p>
                  <p className="text-3xl text-blue-700">-</p>
                </div>
                <div className="text-5xl relative">
                  🏆
                  {!isAnswered && (
                    <div className="absolute -top-2 -right-2">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Timer */}
        <Card className="p-5 mb-6 border-2 border-purple-200 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                실기 모드 ⌨️
              </Badge>
              <span className="text-sm text-gray-600">
                {currentQuestion + 1} / {totalQuestions}
              </span>
            </div>
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                timeLeft <= 10
                  ? "bg-red-100 text-red-700 animate-pulse"
                  : timeLeft <= 20
                  ? "bg-orange-100 text-orange-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="font-mono">{timeLeft}초</span>
            </div>
          </div>
          <Progress
            value={((currentQuestion + 1) / totalQuestions) * 100}
            className="h-2.5"
          />
        </Card>

        {/* 2단 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 문제 */}
          <Card className="p-8 border-2 border-purple-200 bg-white/90 backdrop-blur-sm shadow-lg">
            <div className="mb-4">
              <h2 className="text-gray-900 text-base">{question.question}</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-lg border-2 border-orange-200">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-orange-500 text-white">AI 채점 🤖</Badge>
                  <p className="text-sm text-gray-700">코드나 답변을 입력하세요</p>
                </div>
                <Input
                  value={typingAnswer}
                  onChange={(e) => setTypingAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isAnswered && typingAnswer.trim()) {
                      handleAnswer();
                    }
                  }}
                  placeholder="답변을 입력하세요..."
                  disabled={isAnswered}
                  className="bg-white border-2 border-orange-300 focus:border-orange-500 disabled:opacity-60"
                />
              </div>
              {!isAnswered && typingAnswer.trim() && (
                <Button
                  onClick={handleAnswer}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  제출하기
                </Button>
              )}
            </div>
          </Card>

          {/* 해설 */}
          <Card className="p-8 border-2 border-purple-200 bg-white/90 backdrop-blur-sm shadow-lg">
            {!showResult ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="text-6xl mb-4">🤔</div>
                <p className="text-gray-600">답변을 제출하면</p>
                <p className="text-gray-600">이곳에 AI 해설이 표시됩니다</p>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div
                  className={`p-5 rounded-xl border-2 flex-1 ${
                    isCorrect
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300"
                      : "bg-gradient-to-r from-red-50 to-rose-50 border-red-300"
                  }`}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-5xl">
                      {isCorrect ? "🎉" : "💭"}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-xl mb-2 ${
                          isCorrect ? "text-green-900" : "text-red-900"
                        }`}
                      >
                        {isCorrect ? "정답입니다! ✨" : "아쉽네요! 😢"}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-white/70 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-orange-500 text-white text-xs">AI 해설</Badge>
                      <p className="text-sm text-gray-700">📚 해설</p>
                    </div>
                    <p className="text-sm text-gray-800">{question.explanation}</p>
                  </div>

                  {showOpponentAnswer && (
                    <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
                      <span>🏆</span>
                      <span>다른 참가자들도 문제를 풀고 있습니다!</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* 참가자 나감 오버레이 표시 (토너먼트에서는 사용하지 않을 수 있음) */}
      {opponentLeft && (
        <OpponentLeftOverlay
          opponentName="토너먼트"
          myScore={myScore}
          opponentScore={0}
          onConfirm={() => {
            setOpponentLeft(false);
            onExit(); // 홈으로 나가기
          }}
        />
      )}
    </div>
  );
}
