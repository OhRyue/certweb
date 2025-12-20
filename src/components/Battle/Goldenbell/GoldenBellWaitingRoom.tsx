import { useState, useEffect, useRef } from "react"
import { Card } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { Avatar } from "../../ui/avatar"
import { Bell, Users, Clock, User } from "lucide-react"
import { sendHeartbeat, getScoreboard, type RoomDetailResponse, type Scoreboard } from "../../api/versusApi"
import { toast } from "sonner"
import { BattleWebSocketClient, type JoinRoomSnapshot, type BattleEvent } from "../../../ws/BattleWebSocketClient"

interface GoldenBellWaitingRoomProps {
  roomId: number
  roomDetail: RoomDetailResponse
  myUserId: string
  wsClient?: BattleWebSocketClient | null
  snapshot?: JoinRoomSnapshot | null
  onGameStart: () => void
  onError: (error: string) => void
}

export function GoldenBellWaitingRoom({ 
  roomId, 
  roomDetail: initialRoomDetail, 
  myUserId, 
  wsClient,
  snapshot,
  onGameStart,
  onError 
}: GoldenBellWaitingRoomProps) {
  const [scoreboard, setScoreboard] = useState<Scoreboard | null>(initialRoomDetail.scoreboard)
  const [countdown, setCountdown] = useState<string>("")
  const [gameStarting, setGameStarting] = useState(false) // 게임 시작 중 플래그
  // scheduledAt을 우선 사용, 없으면 createdAt 사용
  const scheduledAt = initialRoomDetail.room.scheduledAt || initialRoomDetail.room.createdAt
  const isBotMatch = initialRoomDetail.room.isBotMatch || false

  // 한국 시각으로 표시
  const formatKoreanDateTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Seoul'
    })
  }

  // 카운트다운 계산
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const target = new Date(scheduledAt)
      const diff = target.getTime() - now.getTime()

      if (diff <= 0) {
        setCountdown("곧 시작됩니다...")
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (hours > 0) {
        setCountdown(`${hours}시간 ${minutes}분 ${seconds}초`)
      } else if (minutes > 0) {
        setCountdown(`${minutes}분 ${seconds}초`)
      } else {
        setCountdown(`${seconds}초`)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [scheduledAt])

  // Heartbeat 처리 (봇전: REST API, PvP: WebSocket)
  useEffect(() => {
    // 게임이 시작되면 heartbeat 중지
    if (gameStarting) {
      return
    }

    // 봇전인 경우 REST API 폴링 사용
    if (isBotMatch) {
      let heartbeatInterval: NodeJS.Timeout

      const sendHeartbeatRequest = async () => {
        try {
          await sendHeartbeat(roomId)
          console.log("Heartbeat 전송 성공 (REST API)")
        } catch (error: any) {
          console.error("Heartbeat 전송 실패:", error)
        }
      }

      // 즉시 한 번 전송
      sendHeartbeatRequest()
      
      // 30초마다 전송
      heartbeatInterval = setInterval(sendHeartbeatRequest, 30000)

      return () => {
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval)
          console.log("Heartbeat 폴링 중지 (REST API)")
        }
      }
    }
    
    // PvP 전인 경우 WebSocket heartbeat는 BattleWebSocketClient에서 자동 처리됨
    // (WAIT 상태일 때만 자동으로 전송됨)
  }, [roomId, gameStarting, isBotMatch])

  // 스코어보드 업데이트 (봇전: REST API 폴링, PvP: WebSocket 이벤트)
  useEffect(() => {
    // 게임이 시작되면 업데이트 중지
    if (gameStarting) {
      return
    }

    // 봇전인 경우 REST API 폴링 사용
    if (isBotMatch) {
      let scoreboardInterval: NodeJS.Timeout

      const fetchScoreboard = async () => {
        try {
          const newScoreboard = await getScoreboard(roomId)
          setScoreboard(newScoreboard)
          
          // 스코어보드의 status가 ONGOING 또는 IN_PROGRESS로 변경되면 게임 시작
          if (newScoreboard.status === "ONGOING" || newScoreboard.status === "IN_PROGRESS") {
            console.log("게임이 시작되었습니다! status:", newScoreboard.status)
            setGameStarting(true)
            toast.success("게임이 시작됩니다!")
            
            setTimeout(() => {
              onGameStart()
            }, 500)
            
            return
          }
          
          // 상태가 CANCELLED이면 에러 처리
          if (newScoreboard.status === "CANCELLED") {
            setGameStarting(true)
            onError("방이 취소되었습니다.")
          }
        } catch (error: any) {
          console.error("스코어보드 조회 실패:", error)
          if (error.response?.status === 404) {
            setGameStarting(true)
            onError("방을 찾을 수 없습니다.")
          }
        }
      }

      // 즉시 한 번 호출
      fetchScoreboard()

      // 2초마다 스코어보드 업데이트
      scoreboardInterval = setInterval(fetchScoreboard, 2000)

      return () => {
        if (scoreboardInterval) {
          clearInterval(scoreboardInterval)
          console.log("스코어보드 폴링 중지 (REST API)")
        }
      }
    }
    
    // PvP 전인 경우 WebSocket 이벤트 사용
    if (!isBotMatch && wsClient) {
      // snapshot에서 초기 스코어보드 설정
      if (snapshot) {
        setScoreboard({
          status: snapshot.scoreboard.status || "WAIT",
          items: snapshot.scoreboard.items || []
        })
      }

      // 이벤트 핸들러 설정
      const handleEvent = (eventType: string, event: BattleEvent) => {
        console.log('[GoldenBellWaitingRoom] 이벤트 수신:', eventType, event)
        
        // MATCH_STARTED 이벤트 수신 시 게임 시작
        if (eventType === 'MATCH_STARTED') {
          console.log("게임이 시작되었습니다! (WebSocket)")
          setGameStarting(true)
          toast.success("게임이 시작됩니다!")
          
          setTimeout(() => {
            onGameStart()
          }, 500)
        }
        
        // PLAYER_JOINED 이벤트 수신 시 참가자 목록 업데이트
        if (eventType === 'PLAYER_JOINED' && event.payload) {
          // snapshot을 다시 받아서 업데이트하거나, 이벤트에서 참가자 정보를 추출
          // 여기서는 간단히 스코어보드를 다시 조회 (또는 snapshot 업데이트 대기)
        }
      }

      wsClient.setEventCallback(handleEvent)

      // cleanup
      return () => {
        wsClient.setEventCallback(null)
      }
    }
  }, [roomId, onGameStart, onError, gameStarting, isBotMatch, wsClient, snapshot])

  const participants = scoreboard?.items || []
  const participantCount = participants.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Bell className="w-12 h-12 text-purple-600" />
            <h1 className="text-4xl font-bold text-purple-900">대기실</h1>
          </div>
          <p className="text-gray-600">게임이 시작될 때까지 기다려주세요</p>
        </div>

        {/* 방 정보 카드 */}
        <Card className="p-6 mb-6 bg-white/80 backdrop-blur border-2 border-purple-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-purple-600 mb-2">
                <Bell className="w-5 h-5" />
                <span className="font-semibold">방 ID</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">#{roomId}</p>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">시작까지</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{countdown}</p>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                <Users className="w-5 h-5" />
                <span className="font-semibold">참가자</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{participantCount}/20</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-purple-200">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>예정 시간: {formatKoreanDateTime(scheduledAt)}</span>
            </div>
          </div>
        </Card>

        {/* 참가자 목록 */}
        <Card className="p-6 bg-white/80 backdrop-blur border-2 border-purple-200">
          <h2 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            참가자 목록
          </h2>

          {participantCount === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>아직 참가자가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {participants.map((participant, index) => {
                const isMe = participant.userId === myUserId
                return (
                  <div
                    key={participant.userId}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isMe
                        ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300"
                        : "bg-white border-gray-200 hover:border-purple-300"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Avatar className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400">
                        <div className="w-full h-full flex items-center justify-center text-white font-bold">
                          {participant.nickname?.[0] || <User className="w-6 h-6" />}
                        </div>
                      </Avatar>
                      <div className="text-center">
                        <p className="font-semibold text-sm text-gray-900 truncate max-w-[80px]">
                          {participant.nickname || `플레이어${index + 1}`}
                        </p>
                        {isMe && (
                          <Badge className="mt-1 bg-yellow-100 text-yellow-700 text-xs">
                            나
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* 안내 메시지 */}
        <Card className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900 mb-1">대기실 안내</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• 예약된 시간이 되면 자동으로 게임이 시작됩니다.</li>
                <li>• 1분 이상 응답이 없으면 자동으로 퇴장됩니다.</li>
                <li>• 게임 시작 전까지 참가자가 계속 입장할 수 있습니다.</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

