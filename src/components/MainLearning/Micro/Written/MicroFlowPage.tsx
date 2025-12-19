import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import axios from "../../../api/axiosConfig"

import { ConceptView } from "../ConceptView"
import { MiniCheck } from "../MiniCheck"
import { ProblemSolvingWritten } from "./ProblemSolvingWritten"
import { MicroWrongAnswersWritten } from "./MicroWrongAnswersWritten"
import { MicroResult } from "..//MicroResult"
import { LevelUpScreen } from "../../../LevelUpScreen"
import { getAuthItem } from "../../../../utils/authStorage"

// 세션 단계 타입
// 필기: CONCEPT, MINI, REVIEW_WRONG, MCQ, SUMMARY
type SessionStep = "CONCEPT" | "MINI" | "REVIEW_WRONG" | "MCQ" | "PRACTICAL" | "PRACTICAL_SET" | "SUMMARY"
type StepState = "READY" | "IN_PROGRESS" | "COMPLETE" | "CLOSED"

// 세션 단계 정보 (새로운 API 응답 구조에 맞춤)
interface SessionStepInfo {
  stepId: number
  step: SessionStep
  state: StepState
  scorePct: number | null
  metadata: string | null
}

// 세션 상태 정보
interface SessionInfo {
  sessionId: number
  topicId: number
  mode: "WRITTEN" | "PRACTICAL"
  status: "IN_PROGRESS" | "DONE" | "ABANDONED"
  currentStep: SessionStep | null
  steps: SessionStepInfo[]
  learningSessionId?: number  // LearningSession ID (선택적, 세션 정보에 포함될 수 있음)
}

// 세션 단계를 내부 step으로 변환
// 필기 전용 매핑
function mapSessionStepToInternalStep(sessionStep: SessionStep | null): string {
  if (!sessionStep) return "concept"
  
  switch (sessionStep) {
    case "CONCEPT":
      return "concept"
    case "MINI":
      return "mini"
    case "REVIEW_WRONG":
      return "wrong"
    case "MCQ":           // 필기 문제 풀이
      return "problem"
    case "SUMMARY":
      return "result"
    default:
      return "concept"
  }
}

/*
마이크로 학습 전체 흐름 (세션 기반)
1. 세션 시작 후 세션 상태 확인
2. currentStep에 따라 적절한 단계로 이동
3. 각 단계 완료 후 세션 상태 확인하여 다음 단계 결정
*/
export function MicroFlowPage() {
  const [step, setStep] = useState<string | null>(null)    // 현재 상태(세션 상태 기반으로 결정)
  const [loading, setLoading] = useState(true)            // 최초 로딩 상태
  const [error, setError] = useState<string | null>(null) // 어떤 단계에서든 발생 가능한 에러 메시지
  const [, setSessionInfo] = useState<SessionInfo | null>(null)  // 세션 상태 정보
  const [topicId, setTopicId] = useState<number | null>(null)  // 세션의 topicId (세션 조회 후 설정)

  // 데이터
  const [conceptData, setConceptData] = useState(null)    // 데이터
  const [miniData, setMiniData] = useState(null)
  const [mcqData, setMcqData] = useState(null)

  // 점수
  const [miniScore, setMiniScore] = useState(0)           // 점수
  const [problemScore, setProblemScore] = useState(0)

  const [wrongAnswers, setWrongAnswers] = useState([])    // 객관식 문제 중 틀린 문제 목록
  const [learningSessionId, setLearningSessionId] = useState<number | null>(null)  // 실기 미니체크에서 받은 learningSessionId
  const [summaryData, setSummaryData] = useState<{
    miniTotal?: number
    miniCorrect?: number
    mcqTotal?: number
    mcqCorrect?: number
    summary?: string
    aiSummary?: string
    earnedXp?: number
    totalXp?: number
    level?: number
    xpToNextLevel?: number
    leveledUp?: boolean
    levelUpRewardPoints?: number
  } | null>(null)  // SUMMARY API 응답 데이터
  const [showLevelUp, setShowLevelUp] = useState(false)  // 레벨업 모달 표시 여부
  const [loadingSummary, setLoadingSummary] = useState(false)  // SUMMARY API 로딩 상태

  const [searchParams] = useSearchParams()      // URL 쿼리 파라미터
  const navigate = useNavigate()

  const subTopicId = Number(searchParams.get("subTopicId"))         // 쿼리에서 서브 토픽 아이디 읽기
  const userId = getAuthItem("userId") || "guest"          // 임시 유저 아이디, 로그인 안되어 있으면 게스트로 처리
  const sessionIdParam = searchParams.get("sessionId")             // 쿼리에서 세션 아이디 읽기
  
  const [sessionId] = useState<number | null>(
    sessionIdParam ? Number(sessionIdParam) : null
  )  // 세션 시작 API로부터 받은 sessionId

  // 필기 전용
  const examType = "written" as const

  // 세션 상태 조회 함수
  const fetchSessionInfo = async (sessionId: number): Promise<SessionInfo> => {
    const res = await axios.get(`/study/session/${sessionId}`)
    return res.data
  }

  // 세션 상태 확인 후 현재 단계로 이동
  const syncSessionAndNavigate = async (targetSessionId: number) => {
    try {
      const session = await fetchSessionInfo(targetSessionId)
      setSessionInfo(session)
      
      // 세션의 topicId 업데이트 (세션 조회로 확인한 topicId 사용)
      setTopicId(session.topicId)
      
      // learningSessionId가 세션 정보에 포함되어 있으면 저장
      if (session.learningSessionId !== undefined && learningSessionId === null) {
        setLearningSessionId(session.learningSessionId)
        // localStorage에도 저장
        localStorage.setItem('learningSessionId', session.learningSessionId.toString())
      }
      
      // currentStep에 따라 적절한 단계로 이동
      const internalStep = mapSessionStepToInternalStep(session.currentStep)
      
      // 문제 풀이 단계로 이동할 때는 이전 문제 데이터 초기화
      if (internalStep === "problem") {
        setMcqData(null)
      }
      
      setStep(internalStep)
    } catch (err) {
      console.error("세션 상태 확인 실패:", err)
      setError("세션 상태를 불러오는 중 오류가 발생했습니다")
    }
  }

  // 백엔드 MCQ 응답을 프론트에서 쓰기 편한 형태로 정규화
  // ProblemSolvingWritten 컴포넌트가 기대하는 필드 구조로 맞춰주는 역할
  function normalizeMcq(items) {
    return items.map((q) => ({
      id: q.questionId,           // 문제 아이디
      question: q.text,           // 문제 본문
      imageUrl: q.imageUrl || null, // 이미지 URL (있을 수 있음)

      // 선택지 변환 (ProblemSolvingWritten이 기대하는 형식: { label, text } 객체 배열 또는 문자열 배열)
      options: q.choices
        ? q.choices.map(c => ({
            label: c.label,     // A, B, C, D
            text: c.text        // 선택지 내용
          }))
        : [],

      // grade-one 때 판단
      correctAnswer: null,

      // 해설은 grade-one 응답으로 채울 수 있음   지금은 비워둠
      explanation: "",

      // 난이도나 태그는 백엔드가 주면 그대로 사용
      difficulty: q.difficulty ?? "medium",
      tags: q.tags ?? []
    }))
  }


  // 1. 초기 로딩: 세션 상태 확인
  useEffect(() => {
    const initialize = async () => {
      try {
        // localStorage에서 저장된 learningSessionId 확인 (페이지 새로고침 대응)
        // learningSessionId만 복원하고, 세션 조회는 sessionId가 있을 때만 수행
        const savedLearningSessionId = localStorage.getItem('learningSessionId')
        if (savedLearningSessionId && !learningSessionId) {
          const savedId = Number(savedLearningSessionId)
          // learningSessionId만 복원 (세션 조회는 sessionId가 있을 때만)
          setLearningSessionId(savedId)
          console.log("저장된 learningSessionId 복원:", savedId)
        }
        
        // 세션이 있으면 세션 상태 확인 (한 번만 조회)
        if (sessionId) {
          const session = await fetchSessionInfo(sessionId)
          setSessionInfo(session)
          
          // 세션의 topicId 저장 (세션 조회로 확인한 topicId 사용)
          setTopicId(session.topicId)
          
          // learningSessionId가 세션 정보에 있으면 저장
          if (session.learningSessionId !== undefined && !learningSessionId) {
            setLearningSessionId(session.learningSessionId)
            localStorage.setItem('learningSessionId', session.learningSessionId.toString())
          }
          
          // currentStep에 따라 적절한 단계로 이동
          const internalStep = mapSessionStepToInternalStep(session.currentStep)
          setStep(internalStep)
          
          // 개념 데이터는 별도의 useEffect에서 불러옴 (중복 방지)
        } else {
          // 세션이 없을 때는 subTopicId 사용 (fallback)
          setTopicId(subTopicId)
          // 세션이 없으면 기본적으로 concept 단계로
          setStep("concept")
          
          // 세션이 없을 때는 기존 API 사용 (fallback)
          const ConceptRes = await axios.get(`/cert/concepts/${subTopicId}`)
          const parsed = JSON.parse(ConceptRes.data.sectionsJson)
          const topicRes = await axios.get(`/cert/topics/${subTopicId}`)

          setConceptData({
            topicId: ConceptRes.data.topicId,
            sections: parsed.sections,
            title: topicRes.data.title || ""
          })
        }
      } catch (err) {
        console.error(err)
        setError("데이터를 불러오는 중 오류가 발생했습니다")
      } finally {
        setLoading(false)
      }
    }

    initialize()
  }, [subTopicId, sessionId])

  // 개념 데이터 불러오기 (세션 기반, concept 단계일 때만)
  useEffect(() => {
    const loadConceptData = async () => {
      if (step === "concept" && !conceptData && sessionId && topicId) {
        try {
          const conceptRes = await axios.get(`/study/${examType}/concept/${topicId}`, {
            params: { sessionId }
          })
          setConceptData({
            topicId: conceptRes.data.topicId,
            sections: conceptRes.data.sections || [],
            title: conceptRes.data.title || ""
          })
        } catch (err) {
          console.error("개념 데이터 불러오기 실패:", err)
          setError("개념 데이터를 불러오는 중 오류가 발생했습니다")
        }
      }
    }
    loadConceptData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, sessionId, examType, topicId])

  // 미니체크 문제 불러오기 (세션 기반)
  useEffect(() => {
    const loadMiniData = async () => {
      if (step === "mini" && !miniData && sessionId && topicId) {
        try {
          const res = await axios.get(`/study/${examType}/mini/${topicId}`, {
            params: { sessionId }
          })
          // 응답 구조: payload.items 또는 items 배열
          const items = res.data.payload?.items || res.data.items || []
          setMiniData(items)
          
          // learningSessionId가 응답에 포함되어 있으면 저장
          if (res.data.learningSessionId !== undefined) {
            setLearningSessionId(res.data.learningSessionId)
            // localStorage에도 저장
            localStorage.setItem('learningSessionId', res.data.learningSessionId.toString())
          }
        } catch (err) {
          console.error("미니체크 문제 불러오기 실패:", err)
          setError("미니체크 문제를 불러오는 중 오류가 발생했습니다")
        }
      }
    }
    loadMiniData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, sessionId, examType, topicId])

  // 문제 풀이 데이터 불러오기 (세션 기반, 필기 전용)
  useEffect(() => {
    const loadProblemData = async () => {
      // step이 "problem"이고, mcqData가 없고, sessionId와 topicId가 있어야 함
      if (step === "problem" && !mcqData && sessionId && topicId) {
        try {
          // 필기 모드: 필기 MCQ 문제 불러오기
          const res = await axios.get(`/study/written/mcq/${topicId}`, {
            params: { sessionId }
          })
          
          // 응답 구조: payload.items 배열
          const items = res.data.payload?.items || res.data.items || []
          setMcqData(normalizeMcq(items))
          
          // learningSessionId가 응답에 포함되어 있으면 저장
          if (res.data.learningSessionId !== undefined) {
            setLearningSessionId(res.data.learningSessionId)
            // localStorage에도 저장
            localStorage.setItem('learningSessionId', res.data.learningSessionId.toString())
          }
        } catch (err) {
          console.error("문제 불러오기 실패:", err)
          setError("문제를 불러오는 중 오류가 발생했습니다")
        }
      }
    }
    loadProblemData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, sessionId, topicId])

  // 오답 문제 목록은 MicroWrongAnswersWritten 컴포넌트에서 직접 가져옴
  // 중복 호출 방지를 위해 여기서는 제거

  // SUMMARY API 호출 및 advance API 호출 (세션 기반, result 단계일 때만)
  useEffect(() => {
    const loadSummary = async () => {
      // learningSessionId가 있어야 summary API 호출 가능 (API 스펙상 sessionId는 LearningSession ID)
      if (step === "result" && !summaryData && learningSessionId && topicId) {
        setLoadingSummary(true)
        try {
          // SUMMARY API 호출
          const res = await axios.get(`/study/${examType}/summary`, {
            params: { 
              topicId: topicId || subTopicId, 
              sessionId: learningSessionId // LearningSession ID 사용
            }
          })
          const payload = res.data.payload || {}
          setSummaryData(payload)
          
          // 경험치를 획득했으면 레벨업 모달 표시
          if (payload.earnedXp && payload.earnedXp > 0) {
            setShowLevelUp(true)
          }
          
          // SUMMARY 단계 완료: advance API 호출
          // 세션이 있으면 advance API 호출
          if (sessionId && learningSessionId) {
            const session = await fetchSessionInfo(sessionId)
            const currentStep = session.currentStep
            
            // SUMMARY 단계일 때만 advance 호출
            if (currentStep === "SUMMARY") {
              await axios.post("/study/session/advance", {
                sessionId: learningSessionId,
                step: "SUMMARY",
                score: null,
                detailsJson: null
              })
              // advance 호출 후 세션 상태 확인 (movedTo === "END", status === "DONE")
              const updatedSession = await fetchSessionInfo(sessionId)
              if (updatedSession.status === "DONE") {
                // 세션이 종료됨 - localStorage에서 삭제
                console.log("세션이 종료되었습니다. status:", updatedSession.status)
                localStorage.removeItem('learningSessionId')
              }
            }
          }
        } catch (err) {
          console.error("SUMMARY 불러오기 실패:", err)
          setError("요약 정보를 불러오는 중 오류가 발생했습니다")
        } finally {
          setLoadingSummary(false)
        }
      }
    }
    loadSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, learningSessionId, examType, topicId, subTopicId, sessionId])

  // 로딩 중이면 공통 로딩 표시
  if (loading) return <div className="p-8 text-center">불러오는 중</div>
  // 에러가 있다면에러 메시지 출력
  if (error) return <div className="p-8 text-red-500 text-center">{error}</div>
  // step이 결정되지 않았으면 로딩 표시
  if (step === null) return <div className="p-8 text-center">불러오는 중</div>
  // concept 단계일 때만 conceptData가 필요함
  if (step === "concept" && !conceptData) return <div className="p-8 text-center">개념 데이터를 불러오는 중...</div>

  // 2. 개념
  // ConceptView는 개념 화면만 담당하고
  // onNext가 호출될 때 advance API 호출 후 다음 단계로 이동
  if (step === "concept") {
    return (
      <ConceptView
        data={conceptData}
        onNext={async () => {
          try {
            // 세션이 있으면 advance API 호출
            if (sessionId) {
              // 세션 정보에서 learningSessionId 가져오기
              const session = await fetchSessionInfo(sessionId)
              
              // learningSessionId가 세션 정보에 있으면 저장
              if (session.learningSessionId !== undefined) {
                setLearningSessionId(session.learningSessionId)
                // localStorage에도 저장
                localStorage.setItem('learningSessionId', session.learningSessionId.toString())
              }
              
              // learningSessionId가 없으면 세션 시작 시점에 생성되지 않았을 수 있음
              // localStorage에서도 확인
              const savedLearningSessionId = localStorage.getItem('learningSessionId')
              const targetLearningSessionId = session.learningSessionId || learningSessionId || (savedLearningSessionId ? Number(savedLearningSessionId) : null)
              
              if (targetLearningSessionId) {
                try {
                  // advance API 호출
                  await axios.post("/study/session/advance", {
                    sessionId: targetLearningSessionId,
                    step: "CONCEPT",
                    score: null,
                    detailsJson: null
                  })
                  
                  // advance 호출 후 항상 세션 상태를 다시 조회하여 다음 단계 결정
                  await syncSessionAndNavigate(sessionId)
                  return
                } catch (advanceErr: any) {
                  console.error("CONCEPT advance API 호출 실패:", advanceErr)
                  // advance 실패 시 세션 상태 확인으로 fallback
                  await syncSessionAndNavigate(sessionId)
                  return
                }
              } else {
                // learningSessionId가 없으면 세션 상태 확인으로 fallback
                console.log("learningSessionId가 없습니다. 세션 상태를 확인합니다.")
                await syncSessionAndNavigate(sessionId)
                return
              }
            } else {
              // 세션이 없으면 기존 방식 (fallback)
              const res = await axios.get(`/study/written/mini/${subTopicId}`)
              setMiniData(res.data.payload.items)
              setStep("mini")
            }
          } catch (err) {
            console.error("CONCEPT 단계 이동 실패:", err)
            setError("다음 단계로 이동하는 중 오류가 발생했습니다")
          }
        }}
      />
    )
  }

  // 3. 미니체크
  // MiniCheck 내부에서 한 문제씩 풀게 하고
  // onComplete에서 점수만 받아서 다음 단계로 넘김
  if (step === "mini") {
    // 미니체크 문제가 아직 로딩 중이면 로딩 표시
    if (!miniData || miniData.length === 0) {
      return <div className="p-8 text-center">미니체크 문제를 불러오는 중...</div>
    }

    return (
      <MiniCheck
        questions={miniData}
        topicName={conceptData?.title || ""}
        userId={userId}
        topicId={topicId || subTopicId}
        examType={examType}
        sessionId={sessionId ?? undefined}
        onComplete={async (score, learningSessionIdFromMini) => {
          // 미니체크 점수 저장
          setMiniScore(score)
          // learningSessionId 저장 (필기/실기 모두)
          if (learningSessionIdFromMini !== undefined) {
            setLearningSessionId(learningSessionIdFromMini)
            // localStorage에도 저장
            localStorage.setItem('learningSessionId', learningSessionIdFromMini.toString())
          }
          
          try {
            // 세션이 있으면 세션 메타데이터 확인 후 advance API 호출
            if (sessionId) {
              // learningSessionId 확인 (미니체크에서 받았거나 이미 저장된 값)
              const targetLearningSessionId = learningSessionIdFromMini || learningSessionId
              
              if (targetLearningSessionId) {
                // 세션 정보 가져오기
                const session = await fetchSessionInfo(sessionId)
                
                // MINI 단계의 메타데이터 확인
                const miniStep = session.steps.find(s => s.step === "MINI")
                if (miniStep) {
                  // 단계 상태 확인 (IN_PROGRESS 또는 READY 상태여야 함)
                  if (miniStep.state !== "IN_PROGRESS" && miniStep.state !== "READY") {
                    console.warn(`MINI 단계가 진행 가능한 상태가 아닙니다. 현재 상태: ${miniStep.state}`)
                    await syncSessionAndNavigate(sessionId)
                    return
                  }
                  
                  // 메타데이터 파싱 (detailsJson 우선, 없으면 metadata 사용)
                  const detailsJson = (miniStep as any).detailsJson || miniStep.metadata
                  const metadata = detailsJson ? JSON.parse(detailsJson) : {}
                  const totalAnswered = metadata.total || 0
                  
                  // 모든 문제를 풀었는지 확인 (MINI는 4문제)
                  if (totalAnswered >= 4) {
                    try {
                      // MINI 단계 완료: advance API 호출
                      await axios.post("/study/session/advance", {
                        sessionId: targetLearningSessionId,
                        step: "MINI",
                        score: metadata.scorePct || 0,
                        detailsJson: detailsJson
                      })
                      
                      // advance 호출 후 항상 세션 상태를 다시 조회하여 다음 단계 결정
                      await syncSessionAndNavigate(sessionId)
                      return
                    } catch (advanceErr: any) {
                      // 에러 처리: 모든 문제를 풀지 않았거나 단계 상태가 잘못된 경우
                      if (advanceErr.response?.status === 400) {
                        const errorMessage = advanceErr.response?.data?.message || "모든 문제를 풀어야 합니다"
                        setError(errorMessage)
                        console.error("advance API 호출 실패:", errorMessage)
                      } else if (advanceErr.response?.status === 403) {
                        setError("세션 소유자가 아닙니다")
                        console.error("advance API 호출 실패: 세션 소유자가 아님")
                      } else {
                        throw advanceErr
                      }
                      return
                    }
                  } else {
                    // 아직 모든 문제를 풀지 않았음
                    console.log(`MINI 단계 진행 중: ${totalAnswered}/4 문제 완료`)
                  }
                }
              }
              
              // 세션 상태 다시 확인하여 다음 단계 결정
              await syncSessionAndNavigate(sessionId)
            } else {
              // 세션이 없으면 기존 방식 (fallback)
              const res = await axios.get(`/study/written/mcq/${topicId || subTopicId}`)
              setMcqData(normalizeMcq(res.data.payload.items))
              if (res.data.learningSessionId !== undefined) {
                setLearningSessionId(res.data.learningSessionId)
                // localStorage에도 저장
                localStorage.setItem('learningSessionId', res.data.learningSessionId.toString())
              }
              setStep("problem")
            }
          } catch (err) {
            console.error(err)
            setError("다음 단계로 이동하는 중 오류가 발생했습니다")
          }
        }}
      />
    )
  }

  // 4. 문제 풀이 단계 (필기 전용)
  if (step === "problem") {
    // 아직 mcqData가 준비되지 않았으면 로딩 표시
    if (!mcqData) {
      return <div className="p-8 text-center">문제를 불러오는 중...</div>
    }
    
    return (
      <ProblemSolvingWritten
        questions={mcqData}
        topicName={conceptData?.title || ""}
        topicId={topicId || subTopicId}
        userId={userId}
        // 사용자가 한 문제를 제출할 때 마다 호출
        // 이 함수는 grade-one API를 호출해서 해당 문제의 정답 여부만 즉시 확인
        onSubmitOne={async ({ questionId, label }) => {
          // 세션이 있으면 sessionId를 쿼리 파라미터로 전달
          const config = sessionId
            ? { params: { sessionId } }
            : {}
          
          const res = await axios.post(
            `/study/written/mcq/grade-one`,
            {
              topicId: topicId || subTopicId,
              questionId,
              label
            },
            config
          )
          // grade-one 응답 구조 확인용 로그
          // 실제 서비스 때는 제거해도 됨
          console.log("grade-one 응답:", res.data)     // 디버깅
          
          // 응답 형태: { correct, correctLabel, explanation, aiExplanation }
          // aiExplanation은 사용하지 않음, explanation만 사용
          return {
            correct: res.data.correct,
            correctLabel: res.data.correctLabel,
            explanation: res.data.explanation || "", // explanation 사용
            aiExplanation: res.data.aiExplanation || "" // 사용하지 않지만 호환성을 위해 포함
          }
        }}
        // 모든 문제를 다 풀었을 때 호출
        // score  전체 점수
        // answers  각 문항에 대한 정오 정보와 선택 정보
        onComplete={async (score, answers) => {
          // 점수 저장
          setProblemScore(score)
          
          // 틀린 문제 필터링
          const wrongAnswersList = answers.filter(a => !a.isCorrect).map(a => {
            const correctLabel = a.correctLabel || ""
            return {
              questionId: Number(a.questionId),
              userAnswer: typeof a.selectedAnswer === 'number' 
                ? String.fromCharCode(65 + a.selectedAnswer) 
                : String(a.selectedAnswer),
              correctAnswer: correctLabel || "",
              explanation: a.explanation || ""
            }
          })
          
          try {
            // 세션이 있으면 세션 메타데이터 확인 후 advance API 호출
            if (sessionId && learningSessionId) {
              // 세션 정보 가져오기
              const session = await fetchSessionInfo(sessionId)
              
              // MCQ 단계의 메타데이터 확인
              const mcqStep = session.steps.find(s => s.step === "MCQ")
              if (mcqStep) {
                // 단계 상태 확인 (IN_PROGRESS 또는 READY 상태여야 함)
                if (mcqStep.state !== "IN_PROGRESS" && mcqStep.state !== "READY") {
                  console.warn(`MCQ 단계가 진행 가능한 상태가 아닙니다. 현재 상태: ${mcqStep.state}`)
                  await syncSessionAndNavigate(sessionId)
                  return
                }
                
                // 메타데이터 파싱 (detailsJson 우선, 없으면 metadata 사용)
                const detailsJson = (mcqStep as any).detailsJson || mcqStep.metadata
                const metadata = detailsJson ? JSON.parse(detailsJson) : {}
                const totalAnswered = metadata.total || 0
                
                // 모든 문제를 풀었는지 확인 (MCQ는 5문제)
                if (totalAnswered >= 5) {
                  try {
                    // MCQ 단계 완료: advance API 호출
                    // 백엔드에서 오답이 없으면 자동으로 REVIEW_WRONG을 건너뛰고 SUMMARY로 이동
                    await axios.post("/study/session/advance", {
                      sessionId: learningSessionId,
                      step: "MCQ",
                      score: metadata.scorePct || 0,
                      detailsJson: detailsJson
                    })
                    
                    // advance 호출 후 항상 세션 상태를 다시 조회하여 다음 단계 결정
                    // 백엔드가 오답 존재 여부를 자동으로 처리하므로 세션 상태만 확인
                    await syncSessionAndNavigate(sessionId)
                    return
                  } catch (advanceErr: any) {
                    // 에러 처리: 모든 문제를 풀지 않았거나 단계 상태가 잘못된 경우
                    if (advanceErr.response?.status === 400) {
                      const errorMessage = advanceErr.response?.data?.message || "모든 문제를 풀어야 합니다"
                      setError(errorMessage)
                      console.error("advance API 호출 실패:", errorMessage)
                    } else if (advanceErr.response?.status === 403) {
                      setError("세션 소유자가 아닙니다")
                      console.error("advance API 호출 실패: 세션 소유자가 아님")
                    } else {
                      throw advanceErr
                    }
                    return
                  }
                } else {
                  // 아직 모든 문제를 풀지 않았으면 세션 상태만 확인
                  await syncSessionAndNavigate(sessionId)
                }
              } else {
                // MCQ 단계 정보가 없으면 세션 상태만 확인
                await syncSessionAndNavigate(sessionId)
              }
            } else {
              // 세션이 없으면 기존 방식 (fallback)
              if (wrongAnswersList.length === 0) {
                // 틀린 문제가 없으면 오답 정리 단계 건너뛰고 결과 화면으로
                setStep("result")
              } else {
                // 틀린 문제가 있으면 오답 정리 단계로
                // fallback 모드에서는 프론트엔드에서 계산한 오답 목록 사용
                setWrongAnswers(wrongAnswersList)
                setStep("wrong")
              }
            }
          } catch (err) {
            console.error("다음 단계로 이동 실패:", err)
            setError("다음 단계로 이동하는 중 오류가 발생했습니다")
          }
        }}
      />
    )
  }

  // 5. 오답 정리 (필기 전용)
  if (step === "wrong") {
    const handleContinue = async () => {
      try {
        // 세션이 있으면 advance API 호출 후 세션 상태 확인
        if (sessionId && learningSessionId) {
          // 현재 세션 상태 확인하여 어떤 오답 단계인지 판단
          const session = await fetchSessionInfo(sessionId)
          const currentStep = session.currentStep
          
          // 오답 정리 단계 완료 처리: advance API 호출
          if (currentStep === "REVIEW_WRONG") {
            await axios.post("/study/session/advance", {
              sessionId: learningSessionId, // LearningSession ID 사용
              step: "REVIEW_WRONG",
              score: null,
              detailsJson: null
            })
            
            // advance 호출 후 항상 세션 상태를 다시 조회하여 다음 단계 결정
            await syncSessionAndNavigate(sessionId)
            return
          }
          
          // 세션 상태 확인하여 다음 단계 결정
          await syncSessionAndNavigate(sessionId)
        } else if (sessionId) {
          // learningSessionId가 없으면 세션 상태만 확인
          await syncSessionAndNavigate(sessionId)
        } else {
          // 세션이 없으면 기존 방식 (fallback)
          setStep("result")
        }
      } catch (err) {
        console.error("다음 단계로 이동 실패:", err)
        setError("다음 단계로 이동하는 중 오류가 발생했습니다")
      }
    }

    return (
      <MicroWrongAnswersWritten
        sessionId={sessionId}
        learningSessionId={learningSessionId}
        topicName={conceptData?.title || ""}
        onContinue={handleContinue}
        wrongAnswers={sessionId ? undefined : (wrongAnswers.length > 0 ? wrongAnswers : undefined)}
      />
    )
  }

  // 6 최종 결과 화면 단계 (SUMMARY, 필기 전용)
  // 여기서 점수와 전체 문제 수를 보여주고
  // 다시 풀기 또는 대시보드로 이동 같은 행동 제공
  if (step === "result") {
    return (
      <>
        <MicroResult
          topicName={conceptData?.title || ""}
          miniCheckScore={summaryData?.miniCorrect}
          problemScore={summaryData?.mcqCorrect}
          totalProblems={
            summaryData?.miniTotal !== undefined && summaryData?.mcqTotal !== undefined
              ? summaryData.miniTotal + summaryData.mcqTotal
              : undefined
          }
          miniTotal={summaryData?.miniTotal}
          mcqTotal={summaryData?.mcqTotal}
          aiSummary={summaryData?.summary || summaryData?.aiSummary}
          loadingSummary={loadingSummary}
          onRetry={async () => {
            // 새로운 세션을 시작하여 처음부터 다시 학습
            try {
              const res = await axios.post("/study/session/start", {
                topicId: subTopicId,
                mode: "MICRO",
                examMode: "WRITTEN",
                resume: false
              })
              
              // 응답으로 받은 sessionId를 포함해서 페이지를 완전히 리로드
              const newSessionId = res.data.sessionId
              localStorage.setItem('learningSessionId', newSessionId.toString())
              // window.location.href를 사용하여 페이지를 완전히 새로고침
              window.location.href = `/learning/micro?subTopicId=${subTopicId}&type=written&sessionId=${newSessionId}`
            } catch (err) {
              console.error("세션 시작 실패:", err)
              // 에러 발생 시에도 기존 방식으로 fallback
              window.location.href = `/learning/micro?subTopicId=${subTopicId}&type=written`
            }
          }}
          // 메인 학습 대시보드로 이동
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
}
