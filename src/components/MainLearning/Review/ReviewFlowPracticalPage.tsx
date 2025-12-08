import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { ReviewProblemSolvingPractical } from "./ReviewProblemSolvingPractical"
import { ReviewWrongAnswersPractical } from "./ReviewWrongAnswersPractical"
import { ReviewResult } from "./ReviewResult"
import { LevelUpScreen } from "../../LevelUpScreen"
import axios from "../../api/axiosConfig"

interface ReviewQuestion {
  id: number
  stem: string
  imageUrl: string | null
  type?: string
}

export function ReviewFlowPracticalPage() {
  const [step, setStep] = useState<"problem" | "wrong" | "result">("problem")
  const [questions, setQuestions] = useState<ReviewQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [topicName] = useState<string>("실기 총정리")
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
  const [summaryLoaded, setSummaryLoaded] = useState(false)
  const [showLevelUp, setShowLevelUp] = useState(false)  // 레벨업 모달 표시 여부

  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // URL 파라미터에서 mainTopicId와 sessionId 가져오기
  const mainTopicId = searchParams.get("mainTopicId")
  const sessionIdParam = searchParams.get("sessionId")
  const rootTopicId = mainTopicId ? Number(mainTopicId) : null
  const learningSessionId = sessionIdParam ? Number(sessionIdParam) : null

  // localStorage에서도 확인 (fallback)
  const savedSessionId = localStorage.getItem('practicalReviewLearningSessionId')
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
        const res = await axios.get(`/study/practical/review/${rootTopicId}`, {
          params: { sessionId: finalLearningSessionId }
        })
        
        // API 응답 구조 확인
        // 응답의 learningSessionId가 있으면 업데이트
        if (res.data.learningSessionId && res.data.learningSessionId !== finalLearningSessionId) {
          localStorage.setItem('practicalReviewLearningSessionId', res.data.learningSessionId.toString())
        }
        
        // API 응답 구조: payload.items
        const items = res.data.payload?.items || []
        // API 응답을 ReviewQuestion 형태로 변환
        // API는 text를 반환하지만 컴포넌트는 stem을 사용
        const reviewQuestions: ReviewQuestion[] = items.map((item: any) => ({
          id: item.questionId || item.id,
          stem: item.text || item.stem || "",  // text를 stem으로 매핑
          imageUrl: item.imageUrl || null,
          type: item.type || "SHORT"  // SHORT 타입만 사용
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

  // 오답 목록은 ReviewWrongAnswersPractical 컴포넌트에서 직접 API로 가져옴
  // 중복 호출 방지를 위해 여기서는 제거

  // 3. SUMMARY API 호출 및 advance API 호출 (result 단계일 때만)
  useEffect(() => {
    const loadSummary = async () => {
      if (step !== "result") return
      if (!rootTopicId || !finalLearningSessionId) return

      try {
        // 실기 Review 모드 SUMMARY 조회 API
        // GET /study/practical/review/summary
        const res = await axios.get(`/study/practical/review/summary`, {
          params: {
            rootTopicId: rootTopicId,
            sessionId: finalLearningSessionId
          }
        })
        
        const payload = res.data.payload || {}
        // API 응답 구조에 맞게 데이터 매핑 (오직 API 데이터만 사용)
        setSummaryData({
          summaryText: payload.aiSummary,
          aiSummary: payload.aiSummary,
          mcqCorrect: payload.mcqCorrect,
          mcqTotal: payload.mcqTotal,
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
              localStorage.removeItem('practicalReviewLearningSessionId')
            }
          }
        }
        
        setSummaryLoaded(true)
      } catch (err: any) {
        console.error("요약 불러오기 실패:", err)
        // API 실패 시 요약 데이터 없음으로 처리
        setSummaryData(null)
        setSummaryLoaded(true)
      }
    }

    loadSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, rootTopicId, finalLearningSessionId])

  // totalProblems는 API 응답의 practicalTotal을 사용 (summaryData에서 가져옴)

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
      <ReviewProblemSolvingPractical
        key="problem-step"
        questions={questions}
        topicName={topicName}
        rootTopicId={rootTopicId || 0}
        learningSessionId={finalLearningSessionId || 0}
        onComplete={async () => {
          // 마지막 문제 완료 시 advance API 호출
          if (finalLearningSessionId && rootTopicId) {
            try {
              // 세션 조회하여 SHORT 단계의 메타데이터 가져오기
              const sessionRes = await axios.get(`/study/session/${finalLearningSessionId}`)
              const session = sessionRes.data
              
              // SHORT 단계의 메타데이터 추출 (실기 Review 모드는 SHORT 단계 사용)
              const shortStep = session.steps?.find((s: any) => s.step === "SHORT")
              const metadata = shortStep?.detailsJson ? JSON.parse(shortStep.detailsJson) : {}
              
              // 정답률 계산 (0-100)
              const score = metadata.scorePct !== undefined ? Math.round(metadata.scorePct) : 0
              
              // advance 호출하여 SHORT 단계 완료
              const advanceRes = await axios.post("/study/session/advance", {
                sessionId: finalLearningSessionId,
                step: "SHORT",
                score: score,
                detailsJson: shortStep?.detailsJson || JSON.stringify({})
              })
              
              // advance 응답의 movedTo 필드를 사용하여 다음 단계 결정
              const movedTo = advanceRes.data?.movedTo
              if (movedTo === "REVIEW_WRONG") {
                setStep("wrong")
              } else if (movedTo === "SUMMARY") {
                setStep("result")
              } else if (movedTo === "END") {
                // 세션 완료 시 localStorage에서 삭제
                localStorage.removeItem('practicalReviewLearningSessionId')
                setStep("result")
              } else {
                // movedTo가 없으면 세션 재조회로 확인
                const updatedSessionRes = await axios.get(`/study/session/${finalLearningSessionId}`)
                const updatedSession = updatedSessionRes.data
                const currentStep = updatedSession.currentStep
                
                if (currentStep === "REVIEW_WRONG") {
                  setStep("wrong")
                } else if (currentStep === "SUMMARY") {
                  setStep("result")
                } else if (updatedSession.status === "DONE") {
                  localStorage.removeItem('practicalReviewLearningSessionId')
                  setStep("result")
                } else {
                  // 기본적으로 오답 노트로 이동 (백엔드가 자동 처리)
                  setStep("wrong")
                }
              }
            } catch (err: any) {
              console.error("advance API 호출 실패:", err)
              // 에러 처리
              if (err.response?.status === 400) {
                const errorMessage = err.response?.data?.message || "모든 문제를 풀어야 합니다"
                setError(errorMessage)
              } else if (err.response?.status === 403) {
                setError("세션 소유자가 아닙니다")
              } else {
                // 기타 에러는 기본 흐름 유지
                setStep("wrong")
              }
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
      <ReviewWrongAnswersPractical
        learningSessionId={finalLearningSessionId}
        topicName={topicName}
        onContinue={async () => {
          // 오답 노트 완료 시 advance API 호출
          if (finalLearningSessionId) {
            try {
              // advance 호출하여 REVIEW_WRONG 단계 완료
              const advanceRes = await axios.post("/study/session/advance", {
                sessionId: finalLearningSessionId,
                step: "REVIEW_WRONG",
                score: null,
                detailsJson: null
              })
              
              // advance 응답의 movedTo 필드를 사용하여 다음 단계 결정
              const movedTo = advanceRes.data?.movedTo
              if (movedTo === "SUMMARY") {
                setStep("result")
              } else if (movedTo === "END") {
                // 세션 완료 시 localStorage에서 삭제
                localStorage.removeItem('practicalReviewLearningSessionId')
                setStep("result")
              } else {
                // movedTo가 없으면 세션 재조회로 확인
                const updatedSessionRes = await axios.get(`/study/session/${finalLearningSessionId}`)
                const updatedSession = updatedSessionRes.data
                const currentStep = updatedSession.currentStep
                
                if (currentStep === "SUMMARY") {
                  setStep("result")
                } else if (updatedSession.status === "DONE") {
                  localStorage.removeItem('practicalReviewLearningSessionId')
                  setStep("result")
                } else {
                  // 기본적으로 결과 화면으로 이동
                  setStep("result")
                }
              }
            } catch (err: any) {
              console.error("advance API 호출 실패:", err)
              // 에러 처리
              if (err.response?.status === 400) {
                const errorMessage = err.response?.data?.message || "오답 노트를 완료해야 합니다"
                setError(errorMessage)
              } else if (err.response?.status === 403) {
                setError("세션 소유자가 아닙니다")
              } else {
                // 기타 에러는 기본 흐름 유지
                setStep("result")
              }
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
          loadingSummary={!summaryLoaded}
          onRetry={() => setStep("problem")}
          onBackToDashboard={() => navigate("/learning")}
        />

        {/* 경험치를 얻으면 항상 LevelUpScreen 표시 */}
        {showLevelUp && summaryData?.earnedXp !== undefined && summaryData.earnedXp > 0 && (
          <LevelUpScreen
            earnedExp={summaryData.earnedXp}
            currentExp={(() => {
              // totalXp: 획득 후의 현재 총 경험치
              // xpToNextLevel: 다음 레벨까지 필요한 남은 경험치
              // 레벨당 필요 경험치 = totalXp + xpToNextLevel
              // 현재 레벨 내 경험치 = totalXp % (totalXp + xpToNextLevel)
              if (summaryData.totalXp !== undefined && summaryData.xpToNextLevel !== undefined) {
                const totalExpForLevel = summaryData.totalXp + summaryData.xpToNextLevel
                return summaryData.totalXp % totalExpForLevel
              }
              return 0
            })()}
            currentLevel={summaryData.level || 1}
            expToNextLevel={summaryData.xpToNextLevel || 100}
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
