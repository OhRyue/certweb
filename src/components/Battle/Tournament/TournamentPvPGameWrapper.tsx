import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { TournamentWaitingRoom } from "./TournamentWaitingRoom"
import { getRoomDetail, getScoreboard, type RoomDetailResponse, type Scoreboard } from "../../api/versusApi"
import { TournamentGameFlow } from "./TournamentGameFlow"

export function TournamentPvPGameWrapper() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const [roomDetail, setRoomDetail] = useState<RoomDetailResponse | null>(null)
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [gameStarted, setGameStarted] = useState(false)

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
        
        // myUserId는 로컬스토리지에서 가져오기
        const storedUserId = localStorage.getItem("userId")
        if (storedUserId) {
          setMyUserId(storedUserId)
        } else {
          // participants의 마지막 사용자를 현재 사용자로 가정
          const participants = detail.participants
          if (participants && participants.length > 0) {
            const lastParticipant = participants[participants.length - 1]
            setMyUserId(lastParticipant.userId)
          }
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🏆</div>
          <p className="text-xl text-blue-900 mb-2">방 정보를 불러오는 중...</p>
          <p className="text-sm text-gray-600">잠시만 기다려주세요.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-xl text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/battle/tournament")}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
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

  // 게임 시작 처리
  const handleGameStart = () => {
    setGameStarted(true)
    // 방 정보를 다시 로드하여 상태 업데이트
    getRoomDetail(Number(roomId)).then(detail => {
      setRoomDetail(detail)
    })
  }

  // 방 상태에 따라 다른 화면 표시
  if (roomDetail.room.status === "WAIT" && !gameStarted) {
    // 대기실 표시
    return (
      <TournamentWaitingRoom
        roomId={Number(roomId)}
        roomDetail={roomDetail}
        myUserId={myUserId}
        onGameStart={handleGameStart}
        onError={(errorMsg) => {
          setError(errorMsg)
        }}
      />
    )
  }

  if (roomDetail.room.status === "IN_PROGRESS" || roomDetail.room.status === "ONGOING" || gameStarted) {
    // 게임 화면 표시
    // scopeJson에서 examMode 추출
    let examMode: "WRITTEN" | "PRACTICAL" = "WRITTEN"
    try {
      // scopeJson 파싱 시도
      if (roomDetail.room.mode === "TOURNAMENT") {
        // questions에서 examMode 추출하거나 기본값 사용
        // 실제로는 scopeJson을 파싱해야 하지만, 일단 기본값 사용
        examMode = "WRITTEN"
      }
    } catch (e) {
      console.error("examMode 추출 실패:", e)
    }

    // TournamentGameFlow는 location.state에서 roomId와 examType을 가져오므로
    // navigate로 이동하거나 직접 렌더링
    const examType = examMode === "PRACTICAL" ? "practical" : "written"
    
    // location.state를 설정하기 위해 navigate 사용
    if (!gameStarted) {
      // 첫 게임 시작 시에만 navigate
      navigate(`/battle/tournament/game/${examType}`, {
        state: {
          roomId: Number(roomId),
          examType: examType,
        },
        replace: true
      })
      return null
    }

    return (
      <TournamentGameFlow />
    )
  }

  if (roomDetail.room.status === "COMPLETED") {
    // 완료된 방 - 결과 화면으로 이동 (나중에 구현)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-xl text-blue-900 mb-4">게임이 완료되었습니다.</p>
          <button
            onClick={() => navigate("/battle/tournament")}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            돌아가기
          </button>
        </div>
      </div>
    )
  }

  // CANCELLED 등 기타 상태
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
      <div className="text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-xl text-gray-700 mb-4">이 방은 더 이상 사용할 수 없습니다.</p>
        <button
          onClick={() => navigate("/battle/tournament")}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          돌아가기
        </button>
      </div>
    </div>
  )
}

