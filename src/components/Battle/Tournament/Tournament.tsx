import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card } from "../..//ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Trophy, FileText, Code, Users, Zap, ArrowLeft, Bot, CalendarPlus, RefreshCw, Clock } from "lucide-react";
import { startTournamentBotMatch, saveRoomId, type ExamMode, createTournamentPvPRoom, getWaitingRooms, type ScheduledRoom, joinRoom } from "../../api/versusApi";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../ui/dialog";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { getAuthItem } from "../../../utils/authStorage";

interface TournamentProps {
  onBack?: () => void;
}

export function Tournament({ onBack }: TournamentProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<{ written: boolean; practical: boolean }>({
    written: false,
    practical: false,
  });
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedExamMode, setSelectedExamMode] = useState<ExamMode>("WRITTEN");
  const [scheduledRooms, setScheduledRooms] = useState<ScheduledRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState<number | null>(null);

  // 대기 중인 방 목록 가져오기
  const fetchScheduledRooms = async () => {
    try {
      setLoadingRooms(true);
      const rooms = await getWaitingRooms("TOURNAMENT");
      setScheduledRooms(rooms);
      console.log("대기 중인 토너먼트 방 목록:", rooms);
    } catch (error: any) {
      console.error("대기 중인 방 목록 조회 실패:", error);
      toast.error("방 목록을 불러오는 데 실패했습니다.");
    } finally {
      setLoadingRooms(false);
    }
  };

  // 컴포넌트 마운트 시 방 목록 가져오기
  useEffect(() => {
    fetchScheduledRooms();
  }, []);

  const handleBotMatch = async (examMode: ExamMode) => {
    try {
      // 로딩 상태 설정
      setLoading(prev => ({ 
        ...prev, 
        [examMode === "PRACTICAL" ? "practical" : "written"]: true 
      }));

      // 토너먼트 봇전 시작
      const response = await startTournamentBotMatch(examMode);
      
      // roomId 저장
      saveRoomId(response.roomId);

      // 게임 화면으로 이동
      const gamePath = examMode === "PRACTICAL" 
        ? "/battle/tournament/game/practical"
        : "/battle/tournament/game/written";
      
      navigate(gamePath, {
        state: {
          roomId: response.roomId,
          examType: examMode === "PRACTICAL" ? "practical" : "written",
        }
      });
    } catch (error: any) {
      console.error("토너먼트 봇전 시작 실패:", error);
      toast.error(error.response?.data?.message || "봇전을 시작할 수 없습니다. 다시 시도해주세요.");
    } finally {
      setLoading(prev => ({ 
        ...prev, 
        [examMode === "PRACTICAL" ? "practical" : "written"]: false 
      }));
    }
  };

  // 방 생성 다이얼로그 열기
  const handleOpenCreateDialog = () => {
    setShowCreateDialog(true);
  };

  // 방 생성 실행
  const handleCreateRoom = async () => {
    try {
      setCreatingRoom(true);

      // 현재 사용자 ID 가져오기
      const currentUserId = getAuthItem("userId");
      const participants = currentUserId ? [currentUserId] : undefined;

      // 토너먼트 PvP 방 생성
      const response = await createTournamentPvPRoom(selectedExamMode, "NORMAL", participants);
      
      // roomId 저장
      saveRoomId(response.room.roomId);

      console.log("토너먼트 PvP 방 생성 성공:", response);
      
      toast.success(
        `방이 생성되었습니다! (방 ID: ${response.room.roomId})`,
        {
          description: "8명이 모이면 자동으로 시작됩니다.",
          duration: 3000,
        }
      );

      // 다이얼로그 닫기
      setShowCreateDialog(false);
      
      // 대기실로 바로 이동
      navigate(`/battle/tournament/game/${response.room.roomId}`);
    } catch (error: any) {
      console.error("토너먼트 PvP 방 생성 실패:", error);
      toast.error(
        "방 생성에 실패했습니다.",
        {
          description: error.response?.data?.message || error.message,
          duration: 5000,
        }
      );
    } finally {
      setCreatingRoom(false);
    }
  };

  // 한국 시각으로 표시
  const formatKoreanDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Seoul'
    });
  };

  // 상태 표시 텍스트
  const getStatusText = (status: string) => {
    if (status === "WAIT") {
      return "대기 중";
    }
    if (status === "IN_PROGRESS" || status === "ONGOING") {
      return "진행 중";
    }
    if (status === "COMPLETED") {
      return "완료";
    }
    if (status === "CANCELLED") {
      return "취소됨";
    }
    return status;
  };

  // 상태 뱃지 색상
  const getStatusBadgeClass = (status: string) => {
    if (status === "WAIT") {
      return "bg-green-100 text-green-700";
    }
    if (status === "IN_PROGRESS" || status === "ONGOING") {
      return "bg-blue-100 text-blue-700";
    }
    if (status === "COMPLETED") {
      return "bg-gray-100 text-gray-700";
    }
    if (status === "CANCELLED") {
      return "bg-red-100 text-red-700";
    }
    return "bg-gray-100 text-gray-700";
  };

  // 참가 가능 여부 확인 (토너먼트는 8명이 모이면 시작되므로 WAIT 상태이고 8명 미만이면 참가 가능)
  const canJoin = (status: string, participantCount: number) => {
    return status === "WAIT" && participantCount < 8;
  };

  // 방 참가 처리
  const handleJoinRoom = async (roomId: number) => {
    try {
      setJoiningRoomId(roomId);
      
      console.log(`방 ${roomId}에 참가 시도...`);
      const response = await joinRoom(roomId);
      
      console.log("방 참가 성공:", response);
      
      toast.success(
        `방에 참가했습니다! (방 ID: ${roomId})`,
        {
          description: `현재 참가자: ${response.room.participantCount}/8`,
          duration: 3000,
        }
      );
      
      // 방 상세 정보 로그 출력
      console.log("=== 방 참가 정보 ===");
      console.log("방 ID:", response.room.roomId);
      console.log("참가자 수:", response.room.participantCount);
      console.log("방 상태:", response.room.status);
      console.log("참가자 목록:", response.participants);
      
      // 대기 페이지로 이동
      navigate(`/battle/tournament/game/${response.room.roomId}`);
    } catch (error: any) {
      console.error("방 참가 실패:", error);
      
      // 에러 메시지 파싱
      const errorMessage = error.response?.data?.message || error.message;
      
      if (error.response?.status === 401) {
        toast.error(
          "인증 실패",
          {
            description: "로그인이 필요합니다.",
            duration: 5000,
          }
        );
      } else if (error.response?.status === 403) {
        toast.error(
          "참가 불가",
          {
            description: "방이 가득 찼거나 참가할 수 없습니다.",
            duration: 5000,
          }
        );
      } else if (error.response?.status === 404) {
        toast.error(
          "방을 찾을 수 없습니다",
          {
            description: "방이 삭제되었거나 존재하지 않습니다.",
            duration: 5000,
          }
        );
        // 방 목록 새로고침
        fetchScheduledRooms();
      } else {
        // "Already join" 메시지인 경우 사용자 친화적인 메시지로 변경
        const displayMessage = errorMessage?.includes("Already join") || errorMessage?.includes("already join")
          ? "잠시 기다렸다가 다시 시도해보세요."
          : errorMessage;
        
        toast.error(
          "방 참가에 실패했습니다",
          {
            description: displayMessage,
            duration: 5000,
          }
        );
      }
    } finally {
      setJoiningRoomId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-8 h-8 text-blue-600" />
                <h1 className="text-blue-900">토너먼트</h1>
              </div>
              <p className="text-gray-600">8명이 참여하는 실시간 토너먼트에 도전하세요!</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => handleBotMatch("WRITTEN")}
                disabled={loading.written}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
              >
                <Bot className="w-4 h-4 mr-2" />
                {loading.written ? "매칭 중..." : "봇과 매칭 (필기)"}
              </Button>
              <Button
                onClick={() => handleBotMatch("PRACTICAL")}
                disabled={loading.practical}
                size="lg"
                variant="outline"
                className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <Bot className="w-4 h-4 mr-2" />
                {loading.practical ? "매칭 중..." : "봇과 매칭 (실기)"}
              </Button>
              <Button
                onClick={handleOpenCreateDialog}
                disabled={creatingRoom}
                size="lg"
                variant="outline"
                className="border-2 border-green-500 text-green-600 hover:bg-green-50"
              >
                <CalendarPlus className="w-4 h-4 mr-2" />
                PVP 방 만들기
              </Button>
            </div>
          </div>
        </div>

        {/* Tournament Info */}
        <Card className="p-6 mb-8 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
          <div className="flex items-start gap-4">
            <Trophy className="w-8 h-8 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-blue-900 mb-3">토너먼트 게임 안내</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-white/60 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <span className="text-xl">🏆</span>
                    <span>8강</span>
                  </div>
                  <p className="text-gray-700">8명이 모이면 자동 시작</p>
                </div>
                <div className="p-4 bg-white/60 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <span className="text-xl">⚔️</span>
                    <span>4강 → 결승</span>
                  </div>
                  <p className="text-gray-700">라운드별 5문제</p>
                </div>
                <div className="p-4 bg-white/60 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <span className="text-xl">🎁</span>
                    <span>우승 보상</span>
                  </div>
                  <p className="text-gray-700">2000 XP + 특별 뱃지</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Active Rooms */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-blue-900">입장 가능한 토너먼트</h2>
            <Button
              onClick={fetchScheduledRooms}
              disabled={loadingRooms}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingRooms ? "animate-spin" : ""}`} />
              새로고침
            </Button>
          </div>
          
          {loadingRooms ? (
            <Card className="p-8 text-center border-2 border-blue-200">
              <div className="text-4xl mb-3">🏆</div>
              <p className="text-gray-600">방 목록을 불러오는 중...</p>
            </Card>
          ) : scheduledRooms.length === 0 ? (
            <Card className="p-8 text-center border-2 border-gray-200">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-600 mb-2">입장 가능한 토너먼트 방이 없습니다.</p>
              <p className="text-sm text-gray-500">새로운 방을 만들어보세요!</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {scheduledRooms.map((room) => (
                <Card
                  key={room.roomId}
                  className="p-6 border-2 border-blue-200 hover:shadow-xl transition-all hover:border-blue-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 flex-1">
                      <div
                        className={`w-20 h-20 rounded-full flex items-center justify-center ${
                          canJoin(room.status, room.participantCount)
                            ? "bg-gradient-to-br from-green-400 to-emerald-400"
                            : "bg-gradient-to-br from-blue-400 to-cyan-400"
                        }`}
                      >
                        <Trophy className="w-10 h-10 text-white" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-gray-900">토너먼트 #{room.roomId}</h3>
                          <Badge
                            variant="secondary"
                            className={getStatusBadgeClass(room.status)}
                          >
                            {getStatusText(room.status)}
                          </Badge>
                          {room.examMode && (
                            <Badge
                              variant="outline"
                              className={
                                room.examMode === "WRITTEN"
                                  ? "bg-blue-50 text-blue-700 border-blue-300"
                                  : "bg-purple-50 text-purple-700 border-purple-300"
                              }
                            >
                              {room.examMode === "WRITTEN" ? (
                                <>
                                  <FileText className="w-3 h-3 mr-1" />
                                  필기
                                </>
                              ) : (
                                <>
                                  <Code className="w-3 h-3 mr-1" />
                                  실기
                                </>
                              )}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          {room.scheduledAt && (
                            <div>
                              <p className="text-gray-600 mb-1">시작 시간</p>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-800">
                                  {formatKoreanDateTime(room.scheduledAt)}
                                </span>
                              </div>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-600 mb-1">참가자</p>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-800">
                                {room.participantCount}/8
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-600 mb-1">방 생성</p>
                            <p className="text-gray-800 text-xs">
                              {formatKoreanDateTime(room.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-900">
                            {canJoin(room.status, room.participantCount)
                              ? `✅ 지금 입장할 수 있습니다! (${room.participantCount}/8명)`
                              : room.status === "WAIT" && room.participantCount >= 8
                              ? "⏰ 8명이 모여 곧 시작됩니다!"
                              : room.status === "IN_PROGRESS" || room.status === "ONGOING"
                              ? "🎮 게임이 진행 중입니다"
                              : "대기 중"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="ml-6">
                      <Button
                        onClick={() => handleJoinRoom(room.roomId)}
                        disabled={!canJoin(room.status, room.participantCount) || joiningRoomId === room.roomId}
                        size="lg"
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white disabled:opacity-50"
                      >
                        {joiningRoomId === room.roomId ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            참가 중...
                          </>
                        ) : canJoin(room.status, room.participantCount) ? (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            참가하기
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 mr-2" />
                            대기 중
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-8 flex justify-center">
          <Button 
            onClick={onBack || (() => navigate("/battle"))} 
            variant="outline" 
            className="border-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로 가기
          </Button>
        </div>
      </div>

      {/* 방 생성 다이얼로그 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>토너먼트 PVP 방 만들기</DialogTitle>
            <DialogDescription>
              8명이 모이면 자동으로 시작되는 토너먼트 방을 생성합니다. 다른 사용자들도 참가할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* 시험 모드 선택 */}
            <div className="space-y-2">
              <Label htmlFor="examMode">시험 모드</Label>
              <Select value={selectedExamMode} onValueChange={(value) => setSelectedExamMode(value as ExamMode)}>
                <SelectTrigger id="examMode">
                  <SelectValue placeholder="시험 모드 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WRITTEN">필기</SelectItem>
                  <SelectItem value="PRACTICAL">실기</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 인원 안내 */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>토너먼트:</strong> 최대 8명까지 참가 가능
              </p>
              <p className="text-xs text-blue-700 mt-1">
                8명이 모이면 자동으로 시작됩니다.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={creatingRoom}
            >
              취소
            </Button>
            <Button
              onClick={handleCreateRoom}
              disabled={creatingRoom}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
            >
              {creatingRoom ? "생성 중..." : "방 만들기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
