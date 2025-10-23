import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Bell, Clock, Users, Trophy, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface GoldenBellGameProps {
  sessionId: string;
  onComplete: (survived: boolean, rank: number) => void;
  onExit: () => void;
}

type RoundType = "ox" | "short" | "essay";

export function GoldenBellGame({ sessionId, onComplete, onExit }: GoldenBellGameProps) {
  const [round, setRound] = useState<RoundType>("ox");
  const [questionNumber, setQuestionNumber] = useState(1);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [textAnswer, setTextAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(10);
  const [participants, setParticipants] = useState(20);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Mock questions
  const questions = {
    ox: [
      { q: "데이터베이스의 정규화는 데이터 중복을 제거하기 위한 과정이다.", a: "O" },
      { q: "3NF는 2NF를 만족하지 않아도 된다.", a: "X" },
      { q: "Primary Key는 NULL 값을 가질 수 있다.", a: "X" },
    ],
    short: [
      { q: "데이터베이스에서 중복을 제거하고 데이터 무결성을 유지하기 위한 과정은?", a: "정규화" },
      { q: "하나 이상의 테이블에서 데이터를 검색하기 위해 사용하는 SQL 명령어는?", a: "SELECT" },
    ],
    essay: [
      { q: "데이터베이스 정규화의 목적과 1NF, 2NF, 3NF의 차이점을 설명하시오.", a: "정규화 중복제거 무결성" },
    ],
  };

  const currentQuestions = questions[round];
  const currentQuestion = currentQuestions[Math.min(questionNumber - 1, currentQuestions.length - 1)];
  const maxTime = round === "ox" ? 10 : round === "short" ? 20 : 30;

  // Timer
  useEffect(() => {
    if (timeLeft === 0 && !isAnswered) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isAnswered]);

  const handleSubmit = () => {
    setIsAnswered(true);
    
    let correct = false;
    if (round === "ox") {
      correct = selectedAnswer === currentQuestion.a;
    } else if (round === "short") {
      correct = textAnswer.trim().toLowerCase() === currentQuestion.a.toLowerCase();
    } else {
      // Essay - check if contains key words
      const keywords = currentQuestion.a.split(" ");
      correct = keywords.some(keyword => textAnswer.toLowerCase().includes(keyword.toLowerCase()));
    }

    setIsCorrect(correct);
    setShowResult(true);

    // If wrong, game over
    if (!correct) {
      setTimeout(() => {
        onComplete(false, participants);
      }, 2000);
      return;
    }

    // Simulate other participants dropping
    const newParticipants = Math.max(1, participants - Math.floor(Math.random() * 3));
    setParticipants(newParticipants);

    // Move to next question or round
    setTimeout(() => {
      if (round === "ox" && questionNumber >= 3) {
        // Move to short answer round
        setRound("short");
        setQuestionNumber(1);
        setTimeLeft(20);
      } else if (round === "short" && questionNumber >= 2) {
        // Move to essay round
        setRound("essay");
        setQuestionNumber(1);
        setTimeLeft(30);
      } else if (round === "essay" && questionNumber >= 1) {
        // Game complete - winner!
        onComplete(true, 1);
        return;
      } else {
        setQuestionNumber(prev => prev + 1);
        setTimeLeft(maxTime);
      }
      
      setSelectedAnswer("");
      setTextAnswer("");
      setIsAnswered(false);
      setShowResult(false);
    }, 2000);
  };

  const renderQuestion = () => {
    if (round === "ox") {
      return (
        <div className="space-y-4">
          <h2 className="text-gray-900 mb-6">{currentQuestion.q}</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setSelectedAnswer("O");
                setTimeout(() => handleSubmit(), 300);
              }}
              disabled={isAnswered}
              className={`p-8 rounded-lg border-2 transition-all ${
                selectedAnswer === "O"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300"
              } ${isAnswered ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <div className="text-6xl mb-2">⭕</div>
              <p className="text-xl text-gray-800">O</p>
            </button>
            <button
              onClick={() => {
                setSelectedAnswer("X");
                setTimeout(() => handleSubmit(), 300);
              }}
              disabled={isAnswered}
              className={`p-8 rounded-lg border-2 transition-all ${
                selectedAnswer === "X"
                  ? "border-red-500 bg-red-50"
                  : "border-gray-200 hover:border-red-300"
              } ${isAnswered ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <div className="text-6xl mb-2">❌</div>
              <p className="text-xl text-gray-800">X</p>
            </button>
          </div>
        </div>
      );
    }

    if (round === "short") {
      return (
        <div className="space-y-6">
          <h2 className="text-gray-900">{currentQuestion.q}</h2>
          <div>
            <Input
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="답을 입력하세요..."
              disabled={isAnswered}
              className="text-lg p-4"
              onKeyPress={(e) => {
                if (e.key === "Enter" && !isAnswered) {
                  handleSubmit();
                }
              }}
            />
          </div>
          {!isAnswered && (
            <Button
              onClick={handleSubmit}
              disabled={!textAnswer.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
            >
              답안 제출
            </Button>
          )}
        </div>
      );
    }

    // Essay
    return (
      <div className="space-y-6">
        <h2 className="text-gray-900">{currentQuestion.q}</h2>
        <div>
          <Textarea
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            placeholder="답안을 작성하세요..."
            disabled={isAnswered}
            className="min-h-32 text-lg p-4"
            rows={6}
          />
          <p className="text-sm text-gray-600 mt-2">
            핵심 키워드를 포함하여 작성하세요
          </p>
        </div>
        {!isAnswered && (
          <Button
            onClick={handleSubmit}
            disabled={!textAnswer.trim()}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
          >
            답안 제출
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-blue-600" />
              <h2 className="text-blue-900">골든벨 🔔</h2>
            </div>
            <Button
              onClick={onExit}
              variant="ghost"
              size="sm"
              className="text-red-600"
            >
              포기하기
            </Button>
          </div>

          {/* Status Bar */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">라운드</p>
                  <p className="text-xl text-blue-600">
                    {round === "ox" ? "OX 퀴즈" : round === "short" ? "단답형" : "서술형"}
                  </p>
                </div>
                <div className="text-2xl">
                  {round === "ox" ? "⭕" : round === "short" ? "✍️" : "📝"}
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">생존자</p>
                  <p className="text-xl text-purple-600">{participants}명</p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </Card>

            <Card className={`p-4 border-2 ${
              timeLeft <= 5 ? "bg-red-50 border-red-300" : "bg-gray-50 border-gray-200"
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">남은 시간</p>
                  <p className={`text-xl ${timeLeft <= 5 ? "text-red-600" : "text-gray-800"}`}>
                    {timeLeft}초
                  </p>
                </div>
                <Clock className={`w-8 h-8 ${timeLeft <= 5 ? "text-red-600" : "text-gray-600"}`} />
              </div>
            </Card>
          </div>
        </div>

        {/* Progress */}
        <Card className="p-4 mb-6 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              {round === "ox" ? `OX ${questionNumber}/3` : round === "short" ? `단답 ${questionNumber}/2` : `서술 ${questionNumber}/1`}
            </span>
            <Badge className="bg-blue-500 text-white">
              문제 {questionNumber}
            </Badge>
          </div>
          <Progress value={timeLeft / maxTime * 100} className="h-2" />
        </Card>

        {/* Question */}
        <Card className="p-8 border-2 border-blue-200 mb-6">
          {renderQuestion()}

          {/* Result */}
          {showResult && (
            <div className={`mt-6 p-4 rounded-lg border-2 ${
              isCorrect
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}>
              <div className="flex items-center gap-3">
                {isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
                <div>
                  <p className={`${isCorrect ? "text-green-900" : "text-red-900"}`}>
                    {isCorrect ? "정답입니다! 다음 문제로 이동합니다." : "오답입니다. 탈락하셨습니다."}
                  </p>
                  {!isCorrect && (
                    <p className="text-sm text-gray-700 mt-1">
                      정답: {currentQuestion.a}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Info */}
        <Card className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-1" />
            <p className="text-sm text-gray-700">
              한 문제라도 틀리면 즉시 탈락합니다. 신중하게 답변하세요!
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
