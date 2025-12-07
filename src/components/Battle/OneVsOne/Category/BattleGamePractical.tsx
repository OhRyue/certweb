import { useState, useEffect, useRef } from "react";
import { Card } from "../../../ui/card";
import { Button } from "../../../ui/button";
import { Badge } from "../../../ui/badge";
import { Progress } from "../../../ui/progress";
import { Input } from "../../../ui/input";
import { Swords, Clock, Zap, Sparkles, Target } from "lucide-react";
import type { Question } from "../../../../types";
import { OpponentLeftOverlay } from "../../OpponentLeftOverlay";
import { submitAnswer, getScoreboard, getRoomState, getVersusQuestion, type CurrentQuestion } from "../../../api/versusApi";
import axios from "../../../api/axiosConfig";

// 프로필 이미지 import
import girlBasicProfile from "../../../assets/profile/girl_basic_profile.png";
import boyNerdProfile from "../../../assets/profile/boy_nerd_profile.png";
import girlUniformProfile from "../../../assets/profile/girl_uniform_profile.jpg";
import girlPajamaProfile from "../../../assets/profile/girl_pajama_profile.png";
import girlMarriedProfile from "../../../assets/profile/girl_married_profile.png";
import girlNerdProfile from "../../../assets/profile/girl_nerd_profile.png";
import girlIdolProfile from "../../../assets/profile/girl_idol_profile.png";
import girlGhostProfile from "../../../assets/profile/girl_ghost_profile.png";
import girlCyberpunkProfile from "../../../assets/profile/girl_cyberpunk_profile.png";
import girlChinaProfile from "../../../assets/profile/girl_china_profile.jpg";
import girlCatProfile from "../../../assets/profile/girl_cat_profile.png";
import boyWorkerProfile from "../../../assets/profile/boy_worker_profile.png";
import boyPoliceofficerProfile from "../../../assets/profile/boy_policeofficer_profile.png";
import boyHiphopProfile from "../../../assets/profile/boy_hiphop_profile.png";
import boyDogProfile from "../../../assets/profile/boy_dog_profile.png";
import boyBasicProfile from "../../../assets/profile/boy_basic_profile.png";
import boyAgentProfile from "../../../assets/profile/boy_agent_profile.png";

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

interface BattleGamePracticalProps {
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

export function BattleGamePractical({
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
}: BattleGamePracticalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [typingAnswer, setTypingAnswer] = useState("");
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0); // 백엔드 endTime 기반으로 계산
  const [isAnswered, setIsAnswered] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showOpponentAnswer, setShowOpponentAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [gameStatus, setGameStatus] = useState<string>("IN_PROGRESS");
  const [currentQuestionFromServer, setCurrentQuestionFromServer] = useState<CurrentQuestion | null>(null);
  const [questionLoading, setQuestionLoading] = useState(false);
  const currentQuestionIdRef = useRef<number | null>(null);

  // 오버레이 상태 추가
  const [opponentLeft, setOpponentLeft] = useState(false);
  
  // 프로필 이미지용 skinId 상태
  const [mySkinId, setMySkinId] = useState<number>(1);
  const [opponentSkinId, setOpponentSkinId] = useState<number>(1);

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
          setMyScore(myItem.score);
          // skinId 업데이트
          if (myItem.skinId) {
            setMySkinId(myItem.skinId);
          }
        }
        if (opponentItem) {
          setOpponentScore(opponentItem.score);
          // 상대방 skinId 업데이트
          if (opponentItem.skinId) {
            setOpponentSkinId(opponentItem.skinId);
          }
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
          const endTimeDate = new Date(endTime);
          
          if (isNaN(endTimeDate.getTime())) {
            console.error('Invalid endTime:', endTime);
            return;
          }
          
          const now = new Date();
          const remainingMs = endTimeDate.getTime() - now.getTime();
          const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
          
          setTimeLeft(remainingSec);
          
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
          // 게임 종료 시 state 조회하여 결과 확인
          try {
            const roomState = await getRoomState(roomId);
            // 결과는 roomState에서 확인 가능
            console.log("게임 종료 - 최종 결과:", roomState);
          } catch (error) {
            console.error("게임 종료 후 상태 조회 실패:", error);
          }
        } else {
          setGameStatus(scoreboard.status);
        }
      } catch (error) {
        console.error("스코어보드 조회 실패:", error);
      }
    };

    // 즉시 한 번 조회
    pollScoreboard();

    // 1초마다 폴링
    const interval = setInterval(pollScoreboard, 1000);

    return () => clearInterval(interval);
  }, [roomId, myUserId, currentQuestionIndex, opponentLeft]);

  // currentQuestion이 변경되면 문제를 하나씩 가져오기 (토너먼트 방식)
  useEffect(() => {
    const fetchQuestion = async () => {
      if (!currentQuestionFromServer || !roomId) {
        if (setQuestions) {
          setQuestions([]);
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

        // API 응답을 Question 타입으로 변환
        const questionData: Question = {
          id: String(data.id || currentQuestionFromServer.questionId),
          topicId: "",
          tags: [],
          difficulty: convertDifficulty(data.difficulty || "NORMAL"),
          type: convertType(data.type || "MCQ", data.mode || "PRACTICAL"),
          examType: convertMode(data.mode || "PRACTICAL"),
          question: data.stem || "",
          options: [],
          correctAnswer: 0,
          explanation: data.solutionText || "",
          imageUrl: undefined,
          timeLimitSec: currentQuestionFromServer.timeLimitSec,
          roomQuestionId: currentQuestionFromServer.questionId,
          roundNo: currentQuestionFromServer.roundNo,
          phase: currentQuestionFromServer.phase as "MAIN" | "REVIVAL"
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

  // 게임이 종료되었을 때만 렌더링 중단
  if (gameStatus === "DONE") {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">게임이 종료되었습니다...</p>
        </div>
      </div>
    );
  }

  // 문제가 있는지 확인 (토너먼트 방식 참고)
  const hasQuestion = currentQuestionFromServer && questions && questions.length > 0 && !questionLoading;
  const question = questions?.[0]; // 현재 문제는 항상 첫 번째 요소

  // 게임 종료 처리
  useEffect(() => {
    if (gameStatus === "DONE") {
      // 모든 문제를 풀었거나 게임이 종료된 경우
      setTimeout(() => {
        onComplete(myScore, opponentScore);
      }, 2000);
    }
  }, [gameStatus, myScore, opponentScore, onComplete]);

  // Timer - 백엔드 endTime 기반으로 계산하므로 프론트에서 직접 세지 않음
  // 스코어보드 폴링에서 timeLeft를 업데이트하므로 별도 타이머 불필요
  useEffect(() => {
    if (timeLeft === 0 && !isAnswered && question) {
      handleAnswer();
    }
  }, [timeLeft, isAnswered, question]);

  // Handle answer - 답안 제출 (백엔드가 채점 및 점수 관리)
  const handleAnswer = async () => {
    setIsAnswered(true);
    setShowOpponentAnswer(true);

    // 실기 문제는 백엔드가 채점하므로 프론트에서는 임시로 false 설정
    // (실제 채점은 백엔드에서 수행)
    const isCorrect = false; // 백엔드가 채점하므로 프론트에서는 알 수 없음

    // 답안 제출 API 호출
    if (roomId && question.roomQuestionId !== undefined && question.roundNo !== undefined && question.phase) {
      try {
        const timeMs = (question.timeLimitSec || 30) * 1000 - (timeLeft * 1000);
        
        // 답안 제출 (백엔드가 채점 및 점수 저장)
        await submitAnswer(roomId, {
          questionId: question.roomQuestionId,
          userAnswer: typingAnswer.trim(), // 실기 문제는 입력한 답안을 그대로 전송
          correct: isCorrect, // 백엔드가 채점하므로 프론트에서는 false로 전송
          timeMs: Math.max(0, timeMs),
          roundNo: question.roundNo,
          phase: question.phase,
        });

        // UI 표시용으로만 사용 (백엔드 채점 결과는 나중에 조회)
        setIsCorrect(isCorrect);
      } catch (error) {
        console.error("답안 제출 실패:", error);
        setIsCorrect(false);
        // 에러가 발생해도 게임은 계속 진행
      }
    } else {
      setIsCorrect(false);
    }

    // 점수는 백엔드에서 관리하므로 프론트에서 계산하지 않음
    // 백엔드에서 currentQuestion이 바뀌면 자동으로 다음 문제로 전환되므로
    // 여기서는 별도 처리 없음 (상태 초기화는 currentQuestion 변경 시 처리됨)
    setShowResult(true);
  };

  // 문제가 변경되면 상태 초기화
  useEffect(() => {
    if (currentQuestionFromServer && question) {
      setTypingAnswer("");
      setIsAnswered(false);
      setShowResult(false);
      setShowOpponentAnswer(false);
      setIsCorrect(false);
    }
  }, [currentQuestionFromServer, question]);

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

        {/* 여기까지 기존 UI 유지 (생략 가능) */}
        
        {/* Score Board */}
        <div className="mb-6 relative">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 shadow-lg animate-pulse">
              VS
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
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-gradient-to-br from-purple-400 to-pink-400">
                  <img
                    src={getProfileImage(mySkinId)}
                    alt={myUserId || "나"}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Target className="w-3 h-3" />
                <span>문제 {currentQuestionNumber !== null ? currentQuestionNumber : currentQuestionIndex + 1}</span>
              </div>
            </Card>

            {/* 상대 */}
            <Card className={`p-6 border-2 transition-all duration-300 ${
              showResult && !isCorrect
                ? "bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-400 shadow-lg scale-105"
                : "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-700 mb-1 font-semibold">{opponentUserId || opponentName}</p>
                  {opponentRank !== null && opponentRank !== undefined && (
                    <p className="text-xs text-blue-600">순위: {opponentRank}위</p>
                  )}
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
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                실기 모드 ⌨️
              </Badge>
              <span className="text-sm text-gray-600">
                {hasQuestion ? (currentQuestionNumber !== null ? currentQuestionNumber : currentQuestionIndex + 1) : "대기 중"}
              </span>
            </div>
            {hasQuestion && (
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
            )}
          </div>
          {hasQuestion && (
            <Progress
              value={currentQuestionNumber !== null ? (currentQuestionNumber / 20) * 100 : 0}
              className="h-2.5"
            />
          )}
        </Card>

        {/* 2단 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {hasQuestion ? (
            <>
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
                          <span>🤖</span>
                          <span>{opponentName}님도 문제를 풀었습니다!</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </>
          ) : (
            <>
              <Card className="p-8 border-2 border-purple-200 bg-white/90 backdrop-blur-sm shadow-lg">
                <div className="h-full flex flex-col items-center justify-center text-center min-h-[400px]">
                  <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">문제를 불러오는 중...</p>
                </div>
              </Card>
              <Card className="p-8 border-2 border-purple-200 bg-white/90 backdrop-blur-sm shadow-lg">
                <div className="h-full flex flex-col items-center justify-center text-center min-h-[400px]">
                  <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* 상대방 나감 오버레이 표시 */}
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
  );
}
