import { useMemo, useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { BattleGameWritten } from "./BattleGameWritten"
import { BattleGamePractical } from "./BattleGamePractical"
import { BattleResult } from "./BattleResult"
import { LevelUpScreen } from "../../../LevelUpScreen"
import { getRoomDetail, getSavedRoomId, getRoomQuestions } from "../../../api/versusApi"
import axios from "../../../api/axiosConfig"
import type { Question } from "../../../../types"

type ExamType = "written" | "practical"

export function DifficultyBattleFlow() {
  const navigate = useNavigate()

  const { state } = useLocation() as {
    state?: {
      opponentName?: string
      opponentId?: string
      myUserId?: string
      roomId?: number
      difficulty?: "easy" | "medium" | "hard"
      examType?: ExamType
      questionCount?: number
    }
  }

  const [myUserId, setMyUserId] = useState<string | null>(state?.myUserId || null)
  const [opponentUserId, setOpponentUserId] = useState<string | null>(state?.opponentId || null)
  const [myRank, setMyRank] = useState<number | null>(null)
  const [opponentRank, setOpponentRank] = useState<number | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(true)

  const opponentName = opponentUserId || state?.opponentName || "상대"
  const difficulty = state?.difficulty ?? "medium"
  const examType: ExamType = state?.examType ?? "written"
  const questionCount = state?.questionCount ?? 20
  const roomId = state?.roomId || getSavedRoomId()

  // 방 정보 조회하여 참가자 정보 가져오기
  useEffect(() => {
    const fetchRoomInfo = async () => {
      if (!roomId) return

      try {
        const roomDetail = await getRoomDetail(roomId)
        
        // 현재 사용자 정보 가져오기
        if (!myUserId) {
          const profileRes = await axios.get("/account/profile")
          const currentUserId = profileRes.data.userId || profileRes.data.id
          setMyUserId(currentUserId)
        }

        const currentUserId = myUserId || state?.myUserId
        if (!currentUserId) return

        // 참가자 목록에서 자신과 상대 구분
        const myParticipant = roomDetail.participants.find(p => p.userId === currentUserId)
        const opponentParticipant = roomDetail.participants.find(p => p.userId !== currentUserId)

        if (myParticipant) {
          setMyRank(myParticipant.rank)
        }

        if (opponentParticipant) {
          setOpponentUserId(opponentParticipant.userId)
          setOpponentRank(opponentParticipant.rank)
        }
      } catch (err) {
        console.error("방 정보 조회 실패", err)
      }
    }

    fetchRoomInfo()
  }, [roomId, myUserId, state?.myUserId])

  useEffect(() => {
    if (!state) navigate("/battle/onevsone/difficulty/matching")
  }, [state, navigate])

  // 방의 문제 목록 조회
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!roomId) {
        setQuestionsLoading(false)
        return
      }

      try {
        const roomQuestions = await getRoomQuestions(roomId)
        
        if (roomQuestions.length === 0) {
          setQuestionsLoading(false)
          return
        }

        // 각 questionId에 대해 문제 상세 정보 가져오기
        const questionPromises = roomQuestions.map(async (roomQ) => {
          try {
            // versus API 사용 (필기/실기 공통)
            const res = await axios.get(`/study/versus/questions/${roomQ.questionId}`)
            const data = res.data

            // answerKey를 인덱스로 변환 (A=0, B=1, C=2, D=3)
            const answerKeyToIndex = (key: string): number => {
              if (typeof key === "number") return key
              const upperKey = String(key).toUpperCase()
              return upperKey.charCodeAt(0) - 65 // A=0, B=1, C=2, D=3
            }

            // type 변환
            const convertType = (type: string, mode: string): "multiple" | "ox" | "typing" => {
              if (mode === "PRACTICAL") return "typing"
              if (type === "OX") return "ox"
              return "multiple"
            }

            // mode 변환
            const convertMode = (mode: string): "written" | "practical" => {
              return mode === "PRACTICAL" ? "practical" : "written"
            }

            // difficulty 변환
            const convertDifficulty = (diff: string): "easy" | "medium" | "hard" => {
              if (diff === "EASY") return "easy"
              if (diff === "HARD") return "hard"
              return "medium"
            }

            // payloadJson에서 choices 추출 (있는 경우)
            let options: { label: string; text: string }[] = []
            if (data.payloadJson) {
              try {
                const payload = typeof data.payloadJson === "string" 
                  ? JSON.parse(data.payloadJson) 
                  : data.payloadJson
                if (payload.choices && Array.isArray(payload.choices)) {
                  options = payload.choices.map((choice: any) => ({
                    label: choice.label || "",
                    text: choice.content || choice.text || ""
                  }))
                }
              } catch (e) {
                console.error("payloadJson 파싱 실패", e)
              }
            }

            // API 응답을 Question 타입으로 변환
            const question: Question = {
              id: String(data.id || roomQ.questionId),
              topicId: "",
              tags: [],
              difficulty: convertDifficulty(data.difficulty || "NORMAL"),
              type: convertType(data.type || "MCQ", data.mode || "WRITTEN"),
              examType: convertMode(data.mode || "WRITTEN"),
              question: data.stem || "",
              options: options,
              correctAnswer: data.answerKey !== undefined 
                ? (typeof data.answerKey === "string" ? answerKeyToIndex(data.answerKey) : data.answerKey)
                : 0,
              explanation: data.solutionText || "",
              imageUrl: undefined,
              timeLimitSec: roomQ.timeLimitSec
            }

            return question
          } catch (err) {
            console.error(`문제 ${roomQ.questionId} 상세 정보 불러오기 실패:`, err)
            return null
          }
        })

        const questionsData = await Promise.all(questionPromises)
        const validQuestions = questionsData.filter((q): q is Question => q !== null)

        if (validQuestions.length === 0) {
          throw new Error("문제를 불러올 수 없습니다")
        }
        
        setQuestions(validQuestions)
      } catch (err) {
        console.error("문제 조회 실패", err)
        setQuestionsLoading(false)
        // 에러는 상위에서 처리
        throw err
      } finally {
        setQuestionsLoading(false)
      }
    }

    fetchQuestions()
  }, [roomId, difficulty, examType, questionCount])

  // game → levelUp → result
  const [step, setStep] = useState<"game" | "levelUp" | "result">("game")
  const [myScore, setMyScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)

  const [currentLevel, setCurrentLevel] = useState(5)
  const [currentExp, setCurrentExp] = useState(20)
  const expPerLevel = 100
  const earnedExp = myScore * 7

  // 1) 게임 화면
  if (step === "game") {
    if (questionsLoading) {
      return (
        <div className="p-8 text-center">
          <p className="text-gray-600">문제를 불러오는 중...</p>
        </div>
      )
    }

    const GameComponent =
      examType === "practical" ? BattleGamePractical : BattleGameWritten

    return (
      <GameComponent
        questions={questions}
        opponentName={opponentName}
        myUserId={myUserId || undefined}
        opponentUserId={opponentUserId || undefined}
        myRank={myRank}
        opponentRank={opponentRank}
        onComplete={(me, opp) => {
          setMyScore(me)
          setOpponentScore(opp)
          // 게임 끝나자마자 레벨업으로
          setStep("levelUp")
        }}
        onExit={() => navigate("/battle")}
      />
    )
  }

  // 2) 레벨업 화면 (게임 끝나고 바로)
  if (step === "levelUp") {
    return (
      <LevelUpScreen
        currentLevel={currentLevel}
        currentExp={currentExp}
        earnedExp={earnedExp}
        expPerLevel={expPerLevel}
        onComplete={() => {
          // 경험치/레벨 반영
          setCurrentExp(prevExp => {
            const total = prevExp + earnedExp
            const levelUpCount = Math.floor(total / expPerLevel)

            if (levelUpCount > 0) {
              setCurrentLevel(prevLevel => prevLevel + levelUpCount)
            }

            return total % expPerLevel
          })

          // 레벨업 모달 닫으면 → 결과 화면으로 전환
          setStep("result")
        }}
      />
    )
  }

  // 3) 최종 결과 화면 (나중에)
  if (step === "result") {
    return (
      <BattleResult
        myScore={myScore}
        opponentScore={opponentScore}
        opponentName={opponentName}
        onRematch={() => navigate("/battle/onevsone/matching")}
        onBackToDashboard={() => navigate("/battle")}
      />
    )
  }

  return null
}
