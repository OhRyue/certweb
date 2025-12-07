import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { GoldenBellGame } from "./GoldenBellGame"
import { GoldenBellResult } from "./GoldenBellResult"
import { startGoldenBellBotMatch, getRoomState, getScoreboard, type ExamMode, type Scoreboard } from "../../api/versusApi"

export function GoldenBellBotGameWrapper() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [roomId, setRoomId] = useState<number | null>(null)
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [finalScoreboard, setFinalScoreboard] = useState<Scoreboard | null>(null)

  useEffect(() => {
    const initializeGame = async () => {
      // 이미 roomId가 있으면 재초기화하지 않음
      if (roomId) {
        return
      }

      try {
        setLoading(true)
        setError(null)

        // examMode 파라미터 가져오기 (기본값: WRITTEN)
        const examMode = (searchParams.get("examMode") || "WRITTEN") as ExamMode

        // sessionId가 있고 숫자면 기존 방 사용, 아니면 새로 생성
        let targetRoomId: number
        let targetMyUserId: string

        if (sessionId && sessionId !== "new" && !isNaN(Number(sessionId))) {
          // 기존 방 ID가 있으면 그 방 사용
          targetRoomId = Number(sessionId)
          // 기존 방의 경우 myUserId는 roomState에서 가져와야 함
          const roomState = await getRoomState(targetRoomId)
          // participants에서 현재 사용자 찾기 (실제로는 다른 방법 필요할 수 있음)
          targetMyUserId = roomState.detail.participants[0]?.userId || ""
        } else {
          // 새 방 생성
          const matchResponse = await startGoldenBellBotMatch(examMode)
          console.log("골든벨 봇전 시작 응답:", matchResponse)
          targetRoomId = matchResponse.roomId
          targetMyUserId = matchResponse.myUserId
        }
        
        setRoomId(targetRoomId)
        setMyUserId(targetMyUserId)

        // questions 배열이 생성될 때까지 대기
        const waitForQuestions = async (roomId: number, retryCount = 0, maxRetries = 30) => {
          try {
            const roomState = await getRoomState(roomId)
            console.log("방 상태 조회 응답:", roomState)
            
            // questions 배열이 비어있으면 재시도
            if (!roomState.detail.questions || roomState.detail.questions.length === 0) {
              if (retryCount < maxRetries) {
                console.log(`questions 배열 대기 중... (${retryCount + 1}/${maxRetries})`)
                setTimeout(() => {
                  waitForQuestions(roomId, retryCount + 1, maxRetries)
                }, 1000) // 1초 후 재시도
                return
              } else {
                throw new Error("문제 목록을 불러오는 데 시간이 너무 오래 걸립니다.")
              }
            }
            
            // questions 배열이 준비되었으면 로딩 완료
            console.log("questions 배열 준비 완료:", roomState.detail.questions.length)
            setLoading(false)
          } catch (err: any) {
            console.error("방 상태 조회 실패:", err)
            setError(err.message || "방 상태를 불러오는 중 오류가 발생했습니다.")
            setLoading(false)
          }
        }

        // questions 배열이 생성될 때까지 대기 시작
        waitForQuestions(targetRoomId)
      } catch (err: any) {
        console.error("골든벨 봇전 초기화 실패:", err)
        setError(err.response?.data?.message || "봇전을 시작할 수 없습니다.")
        setLoading(false)
      }
    }

    initializeGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, sessionId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🔔</div>
          <p className="text-xl text-purple-900 mb-2">골든벨 봇전을 준비하고 있습니다...</p>
          <p className="text-sm text-gray-600">문제 목록을 생성하는 중입니다. 잠시만 기다려주세요.</p>
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

  if (!roomId) {
    return null
  }

  // 게임 완료 시 최종 스코어보드 가져오기
  const handleGameComplete = async (win: boolean, rank: number) => {
    if (roomId) {
      try {
        const scoreboard = await getScoreboard(roomId)
        setFinalScoreboard(scoreboard)
        setGameCompleted(true)
      } catch (error) {
        console.error("최종 스코어보드 조회 실패:", error)
        // 에러가 발생해도 결과 화면으로 이동
        setGameCompleted(true)
      }
    }
  }

  // 결과 화면 표시
  if (gameCompleted && finalScoreboard && myUserId) {
    return (
      <GoldenBellResult
        scoreboard={finalScoreboard}
        myUserId={myUserId}
        onBackToDashboard={() => navigate("/battle/goldenbell")}
        onRetry={() => {
          setGameCompleted(false)
          setFinalScoreboard(null)
          // 게임 재시작을 위해 페이지 새로고침 또는 상태 초기화
          window.location.reload()
        }}
      />
    )
  }

  if (!myUserId) {
    return null
  }

  return (
    <GoldenBellGame
      sessionId={String(roomId)}
      myUserId={myUserId}
      onComplete={handleGameComplete}
      onExit={() => navigate("/battle/goldenbell")}
    />
  )
}


