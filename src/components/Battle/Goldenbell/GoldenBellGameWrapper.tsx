import { useParams, useNavigate } from "react-router-dom"
import { GoldenBellGame } from "./GoldenBellGame"

export function GoldenBellGameWrapper() {
  const { sessionId } = useParams()
  const navigate = useNavigate()

  return (
    <GoldenBellGame
      sessionId={sessionId || "temp"}
      onComplete={(win, rank) => {
        console.log("게임 종료:", win, rank)
        navigate("/battle/goldenbell")
      }}
      onExit={() => navigate("/battle/goldenbell")}
    />
  )
}
