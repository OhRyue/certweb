import { useState, useMemo, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ProblemSolving } from "./ProblemSolving"
import { ProblemPractical } from "./ProblemPractical"
import { ProblemSolvingPractical } from "../MainLearning/Micro/Practical/ProblemSolvingPractical"
import { ProblemSolvingWritten } from "../MainLearning/Micro/Written/ProblemSolvingWritten"
import { ReviewWrongAnswersWritten } from "../MainLearning/Review/ReviewWrongAnswersWritten"
import { ReviewWrongAnswersPractical } from "../MainLearning/Review/ReviewWrongAnswersPractical"
import { ReviewResult } from "./SoloResult"
import { LevelUpScreen } from "../LevelUpScreen"
import { questions } from "../../data/mockData"
import type { Question } from "../../types"
import axios from "../api/axiosConfig"

// 카테고리 퀴즈와 난이도 퀴즈의 플로우 컨테이너
// 1. 문제 풀이 (컴포넌트 분기: 필기 / 실기)
// 2. 결과 화면 및 레벨업 오버레이

// API 응답을 Question 형식으로 변환하는 함수들
function normalizeMcq(items: any[]): Question[] {
  return items.map((q) => ({
    id: String(q.questionId),
    topicId: "",
    question: q.text,
    options: q.choices
      ? q.choices.map((c: any) => ({
        label: c.label,
        text: c.text,
      }))
      : [],
    correctAnswer: null as any, // 채점 API에서 받아야 함
    explanation: "",
    difficulty: q.difficulty ?? "medium",
    tags: q.tags ?? [],
    type: "multiple" as const,
    examType: "written" as const,
    imageUrl: q.imageUrl,
  }))
}

function normalizePractical(items: any[]): Question[] {
  return items.map((q) => ({
    id: String(q.questionId),
    topicId: "",
    question: q.text,
    options: [],
    correctAnswer: null as any, // 채점 API에서 받아야 함
    explanation: "",
    difficulty: "medium" as const,
    tags: [],
    type: "typing" as const,
    examType: "practical" as const,
    imageUrl: q.imageUrl,
  }))
}

export function QuizFlowPage() {
  const location = useLocation()
  const navigate = useNavigate()

  // CategoryQuiz 또는 DifficultyQuiz에서 navigate로 전달된 상태값
  const { 
    selectedDetails, 
    questionCount, 
    examType, 
    quizType,
    questions: apiQuestions, // API에서 받은 문제 (난이도 퀴즈 실기 모드)
    sessionId,
    learningSessionId,
    topicId
  } = location.state || {}
  
  // 선택된 detail id 배열 보정
  const detailIds = Array.isArray(selectedDetails) ? selectedDetails : []

  // 카테고리 퀴즈: mockData에서 필터링
  // 난이도 퀴즈: API에서 받은 문제 사용 (필기/실기 모두)
  const relatedQuestions = useMemo(() => {
    if (quizType === "difficulty" && apiQuestions) {
      return apiQuestions as Question[]
    }
    // 카테고리 퀴즈: 기존 로직
    const filtered = questions.filter(q => detailIds.map(String).includes(q.topicId))
    return filtered.slice(0, questionCount || 10)
  }, [detailIds, questionCount, quizType, apiQuestions])

  // 단계 상태 문제 -> 오답 -> 결과 (난이도 퀴즈만 오답 단계 포함)
  const [step, setStep] = useState<"problem" | "wrong" | "result">("problem")
  const [problemScore, setProblemScore] = useState(0) // 카테고리 퀴즈용 (난이도 퀴즈는 API 사용)
  const [showLevelUp, setShowLevelUp] = useState(false)
  
  // API에서 받은 결과 데이터 (난이도 퀴즈용)
  const [summaryData, setSummaryData] = useState<{
    mcqTotal?: number
    mcqCorrect?: number
    aiSummary?: string
  } | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)

  // 점수 비율로 레벨업 조건 판단 (카테고리 퀴즈용)
  const totalProblems = relatedQuestions.length
  const percentage = quizType === "difficulty" && summaryData
    ? (summaryData.mcqTotal && summaryData.mcqTotal > 0 
        ? Math.round((summaryData.mcqCorrect || 0) / summaryData.mcqTotal * 100) 
        : 0)
    : Math.round((problemScore / totalProblems) * 100)

  // 난이도 퀴즈 결과 화면에서 summary API 호출
  useEffect(() => {
    const loadSummary = async () => {
      if (step === "result" && quizType === "difficulty" && learningSessionId && !summaryData) {
        setLoadingSummary(true)
        try {
          const apiEndpoint = examType === "practical" 
            ? "/study/practical/summary"
            : "/study/written/summary"
          
          const res = await axios.get(apiEndpoint, {
            params: {
              topicId: topicId || 0,
              sessionId: learningSessionId
            }
          })
          
          const payload = res.data.payload || {}
          setSummaryData({
            mcqTotal: payload.mcqTotal || payload.practicalTotal || 0,
            mcqCorrect: payload.mcqCorrect || payload.practicalCorrect || 0,
            aiSummary: payload.aiSummary || ""
          })
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
  }, [step, quizType, learningSessionId, examType, topicId, summaryData])

  useEffect(() => {
    if (step === "result" && percentage === 100) {
      setShowLevelUp(true)
    }
  }, [step, percentage])

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
      // 난이도 퀴즈 필기 모드: learningSession 기반 (API 채점 지원)
      if (quizType === "difficulty" && sessionId !== undefined) {
        const userId = localStorage.getItem("userId") || "guest"
        return (
          <ProblemSolvingWritten
            questions={relatedQuestions}
            topicName="난이도 퀴즈"
            topicId={topicId || 0}
            userId={userId}
            onSubmitOne={async ({ questionId, label }) => {
              // 난이도 퀴즈 필기 채점 API
              const res = await axios.post(
                `/study/assist/written/difficulty/grade-one`,
                {
                  label: label
                },
                {
                  params: {
                    learningSessionId: learningSessionId,
                    questionId: questionId
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
              // 난이도 퀴즈 필기 모드: 세션 조회하여 step 결정 (advance 호출하지 않음)
              // ASSIST_WRITTEN_DIFFICULTY 단계는 제출 시 자동으로 COMPLETE 처리됨
              if (quizType === "difficulty" && learningSessionId) {
                try {
                  // 세션 조회하여 현재 단계 확인
                  const sessionRes = await axios.get(`/study/session/${learningSessionId}`)
                  const session = sessionRes.data
                  const currentStep = session.currentStep
                  
                  if (currentStep === "ASSIST_WRITTEN_DIFFICULTY_WRONG" || currentStep === "REVIEW_WRONG") {
                    setStep("wrong")
                  } else if (currentStep === "ASSIST_WRITTEN_DIFFICULTY_SUMMARY" || currentStep === "SUMMARY") {
                    setStep("result")
                  } else if (session.status === "DONE") {
                    localStorage.removeItem('difficultyQuizLearningSessionId')
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
              } else {
                // 카테고리 퀴즈: 기존 방식
                setProblemScore(score)
                setStep("result")
              }
            }}
          />
        )
      } else {
        // 카테고리 퀴즈 필기 모드: 기존 방식 (로컬 채점)
        return (
          <ProblemSolving
            questions={relatedQuestions}
            onComplete={(score, answers) => {
              setProblemScore(score)
              setStep("result")
            }}
          />
        )
      }
    } else if (examType === "practical") {
      // 난이도 퀴즈 실기 모드: learningSession 기반 (API 채점 지원)
      if (quizType === "difficulty" && sessionId !== undefined) {
        return (
          <ProblemSolvingPractical
            questions={relatedQuestions}
            topicName="난이도 퀴즈"
            topicId={topicId || 0}
            sessionId={sessionId}
            learningSessionId={learningSessionId}
            isDifficultyQuiz={true}
            onComplete={async (score, answers) => {
              // 난이도 퀴즈 실기 모드: 세션 조회하여 step 결정 (advance 호출하지 않음)
              // ASSIST_PRACTICAL_DIFFICULTY 단계는 제출 시 자동으로 COMPLETE 처리됨
              if (quizType === "difficulty" && learningSessionId) {
                try {
                  // 세션 조회하여 현재 단계 확인
                  const sessionRes = await axios.get(`/study/session/${learningSessionId}`)
                  const session = sessionRes.data
                  const currentStep = session.currentStep
                  
                  if (currentStep === "ASSIST_PRACTICAL_DIFFICULTY_WRONG" || currentStep === "REVIEW_WRONG") {
                    setStep("wrong")
                  } else if (currentStep === "ASSIST_PRACTICAL_DIFFICULTY_SUMMARY" || currentStep === "SUMMARY") {
                    setStep("result")
                  } else if (session.status === "DONE") {
                    localStorage.removeItem('difficultyQuizLearningSessionId')
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
              } else {
                // 카테고리 퀴즈: 기존 방식
                setProblemScore(score)
                setStep("result")
              }
            }}
          />
        )
      } else {
        // 카테고리 퀴즈 실기 모드: 기존 방식 (로컬 채점)
        return (
          <ProblemPractical
            questions={relatedQuestions}
            topicName={quizType === "difficulty" ? "난이도 퀴즈" : "카테고리 퀴즈"}
            onComplete={(score, answers) => {
              setProblemScore(score)
              setStep("result")
            }}
          />
        )
      }
    }
  }

  // 오답 노트 단계 (난이도 퀴즈만)
  if (step === "wrong" && quizType === "difficulty" && learningSessionId) {
    if (examType === "written") {
      return (
        <ReviewWrongAnswersWritten
          learningSessionId={learningSessionId}
          topicName="난이도 퀴즈"
          onContinue={async () => {
            // 오답 정리 완료 후 advance API 호출하여 요약 단계로 이동
            if (learningSessionId) {
              try {
                const advanceRes = await axios.post("/study/session/advance", {
                  sessionId: learningSessionId,
                  step: "REVIEW_WRONG",
                  score: null,
                  detailsJson: null
                })
                
                // advance 성공 시에만 세션 조회하여 step 결정
                const movedTo = advanceRes.data?.movedTo
                if (movedTo === "ASSIST_WRITTEN_DIFFICULTY_SUMMARY" || movedTo === "SUMMARY") {
                  setStep("result")
                } else if (movedTo === "END") {
                  localStorage.removeItem('difficultyQuizLearningSessionId')
                  setStep("result")
                } else {
                  // movedTo가 없으면 세션 재조회로 확인
                  const updatedSessionRes = await axios.get(`/study/session/${learningSessionId}`)
                  const updatedSession = updatedSessionRes.data
                  const currentStep = updatedSession.currentStep
                  
                  if (currentStep === "ASSIST_WRITTEN_DIFFICULTY_SUMMARY" || currentStep === "SUMMARY") {
                    setStep("result")
                  } else if (updatedSession.status === "DONE") {
                    localStorage.removeItem('difficultyQuizLearningSessionId')
                    setStep("result")
                  } else {
                    console.error("세션 상태를 확인할 수 없습니다:", updatedSession)
                    return
                  }
                }
              } catch (err: any) {
                console.error("advance API 호출 실패:", err)
                // advance 실패 시 절대 step을 변경하지 않음 - 오답 화면에 머물기
                return
              }
            }
          }}
        />
      )
    } else if (examType === "practical") {
      const quizTitle =
        quizType === "difficulty"
          ? "난이도별 퀴즈"
          : quizType === "weakness"
          ? "약점 퀴즈"
          : "카테고리 퀴즈"

      // topicId 추출: location.state에서 받거나, API 응답에서 추출하거나, 문제 데이터에서 추출
      const extractedTopicId = topicId || 
        apiResponse?.meta?.topicId || 
        (apiQuestions && apiQuestions.length > 0 && (apiQuestions[0] as any).topicId) ||
        (relatedQuestions && relatedQuestions.length > 0 && Number(relatedQuestions[0].topicId) || 0) ||
        0

      return (
        <ReviewWrongAnswersPractical
          learningSessionId={learningSessionId}
          topicName="난이도 퀴즈"
          onContinue={async () => {
            // 오답 정리 완료 후 advance API 호출하여 요약 단계로 이동
            if (learningSessionId) {
              try {
                const advanceRes = await axios.post("/study/session/advance", {
                  sessionId: learningSessionId,
                  step: "REVIEW_WRONG",
                  score: null,
                  detailsJson: null
                })
                
                // advance 성공 시에만 세션 조회하여 step 결정
                const movedTo = advanceRes.data?.movedTo
                if (movedTo === "ASSIST_PRACTICAL_DIFFICULTY_SUMMARY" || movedTo === "SUMMARY") {
                  setStep("result")
                } else if (movedTo === "END") {
                  localStorage.removeItem('difficultyQuizLearningSessionId')
                  setStep("result")
                } else {
                  // movedTo가 없으면 세션 재조회로 확인
                  const updatedSessionRes = await axios.get(`/study/session/${learningSessionId}`)
                  const updatedSession = updatedSessionRes.data
                  const currentStep = updatedSession.currentStep
                  
                  if (currentStep === "ASSIST_PRACTICAL_DIFFICULTY_SUMMARY" || currentStep === "SUMMARY") {
                    setStep("result")
                  } else if (updatedSession.status === "DONE") {
                    localStorage.removeItem('difficultyQuizLearningSessionId')
                    setStep("result")
                  } else {
                    console.error("세션 상태를 확인할 수 없습니다:", updatedSession)
                    return
                  }
                }
              } catch (err: any) {
                console.error("advance API 호출 실패:", err)
                // advance 실패 시 절대 step을 변경하지 않음 - 오답 화면에 머물기
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
    const topicName = quizType === "difficulty" ? "난이도 퀴즈" : "카테고리 퀴즈"
    
    return (
      <>
        <ReviewResult
          topicName={topicName}
          problemScore={quizType === "difficulty" ? undefined : problemScore}
          totalProblem={quizType === "difficulty" ? undefined : totalProblems}
          mcqTotal={summaryData?.mcqTotal}
          mcqCorrect={summaryData?.mcqCorrect}
          aiSummary={summaryData?.aiSummary}
          loadingSummary={loadingSummary}
          onRetry={() => setStep("problem")}
          onBackToDashboard={() => {
            // 난이도 퀴즈일 때 learningSessionId 정리 (필기/실기 모두)
            if (quizType === "difficulty") {
              localStorage.removeItem('difficultyQuizLearningSessionId')
            }
            navigate("/solo")
          }}
        />
        {showLevelUp && (
          <LevelUpScreen
            currentLevel={3}
            currentExp={80}
            earnedExp={20}
            expPerLevel={100}
            onComplete={() => setShowLevelUp(false)}
          />
        )}
      </>
    )
  }

  // 방어 return
  return null
}
