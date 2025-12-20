import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState, useRef } from "react"
import { GoldenBellGame } from "./GoldenBellGame"
import { GoldenBellResult } from "./GoldenBellResult"
import { GoldenBellWaitingRoom } from "./GoldenBellWaitingRoom"
import { getRoomDetail, getScoreboard, type RoomDetailResponse, type Scoreboard } from "../../api/versusApi"
import { BattleWebSocketClient, type JoinRoomSnapshot, type BattleEvent } from "../../../ws/BattleWebSocketClient"
import { getAuthItem } from "../../../utils/authStorage"

export function GoldenBellPvPGameWrapper() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const [roomDetail, setRoomDetail] = useState<RoomDetailResponse | null>(null)
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [finalScoreboard, setFinalScoreboard] = useState<Scoreboard | null>(null)
  const wsClientRef = useRef<BattleWebSocketClient | null>(null)
  const [snapshot, setSnapshot] = useState<JoinRoomSnapshot | null>(null)

  // 웹소켓 연결 및 방 입장
  useEffect(() => {
    if (!roomId || isNaN(Number(roomId))) {
      setError("유효하지 않은 방 ID입니다.")
      setLoading(false)
      return
    }

    const roomIdNum = Number(roomId)
    
    // 웹소켓 클라이언트 생성
    const wsClient = new BattleWebSocketClient()
    wsClientRef.current = wsClient

    // JOIN_ROOM snapshot 핸들러 설정
    wsClient.setSnapshotCallback((snapshot) => {
      console.log('[GoldenBellPvPGameWrapper] JOIN_ROOM snapshot 수신:', snapshot)
      setSnapshot(snapshot)
      
      // myUserId 설정
      const storedUserId = getAuthItem("userId")
      if (storedUserId) {
        setMyUserId(storedUserId)
      } else if (snapshot.participants.length > 0) {
        // 저장된 userId가 없으면 첫 번째 참가자 사용 (fallback)
        setMyUserId(snapshot.participants[0].userId)
      }
      
      // roomDetail 업데이트 (호환성을 위해)
      setRoomDetail({
        room: {
          roomId: snapshot.room.roomId,
          mode: snapshot.room.mode,
          status: snapshot.room.status,
          examMode: snapshot.room.examMode,
          createdAt: snapshot.room.createdAt,
          scheduledAt: snapshot.room.scheduledAt,
          isBotMatch: snapshot.room.isBotMatch
        },
        participants: snapshot.participants,
        scoreboard: {
          status: snapshot.scoreboard.status || "WAIT",
          items: snapshot.scoreboard.items || []
        }
      })
      
      setLoading(false)
    })

    // 이벤트 핸들러 설정
    wsClient.setEventCallback((eventType, event) => {
      console.log('[GoldenBellPvPGameWrapper] 이벤트 수신:', eventType, event)
      
      // MATCH_STARTED 이벤트 수신 시 게임 시작
      if (eventType === 'MATCH_STARTED') {
        setRoomDetail(prev => prev ? {
          ...prev,
          room: { ...prev.room, status: "ONGOING" }
        } : null)
      }
      
      // SCOREBOARD_UPDATED 이벤트는 GoldenBellGame에서 처리
    })

    // 웹소켓 연결
    wsClient.connect(roomIdNum)

    // cleanup
    return () => {
      if (wsClientRef.current) {
        wsClientRef.current.disconnect()
        wsClientRef.current = null
      }
    }
  }, [roomId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🔔</div>
          <p className="text-xl text-purple-900 mb-2">방 정보를 불러오는 중...</p>
          <p className="text-sm text-gray-600">잠시만 기다려주세요.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-xl text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/battle/goldenbell")}
            className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            돌아가기
          </button>
        </div>
      </div>
    )
  }

  if (!roomDetail || !myUserId || !roomId || !snapshot) {
    return null
  }

  // 게임 완료 시 최종 스코어보드 가져오기
  const handleGameComplete = async (win: boolean, rank: number) => {
    try {
      const scoreboard = await getScoreboard(Number(roomId))
      setFinalScoreboard(scoreboard)
      setGameCompleted(true)
    } catch (error) {
      console.error("최종 스코어보드 조회 실패:", error)
      // 에러가 발생해도 결과 화면으로 이동
      setGameCompleted(true)
    }
  }

  // 결과 화면 표시
  if (gameCompleted && finalScoreboard) {
    return (
      <GoldenBellResult
        scoreboard={finalScoreboard}
        myUserId={myUserId}
        onBackToDashboard={() => navigate("/battle/goldenbell")}
        onRetry={() => {
          navigate("/battle/goldenbell")
        }}
      />
    )
  }

  // 방 상태에 따라 다른 화면 표시
  if (roomDetail && roomDetail.room.status === "WAIT") {
    // 대기실 표시
    return (
      <GoldenBellWaitingRoom
        roomId={Number(roomId)}
        roomDetail={roomDetail}
        myUserId={myUserId || ""}
        wsClient={wsClientRef.current}
        snapshot={snapshot}
        onGameStart={() => {
          // 게임 시작 시 방 정보를 다시 로드하여 상태 업데이트
          // 또는 직접 상태를 IN_PROGRESS로 변경
          setRoomDetail(prev => prev ? {
            ...prev,
            room: { ...prev.room, status: "ONGOING" }
          } : null)
        }}
        onError={(errorMsg) => {
          setError(errorMsg)
        }}
      />
    )
  }

  if (roomDetail && (roomDetail.room.status === "IN_PROGRESS" || roomDetail.room.status === "ONGOING")) {
    // 게임 화면 표시 (PvP 전용 - 웹소켓 사용)
    return (
      <GoldenBellGame
        sessionId={roomId}
        myUserId={myUserId || undefined}
        wsClient={wsClientRef.current}
        isBotMatch={false}
        onComplete={handleGameComplete}
        onExit={() => navigate("/battle/goldenbell")}
      />
    )
  }

  if (roomDetail.room.status === "COMPLETED") {
    // 완료된 방 - 결과 화면으로 이동
    if (!finalScoreboard) {
      // 스코어보드를 아직 불러오지 않았으면 불러오기
      getScoreboard(Number(roomId)).then(scoreboard => {
        setFinalScoreboard(scoreboard)
        setGameCompleted(true)
      })
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
          <div className="text-center">
            <div className="text-6xl mb-4">🏆</div>
            <p className="text-xl text-purple-900">결과를 불러오는 중...</p>
          </div>
        </div>
      )
    }
  }

  // CANCELLED 등 기타 상태
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-xl text-gray-700 mb-4">이 방은 더 이상 사용할 수 없습니다.</p>
        <button
          onClick={() => navigate("/battle/goldenbell")}
          className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
        >
          돌아가기
        </button>
      </div>
    </div>
  )
}

