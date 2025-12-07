import { useState, useEffect } from "react";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Bell, Users, Clock, Award, Zap, Bot, CalendarPlus, RefreshCw, FileText, Code } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { type ExamMode, type Difficulty, createGoldenBellRoom, getScheduledRooms, type ScheduledRoom, joinRoom } from "../../api/versusApi";
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
import { Input } from "../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

export function GoldenBell() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState("");
  const [selectedExamMode, setSelectedExamMode] = useState<ExamMode>("WRITTEN");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("NORMAL");
  const [scheduledRooms, setScheduledRooms] = useState<ScheduledRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState<number | null>(null);

  // 예약된 방 목록 가져오기
  const fetchScheduledRooms = async () => {
    try {
      setLoadingRooms(true);
      const rooms = await getScheduledRooms("GOLDENBELL");
      setScheduledRooms(rooms);
      console.log("예약된 골든벨 방 목록:", rooms);
    } catch (error: any) {
      console.error("예약된 방 목록 조회 실패:", error);
      toast.error("방 목록을 불러오는 데 실패했습니다.");
    } finally {
      setLoadingRooms(false);
    }
  };

  // 컴포넌트 마운트 시 방 목록 가져오기
  useEffect(() => {
    fetchScheduledRooms();
  }, []);

  const handleBotMatch = async (examMode: ExamMode = "WRITTEN") => {
    // API 호출은 GoldenBellBotGameWrapper에서 수행하므로 여기서는 네비게이션만 수행
    setLoading(true);
    // 봇전 페이지로 이동 (roomId는 GoldenBellBotGameWrapper에서 생성)
    navigate(`/battle/goldenbell/bot/new?examMode=${examMode}`);
    // loading 상태는 페이지 이동 후 리셋되므로 여기서는 설정만 함
  };

  // 방 생성 다이얼로그 열기
  const handleOpenCreateDialog = () => {
    // 현재 시각으로부터 1시간 후로 기본값 설정
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    now.setSeconds(0);
    const defaultDateTime = now.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm" 형식
    setSelectedDateTime(defaultDateTime);
    setShowCreateDialog(true);
  };

  // 방 생성 실행
  const handleCreateRoom = async () => {
    if (!selectedDateTime) {
      toast.error("시작 시각을 선택해주세요.");
      return;
    }

    try {
      setCreatingRoom(true);
      
      // datetime-local input 값을 한국 시각(KST, UTC+9)로 명시적으로 해석
      // input 값: "2025-12-05T11:30" 형태
      const dateTimeStr = selectedDateTime; // "2025-12-05T11:30"
      
      // 한국 시각임을 명시 (타임존 +09:00 추가)
      const koreanDateStr = dateTimeStr + ":00+09:00"; // "2025-12-05T11:30:00+09:00"
      
      // Date 객체로 변환 (자동으로 UTC로 변환됨)
      const date = new Date(koreanDateStr);
      
      // 현재 시각과 비교하여 과거 시각인지 확인
      const now = new Date();
      if (date <= now) {
        toast.error(
          "시작 시각을 현재 시각보다 늦게 설정해주세요.",
          {
            description: "과거 시각으로는 방을 생성할 수 없습니다.",
            duration: 5000,
          }
        );
        setCreatingRoom(false);
        return;
      }
      
      const scheduledAt = date.toISOString(); // UTC 시각으로 변환됨 (예: "2025-12-05T02:30:00Z")
      
      const response = await createGoldenBellRoom(selectedExamMode, selectedDifficulty, scheduledAt);
      
      console.log("방 생성 성공:", response);
      
      // 한국 시각으로 표시 (입력된 Date 객체 사용)
      const koreanDisplayStr = date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Seoul'
      });
      
      toast.success(
        `방이 생성되었습니다! (방 ID: ${response.room.roomId})`,
        {
          description: `${koreanDisplayStr}에 시작됩니다.`,
          duration: 5000,
        }
      );
      
      // 방 상세 정보 로그 출력
      console.log("=== 방 생성 정보 ===");
      console.log("방 ID:", response.room.roomId);
      console.log("모드:", response.room.mode);
      console.log("상태:", response.room.status);
      console.log("시험 모드:", selectedExamMode);
      console.log("난이도:", selectedDifficulty);
      console.log("입력된 시각:", selectedDateTime);
      console.log("한국 시각 문자열:", koreanDateStr);
      console.log("예약 시각(UTC):", scheduledAt);
      console.log("예약 시각(한국 표시):", koreanDisplayStr);
      console.log("참가자 수:", response.room.participantCount);
      console.log("생성 시각:", response.room.createdAt);
      console.log("참가자:", response.participants);
      console.log("문제 수:", response.questions.length);
      console.log("골든벨 규칙:", response.goldenbellRuleJson);
      
      // 다이얼로그 닫기
      setShowCreateDialog(false);
      
      // 방 목록 새로고침
      fetchScheduledRooms();
    } catch (error: any) {
      console.error("방 생성 실패:", error);
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
      timeZone: 'Asia/Seoul' // 명시적으로 한국 시각대 지정
    });
  };

  // 상태 표시 텍스트
  const getStatusText = (status: string, scheduledAt: string) => {
    const now = new Date();
    const scheduledTime = new Date(scheduledAt);
    const tenMinutesBefore = new Date(scheduledTime.getTime() - 10 * 60 * 1000);

    if (status === "WAIT") {
      if (now >= tenMinutesBefore) {
        return "입장 가능";
      }
      return "대기 중";
    }
    if (status === "IN_PROGRESS") {
      return "진행 중";
    }
    return status;
  };

  // 상태 뱃지 색상
  const getStatusBadgeClass = (status: string, scheduledAt: string) => {
    const now = new Date();
    const scheduledTime = new Date(scheduledAt);
    const tenMinutesBefore = new Date(scheduledTime.getTime() - 10 * 60 * 1000);

    if (status === "WAIT" && now >= tenMinutesBefore) {
      return "bg-green-100 text-green-700";
    }
    if (status === "WAIT") {
      return "bg-yellow-100 text-yellow-700";
    }
    if (status === "IN_PROGRESS") {
      return "bg-blue-100 text-blue-700";
    }
    return "bg-gray-100 text-gray-700";
  };

  // 참가 가능 여부 확인
  const canJoin = (status: string, scheduledAt: string) => {
    const now = new Date();
    const scheduledTime = new Date(scheduledAt);
    const tenMinutesBefore = new Date(scheduledTime.getTime() - 10 * 60 * 1000);

    return status === "WAIT" && now >= tenMinutesBefore;
  };

  // 방 참가 처리
  const handleJoinRoom = async (roomId: number) => {
    try {
      setJoiningRoomId(roomId);
      
      console.log(`방 ${roomId}에 참가 시도...`);
      const response = await joinRoom(roomId);
      
      console.log("방 참가 성공:", response);
      
      // 내 userId 찾기 (participants에서 가장 최근에 참가한 사용자)
      const myParticipant = response.participants[response.participants.length - 1];
      const myUserId = myParticipant?.userId;
      
      if (!myUserId) {
        throw new Error("사용자 정보를 찾을 수 없습니다.");
      }
      
      toast.success(
        `방에 참가했습니다! (방 ID: ${roomId})`,
        {
          description: `현재 참가자: ${response.room.participantCount}명`,
          duration: 3000,
        }
      );
      
      // 방 상세 정보 로그 출력
      console.log("=== 방 참가 정보 ===");
      console.log("방 ID:", response.room.roomId);
      console.log("내 userId:", myUserId);
      console.log("참가자 수:", response.room.participantCount);
      console.log("방 상태:", response.room.status);
      console.log("참가자 목록:", response.participants);
      
      // 게임 화면으로 이동
      // 방 상태가 IN_PROGRESS이면 바로 게임 시작, WAIT이면 대기실
      navigate(`/battle/goldenbell/game/${roomId}`);
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
            description: "아직 입장 시간이 아니거나 방이 가득 찼습니다.",
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
        toast.error(
          "방 참가에 실패했습니다",
          {
            description: errorMessage,
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
                <Bell className="w-8 h-8 text-blue-600" />
                <h1 className="text-blue-900">골든벨</h1>
              </div>
              <p className="text-gray-600">최후 1인이 되어 골든벨의 주인공이 되세요!</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => handleBotMatch("WRITTEN")}
                disabled={loading}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
              >
                <Bot className="w-4 h-4 mr-2" />
                {loading ? "매칭 중..." : "봇과 매칭 (필기)"}
              </Button>
              <Button
                onClick={() => handleBotMatch("PRACTICAL")}
                disabled={loading}
                size="lg"
                variant="outline"
                className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <Bot className="w-4 h-4 mr-2" />
                {loading ? "매칭 중..." : "봇과 매칭 (실기)"}
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

        {/* Golden Bell Info */}
        <Card className="p-6 mb-8 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
          <div className="flex items-start gap-4">
            <Bell className="w-8 h-8 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-blue-900 mb-3">골든벨 게임 안내</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-white/60 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <span className="text-xl">⭕</span>
                    <span>1라운드: OX</span>
                  </div>
                  <p className="text-gray-700">10문제 (10초/문제)</p>
                </div>
                <div className="p-4 bg-white/60 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <span className="text-xl">✍️</span>
                    <span>2라운드: 단답형</span>
                  </div>
                  <p className="text-gray-700">5문제 (20초/문제)</p>
                </div>
                <div className="p-4 bg-white/60 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <span className="text-xl">📝</span>
                    <span>3라운드: 서술형</span>
                  </div>
                  <p className="text-gray-700">3문제 (30초/문제)</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-900">
                  ⚠️ 한 문제라도 틀리면 즉시 탈락! 긴장감 넘치는 생존 게임
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Active Sessions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-blue-900">참가 가능한 골든벨</h2>
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
              <div className="text-4xl mb-3">🔔</div>
              <p className="text-gray-600">방 목록을 불러오는 중...</p>
            </Card>
          ) : scheduledRooms.length === 0 ? (
            <Card className="p-8 text-center border-2 border-gray-200">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-600 mb-2">예약된 골든벨 방이 없습니다.</p>
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
                          canJoin(room.status, room.scheduledAt)
                            ? "bg-gradient-to-br from-green-400 to-emerald-400"
                            : "bg-gradient-to-br from-blue-400 to-cyan-400"
                        }`}
                      >
                        <Bell className="w-10 h-10 text-white" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-gray-900">골든벨 #{room.roomId}</h3>
                          <Badge
                            variant="secondary"
                            className={getStatusBadgeClass(room.status, room.scheduledAt)}
                          >
                            {getStatusText(room.status, room.scheduledAt)}
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

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 mb-1">시작 시간</p>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-800">
                                {formatKoreanDateTime(room.scheduledAt)}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-600 mb-1">참가자</p>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-800">
                                {room.participantCount}/20
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-900">
                            {canJoin(room.status, room.scheduledAt)
                              ? "✅ 지금 입장할 수 있습니다!"
                              : "⏰ 시작 10분 전부터 입장 가능합니다."}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="ml-6">
                      <Button
                        onClick={() => handleJoinRoom(room.roomId)}
                        disabled={!canJoin(room.status, room.scheduledAt) || joiningRoomId === room.roomId}
                        size="lg"
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white disabled:opacity-50"
                      >
                        {joiningRoomId === room.roomId ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            참가 중...
                          </>
                        ) : canJoin(room.status, room.scheduledAt) ? (
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

        {/* Strategy Tips */}
        <Card className="p-6 mt-8 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h3 className="text-purple-900 mb-2">골든벨 전략 팁</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• 1라운드는 빠른 판단력이 중요합니다. 너무 오래 고민하지 마세요!</li>
                <li>• 2라운드 단답형은 정확한 용어를 기억하는 것이 핵심입니다.</li>
                <li>• 3라운드 서술형은 핵심 키워드를 포함하여 간결하게 작성하세요.</li>
                <li>• 평소 Micro 학습으로 기본 개념을 탄탄히 하면 유리합니다.</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Back Button */}
        <div className="mt-8 flex justify-center">
          <Button onClick={() => navigate("/battle")} variant="outline" className="border-2">
            뒤로 가기
          </Button>
        </div>
      </div>

      {/* 방 생성 다이얼로그 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>골든벨 방 만들기</DialogTitle>
            <DialogDescription>
              특정 시각에 시작하는 골든벨 방을 생성합니다. 다른 사용자들도 참가할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* 시작 시각 선택 */}
            <div className="space-y-2">
              <Label htmlFor="datetime">시작 시각 (한국 시각)</Label>
              <Input
                id="datetime"
                type="datetime-local"
                value={selectedDateTime}
                onChange={(e) => setSelectedDateTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                예약 시간 10분 전부터 입장이 가능합니다. 현재 시각보다 늦은 시각만 선택 가능합니다.
              </p>
            </div>

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

            {/* 난이도 선택 */}
            <div className="space-y-2">
              <Label htmlFor="difficulty">난이도</Label>
              <Select value={selectedDifficulty} onValueChange={(value) => setSelectedDifficulty(value as Difficulty)}>
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="난이도 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">쉬움</SelectItem>
                  <SelectItem value="NORMAL">보통</SelectItem>
                  <SelectItem value="HARD">어려움</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 인원 안내 */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>골든벨:</strong> 최대 20명까지 참가 가능
              </p>
              <p className="text-xs text-blue-700 mt-1">
                예약된 시간이 되면 자동으로 시작됩니다.
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
              disabled={creatingRoom || !selectedDateTime}
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
