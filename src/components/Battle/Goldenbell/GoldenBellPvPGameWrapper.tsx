import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { GoldenBellGame } from "./GoldenBellGame"
import { GoldenBellResult } from "./GoldenBellResult"
import { GoldenBellWaitingRoom } from "./GoldenBellWaitingRoom"
import { getRoomDetail, getScoreboard, type RoomDetailResponse, type Scoreboard } from "../../api/versusApi"

export function GoldenBellPvPGameWrapper() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const [roomDetail, setRoomDetail] = useState<RoomDetailResponse | null>(null)
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [finalScoreboard, setFinalScoreboard] = useState<Scoreboard | null>(null)

  useEffect(() => {
    const initializeRoom = async () => {
      if (!roomId || isNaN(Number(roomId))) {
        setError("유효하지 않은 방 ID입니다.")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const detail = await getRoomDetail(Number(roomId))
        console.log("방 정보 조회 성공:", detail)
        
        setRoomDetail(detail)
        
        // myUserId는 로컬스토리지나 다른 방법으로 가져올 수 있음
        // 여기서는 participants의 마지막 사용자를 현재 사용자로 가정
        // (실제로는 JWT 토큰에서 userId를 추출하거나 다른 방법 사용)
        const participants = detail.participants
        if (participants && participants.length > 0) {
          // 가장 최근에 참가한 사용자를 현재 사용자로 가정
          const lastParticipant = participants[participants.length - 1]
          setMyUserId(lastParticipant.userId)
        }
        
        setLoading(false)
      } catch (err: any) {
        console.error("방 정보 조회 실패:", err)
        setError(err.response?.data?.message || "방 정보를 불러올 수 없습니다.")
        setLoading(false)
      }
    }

    initializeRoom()
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

  if (!roomDetail || !myUserId || !roomId) {
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
  if (roomDetail.room.status === "WAIT") {
    // 대기실 표시
    return (
      <GoldenBellWaitingRoom
        roomId={Number(roomId)}
        roomDetail={roomDetail}
        myUserId={myUserId}
        onGameStart={() => {
          // 게임 시작 시 방 정보를 다시 로드하여 상태 업데이트
          // 또는 직접 상태를 IN_PROGRESS로 변경
          setRoomDetail(prev => prev ? {
            ...prev,
            room: { ...prev.room, status: "IN_PROGRESS" }
          } : null)
        }}
        onError={(errorMsg) => {
          setError(errorMsg)
        }}
      />
    )
  }

  if (roomDetail.room.status === "IN_PROGRESS" || roomDetail.room.status === "ONGOING") {
    // 게임 화면 표시
    return (
      <GoldenBellGame
        sessionId={roomId}
        myUserId={myUserId}
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

