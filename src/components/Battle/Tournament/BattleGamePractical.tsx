import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Progress } from "../../ui/progress";
import { Input } from "../../ui/input";
import { Swords, Clock, Zap, Sparkles, Target } from "lucide-react";
import type { Question } from "../../../types";
import { OpponentLeftOverlay } from "../OpponentLeftOverlay";
import { submitAnswer, getScoreboard, type ScoreboardItem } from "../../api/versusApi";

// 캐릭터 이미지 import
import girlBasicCharacter from "../../assets/characters/girl_basic_noBackGround.png";
import boyNerdCharacter from "../../assets/characters/boy_nerd_noBackGround.png";
import girlUniformCharacter from "../../assets/characters/girl_uniform_noBackGround.png";
import girlPajamaCharacter from "../../assets/characters/girl_pajama_noBackGround.png";
import girlMarriedCharacter from "../../assets/characters/girl_married_noBackGround.png";
import girlNerdCharacter from "../../assets/characters/girl_nerd_noBackGround.png";
import girlIdolCharacter from "../../assets/characters/girl_idol_noBackGround.png";
import girlGhostCharacter from "../../assets/characters/girl_ghost._noBackGround.png";
import girlCyberpunkCharacter from "../../assets/characters/girl_cyberpunk_noBackGround.png";
import girlChinaCharacter from "../../assets/characters/girl_china_noBackGround.png";
import girlCatCharacter from "../../assets/characters/girl_cat_noBackGround.png";
import boyWorkerCharacter from "../../assets/characters/boy_worker_noBackGround.png";
import boyPoliceofficerCharacter from "../../assets/characters/boy_policeofficer_noBackGround.png";
import boyHiphopCharacter from "../../assets/characters/boy_hiphop_noBackGround.png";
import boyDogCharacter from "../../assets/characters/boy_dog_noBackGround.png";
import boyBasicCharacter from "../../assets/characters/boy_basic_noBackGround.png";
import boyAgentCharacter from "../../assets/characters/boy_agent_noBackGround.png";

// skinId를 캐릭터 이미지로 매핑
const CHARACTER_IMAGE_MAP: Record<number, string> = {
  1: girlBasicCharacter,
  2: boyNerdCharacter,
  3: girlUniformCharacter,
  4: girlPajamaCharacter,
  5: girlMarriedCharacter,
  6: girlNerdCharacter,
  7: girlIdolCharacter,
  8: girlGhostCharacter,
  9: girlCyberpunkCharacter,
  10: girlChinaCharacter,
  11: girlCatCharacter,
  12: boyWorkerCharacter,
  13: boyPoliceofficerCharacter,
  14: boyHiphopCharacter,
  15: boyDogCharacter,
  16: boyBasicCharacter,
  17: boyAgentCharacter,
};

interface BattleGamePracticalProps {
  questions: Question[];
  roomId?: number; // 답안 제출용
  opponentName?: string; // 토너먼트에서는 사용하지 않지만 호환성을 위해 유지
  myUserId?: string;
  opponentUserId?: string; // 토너먼트에서는 사용하지 않지만 호환성을 위해 유지
  myRank?: number | null;
  opponentRank?: number | null; // 토너먼트에서는 사용하지 않지만 호환성을 위해 유지
  endTime?: string; // currentQuestion.endTime (ISO 8601 형식)
  onComplete: (myScore: number, opponentScore: number) => void;
  onExit: () => void;
}

export function BattleGamePractical({
  questions,
  roomId,
  myUserId,
  myRank,
  endTime,
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
  const [opponentName, setOpponentName] = useState<string>("상대방");
  const [previousParticipantCount, setPreviousParticipantCount] = useState<number | null>(null);
  const [participants, setParticipants] = useState<ScoreboardItem[]>([]);
  const [previousCorrectCount, setPreviousCorrectCount] = useState<number | null>(null); // 이전 정답 개수 저장
  const [isAlive, setIsAlive] = useState<boolean>(true); // 탈락 여부

  // questions가 없거나 비어있으면 예외 처리
  const totalQuestions = questions?.length || 0;
  const question = questions?.[currentQuestion];
  const [timeLeft, setTimeLeft] = useState(0); // endTime 기준으로 계산


  // 스코어보드 폴링 (점수 업데이트 및 상대방 이탈 감지)
  useEffect(() => {
    if (!roomId) return;

    const pollScoreboard = async () => {
      try {
        const scoreboard = await getScoreboard(roomId);

        // 내 점수 및 탈락 여부 업데이트 (백엔드에서 계산된 점수)
        const myItem = scoreboard.items.find(item => item.userId === myUserId);
        if (myItem) {
          setMyScore(myItem.score);
          setIsAlive(myItem.alive); // 탈락 여부 업데이트
        }

        // 참가자 목록 업데이트 (최대 8명)
        const sortedParticipants = [...scoreboard.items]
          .sort((a, b) => a.rank - b.rank)
          .slice(0, 8);
        setParticipants(sortedParticipants);

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

    // 2초마다 폴링
    const pollingInterval = setInterval(pollScoreboard, 2000);

    return () => clearInterval(pollingInterval);
  }, [roomId, myUserId, previousParticipantCount]);

  // questions가 없거나 비어있으면 화면 구조는 유지하되 문제 부분만 대기 표시
  const hasQuestion = questions && Array.isArray(questions) && questions.length > 0 && question;
  
  // 답안 제출 중복 방지를 위한 ref
  const isSubmittingRef = useRef(false);

  // 새 문제가 로드될 때 상태 리셋
  useEffect(() => {
    if (hasQuestion && question) {
      setIsAnswered(false);
      setShowResult(false);
      setShowOpponentAnswer(false);
      setIsCorrect(false);
      setTypingAnswer("");
      isSubmittingRef.current = false; // 제출 플래그도 리셋
    }
  }, [question?.id, hasQuestion]);

  // Handle answer - 백엔드가 채점하므로 프론트에서는 답안만 제출
  const handleAnswer = useCallback(async () => {
    // 탈락했거나 이미 제출 중이거나 답변했으면 중복 호출 방지
    if (!isAlive || isAnswered || isSubmittingRef.current) return;
    
    isSubmittingRef.current = true;
    setIsAnswered(true);
    setShowOpponentAnswer(true);

    // 답안 제출 API 호출 (서버가 채점 및 timeMs 계산)
    if (roomId && question?.roomQuestionId !== undefined && question.roundNo !== undefined && question.phase) {
      try {
        // 서버 응답 받기
        const response = await submitAnswer(roomId, {
          questionId: question.roomQuestionId,
          userAnswer: typingAnswer.trim(), // 실기 문제는 입력한 답안을 그대로 전송
          correct: false, // 서버가 채점하므로 프론트에서는 false로 전송
          timeMs: 0, // 백엔드가 계산하므로 0으로 전송 (실제로는 백엔드가 계산)
          roundNo: question.roundNo,
          phase: question.phase,
        });

        // 서버 응답의 scoreboard에서 내 점수 확인
        const myItem = response.items.find(item => item.userId === myUserId);
        if (myItem) {
          setMyScore(myItem.score);
          // 이전 correctCount와 비교하여 정답 여부 판단
          const wasCorrect = previousCorrectCount !== null 
            ? myItem.correctCount > previousCorrectCount 
            : myItem.correctCount > 0; // 첫 문제인 경우
          setIsCorrect(wasCorrect);
          // 다음 문제를 위해 현재 correctCount 저장
          setPreviousCorrectCount(myItem.correctCount);
        }
      } catch (error) {
        console.error("답안 제출 실패:", error);
        setIsCorrect(false);
        // 에러가 발생해도 게임은 계속 진행
      }
    } else {
      setIsCorrect(false);
    }

    setShowResult(true);
    // 다음 문제는 scoreboard 폴링으로 자동 감지되므로 여기서는 결과만 표시
  }, [roomId, question?.roomQuestionId, question?.roundNo, question?.phase, typingAnswer, myUserId, isAnswered, isAlive, previousCorrectCount]);

  // endTime 기준으로 남은 시간 계산 (백엔드 시간 기준)
  useEffect(() => {
    if (!endTime || !hasQuestion) return;

    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(remaining);

      // 시간이 만료되었고 아직 답변하지 않았으면 자동 제출 (탈락하지 않은 경우만)
      if (remaining === 0 && isAlive && !isAnswered && !isSubmittingRef.current) {
        handleAnswer();
      }
    };

    // 즉시 실행
    updateTimeLeft();

    // 100ms마다 업데이트 (더 정확한 표시)
    const timer = setInterval(updateTimeLeft, 100);

    return () => clearInterval(timer);
  }, [endTime, hasQuestion, question?.id, isAnswered, handleAnswer]);

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
        {/* 참가자 캐릭터 그리드 */}
        <div className="mb-6">
          <Card className="p-4 border-2 border-purple-200 bg-white/80 backdrop-blur-sm">
            <div className="grid grid-cols-8 gap-2">
              {Array.from({ length: 8 }).map((_, index) => {
                const participant = participants[index];
                const isMe = participant?.userId === myUserId;
                const characterImage = participant 
                  ? (CHARACTER_IMAGE_MAP[participant.skinId] || CHARACTER_IMAGE_MAP[1])
                  : null;

                return (
                  <div
                    key={index}
                    className={`relative flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${
                      participant
                        ? isMe
                          ? "bg-gradient-to-br from-purple-100 to-pink-100 border-purple-400 shadow-md"
                          : "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300"
                        : "bg-gray-100 border-gray-200"
                    }`}
                  >
                    {characterImage ? (
                      <>
                        <img
                          src={characterImage}
                          alt={participant.nickname || participant.userId}
                          className={`w-12 h-12 md:w-16 md:h-16 object-contain ${
                            !participant.alive ? "grayscale opacity-50" : ""
                          }`}
                        />
                        {isMe && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white"></div>
                        )}
                        <p className="text-xs text-gray-700 mt-1 text-center truncate w-full">
                          {participant.nickname || participant.userId}
                        </p>
                        <p className="text-xs font-semibold text-purple-600">
                          {participant.score}점
                        </p>
                      </>
                    ) : (
                      <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-gray-400">
                        <span className="text-2xl">-</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Timer */}
        <Card className="p-5 mb-6 border-2 border-purple-200 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                실기 모드 ⌨️
              </Badge>
              <span className="text-sm text-gray-600">
                {hasQuestion && question?.roundNo ? `Round ${question.roundNo}` : "대기 중"}
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
              value={((currentQuestion + 1) / totalQuestions) * 100}
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
                        if (e.key === "Enter" && isAlive && !isAnswered && typingAnswer.trim()) {
                          handleAnswer();
                        }
                      }}
                      placeholder="답변을 입력하세요..."
                      disabled={!isAlive || isAnswered}
                      className="bg-white border-2 border-orange-300 focus:border-orange-500 disabled:opacity-60"
                    />
                  </div>
                  {isAlive && !isAnswered && typingAnswer.trim() && (
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
            </>
          ) : (
            <>
              <Card className="p-8 border-2 border-purple-200 bg-white/90 backdrop-blur-sm shadow-lg">
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              </Card>
              <Card className="p-8 border-2 border-purple-200 bg-white/90 backdrop-blur-sm shadow-lg">
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* 상대방 이탈 오버레이 */}
      {opponentLeft && (
        <OpponentLeftOverlay
          opponentName={opponentName}
          myScore={myScore}
          opponentScore={opponentScore}
          onConfirm={() => {
            setOpponentLeft(false);
            onExit(); // 홈으로 나가기
          }}
        />
      )}
    </div>
  );
}
