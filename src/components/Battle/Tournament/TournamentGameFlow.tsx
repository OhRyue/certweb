import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BattleGameWritten } from "./BattleGameWritten";
import { BattleGamePractical } from "./BattleGamePractical";
import { getSavedRoomId, getRoomState, getScoreboard, getVersusQuestion } from "../../api/versusApi";
import axios from "../../api/axiosConfig";
import type { Question } from "../../../types";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";

type ExamType = "written" | "practical";

export function TournamentGameFlow() {
  const navigate = useNavigate();
  const location = useLocation();

  const { roomId, examType } = (location.state as {
    roomId?: number;
    examType?: ExamType;
    startedAt?: string;
  }) || {};

  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);
  const [currentQuestionEndTime, setCurrentQuestionEndTime] = useState<string | null>(null);
  const currentQuestionIdRef = useRef<number | null>(null);
  const [gameStatus, setGameStatus] = useState<string>(""); // 게임 상태 (WAIT, IN_PROGRESS, DONE 등)
  const [finalScoreboard, setFinalScoreboard] = useState<any>(null); // 최종 스코어보드

  const currentRoomId = roomId || getSavedRoomId();
  const currentExamType: ExamType = examType || "written";

  // 문제를 Question 타입으로 변환하는 함수
  const convertToQuestion = (data: any, questionId: number, roundNo: number, phase: string, timeLimitSec: number): Question => {
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
    if (data.payloadJson) {
      try {
        const payload = typeof data.payloadJson === "string" 
          ? JSON.parse(data.payloadJson) 
          : data.payloadJson;
        if (payload.choices && Array.isArray(payload.choices)) {
          options = payload.choices.map((choice: { label?: string; content?: string; text?: string }) => ({
            label: choice.label || "", // 백엔드에서 받은 label (예: "A", "B", "C", "D")
            text: choice.content || choice.text || "" // 백엔드에서 받은 content를 text 필드에 저장
          }));
        }
      } catch (e) {
        console.error("payloadJson 파싱 실패", e);
      }
    }

    return {
      id: String(data.id || questionId),
      topicId: "",
      tags: [],
      difficulty: convertDifficulty(data.difficulty || "NORMAL"),
      type: convertType(data.type || "MCQ", data.mode || "WRITTEN"),
      examType: convertMode(data.mode || "WRITTEN"),
      question: data.stem || "",
      options: options,
      correctAnswer: data.answerKey !== undefined 
        ? (typeof data.answerKey === "string" ? answerKeyToIndex(data.answerKey) : data.answerKey)
        : 0,
      explanation: data.solutionText || "",
      imageUrl: undefined,
      timeLimitSec: timeLimitSec,
      roomQuestionId: questionId,
      roundNo: roundNo,
      phase: phase as "MAIN" | "REVIVAL"
    };
  };

  // 현재 문제 가져오기
  const fetchCurrentQuestion = async (questionId: number, roundNo: number, phase: string, timeLimitSec: number, endTime?: string) => {
    try {
      const data = await getVersusQuestion(questionId);
      const question = convertToQuestion(data, questionId, roundNo, phase, timeLimitSec);
      setQuestions([question]); // 현재 문제만 유지
      if (endTime) {
        setCurrentQuestionEndTime(endTime);
      }
    } catch (err) {
      console.error(`문제 ${questionId} 상세 정보 불러오기 실패:`, err);
      setError("문제를 불러오는데 실패했습니다.");
    }
  };

  // 초기 설정 (한번만 실행)
  useEffect(() => {
    const initializeGame = async () => {
      if (!currentRoomId) {
        setError("방 정보를 찾을 수 없습니다.");
        setLoading(false);
        return;
      }

      try {
        // 1. 현재 사용자 정보 가져오기
        const profileRes = await axios.get("/account/profile");
        const currentUserId = profileRes.data.userId || profileRes.data.id;
        setMyUserId(currentUserId);

        // 2. 초기 방 상태 조회 (한번만)
        const roomState = await getRoomState(currentRoomId);
        const roomDetail = roomState.detail;

        // 3. 참가자 정보에서 내 순위 가져오기
        const myParticipant = roomDetail.participants.find(
          (p) => p.userId === currentUserId
        );
        if (myParticipant) {
          setMyRank(myParticipant.rank);
        }

        // 4. 초기 currentQuestion 확인
        const initialCurrentQuestion = roomDetail.scoreboard.currentQuestion;
        if (initialCurrentQuestion) {
          currentQuestionIdRef.current = initialCurrentQuestion.questionId;
          setCurrentQuestionId(initialCurrentQuestion.questionId);
          await fetchCurrentQuestion(
            initialCurrentQuestion.questionId,
            initialCurrentQuestion.roundNo,
            initialCurrentQuestion.phase,
            initialCurrentQuestion.timeLimitSec,
            initialCurrentQuestion.endTime
          );
        } else {
          // currentQuestion이 null인 경우 (문제를 불러오는 중이거나 쉬는 시간)
          setQuestions([]);
          setCurrentQuestionId(null);
          setCurrentQuestionEndTime(null);
        }

        setLoading(false);
      } catch (err) {
        console.error("게임 초기화 실패", err);
        setError("게임 데이터를 불러오는데 실패했습니다.");
        setLoading(false);
      }
    };

    initializeGame();
  }, [currentRoomId]);

  // scoreboard 폴링으로 currentQuestion 추적
  useEffect(() => {
    if (!currentRoomId || loading) return;
    
    // 이미 게임이 종료된 경우 폴링하지 않음
    if (gameStatus === "DONE") return;

    const pollScoreboard = async () => {
      try {
        const scoreboard = await getScoreboard(currentRoomId);
        
        // 게임 상태 업데이트
        setGameStatus(scoreboard.status);
        
        // 게임이 종료되었는지 확인
        if (scoreboard.status === "DONE") {
          setFinalScoreboard(scoreboard);
          // 폴링은 useEffect cleanup에서 중지됨
          return;
        }

        const currentQuestion = scoreboard.currentQuestion;

        // currentQuestion이 null인 경우 (문제를 불러오는 중이거나 쉬는 시간)
        if (!currentQuestion) {
          setQuestions([]); // 문제 목록 비우기
          setCurrentQuestionId(null);
          setCurrentQuestionEndTime(null);
          currentQuestionIdRef.current = null;
          return;
        }

        // currentQuestion이 변경되었는지 확인
        if (currentQuestion.questionId !== currentQuestionIdRef.current) {
          console.log("새 문제 감지:", currentQuestion.questionId);
          currentQuestionIdRef.current = currentQuestion.questionId;
          setCurrentQuestionId(currentQuestion.questionId);
          
          // 새 문제 가져오기
          await fetchCurrentQuestion(
            currentQuestion.questionId,
            currentQuestion.roundNo,
            currentQuestion.phase,
            currentQuestion.timeLimitSec,
            currentQuestion.endTime
          );
        } else if (currentQuestion.endTime !== currentQuestionEndTime) {
          // endTime이 업데이트된 경우 (같은 문제지만 시간 갱신)
          setCurrentQuestionEndTime(currentQuestion.endTime);
        }
      } catch (err) {
        console.error("스코어보드 조회 실패:", err);
      }
    };

    // 2초마다 폴링
    const interval = setInterval(pollScoreboard, 2000);

    return () => clearInterval(interval);
  }, [currentRoomId, loading, gameStatus]);

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">게임을 준비하고 있습니다...</p>
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-red-500 font-semibold mb-4">{error}</p>
          <Button onClick={() => navigate("/battle/tournament")}>
            토너먼트로 돌아가기
          </Button>
        </Card>
      </div>
    );
  }

  // 게임 종료 시 결과 화면 표시
  if (gameStatus === "DONE" && finalScoreboard) {
    const myItem = finalScoreboard.items.find((item: any) => item.userId === myUserId);
    const myScore = myItem?.score || 0;
    const myRank = myItem?.rank || null;
    
    // 최종 순위 정렬
    const sortedParticipants = [...finalScoreboard.items]
      .sort((a, b) => a.rank - b.rank);

    return (
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 border-2 border-purple-200 bg-white/90 backdrop-blur-sm shadow-2xl">
            {/* 결과 헤더 */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 bg-gradient-to-br from-purple-400 to-pink-400">
                <span className="text-5xl">🏆</span>
              </div>
              <h1 className="text-3xl font-bold text-purple-900 mb-2">토너먼트 종료!</h1>
              <p className="text-gray-600">게임이 완료되었습니다</p>
            </div>

            {/* 내 결과 */}
            <Card className="p-6 mb-6 border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">나의 최종 결과</p>
                <div className="text-4xl font-bold text-purple-700 mb-2">{myScore}점</div>
                {myRank !== null && (
                  <Badge className="bg-purple-500 text-white text-lg px-4 py-2">
                    {myRank}위
                  </Badge>
                )}
              </div>
            </Card>

            {/* 최종 순위표 */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">최종 순위</h2>
              <div className="space-y-2">
                {sortedParticipants.map((participant: any, index: number) => {
                  const isMe = participant.userId === myUserId;
                  return (
                    <Card
                      key={participant.userId}
                      className={`p-4 border-2 ${
                        isMe
                          ? "bg-gradient-to-br from-purple-100 to-pink-100 border-purple-400"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            participant.rank === 1
                              ? "bg-yellow-400 text-yellow-900"
                              : participant.rank === 2
                              ? "bg-gray-300 text-gray-700"
                              : participant.rank === 3
                              ? "bg-orange-300 text-orange-700"
                              : "bg-gray-200 text-gray-600"
                          }`}>
                            {participant.rank}
                          </div>
                          <div>
                            <p className={`font-semibold ${isMe ? "text-purple-700" : "text-gray-800"}`}>
                              {participant.nickname || participant.userId}
                              {isMe && " (나)"}
                            </p>
                            <p className="text-sm text-gray-600">
                              정답: {participant.correctCount}/{participant.totalCount}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-purple-600">{participant.score}점</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-4">
              <Button
                onClick={() => navigate("/battle/tournament")}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                토너먼트로 돌아가기
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const GameComponent =
    currentExamType === "practical" ? BattleGamePractical : BattleGameWritten;

  return (
    <GameComponent
      questions={questions}
      roomId={currentRoomId}
      myUserId={myUserId || undefined}
      myRank={myRank}
      endTime={currentQuestionEndTime || undefined}
      onComplete={(myScore, opponentScore) => {
        // TODO: 토너먼트 결과 처리
        console.log("토너먼트 게임 완료", { myScore, opponentScore });
        navigate("/battle/tournament/bracket", {
          state: { roomId: currentRoomId, myScore },
        });
      }}
      onExit={() => navigate("/battle/tournament")}
    />
  );
}

