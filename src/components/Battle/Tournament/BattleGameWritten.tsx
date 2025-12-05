import { useState, useEffect } from "react";
import { Card } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Progress } from "../../ui/progress";
import { Swords, Clock, Sparkles, Target } from "lucide-react";
import type { Question } from "../../../types";
import { OpponentLeftOverlay } from "../OpponentLeftOverlay";
import { submitAnswer, sendHeartbeat, getScoreboard } from "../../api/versusApi"; 

interface BattleGameWrittenProps {
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

export function BattleGameWritten({
    questions,
    roomId,
    myUserId,
    myRank,
    onComplete,
    onExit,
}: BattleGameWrittenProps) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [myScore, setMyScore] = useState(0);
    const [opponentScore] = useState(0); // 토너먼트에서는 사용하지 않지만 onComplete 호환성을 위해 유지
    const [isAnswered, setIsAnswered] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [showOpponentAnswer, setShowOpponentAnswer] = useState(false);
    const [serverCorrect, setServerCorrect] = useState<boolean | null>(null); // 서버 채점 결과

    // 여기 추가: 상대 퇴장 여부
    const [opponentLeft, setOpponentLeft] = useState(false);
    const [opponentName, setOpponentName] = useState<string>("상대방");
    const [previousParticipantCount, setPreviousParticipantCount] = useState<number | null>(null);

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

    // 하트비트 전송 (30초마다)
    useEffect(() => {
        if (!roomId) return;

        const heartbeatInterval = setInterval(async () => {
            try {
                await sendHeartbeat(roomId);
                console.log("하트비트 전송 성공");
            } catch (error) {
                console.error("하트비트 전송 실패:", error);
            }
        }, 30000); // 30초마다

        return () => clearInterval(heartbeatInterval);
    }, [roomId]);

    // 스코어보드 폴링 (상대방 이탈 감지)
    useEffect(() => {
        if (!roomId) return;

        const pollScoreboard = async () => {
            try {
                const scoreboard = await getScoreboard(roomId);
                console.log("스코어보드 조회:", scoreboard);

                // 초기 참가자 수 설정
                if (previousParticipantCount === null) {
                    setPreviousParticipantCount(scoreboard.items.length);
                    
                    // 상대방 이름 저장 (나를 제외한 사용자)
                    if (scoreboard.items.length === 2) {
                        const opponent = scoreboard.items.find(item => item.userId !== myUserId);
                        if (opponent) {
                            setOpponentName(opponent.nickname || opponent.userId);
                        }
                    }
                }

                // 참가자 수가 2 -> 1로 줄어든 경우 상대방 이탈
                if (previousParticipantCount === 2 && scoreboard.items.length === 1) {
                    console.log("상대방 이탈 감지!");
                    setOpponentLeft(true);
                }

                setPreviousParticipantCount(scoreboard.items.length);
            } catch (error) {
                console.error("스코어보드 조회 실패:", error);
            }
        };

        // 즉시 실행
        pollScoreboard();

        // 1초마다 폴링
        const pollingInterval = setInterval(pollScoreboard, 1000);

        return () => clearInterval(pollingInterval);
    }, [roomId, myUserId, previousParticipantCount]);

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

    // Handle Answer
    const handleAnswer = async (answer: number | null) => {
        setIsAnswered(true);
        setShowOpponentAnswer(true);
        setServerCorrect(null); // 초기화

        let isCorrect = false;
        let serverScore = 0;

        // 답안 제출 API 호출 (서버가 채점)
        if (roomId && question.roomQuestionId !== undefined && question.roundNo !== undefined && question.phase) {
            try {
                // 답안을 문자열로 변환 (0 -> "A", 1 -> "B", 2 -> "C", 3 -> "D")
                const answerString = answer !== null ? String.fromCharCode(65 + answer) : "";
                const timeMs = (question.timeLimitSec || 30) * 1000 - (timeLeft * 1000);
                
                await submitAnswer(roomId, {
                    questionId: question.roomQuestionId,
                    userAnswer: answerString,
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
                setServerCorrect(isCorrect);
            } catch (error) {
                console.error("답안 제출 실패:", error);
                setServerCorrect(false);
                // 에러가 발생해도 게임은 계속 진행
            }
        } else {
            setServerCorrect(false);
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
                setSelectedAnswer(null);
                setIsAnswered(false);
                setShowResult(false);
                setShowOpponentAnswer(false);
                setServerCorrect(null);
                setTimeLeft(nextTimeLimit);
            } else {
                const finalMyScore = isCorrect
                    ? myScore + serverScore
                    : myScore;
                onComplete(finalMyScore, opponentScore);
            }
        }, 2500);
    };

    // 프론트 채점 로직 제거 - 서버 채점 결과 사용

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

                {/* 기존 UI (점수/타이머/문제 카드 등)는 그대로 유지 */}
                {/* Battle Arena */}
                <div className="mb-6 relative">
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        <Badge className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-4 py-2 shadow-lg animate-pulse">토너먼트</Badge>
                    </div>

                    {/* Score Board */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* My Score */}
                        <Card className={`p-6 border-2 transition-all duration-300 ${showResult && serverCorrect === true
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
                        <Card className={`p-6 border-2 transition-all duration-300 ${showResult && serverCorrect === false
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
                                // 프론트 채점 제거 - 서버 채점 결과만 사용
                                const showCorrect = showResult && serverCorrect === true && isSelected;
                                const showWrong = showResult && serverCorrect === false && isSelected;

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
                                            <span className="text-gray-800">{option.text}</span>
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
                                <div className={`p-5 rounded-xl border-2 flex-1 ${serverCorrect === true
                                    ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300"
                                    : serverCorrect === false
                                    ? "bg-gradient-to-r from-red-50 to-rose-50 border-red-300"
                                    : "bg-gray-100 border-gray-300"
                                    }`}>
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="text-5xl">{serverCorrect === true ? "🎉" : serverCorrect === false ? "💭" : "⏳"}</div>
                                        <div className="flex-1">
                                            <p className={`text-xl mb-2 ${serverCorrect === true ? "text-green-900" : serverCorrect === false ? "text-red-900" : "text-gray-600"}`}>
                                                {serverCorrect === true ? "정답입니다! ✨" : serverCorrect === false ? "아쉽네요! 😢" : "채점 중..."}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-lg bg-white/70 mb-4">
                                        <p className="text-sm text-gray-700 mb-2">📚 해설</p>
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

                {/* 상대방 이탈 오버레이 */}
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
