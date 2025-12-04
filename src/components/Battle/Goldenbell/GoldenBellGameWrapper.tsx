import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { GoldenBellGame } from "./GoldenBellGame"
import { startGoldenBellBotMatch, getRoomState, type ExamMode } from "../../api/versusApi"

export function GoldenBellGameWrapper() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [roomId, setRoomId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeGame = async () => {
      try {
        setLoading(true)
        setError(null)

        // examMode 파라미터 가져오기 (기본값: WRITTEN)
        const examMode = (searchParams.get("examMode") || "WRITTEN") as ExamMode

        // 봇전 골든벨 시작
        const matchResponse = await startGoldenBellBotMatch(examMode)
        console.log("골든벨 봇전 시작 응답:", matchResponse)
        
        setRoomId(matchResponse.roomId)

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
        waitForQuestions(matchResponse.roomId)
      } catch (err: any) {
        console.error("골든벨 게임 초기화 실패:", err)
        setError(err.response?.data?.message || "게임을 시작할 수 없습니다.")
        setLoading(false)
      }
    }

    initializeGame()
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🔔</div>
          <p className="text-xl text-purple-900 mb-2">골든벨 게임을 준비하고 있습니다...</p>
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

  return (
    <GoldenBellGame
      sessionId={String(roomId)}
      onComplete={(win, rank) => {
        console.log("게임 종료:", win, rank)
        navigate("/battle/goldenbell")
      }}
      onExit={() => navigate("/battle/goldenbell")}
    />
  )
}
