import { useState, useEffect } from "react"
import { Card } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { Avatar } from "../../ui/avatar"
import { Button } from "../../ui/button"
import { Trophy, Users, User, Zap } from "lucide-react"
import { sendHeartbeat, getScoreboard, type RoomDetailResponse, type Scoreboard, startRoom } from "../../api/versusApi"
import { toast } from "sonner"

interface TournamentWaitingRoomProps {
  roomId: number
  roomDetail: RoomDetailResponse
  myUserId: string
  onGameStart: () => void
  onError: (error: string) => void
}

export function TournamentWaitingRoom({ 
  roomId, 
  roomDetail: initialRoomDetail, 
  myUserId, 
  onGameStart,
  onError 
}: TournamentWaitingRoomProps) {
  const [scoreboard, setScoreboard] = useState<Scoreboard | null>(initialRoomDetail.scoreboard)
  const [starting, setStarting] = useState(false)
  const [gameStarting, setGameStarting] = useState(false) // 게임 시작 중 플래그

  // 현재 사용자가 방장인지 확인 (첫 번째 참가자가 방장)
  const isHost = initialRoomDetail.participants.length > 0 && 
                 initialRoomDetail.participants[0].userId === myUserId

  // Heartbeat 폴링 (30초마다)
  useEffect(() => {
    // 게임이 시작되면 heartbeat 폴링하지 않음
    if (gameStarting) {
      return
    }

    let heartbeatInterval: NodeJS.Timeout

    const sendHeartbeatRequest = async () => {
      try {
        await sendHeartbeat(roomId)
        console.log("Heartbeat 전송 성공")
      } catch (error: any) {
        console.error("Heartbeat 전송 실패:", error)
        // heartbeat 실패는 자동 추방으로 이어지므로 에러 표시하지 않음
      }
    }

    // 즉시 한 번 전송
    sendHeartbeatRequest()
    
    // 30초마다 전송
    heartbeatInterval = setInterval(sendHeartbeatRequest, 30000)

    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
        console.log("Heartbeat 폴링 중지")
      }
    }
  }, [roomId, gameStarting])

  // 스코어보드 폴링 (2초마다) - 참가자 수 & 방 상태 확인
  useEffect(() => {
    // 게임이 시작되면 스코어보드 폴링하지 않음
    if (gameStarting) {
      return
    }

    let scoreboardInterval: NodeJS.Timeout

    const fetchScoreboard = async () => {
      try {
        const newScoreboard = await getScoreboard(roomId)
        setScoreboard(newScoreboard)
        
        // 스코어보드의 status가 ONGOING 또는 IN_PROGRESS로 변경되면 게임 시작
        if (newScoreboard.status === "ONGOING" || newScoreboard.status === "IN_PROGRESS") {
          console.log("게임이 시작되었습니다! status:", newScoreboard.status)
          setGameStarting(true) // 플래그 설정하여 폴링 중지
          toast.success("게임이 시작됩니다!")
          
          // 약간의 딜레이 후 게임 화면으로 전환
          setTimeout(() => {
            onGameStart()
          }, 500)
          
          return // 더 이상 폴링하지 않음
        }
        
        // 상태가 CANCELLED이면 에러 처리
        if (newScoreboard.status === "CANCELLED") {
          setGameStarting(true) // 폴링 중지
          onError("방이 취소되었습니다.")
        }
      } catch (error: any) {
        console.error("스코어보드 조회 실패:", error)
        if (error.response?.status === 404) {
          setGameStarting(true) // 폴링 중지
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
        console.log("스코어보드 폴링 중지")
      }
    }
  }, [roomId, onGameStart, onError, gameStarting])

  // 방 시작 처리
  const handleStartRoom = async () => {
    try {
      setStarting(true)
      
      console.log(`방 ${roomId} 시작 시도...`)
      const response = await startRoom(roomId)
      
      console.log("방 시작 성공:", response)
      
      toast.success("게임이 시작됩니다!")
      
      // 게임 화면으로 이동
      setTimeout(() => {
        onGameStart()
      }, 500)
    } catch (error: any) {
      console.error("방 시작 실패:", error)
      
      const errorMessage = error.response?.data?.message || error.message
      toast.error(
        "방 시작에 실패했습니다",
        {
          description: errorMessage,
          duration: 5000,
        }
      )
    } finally {
      setStarting(false)
    }
  }

  const participants = scoreboard?.items || []
  const participantCount = participants.length
  const canStart = isHost && participantCount >= 8 && !gameStarting

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-12 h-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-blue-900">토너먼트 대기실</h1>
          </div>
          <p className="text-gray-600">8명이 모이면 게임을 시작할 수 있습니다</p>
        </div>

        {/* 방 정보 카드 */}
        <Card className="p-6 mb-6 bg-white/80 backdrop-blur border-2 border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
                <Trophy className="w-5 h-5" />
                <span className="font-semibold">방 ID</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">#{roomId}</p>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                <Users className="w-5 h-5" />
                <span className="font-semibold">참가자</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{participantCount}/8</p>
            </div>
          </div>

          {/* 시작하기 버튼 (방장만 표시) */}
          {isHost && (
            <div className="mt-6 pt-6 border-t border-blue-200">
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-gray-600 text-center">
                  {participantCount < 8 
                    ? `${8 - participantCount}명이 더 필요합니다`
                    : "8명이 모였습니다! 게임을 시작할 수 있습니다"}
                </p>
                <Button
                  onClick={handleStartRoom}
                  disabled={!canStart || starting}
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white disabled:opacity-50 min-w-[200px]"
                >
                  {starting ? (
                    <>
                      <Zap className="w-4 h-4 mr-2 animate-spin" />
                      시작 중...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      게임 시작하기
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* 참가자 목록 */}
        <Card className="p-6 bg-white/80 backdrop-blur border-2 border-blue-200">
          <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            참가자 목록
          </h2>

          {participantCount === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>아직 참가자가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {participants.map((participant, index) => {
                const isMe = participant.userId === myUserId
                const isHostUser = index === 0 && participant.userId === myUserId
                return (
                  <div
                    key={participant.userId}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isMe
                        ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300"
                        : "bg-white border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Avatar className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400">
                        <div className="w-full h-full flex items-center justify-center text-white font-bold">
                          {participant.nickname?.[0] || <User className="w-6 h-6" />}
                        </div>
                      </Avatar>
                      <div className="text-center">
                        <p className="font-semibold text-sm text-gray-900 truncate max-w-[80px]">
                          {participant.nickname || `플레이어${index + 1}`}
                        </p>
                        <div className="flex gap-1 justify-center mt-1">
                          {isMe && (
                            <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                              나
                            </Badge>
                          )}
                          {isHostUser && (
                            <Badge className="bg-blue-100 text-blue-700 text-xs">
                              방장
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* 안내 메시지 */}
        <Card className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">대기실 안내</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• 8명이 모이면 방장이 게임을 시작할 수 있습니다.</li>
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

