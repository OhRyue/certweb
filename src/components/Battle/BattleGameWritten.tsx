import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Swords, Clock, Sparkles, Target } from "lucide-react";
import type { Question } from "../../types";
import { OpponentLeftOverlay } from "./OpponentLeftOverlay"; // ✅ 추가

interface BattleGameWrittenProps {
    questions: Question[];
    opponentName: string;
    onComplete: (myScore: number, opponentScore: number) => void;
    onExit: () => void;
}

export function BattleGameWritten({
    questions,
    opponentName,
    onComplete,
    onExit,
}: BattleGameWrittenProps) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [myScore, setMyScore] = useState(0);
    const [opponentScore, setOpponentScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isAnswered, setIsAnswered] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [showOpponentAnswer, setShowOpponentAnswer] = useState(false);

    // 여기 추가: 상대 퇴장 여부
    const [opponentLeft, setOpponentLeft] = useState(false);

    const totalQuestions = questions.length;
    const question = questions[currentQuestion];

    // 테스트용: ESC 누르면 상대 나간 것처럼 오버레이 실행
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
            handleAnswer(null);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, isAnswered]);

    // Handle Answer
    const handleAnswer = (answer: number | null) => {
        setIsAnswered(true);
        setShowOpponentAnswer(true);

        const isCorrect = answer === question.correctAnswer;
        if (isCorrect) {
            const speedBonus = Math.floor(timeLeft / 3);
            setMyScore((prev) => prev + 10 + speedBonus);
        }

        const opponentCorrect = Math.random() > 0.3;
        const opponentTime = Math.floor(Math.random() * 25) + 5;
        if (opponentCorrect) {
            const opponentSpeedBonus = Math.floor(opponentTime / 3);
            setOpponentScore((prev) => prev + 10 + opponentSpeedBonus);
        }

        setShowResult(true);
        setTimeout(() => {
            if (currentQuestion < totalQuestions - 1) {
                setCurrentQuestion((prev) => prev + 1);
                setSelectedAnswer(null);
                setIsAnswered(false);
                setShowResult(false);
                setShowOpponentAnswer(false);
                setTimeLeft(30);
            } else {
                const finalMyScore = isCorrect
                    ? myScore + 10 + Math.floor(timeLeft / 3)
                    : myScore;
                const finalOpponentScore = opponentCorrect
                    ? opponentScore + 10 + Math.floor(opponentTime / 3)
                    : opponentScore;
                onComplete(finalMyScore, finalOpponentScore);
            }
        }, 2500);
    };

    const getIsCorrect = () => selectedAnswer === question.correctAnswer;

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
                        <h1 className="text-purple-900">1:1 배틀 ⚔️</h1>
                    </div>
                </div>

                {/* 기존 UI (점수/타이머/문제 카드 등)는 그대로 유지 */}
                {/* Battle Arena */}
                <div className="mb-6 relative">
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 shadow-lg animate-pulse">VS</Badge>
                    </div>

                    {/* Score Board */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* My Score */}
                        <Card className={`p-6 border-2 transition-all duration-300 ${showResult && getIsCorrect()
                            ? "bg-gradient-to-br from-green-100 to-emerald-100 border-green-400 shadow-lg scale-105"
                            : "bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300"
                            }`}>
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-sm text-gray-700">나</p>
                                    <p className="text-3xl text-purple-700">{myScore}점</p>
                                </div>
                                <div className="text-5xl">👨‍💻</div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Target className="w-3 h-3" />
                                <span>문제 {currentQuestion + 1}/{totalQuestions}</span>
                            </div>
                        </Card>

                        {/* Opponent Score */}
                        <Card className={`p-6 border-2 transition-all duration-300 ${showResult && !getIsCorrect()
                            ? "bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-400 shadow-lg scale-105"
                            : "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300"
                            }`}>
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-sm text-gray-700 mb-1">{opponentName}</p>
                                    <p className="text-3xl text-blue-700">{opponentScore}점</p>
                                </div>
                                <div className="text-5xl relative">
                                    🤖
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
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">필기 모드 ✏️</Badge>
                            <span className="text-sm text-gray-600">{currentQuestion + 1} / {totalQuestions}</span>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${timeLeft <= 10 ? "bg-red-100 text-red-700 animate-pulse" :
                            timeLeft <= 20 ? "bg-orange-100 text-orange-700" :
                                "bg-blue-100 text-blue-700"
                            }`}>
                            <Clock className="w-5 h-5" />
                            <span className="font-mono">{timeLeft}초</span>
                        </div>
                    </div>
                    <Progress value={((currentQuestion + 1) / totalQuestions) * 100} className="h-2.5" />
                </Card>

                {/* Questions & Explanation */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-8 border-2 border-purple-200 bg-white/90 backdrop-blur-sm">
                        <h2 className="text-gray-900 text-base mb-4">{question.question}</h2>
                        <div className="space-y-3">
                            {question.options?.map((option, index) => {
                                const isSelected = selectedAnswer === index;
                                const isCorrect = index === question.correctAnswer;
                                const showCorrect = showResult && isCorrect;
                                const showWrong = showResult && isSelected && !isCorrect;

                                return (
                                    <button
                                        key={index}
                                        onClick={() => !isAnswered && handleAnswer(index)}
                                        disabled={isAnswered}
                                        className={`w-full p-5 rounded-xl border-2 text-left transition-all ${showCorrect
                                            ? "border-green-500 bg-green-50 scale-[1.02]"
                                            : showWrong
                                                ? "border-red-500 bg-red-50 scale-95"
                                                : isSelected
                                                    ? "border-purple-500 bg-purple-50"
                                                    : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/30"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${showCorrect ? "bg-green-500 text-white" :
                                                showWrong ? "bg-red-500 text-white" :
                                                    isSelected ? "bg-purple-500 text-white" :
                                                        "bg-gray-200 text-gray-600"
                                                }`}>
                                                {showCorrect ? "✓" : showWrong ? "✗" : index + 1}
                                            </div>
                                            <span className="text-gray-800">{option}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Explanation */}
                    <Card className="p-8 border-2 border-purple-200 bg-white/90 backdrop-blur-sm">
                        {!showResult ? (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <div className="text-6xl mb-4">🤔</div>
                                <p className="text-gray-600">답을 선택하면 이곳에 해설이 표시됩니다</p>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col">
                                <div className={`p-5 rounded-xl border-2 flex-1 ${getIsCorrect()
                                    ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300"
                                    : "bg-gradient-to-r from-red-50 to-rose-50 border-red-300"
                                    }`}>
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="text-5xl">{getIsCorrect() ? "🎉" : "💭"}</div>
                                        <div className="flex-1">
                                            <p className={`text-xl mb-2 ${getIsCorrect() ? "text-green-900" : "text-red-900"}`}>
                                                {getIsCorrect() ? "정답입니다! ✨" : "아쉽네요! 😢"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-lg bg-white/70 mb-4">
                                        <p className="text-sm text-gray-700 mb-2">📚 해설</p>
                                        <p className="text-sm text-gray-800">{question.explanation}</p>
                                    </div>

                                    {showOpponentAnswer && (
                                        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
                                            <span>🤖</span>
                                            <span>{opponentName}님도 문제를 풀었습니다!</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                {/* 상대 나감 오버레이 표시 */}
                {opponentLeft && (
                    <OpponentLeftOverlay
                        opponentName={opponentName}
                        myScore={myScore}
                        opponentScore={opponentScore}
                        onConfirm={() => {
                            setOpponentLeft(false);
                            onExit();
                        }}
                    />
                )}
            </div>
        </div>
    );
}
