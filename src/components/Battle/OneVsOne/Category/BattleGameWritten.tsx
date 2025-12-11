import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "../../../ui/card";
import { Badge } from "../../../ui/badge";
import { Progress } from "../../../ui/progress";
import { Swords, Clock, Sparkles, Target } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Question } from "../../../../types";
import { OpponentLeftOverlay } from "../../OpponentLeftOverlay";
import { submitAnswer, getScoreboard, getVersusQuestion, sendHeartbeat, type CurrentQuestion } from "../../../api/versusApi";
import axios from "../../../api/axiosConfig";

// 프로필 이미지 경로
const girlBasicProfile = "/assets/profile/girl_basic_profile.png";
const boyNerdProfile = "/assets/profile/boy_nerd_profile.png";
const girlUniformProfile = "/assets/profile/girl_uniform_profile.jpg";
const girlPajamaProfile = "/assets/profile/girl_pajama_profile.png";
const girlMarriedProfile = "/assets/profile/girl_married_profile.png";
const girlNerdProfile = "/assets/profile/girl_nerd_profile.png";
const girlIdolProfile = "/assets/profile/girl_idol_profile.png";
const girlGhostProfile = "/assets/profile/girl_ghost_profile.png";
const girlCyberpunkProfile = "/assets/profile/girl_cyberpunk_profile.png";
const girlChinaProfile = "/assets/profile/girl_china_profile.jpg";
const girlCatProfile = "/assets/profile/girl_cat_profile.png";
const boyWorkerProfile = "/assets/profile/boy_worker_profile.png";
const boyPoliceofficerProfile = "/assets/profile/boy_policeofficer_profile.png";
const boyHiphopProfile = "/assets/profile/boy_hiphop_profile.png";
const boyDogProfile = "/assets/profile/boy_dog_profile.png";
const boyBasicProfile = "/assets/profile/boy_basic_profile.png";
const boyAgentProfile = "/assets/profile/boy_agent_profile.png";

// skinId를 프로필 이미지로 매핑
const PROFILE_IMAGE_MAP: Record<number, string> = {
  1: girlBasicProfile,
  2: boyNerdProfile,
  3: girlUniformProfile,
  4: girlPajamaProfile,
  5: girlMarriedProfile,
  6: girlNerdProfile,
  7: girlIdolProfile,
  8: girlGhostProfile,
  9: girlCyberpunkProfile,
  10: girlChinaProfile,
  11: girlCatProfile,
  12: boyWorkerProfile,
  13: boyPoliceofficerProfile,
  14: boyHiphopProfile,
  15: boyDogProfile,
  16: boyBasicProfile,
  17: boyAgentProfile,
};

// skinId로 프로필 이미지 경로 가져오기
function getProfileImage(skinId?: number): string {
  if (!skinId) return PROFILE_IMAGE_MAP[1]; // 기본값: girl_basic_profile
  return PROFILE_IMAGE_MAP[skinId] || PROFILE_IMAGE_MAP[1];
}

interface BattleGameWrittenProps {
    questions: Question[];
    setQuestions?: (questions: Question[]) => void; // 문제 업데이트용 (토너먼트 방식)
    roomId?: number; // 답안 제출용
    opponentName: string;
    myUserId?: string;
    opponentUserId?: string;
    myRank?: number | null;
    opponentRank?: number | null;
    onComplete: (myScore: number, opponentScore: number) => void;
    onExit: () => void;
}

export function BattleGameWritten({
    questions,
    setQuestions,
    roomId,
    opponentName,
    myUserId,
    opponentUserId,
    myRank,
    opponentRank,
    onComplete,
    onExit,
}: BattleGameWrittenProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [myScore, setMyScore] = useState(0);
    const [opponentScore, setOpponentScore] = useState(0);
    const [previousScore, setPreviousScore] = useState(0);
    const [currentQuestionNumber, setCurrentQuestionNumber] = useState<number | null>(null); // 백엔드에서 제공하는 현재 문제 번호
    const [timeLeft, setTimeLeft] = useState<number>(0); // 백엔드 endTime 기반으로 계산
    const [isAnswered, setIsAnswered] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [showOpponentAnswer, setShowOpponentAnswer] = useState(false);
    const [serverCorrect, setServerCorrect] = useState<boolean | null>(null);
    const [gameStatus, setGameStatus] = useState<string>("IN_PROGRESS");
    const [currentQuestionFromServer, setCurrentQuestionFromServer] = useState<CurrentQuestion | null>(null);
    const [questionLoading, setQuestionLoading] = useState(false);
    const currentQuestionIdRef = useRef<number | null>(null);
    
    // 답안 제출 중복 방지를 위한 ref
    const isSubmittingRef = useRef(false);
    
    // questions prop을 업데이트하여 현재 문제만 저장 (토너먼트 방식)

    // 여기 추가: 상대 퇴장 여부
    const [opponentLeft, setOpponentLeft] = useState(false);
    
    // 프로필 이미지용 skinId 상태
    const [mySkinId, setMySkinId] = useState<number>(1);
    const [opponentSkinId, setOpponentSkinId] = useState<number>(1);
    
    // nickname 상태
    const [myNickname, setMyNickname] = useState<string | null>(null);
    const [opponentNickname, setOpponentNickname] = useState<string | null>(null);

    // 1초 폴링으로 실시간 스코어보드 조회
    useEffect(() => {
        if (!roomId || !myUserId) return;

        const pollScoreboard = async () => {
            try {
                const scoreboard = await getScoreboard(roomId);
                
                // 스코어보드에서 내 점수와 상대 점수 찾기
                const myItem = scoreboard.items.find(item => item.userId === myUserId);
                const opponentItem = scoreboard.items.find(item => item.userId !== myUserId);
                
                if (myItem) {
                    // 점수 변화로 채점 결과 추론 (백엔드가 채점)
                    if (myItem.score > previousScore && previousScore >= 0 && isAnswered && serverCorrect === null) {
                        // 점수가 증가했으면 정답
                        setServerCorrect(true);
                    } else if (myItem.score === previousScore && isAnswered && serverCorrect === null && previousScore >= 0) {
                        // 점수가 변하지 않았고 답을 제출했으면 오답일 가능성
                        setServerCorrect(false);
                    }
                    setMyScore(myItem.score);
                    if (myItem.score !== previousScore) {
                        setPreviousScore(myItem.score);
                    }
                    // skinId 업데이트
                    if (myItem.skinId) {
                        setMySkinId(myItem.skinId);
                    }
                    // nickname 업데이트
                    setMyNickname(myItem.nickname);
                }
                if (opponentItem) {
                    setOpponentScore(opponentItem.score);
                    // 상대방 skinId 업데이트
                    if (opponentItem.skinId) {
                        setOpponentSkinId(opponentItem.skinId);
                    }
                    // 상대방 nickname 업데이트
                    setOpponentNickname(opponentItem.nickname);
                }

                // 1:1 배틀에서 상대방 이탈 감지 (참가자가 1명만 남은 경우)
                if (scoreboard.items.length === 1 && !opponentLeft) {
                    setOpponentLeft(true);
                }

                // currentQuestion 정보 업데이트
                if (scoreboard.currentQuestion) {
                    const { orderNo, endTime } = scoreboard.currentQuestion;
                    setCurrentQuestionNumber(orderNo);
                    setCurrentQuestionFromServer(scoreboard.currentQuestion);
                    
                    // endTime은 UTC 형식이므로 UTC 기준으로 파싱
                    // ISO 8601 형식 (예: "2025-12-02T03:15:06Z")은 자동으로 UTC로 파싱됨
                    const endTimeDate = new Date(endTime);
                    
                    // endTime 파싱 검증
                    if (isNaN(endTimeDate.getTime())) {
                        console.error('Invalid endTime:', endTime);
                        return;
                    }
                    
                    const now = new Date(); // 현재 시간
                    
                    // getTime()은 모두 UTC 기준 밀리초를 반환하므로 정확하게 계산됨
                    // endTimeDate.getTime() - now.getTime() = 남은 밀리초
                    const remainingMs = endTimeDate.getTime() - now.getTime();
                    // Math.ceil을 사용하여 0.1초 남아도 1초로 표시
                    const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
                    
                    setTimeLeft(remainingSec);
                    
                    // orderNo는 1부터 시작하므로 인덱스로 변환 (orderNo - 1)
                    const questionIndex = orderNo - 1;
                    if (questionIndex >= 0 && questionIndex !== currentQuestionIndex) {
                        setCurrentQuestionIndex(questionIndex);
                    }
                } else {
                    // currentQuestion이 null이면 쉬는 시간 (인터미션)
                    setCurrentQuestionFromServer(null);
                    currentQuestionIdRef.current = null;
                    if (setQuestions) {
                        setQuestions([]);
                    }
                }

                // status가 "DONE"이면 게임 종료
                if (scoreboard.status === "DONE") {
                    setGameStatus("DONE");
                } else {
                    setGameStatus(scoreboard.status);
                }
            } catch (error) {
                console.error("스코어보드 조회 실패:", error);
            }
        };

        // 즉시 한 번 조회
        pollScoreboard();

        // 2초마다 폴링
        const interval = setInterval(pollScoreboard, 2000);

        return () => clearInterval(interval);
    }, [roomId, myUserId, previousScore, isAnswered, serverCorrect, currentQuestionIndex, opponentLeft]);

    // 하트비트 전송 (15초마다)
    useEffect(() => {
        if (!roomId || gameStatus === "DONE") return;

        const sendHeartbeatRequest = async () => {
            try {
                await sendHeartbeat(roomId);
            } catch (error) {
                console.error("Heartbeat 전송 실패:", error);
                // heartbeat 실패는 자동 추방으로 이어지므로 에러 표시하지 않음
            }
        };

        // 즉시 한 번 전송
        sendHeartbeatRequest();

        // 15초마다 전송
        const heartbeatInterval = setInterval(sendHeartbeatRequest, 15000);

        return () => {
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
            }
        };
    }, [roomId, gameStatus]);

    // 게임 종료 처리
    useEffect(() => {
        if (gameStatus === "DONE") {
            // 모든 문제를 풀었거나 게임이 종료된 경우
            setTimeout(() => {
                onComplete(myScore, opponentScore);
            }, 2000);
        }
    }, [gameStatus, myScore, opponentScore, onComplete]);

    // currentQuestion이 변경되면 문제를 하나씩 가져오기 (토너먼트 방식)
    useEffect(() => {
        const fetchQuestion = async () => {
            if (!currentQuestionFromServer || !roomId) {
                if (setQuestions) {
                    setQuestions([]); // 문제 목록 비우기
                }
                return;
            }

            // 이미 같은 문제를 가져왔으면 다시 가져오지 않음
            if (currentQuestionIdRef.current === currentQuestionFromServer.questionId) {
                return;
            }

            setQuestionLoading(true);
            try {
                const data = await getVersusQuestion(currentQuestionFromServer.questionId);

                // answerKey를 인덱스로 변환 (A=0, B=1, C=2, D=3)
                const answerKeyToIndex = (key: string): number => {
                    if (typeof key === "number") return key;
                    const upperKey = String(key).toUpperCase();
                    return upperKey.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
                };

                // type 변환
                const convertType = (type: string, mode: string): "multiple" | "ox" | "typing" => {
                    if (mode === "PRACTICAL") return "typing";
                    if (type === "OX") return "ox";
                    return "multiple";
                };

                // mode 변환
                const convertMode = (mode: string): "written" | "practical" => {
                    return mode === "PRACTICAL" ? "practical" : "written";
                };

                // difficulty 변환
                const convertDifficulty = (diff: string): "easy" | "medium" | "hard" => {
                    if (diff === "EASY") return "easy";
                    if (diff === "HARD") return "hard";
                    return "medium";
                };

                // payloadJson에서 choices 추출 (있는 경우)
                let options: { label: string; text: string }[] = [];
                let correctAnswerIndex = 0;
                
                if (data.payloadJson) {
                    try {
                        const payload = typeof data.payloadJson === "string" 
                            ? JSON.parse(data.payloadJson) 
                            : data.payloadJson;
                        if (payload.choices && Array.isArray(payload.choices)) {
                            options = payload.choices.map((choice: any) => ({
                                label: choice.label || "",
                                text: choice.content || choice.text || ""
                            }));
                            
                            // correct: true인 선택지의 인덱스 찾기
                            const correctIndex = payload.choices.findIndex((choice: any) => choice.correct === true);
                            if (correctIndex !== -1) {
                                correctAnswerIndex = correctIndex;
                            } else {
                                // correct 필드가 없으면 answerKey 사용 (fallback)
                                correctAnswerIndex = data.answerKey !== undefined 
                                    ? (typeof data.answerKey === "string" ? answerKeyToIndex(data.answerKey) : data.answerKey)
                                    : 0;
                            }
                        } else {
                            // choices가 없으면 answerKey 사용 (fallback)
                            correctAnswerIndex = data.answerKey !== undefined 
                                ? (typeof data.answerKey === "string" ? answerKeyToIndex(data.answerKey) : data.answerKey)
                                : 0;
                        }
                    } catch (e) {
                        console.error("payloadJson 파싱 실패", e);
                        // 파싱 실패 시 answerKey 사용 (fallback)
                        correctAnswerIndex = data.answerKey !== undefined 
                            ? (typeof data.answerKey === "string" ? answerKeyToIndex(data.answerKey) : data.answerKey)
                            : 0;
                    }
                } else {
                    // payloadJson이 없으면 answerKey 사용 (fallback)
                    correctAnswerIndex = data.answerKey !== undefined 
                        ? (typeof data.answerKey === "string" ? answerKeyToIndex(data.answerKey) : data.answerKey)
                        : 0;
                }

                // API 응답을 Question 타입으로 변환
                const questionData: Question = {
                    id: String(data.id || currentQuestionFromServer.questionId),
                    topicId: "",
                    tags: [],
                    difficulty: convertDifficulty(data.difficulty || "NORMAL"),
                    type: convertType(data.type || "MCQ", data.mode || "WRITTEN"),
                    examType: convertMode(data.mode || "WRITTEN"),
                    question: data.stem || "",
                    options: options,
                    correctAnswer: correctAnswerIndex,
                    explanation: data.solutionText || "",
                    imageUrl: undefined,
                    timeLimitSec: currentQuestionFromServer.timeLimitSec,
                    roomQuestionId: currentQuestionFromServer.questionId, // 답안 제출용
                    roundNo: currentQuestionFromServer.roundNo, // 답안 제출용
                    phase: currentQuestionFromServer.phase as "MAIN" | "REVIVAL" // 답안 제출용
                };

                // 현재 문제만 배열에 저장 (토너먼트 방식)
                currentQuestionIdRef.current = currentQuestionFromServer.questionId;
                if (setQuestions) {
                    setQuestions([questionData]);
                }
            } catch (error) {
                console.error("문제 가져오기 실패:", error);
                if (setQuestions) {
                    setQuestions([]);
                }
            } finally {
                setQuestionLoading(false);
            }
        };

        fetchQuestion();
    }, [currentQuestionFromServer, roomId, setQuestions]);

    // 문제 인덱스나 문제 번호가 변경될 때마다 상태 초기화 (첫 문제 포함)
    useEffect(() => {
        // 문제가 변경되면 상태 초기화
        setSelectedAnswer(null);
        setIsAnswered(false);
        setShowResult(false);
        setShowOpponentAnswer(false);
        setServerCorrect(null);
        isSubmittingRef.current = false; // 제출 플래그도 리셋
    }, [currentQuestionIndex, currentQuestionNumber]);

    // Timer - 백엔드 endTime 기반으로 계산하므로 프론트에서 직접 세지 않음
    // 스코어보드 폴링에서 timeLeft를 업데이트하므로 별도 타이머 불필요

    // 문제가 있는지 확인 (토너먼트 방식 참고)
    const hasQuestion = currentQuestionFromServer && questions && questions.length > 0 && !questionLoading;
    const question = questions?.[0]; // 현재 문제는 항상 첫 번째 요소

    // Handle Answer - 답안 제출 (백엔드가 채점 및 점수 관리)
    const handleAnswer = async (answer: number | null) => {
        // 이미 제출 중이거나 답변했으면 중복 호출 방지
        if (isAnswered || isSubmittingRef.current) return;
        
        isSubmittingRef.current = true;
        // 선택한 답안을 먼저 설정 (UI에서 노란색으로 표시하기 위해)
        setSelectedAnswer(answer);
        setIsAnswered(true);
        setShowOpponentAnswer(true);
        setServerCorrect(null); // 초기화

        // 답안 제출 API 호출 (백엔드가 채점)
        if (roomId && question?.roomQuestionId !== undefined && question?.roundNo !== undefined && question?.phase) {
            try {
                // 답안을 문자열로 변환
                let answerString = "";
                if (answer !== null) {
                    if (question.type === "ox") {
                        // OX 문제: userAnswer는 "O" 또는 "X"로 전송
                        answerString = answer === 0 ? "O" : "X";
                    } else {
                        // MCQ 문제: 0 -> "A", 1 -> "B", 2 -> "C", 3 -> "D"
                        answerString = String.fromCharCode(65 + answer);
                    }
                }
                 // 백엔드에서 제공하는 endTime 기반으로 시간 계산
                 // 현재는 timeLeft를 사용하되, 백엔드가 정확한 시간을 관리
                 const timeMs = (question.timeLimitSec || 30) * 1000 - (timeLeft * 1000);
                
                // 정답 판단: correctAnswer와 비교
                let isCorrect = false;
                if (answer !== null && question.correctAnswer !== undefined) {
                    if (question.type === "ox") {
                        // OX 문제: correctAnswer는 인덱스 (0 또는 1)
                        // answerString은 "O" 또는 "X"
                        const correctOption = question.options?.[question.correctAnswer as number];
                        isCorrect = correctOption?.label === answerString;
                    } else {
                        // 객관식 문제: correctAnswer는 인덱스
                        isCorrect = answer === question.correctAnswer;
                    }
                }
                
                // 답안 제출 (백엔드가 채점 및 점수 저장)
                // OX 문제: userAnswer는 "O" 또는 "X"
                const response = await submitAnswer(roomId, {
                    questionId: question.roomQuestionId,
                    userAnswer: answerString, // OX: "O" 또는 "X", MCQ: "A", "B", "C", "D"
                    correct: isCorrect, // 정답 여부 판단
                    timeMs: Math.max(0, timeMs),
                    roundNo: question.roundNo,
                    phase: question.phase,
                });

                // 백엔드가 채점하므로 프론트에서는 채점 결과를 알 수 없음
                // 스코어보드 폴링이 점수를 업데이트할 때 채점 결과를 확인
                setServerCorrect(null); // 채점 결과는 백엔드에서 관리
            } catch (error) {
                console.error("답안 제출 실패:", error);
                setServerCorrect(null); // 백엔드가 채점하므로 프론트에서는 알 수 없음
                // 에러가 발생해도 게임은 계속 진행
            }
        } else {
            setServerCorrect(null);
        }

        // 점수는 백엔드에서 관리하므로 프론트에서 계산하지 않음
        // 백엔드에서 currentQuestion이 바뀌면 자동으로 다음 문제로 전환되므로
        // 여기서는 별도 처리 없음 (상태 초기화는 currentQuestion 변경 시 처리됨)
    };

    // 시간이 만료되었을 때 자동으로 빈 답안 제출
    useEffect(() => {
        if (!hasQuestion || !question || !roomId) return;
        if (timeLeft === 0 && !isAnswered && !isSubmittingRef.current) {
            handleAnswer(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLeft, hasQuestion, isAnswered]);

    // 게임이 종료되었을 때만 렌더링 중단 (모든 hook 호출 후)
    if (gameStatus === "DONE") {
        return (
            <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">게임이 종료되었습니다...</p>
                </div>
            </div>
        );
    }

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
                        <Card className="p-6 border-2 transition-all duration-300 bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">{myNickname || myUserId || "나"}</p>
                                    <p className="text-3xl text-purple-700">{myScore}점</p>
                                </div>
                                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-gradient-to-br from-purple-400 to-pink-400">
                                    <img
                                        src={getProfileImage(mySkinId)}
                                        alt={myUserId || "나"}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Opponent Score */}
                        <Card className="p-6 border-2 transition-all duration-300 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-700 mb-1">{opponentNickname || opponentUserId || opponentName}</p>
                                    <p className="text-3xl text-blue-700">{opponentScore}점</p>
                                </div>
                                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-gradient-to-br from-blue-400 to-cyan-400 relative">
                                    <img
                                        src={getProfileImage(opponentSkinId)}
                                        alt={opponentUserId || opponentName}
                                        className="w-full h-full object-cover"
                                    />
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
                             <span className="text-sm text-gray-600">
                                {hasQuestion 
                                    ? `${currentQuestionNumber !== null ? currentQuestionNumber : currentQuestionIndex + 1} / 10`
                                    : "대기 중"}
                             </span>
                         </div>
                         {hasQuestion && (
                             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${timeLeft <= 10 ? "bg-red-100 text-red-700 animate-pulse" :
                                 timeLeft <= 20 ? "bg-orange-100 text-orange-700" :
                                     "bg-blue-100 text-blue-700"
                                 }`}>
                                 <Clock className="w-5 h-5" />
                                 <span className="font-mono">{timeLeft}초</span>
                             </div>
                         )}
                     </div>
                     {hasQuestion && <Progress value={currentQuestionNumber !== null ? (currentQuestionNumber / 10) * 100 : 0} className="h-2.5" />}
                </Card>

                {/* Questions */}
                {hasQuestion ? (
                    <Card className="p-8 border-2 border-purple-200 bg-white/90 backdrop-blur-sm">
                        <div className="text-gray-900 text-base mb-4 prose prose-sm max-w-none overflow-x-auto">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {question.question}
                          </ReactMarkdown>
                        </div>
                        <div className="space-y-3">
                            {question.options?.map((option, index) => {
                                const isSelected = selectedAnswer === index;
                                // 선택한 답은 항상 노란색으로 표시
                                const isSelectedAnswer = isSelected && isAnswered;

                                return (
                                    <button
                                        key={index}
                                        onClick={() => !isAnswered && handleAnswer(index)}
                                        disabled={isAnswered}
                                        className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                                            isSelectedAnswer
                                                ? "border-yellow-500 bg-yellow-50 scale-[1.02]"
                                                : isAnswered
                                                    ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                                                    : isSelected
                                                        ? "border-purple-500 bg-purple-50"
                                                        : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/30"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                isSelectedAnswer
                                                    ? "bg-yellow-500 text-white"
                                                    : isAnswered
                                                        ? "bg-gray-300 text-gray-500"
                                                        : isSelected
                                                            ? "bg-purple-500 text-white"
                                                            : "bg-gray-200 text-gray-600"
                                            }`}>
                                                {isSelectedAnswer ? "✓" : option.label || String.fromCharCode(65 + index)}
                                            </div>
                                            <span className={`${isAnswered && !isSelected ? "text-gray-500" : "text-gray-800"}`}>{option.text}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </Card>
                ) : (
                    <Card className="p-8 border-2 border-purple-200 bg-white/90 backdrop-blur-sm">
                        <div className="h-full flex flex-col items-center justify-center text-center min-h-[400px]">
                            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">문제를 불러오는 중...</p>
                        </div>
                    </Card>
                )}

                {/* 상대 나감 오버레이 표시 */}
                {opponentLeft && (
                    <OpponentLeftOverlay
                        opponentName={opponentName}
                        myScore={myScore}
                        opponentScore={opponentScore}
                        onConfirm={() => {
                            setOpponentLeft(false);
                            // status가 DONE이면 자동으로 결과 화면으로 이동
                        }}
                    />
                )}
            </div>
        </div>
    );
}
