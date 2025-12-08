import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { ReviewProblemSolving } from "./ReviewProblemSolving"
import { ReviewWrongAnswersWritten } from "./ReviewWrongAnswersWritten"
import { ReviewResult } from "./ReviewResult"
import { LevelUpScreen } from "../../LevelUpScreen"
import axios from "../../api/axiosConfig"

interface ReviewQuestion {
  id: number
  stem: string
  choices: { label: string; content: string }[]
  imageUrl: string | null
}

export function ReviewFlowPage() {
  const [step, setStep] = useState<"problem" | "wrong" | "result">("problem")
  const [questions, setQuestions] = useState<ReviewQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [topicName] = useState<string>("총정리")
  const [summaryData, setSummaryData] = useState<{
    summaryText?: string
    aiSummary?: string
    mcqCorrect?: number
    mcqTotal?: number
    earnedXp?: number
    totalXp?: number
    level?: number
    xpToNextLevel?: number
    leveledUp?: boolean
    levelUpRewardPoints?: number
  } | null>(null)
  const [showLevelUp, setShowLevelUp] = useState(false)  // 레벨업 모달 표시 여부
  const [loadingSummary, setLoadingSummary] = useState(false)  // SUMMARY API 로딩 상태
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // URL 파라미터에서 mainTopicId와 sessionId 가져오기
  const mainTopicId = searchParams.get("mainTopicId")
  const sessionIdParam = searchParams.get("sessionId")
  const rootTopicId = mainTopicId ? Number(mainTopicId) : null
  const learningSessionId = sessionIdParam ? Number(sessionIdParam) : null

  // localStorage에서도 확인 (fallback)
  const savedSessionId = localStorage.getItem('reviewLearningSessionId')
  const finalLearningSessionId = learningSessionId || (savedSessionId ? Number(savedSessionId) : null)

  // 1. Review 문제 세트 조회 (problem 단계일 때만)
  useEffect(() => {
    const fetchQuestions = async () => {
      if (step !== "problem") return
      if (!rootTopicId || !finalLearningSessionId) {
        setError("세션 정보가 없습니다.")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const res = await axios.get(`/study/written/review/${rootTopicId}`, {
          params: { sessionId: finalLearningSessionId }
        })
        
        // API 응답 구조: payload.questions 또는 payload.items
        const items = res.data.payload?.questions || res.data.payload?.items || []
        // API 응답을 ReviewQuestion 형태로 변환
        const reviewQuestions: ReviewQuestion[] = items.map((item: any) => ({
          id: item.questionId,
          stem: item.stem || item.question || item.text || item.content || "",
          choices: (item.choices || []).map((choice: any) => ({
            label: choice.label || "",
            content: choice.content || choice.text || ""
          })),
          imageUrl: item.imageUrl || null
        }))
        
        setQuestions(reviewQuestions)
      } catch (err: any) {
        console.error("Review 문제 불러오기 실패:", err)
        setError(err.response?.data?.message || "문제를 불러오는 중 오류가 발생했습니다")
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, rootTopicId, finalLearningSessionId])

  // 3. SUMMARY API 호출 및 advance API 호출 (result 단계일 때만)
  useEffect(() => {
    const loadSummary = async () => {
      if (step !== "result") return
      if (!rootTopicId || !finalLearningSessionId) return

      setLoadingSummary(true)
      try {
        const res = await axios.get(`/study/written/review/summary`, {
          params: {
            rootTopicId: rootTopicId,
            sessionId: finalLearningSessionId
          }
        })
        
        const payload = res.data.payload || {}
        setSummaryData({
          summaryText: payload.summaryText || "",
          aiSummary: payload.aiSummary || "",
          mcqCorrect: payload.mcqCorrect || 0,
          mcqTotal: payload.mcqTotal || 0,
          earnedXp: payload.earnedXp,
          totalXp: payload.totalXp,
          level: payload.level,
          xpToNextLevel: payload.xpToNextLevel,
          leveledUp: payload.leveledUp,
          levelUpRewardPoints: payload.levelUpRewardPoints
        })
        
        // 경험치를 획득했으면 레벨업 모달 표시
        if (payload.earnedXp && payload.earnedXp > 0) {
          setShowLevelUp(true)
        }
        
        // SUMMARY 단계 완료: advance API 호출
        // 세션이 있으면 advance API 호출
        if (finalLearningSessionId) {
          const sessionRes = await axios.get(`/study/session/${finalLearningSessionId}`)
          const session = sessionRes.data
          const currentStep = session.currentStep
          
          // SUMMARY 단계일 때만 advance 호출
          if (currentStep === "SUMMARY") {
            await axios.post("/study/session/advance", {
              sessionId: finalLearningSessionId,
              step: "SUMMARY",
              score: null,
              detailsJson: null
            })
            // advance 호출 후 세션 상태 확인 (movedTo === "END", status === "DONE")
            const updatedSessionRes = await axios.get(`/study/session/${finalLearningSessionId}`)
            const updatedSession = updatedSessionRes.data
            if (updatedSession.status === "DONE") {
              // 세션이 종료됨 - localStorage에서 삭제
              console.log("세션이 종료되었습니다. status:", updatedSession.status)
              localStorage.removeItem('reviewLearningSessionId')
            }
          }
        }
      } catch (err: any) {
        console.error("요약 불러오기 실패:", err)
        setSummaryData({
          summaryText: "",
          aiSummary: "",
          mcqCorrect: 0,
          mcqTotal: 0
        })
      } finally {
        setLoadingSummary(false)
      }
    }

    loadSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, rootTopicId, finalLearningSessionId])

  // 문제 풀이 단계
  if (step === "problem") {
    if (loading) {
      return (
        <div className="p-8 text-center">
          <p>문제를 불러오는 중...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="p-8 text-center">
          <p className="text-red-600">{error}</p>
          <button onClick={() => navigate("/learning")} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
            메인으로 돌아가기
          </button>
        </div>
      )
    }

    if (questions.length === 0) {
      return (
        <div className="p-8 text-center">
          <p>문제가 없습니다.</p>
        </div>
      )
    }

    return (
      <ReviewProblemSolving
        key="problem-step"
        questions={questions}
        rootTopicId={rootTopicId || 0}
        learningSessionId={finalLearningSessionId || 0}
        onComplete={async () => {
          // 마지막 문제 완료 시 advance API 호출
          if (finalLearningSessionId && rootTopicId) {
            try {
              // 세션 조회하여 MCQ 단계의 메타데이터 가져오기
              const sessionRes = await axios.get(`/study/session/${finalLearningSessionId}`)
              const session = sessionRes.data
              
              // MCQ 단계의 메타데이터 추출
              const mcqStep = session.steps?.find((s: any) => s.step === "MCQ")
              const metadata = mcqStep?.detailsJson ? JSON.parse(mcqStep.detailsJson) : {}
              
              // advance 호출하여 MCQ 단계 완료
              await axios.post("/study/session/advance", {
                sessionId: finalLearningSessionId,
                step: "MCQ",
                score: metadata.scorePct || null,
                detailsJson: mcqStep?.detailsJson || null
              })
              
              // advance 호출 후 세션을 다시 조회하여 실제 step 변경 확인
              const updatedSessionRes = await axios.get(`/study/session/${finalLearningSessionId}`)
              const updatedSession = updatedSessionRes.data
              
              // 현재 단계 확인하여 다음 단계 결정
              const currentStep = updatedSession.currentStep
              
              if (currentStep === "REVIEW_WRONG") {
                // 오답이 있으면 오답 노트로 이동
                setStep("wrong")
              } else {
                // 백엔드가 자동으로 처리하므로, REVIEW_WRONG이 아니면 기본적으로 오답 노트로 이동
                console.warn("예상치 못한 단계:", currentStep)
                setStep("wrong")
              }
            } catch (err: any) {
              console.error("advance API 호출 실패:", err)
              // 에러 발생 시에도 기본 흐름 유지
              setStep("wrong")
            }
          } else {
            // 세션이 없으면 기본 흐름 유지
            setStep("wrong")
          }
        }}
      />
    )
  }

  // 오답노트 단계
  if (step === "wrong") {
    return (
      <ReviewWrongAnswersWritten
        learningSessionId={finalLearningSessionId}
        topicName={topicName}
        onContinue={async () => {
          // 오답 노트 완료 시 advance API 호출
          if (finalLearningSessionId && rootTopicId) {
            try {
              // advance 호출하여 REVIEW_WRONG 단계 완료
              const advanceRes = await axios.post("/study/session/advance", {
                sessionId: finalLearningSessionId,
                step: "REVIEW_WRONG",
                score: null,
                detailsJson: null
              })
              
              // advance 응답의 movedTo 필드 우선 사용
              const movedTo = advanceRes.data?.movedTo
              if (movedTo === "SUMMARY") {
                setStep("result")
              } else if (movedTo === "END") {
                // 세션 완료 처리
                localStorage.removeItem('reviewLearningSessionId')
                setStep("result")
              } else {
                // movedTo가 없으면 세션 재조회로 확인
                const updatedSessionRes = await axios.get(`/study/session/${finalLearningSessionId}`)
                const updatedSession = updatedSessionRes.data
                const currentStep = updatedSession.currentStep
                
                if (currentStep === "SUMMARY") {
                  setStep("result")
                } else if (updatedSession.status === "DONE") {
                  localStorage.removeItem('reviewLearningSessionId')
                  setStep("result")
                } else if (currentStep === "REVIEW_WRONG") {
                  // 백엔드가 REVIEW_WRONG 유지 시, 그대로 오답 단계 유지
                  setStep("wrong")
                } else {
                  // 예외 상황: 기본적으로 결과 화면으로 이동
                  setStep("result")
                }
              }
            } catch (err: any) {
              console.error("advance API 호출 실패:", err)
              // 에러 발생 시에도 기본 흐름 유지
              setStep("result")
            }
          } else {
            // 세션이 없으면 기본 흐름 유지
            setStep("result")
          }
        }}
      />
    )
  }

  // 결과 화면
  if (step === "result") {
    return (
      <>
        <ReviewResult
          topicName={topicName}
          problemScore={summaryData?.mcqCorrect}
          totalProblem={summaryData?.mcqTotal}
          summaryText={summaryData?.summaryText}
          aiSummary={summaryData?.aiSummary}
          loadingSummary={loadingSummary}
          onRetry={() => setStep("problem")}
          onBackToDashboard={() => navigate("/learning")}
        />

        {/* 경험치를 얻으면 항상 LevelUpScreen 표시 */}
        {showLevelUp && summaryData?.earnedXp !== undefined && summaryData.earnedXp > 0 && (
          <LevelUpScreen
            earnedExp={summaryData.earnedXp}
            totalXP={summaryData.totalXp || 0}
            currentLevel={summaryData.level || 1}
            isLevelUp={summaryData.leveledUp || false}
            earnedPoints={summaryData.levelUpRewardPoints || 0}
            onComplete={() => setShowLevelUp(false)}
          />
        )}
      </>
    )
  }

  return null
}
