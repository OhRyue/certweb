import { useState, useMemo, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ProblemPractical } from "./ProblemPractical"
import { ProblemSolving } from "./ProblemSolving"
import { ReviewWrongAnswersWritten } from "../MainLearning/Review/ReviewWrongAnswersWritten"
import { ReviewWrongAnswersPractical } from "../MainLearning/Review/ReviewWrongAnswersPractical"
import { ReviewResult } from "./SoloResult"
import { LevelUpScreen } from "../LevelUpScreen"
import type { Question } from "../../types"
import axios from "../api/axiosConfig"

// 카테고리 퀴즈와 난이도 퀴즈의 플로우 컨테이너
// 1. 문제 풀이 (컴포넌트 분기: 필기 / 실기)
// 2. 결과 화면 및 레벨업 오버레이

export function QuizFlowPage() {
  const location = useLocation()
  const navigate = useNavigate()

  // CategoryQuiz 또는 DifficultyQuiz에서 navigate로 전달된 상태값
  const { 
    examType, 
    quizType,
    questions: apiQuestions, // API에서 받은 문제
    sessionId,
    learningSessionId,
    topicId
  } = location.state || {}

  // API에서 받은 문제 사용 (필기/실기 모두)
  const relatedQuestions = useMemo(() => {
    if (apiQuestions) {
      return apiQuestions as Question[]
    }
    return []
  }, [apiQuestions])

  // 단계 상태 문제 -> 오답 -> 결과
  const [step, setStep] = useState<"problem" | "wrong" | "result">("problem")
  const [showLevelUpScreen, setShowLevelUpScreen] = useState(false)
  
  // API에서 받은 결과 데이터
  const [summaryData, setSummaryData] = useState<{
    mcqTotal?: number
    mcqCorrect?: number
    aiSummary?: string
    completed?: boolean
    earnedXp?: number
    totalXp?: number
    level?: number
    xpToNextLevel?: number
    leveledUp?: boolean
    levelUpRewardPoints?: number
  } | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)

  // 점수 비율로 레벨업 조건 판단 (API 기반)
  const percentage = summaryData && summaryData.mcqTotal && summaryData.mcqTotal > 0
    ? Math.round((summaryData.mcqCorrect || 0) / summaryData.mcqTotal * 100)
    : 0

  // 결과 화면에서 summary API 호출 및 advance API 호출
  useEffect(() => {
    const loadSummary = async () => {
      if (step === "result" && learningSessionId && !summaryData) {
        setLoadingSummary(true)
        try {
          let apiEndpoint: string
          let params: any
          
          if (examType === "practical") {
            // 실기 모드: 기존 API 사용
            apiEndpoint = "/study/practical/summary"
            params = {
              topicId: topicId || 0,
              sessionId: learningSessionId
            }
          } else {
            // 필기 모드: 보조학습 API 사용
            apiEndpoint = "/study/assist/written/summary"
            params = {
              learningSessionId: learningSessionId
            }
          }
          
          const res = await axios.get(apiEndpoint, { params })
          
          const payload = res.data.payload || {}
          
          if (examType === "written") {
            // 보조학습 필기 모드: 새로운 응답 구조 사용
            setSummaryData({
              mcqTotal: payload.total || 0,
              mcqCorrect: payload.correct || 0,
              aiSummary: payload.aiSummary || "",
              completed: payload.completed,
              earnedXp: payload.earnedXp,
              totalXp: payload.totalXp,
              level: payload.level,
              xpToNextLevel: payload.xpToNextLevel,
              leveledUp: payload.leveledUp,
              levelUpRewardPoints: payload.levelUpRewardPoints
            })
            
            // 경험치를 획득했으면 LevelUpScreen 표시
            if (payload.earnedXp && payload.earnedXp > 0) {
              setShowLevelUpScreen(true)
            }
          } else {
            // 실기 모드: 기존 응답 구조 사용
            setSummaryData({
              mcqTotal: payload.mcqTotal || payload.practicalTotal || 0,
              mcqCorrect: payload.mcqCorrect || payload.practicalCorrect || 0,
              aiSummary: payload.aiSummary || ""
            })
          }
          
          // SUMMARY 단계 완료: advance API 호출
          // 세션이 있으면 advance API 호출
          if (learningSessionId) {
            const sessionRes = await axios.get(`/study/session/${learningSessionId}`)
            const session = sessionRes.data
            const currentStep = session.currentStep
            
            // SUMMARY 단계인지 확인 (quizType에 따라 다른 SUMMARY 단계 타입 사용)
            const summaryStep = quizType === "weakness"
              ? (examType === "written"
                ? (currentStep === "ASSIST_WRITTEN_WEAKNESS_SUMMARY" || currentStep === "SUMMARY")
                : (currentStep === "ASSIST_PRACTICAL_WEAKNESS_SUMMARY" || currentStep === "SUMMARY"))
              : quizType === "difficulty"
              ? (examType === "written"
                ? (currentStep === "ASSIST_WRITTEN_DIFFICULTY_SUMMARY" || currentStep === "SUMMARY")
                : (currentStep === "ASSIST_PRACTICAL_DIFFICULTY_SUMMARY" || currentStep === "SUMMARY"))
              : (examType === "written"
                ? (currentStep === "ASSIST_WRITTEN_CATEGORY_SUMMARY" || currentStep === "SUMMARY")
                : (currentStep === "ASSIST_PRACTICAL_CATEGORY_SUMMARY" || currentStep === "SUMMARY"))
            
            // SUMMARY 단계일 때만 advance 호출
            if (summaryStep) {
              await axios.post("/study/session/advance", {
                sessionId: learningSessionId,
                step: "SUMMARY",
                score: null,
                detailsJson: null
              })
              // advance 호출 후 세션 상태 확인 (movedTo === "END", status === "DONE")
              const updatedSessionRes = await axios.get(`/study/session/${learningSessionId}`)
              const updatedSession = updatedSessionRes.data
              if (updatedSession.status === "DONE") {
                // 세션이 종료됨 - localStorage에서 삭제
                console.log("세션이 종료되었습니다. status:", updatedSession.status)
                if (quizType === "difficulty") {
                  localStorage.removeItem('difficultyQuizLearningSessionId')
                } else if (quizType === "weakness") {
                  localStorage.removeItem('weaknessQuizLearningSessionId')
                } else if (quizType === "category") {
                  localStorage.removeItem('categoryQuizLearningSessionId')
                }
              }
            }
          }
        } catch (err: any) {
          console.error("요약 불러오기 실패:", err)
          setSummaryData({
            mcqTotal: 0,
            mcqCorrect: 0,
            aiSummary: ""
          })
        } finally {
          setLoadingSummary(false)
        }
      }
    }
    
    loadSummary()
  }, [step, learningSessionId, examType, topicId, summaryData, quizType])

  // 문제가 없거나 examType이 없을 때 처리
  if (!relatedQuestions || relatedQuestions.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600 mb-4">문제를 불러올 수 없습니다.</p>
        <button
          onClick={() => navigate("/solo")}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          돌아가기
        </button>
      </div>
    )
  }

  if (!examType) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600 mb-4">시험 유형 정보가 없습니다.</p>
        <button
          onClick={() => navigate("/solo")}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          돌아가기
        </button>
      </div>
    )
  }

  // 문제 풀이 단계 필기/실기 분기
  if (step === "problem") {
    if (examType === "written") {
      // 필기 모드: learningSession 기반 (API 채점 지원)
      if (sessionId !== undefined) {
        const userId = localStorage.getItem("userId") || "guest"
        const quizTitle = quizType === "weakness" ? "약점 보완 퀴즈" 
          : quizType === "difficulty" ? "난이도 퀴즈" 
          : "카테고리 퀴즈"
        
        // 채점 API 엔드포인트 결정
        let gradeEndpoint = `/study/assist/written/category/grade-one`
        if (quizType === "weakness") {
          gradeEndpoint = `/study/assist/written/weakness/grade-one`
        } else if (quizType === "difficulty") {
          gradeEndpoint = `/study/assist/written/difficulty/grade-one`
        }
        
        return (
          <ProblemSolving
            questions={relatedQuestions}
            topicName={quizTitle}
            topicId={topicId || 0}
            userId={userId}
            quizType={quizType || null}
            onSubmitOne={async ({ questionId, label }) => {
              // 카테고리/난이도/약점 보완 퀴즈 필기 채점 API
              const res = await axios.post(
                gradeEndpoint,
                {
                  questionId: questionId,
                  label: label
                },
                {
                  params: {
                    learningSessionId: learningSessionId
                  }
                }
              )
              
              return {
                correct: res.data.correct || false,
                correctLabel: res.data.correctLabel || label,
                explanation: res.data.explanation || "", // 필기는 항상 explanation 사용
                aiExplanation: "" // 필기는 ai 해설 사용하지 않음
              }
            }}
            onComplete={async (score, answers) => {
              // 필기 모드: 세션 조회하여 step 결정 (advance 호출하지 않음)
              if (learningSessionId) {
                try {
                  // 세션 조회하여 현재 단계 확인
                  const sessionRes = await axios.get(`/study/session/${learningSessionId}`)
                  const session = sessionRes.data
                  const currentStep = session.currentStep
                  
                  const wrongStep = quizType === "weakness"
                    ? (currentStep === "ASSIST_WRITTEN_WEAKNESS_WRONG" || currentStep === "REVIEW_WRONG")
                    : quizType === "difficulty"
                    ? (currentStep === "ASSIST_WRITTEN_DIFFICULTY_WRONG" || currentStep === "REVIEW_WRONG")
                    : (currentStep === "ASSIST_WRITTEN_CATEGORY_WRONG" || currentStep === "REVIEW_WRONG")
                  
                  const summaryStep = quizType === "weakness"
                    ? (currentStep === "ASSIST_WRITTEN_WEAKNESS_SUMMARY" || currentStep === "SUMMARY")
                    : quizType === "difficulty"
                    ? (currentStep === "ASSIST_WRITTEN_DIFFICULTY_SUMMARY" || currentStep === "SUMMARY")
                    : (currentStep === "ASSIST_WRITTEN_CATEGORY_SUMMARY" || currentStep === "SUMMARY")
                  
                  if (wrongStep) {
                    setStep("wrong")
                  } else if (summaryStep) {
                    setStep("result")
                  } else if (session.status === "DONE") {
                    if (quizType === "difficulty") {
                      localStorage.removeItem('difficultyQuizLearningSessionId')
                    } else if (quizType === "weakness") {
                      localStorage.removeItem('weaknessQuizLearningSessionId')
                    } else if (quizType === "category") {
                      localStorage.removeItem('categoryQuizLearningSessionId')
                    }
                    setStep("result")
                  } else {
                    // 세션 상태를 확인할 수 없으면 에러 처리
                    console.error("세션 상태를 확인할 수 없습니다:", session)
                    // 문제 화면에 머물기
                    return
                  }
                } catch (err: any) {
                  console.error("세션 조회 실패:", err)
                  // 세션 조회 실패 시 문제 화면에 머물기
                  return
                }
              }
            }}
          />
        )
      }
    } else if (examType === "practical") {
      // 실기 모드: learningSession 기반 (API 채점 지원)
      if (sessionId !== undefined) {
        const quizTitle = quizType === "weakness" ? "약점 보완 퀴즈" 
          : quizType === "difficulty" ? "난이도 퀴즈" 
          : "카테고리 퀴즈"
        
        return (
          <ProblemPractical
            questions={relatedQuestions}
            topicName={quizTitle}
            topicId={topicId || 0}
            sessionId={sessionId}
            learningSessionId={learningSessionId}
            isDifficultyQuiz={quizType === "difficulty"}
            quizType={quizType === "difficulty" || quizType === "weakness" || quizType === "category" ? quizType : null}
            onComplete={async (score, answers) => {
              // 실기 모드: 세션 조회하여 step 결정 (advance 호출하지 않음)
              if (learningSessionId) {
                try {
                  // 세션 조회하여 현재 단계 확인
                  const sessionRes = await axios.get(`/study/session/${learningSessionId}`)
                  const session = sessionRes.data
                  const currentStep = session.currentStep
                  
                  const wrongStep = quizType === "weakness"
                    ? (currentStep === "ASSIST_PRACTICAL_WEAKNESS_WRONG" || currentStep === "REVIEW_WRONG")
                    : quizType === "difficulty"
                    ? (currentStep === "ASSIST_PRACTICAL_DIFFICULTY_WRONG" || currentStep === "REVIEW_WRONG")
                    : (currentStep === "ASSIST_PRACTICAL_CATEGORY_WRONG" || currentStep === "REVIEW_WRONG")
                  
                  const summaryStep = quizType === "weakness"
                    ? (currentStep === "ASSIST_PRACTICAL_WEAKNESS_SUMMARY" || currentStep === "SUMMARY")
                    : quizType === "difficulty"
                    ? (currentStep === "ASSIST_PRACTICAL_DIFFICULTY_SUMMARY" || currentStep === "SUMMARY")
                    : (currentStep === "ASSIST_PRACTICAL_CATEGORY_SUMMARY" || currentStep === "SUMMARY")
                  
                  if (wrongStep) {
                    setStep("wrong")
                  } else if (summaryStep) {
                    setStep("result")
                  } else if (session.status === "DONE") {
                    if (quizType === "difficulty") {
                      localStorage.removeItem('difficultyQuizLearningSessionId')
                    } else if (quizType === "weakness") {
                      localStorage.removeItem('weaknessQuizLearningSessionId')
                    } else if (quizType === "category") {
                      localStorage.removeItem('categoryQuizLearningSessionId')
                    }
                    setStep("result")
                  } else {
                    // 세션 상태를 확인할 수 없으면 에러 처리
                    console.error("세션 상태를 확인할 수 없습니다:", session)
                    // 문제 화면에 머물기
                    return
                  }
                } catch (err: any) {
                  console.error("세션 조회 실패:", err)
                  // 세션 조회 실패 시 문제 화면에 머물기
                  return
                }
              }
            }}
          />
        )
      }
    }
  }

  // 오답 노트 단계
  if (step === "wrong" && learningSessionId) {
    if (examType === "written") {
      const quizTitle = quizType === "weakness" ? "약점 보완 퀴즈" 
        : quizType === "difficulty" ? "난이도 퀴즈" 
        : "카테고리 퀴즈"
      
      return (
        <ReviewWrongAnswersWritten
          learningSessionId={learningSessionId}
          topicName={quizTitle}
          onContinue={async () => {
            // 오답 정리 완료 후 advance API 호출하고 세션 조회하여 다음 단계 확인
            if (learningSessionId) {
              try {
                // advance API 호출 (step은 REVIEW_WRONG으로 고정)
                await axios.post("/study/session/advance", {
                  sessionId: learningSessionId,
                  step: "REVIEW_WRONG",
                  score: null,
                  detailsJson: null
                })
                
                // advance 호출 후 세션 조회하여 다음 단계 확인
                const sessionRes = await axios.get(`/study/session/${learningSessionId}`)
                const session = sessionRes.data
                const currentStep = session.currentStep
                
                const summaryStep = quizType === "weakness"
                  ? (currentStep === "ASSIST_WRITTEN_WEAKNESS_SUMMARY" || currentStep === "SUMMARY")
                  : quizType === "difficulty"
                  ? (currentStep === "ASSIST_WRITTEN_DIFFICULTY_SUMMARY" || currentStep === "SUMMARY")
                  : (currentStep === "ASSIST_WRITTEN_CATEGORY_SUMMARY" || currentStep === "SUMMARY")
                
                if (summaryStep) {
                  setStep("result")
                } else if (session.status === "DONE") {
                  if (quizType === "difficulty") {
                    localStorage.removeItem('difficultyQuizLearningSessionId')
                  } else if (quizType === "weakness") {
                    localStorage.removeItem('weaknessQuizLearningSessionId')
                  } else if (quizType === "category") {
                    localStorage.removeItem('categoryQuizLearningSessionId')
                  }
                  setStep("result")
                } else {
                  console.error("세션 상태를 확인할 수 없습니다:", session)
                  return
                }
              } catch (err: any) {
                console.error("advance API 호출 또는 세션 조회 실패:", err)
                // 에러 발생 시 오답 화면에 머물기
                return
              }
            }
          }}
        />
      )
    } else if (examType === "practical") {
      const quizTitle = quizType === "weakness" ? "약점 보완 퀴즈" 
        : quizType === "difficulty" ? "난이도 퀴즈" 
        : "카테고리 퀴즈"
      
      return (
        <ReviewWrongAnswersPractical
          learningSessionId={learningSessionId}
          topicName={quizTitle}
          onContinue={async () => {
            // 오답 정리 완료 후 advance API 호출하고 세션 조회하여 다음 단계 확인
            if (learningSessionId) {
              try {
                // advance API 호출 (step은 REVIEW_WRONG으로 고정)
                await axios.post("/study/session/advance", {
                  sessionId: learningSessionId,
                  step: "REVIEW_WRONG",
                  score: null,
                  detailsJson: null
                })
                
                // advance 호출 후 세션 조회하여 다음 단계 확인
                const sessionRes = await axios.get(`/study/session/${learningSessionId}`)
                const session = sessionRes.data
                const currentStep = session.currentStep
                
                const summaryStep = quizType === "weakness"
                  ? (currentStep === "ASSIST_PRACTICAL_WEAKNESS_SUMMARY" || currentStep === "SUMMARY")
                  : quizType === "difficulty"
                  ? (currentStep === "ASSIST_PRACTICAL_DIFFICULTY_SUMMARY" || currentStep === "SUMMARY")
                  : (currentStep === "ASSIST_PRACTICAL_CATEGORY_SUMMARY" || currentStep === "SUMMARY")
                
                if (summaryStep) {
                  setStep("result")
                } else if (session.status === "DONE") {
                  if (quizType === "difficulty") {
                    localStorage.removeItem('difficultyQuizLearningSessionId')
                  } else if (quizType === "weakness") {
                    localStorage.removeItem('weaknessQuizLearningSessionId')
                  } else if (quizType === "category") {
                    localStorage.removeItem('categoryQuizLearningSessionId')
                  }
                  setStep("result")
                } else {
                  console.error("세션 상태를 확인할 수 없습니다:", session)
                  return
                }
              } catch (err: any) {
                console.error("advance API 호출 또는 세션 조회 실패:", err)
                // 에러 발생 시 오답 화면에 머물기
                return
              }
            }
          }}
        />
      )
    }
  }

  // 결과 화면
  if (step === "result") {
    const topicName = quizType === "weakness" ? "약점 보완 퀴즈" 
      : quizType === "difficulty" ? "난이도 퀴즈" 
      : "카테고리 퀴즈"
    
    return (
      <>
        <ReviewResult
          topicName={topicName}
          problemScore={undefined}
          totalProblem={undefined}
          mcqTotal={summaryData?.mcqTotal}
          mcqCorrect={summaryData?.mcqCorrect}
          aiSummary={summaryData?.aiSummary}
          loadingSummary={loadingSummary}
          onRetry={() => setStep("problem")}
          onBackToDashboard={() => {
            // learningSessionId 정리
            if (quizType === "difficulty") {
              localStorage.removeItem('difficultyQuizLearningSessionId')
            } else if (quizType === "weakness") {
              localStorage.removeItem('weaknessQuizLearningSessionId')
            } else if (quizType === "category") {
              localStorage.removeItem('categoryQuizLearningSessionId')
            }
            navigate("/solo")
          }}
        />
        {/* LevelUpScreen: 경험치를 획득했을 때만 표시 */}
        {showLevelUpScreen && summaryData && summaryData.earnedXp && summaryData.earnedXp > 0 && (
          <LevelUpScreen
            earnedExp={summaryData.earnedXp}
            totalXP={summaryData.totalXp || 0}
            currentLevel={summaryData.level || 1}
            isLevelUp={summaryData.leveledUp || false}
            earnedPoints={summaryData.levelUpRewardPoints || 0}
            onComplete={() => setShowLevelUpScreen(false)}
          />
        )}
      </>
    )
  }

  // 방어 return
  return null
}
