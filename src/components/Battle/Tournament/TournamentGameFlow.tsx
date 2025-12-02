import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BattleGameWritten } from "./BattleGameWritten";
import { BattleGamePractical } from "./BattleGamePractical";
import { getRoomDetail, getSavedRoomId, getRoomQuestions } from "../../api/versusApi";
import axios from "../../api/axiosConfig";
import type { Question } from "../../../types";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";

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

  const currentRoomId = roomId || getSavedRoomId();
  const currentExamType: ExamType = examType || "written";

  // 방 정보 및 문제 조회
  useEffect(() => {
    const fetchGameData = async () => {
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

        // 2. 방 정보 조회
        const roomDetail = await getRoomDetail(currentRoomId);

        // 3. 참가자 정보에서 내 순위 가져오기
        const myParticipant = roomDetail.participants.find(
          (p) => p.userId === currentUserId
        );
        if (myParticipant) {
          setMyRank(myParticipant.rank);
        }

        // 4. 방의 문제 목록 조회
        try {
          const roomQuestions = await getRoomQuestions(currentRoomId);
          
          if (roomQuestions.length === 0) {
            throw new Error("문제가 없습니다");
          }

          // 각 questionId에 대해 문제 상세 정보 가져오기
          const questionPromises = roomQuestions.map(async (roomQ) => {
            try {
              // versus API 사용 (필기/실기 공통)
              const res = await axios.get(`/study/versus/questions/${roomQ.questionId}`);
              const data = res.data;

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
                      label: choice.label || "",
                      text: choice.content || choice.text || ""
                    }));
                  }
                } catch (e) {
                  console.error("payloadJson 파싱 실패", e);
                }
              }

              // API 응답을 Question 타입으로 변환
              const question: Question = {
                id: String(data.id || roomQ.questionId),
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
                timeLimitSec: roomQ.timeLimitSec, // RoomQuestion의 timeLimitSec 사용
                roomQuestionId: roomQ.questionId, // 답안 제출용
                roundNo: roomQ.roundNo, // 답안 제출용
                phase: roomQ.phase // 답안 제출용
              };

              return question;
            } catch (err) {
              console.error(`문제 ${roomQ.questionId} 상세 정보 불러오기 실패:`, err);
              return null;
            }
          });

          const questionsData = await Promise.all(questionPromises);
          const validQuestions = questionsData.filter((q): q is Question => q !== null);

          if (validQuestions.length === 0) {
            throw new Error("문제를 불러올 수 없습니다");
          }

          setQuestions(validQuestions);
        } catch (err) {
          console.error("문제 조회 실패", err);
          setError("문제를 불러오는데 실패했습니다. 다시 시도해주세요.");
        }
      } catch (err) {
        console.error("게임 데이터 조회 실패", err);
        setError("게임 데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [currentRoomId, currentExamType]);

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

  const GameComponent =
    currentExamType === "practical" ? BattleGamePractical : BattleGameWritten;

  return (
    <GameComponent
      questions={questions}
      roomId={currentRoomId}
      myUserId={myUserId || undefined}
      myRank={myRank}
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

