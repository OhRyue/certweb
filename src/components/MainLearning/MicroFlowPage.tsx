import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import axios from "../api/axiosConfig"

import { ConceptView } from "./ConceptView"
import { MiniCheck } from "./MiniCheck"
import { ProblemSolvingWritten } from "./ProblemSolvingWritten"
import { ProblemSolvingPractical } from "./ProblemSolvingPractical"
import { MicroWrongAnswers } from "./MicroWrongAnswers"
import { MicroResult } from "./MicroResult"
import { LevelUpScreen } from "../LevelUpScreen"

/*
마이크로 학습 전체 흐름
1. 개념 보기
2. 미니체크 OX
3. 객관식 문제 풀이 MCQ
4. 틀린 문제 정리 화면
5. 최종 결과 화면
6. 필요 시 레벨업 연출
*/
export function MicroFlowPage() {
  const [step, setStep] = useState("concept")             // 현재 상태(concept -> mini -> problem -> wrong -> result)
  const [loading, setLoading] = useState(true)            // 최초 로딩 상태(개념 불러올 때만 사용)
  const [error, setError] = useState(null)                // 어떤 단계에서든 발생 가능한 에러 메시지

  // 데이터
  const [conceptData, setConceptData] = useState(null)    // 데이터
  const [miniData, setMiniData] = useState(null)
  const [mcqData, setMcqData] = useState(null)

  // 점수
  const [miniScore, setMiniScore] = useState(0)           // 점수
  const [problemScore, setProblemScore] = useState(0)

  const [wrongAnswers, setWrongAnswers] = useState([])    // 객관식 문제 중 틀린 문제 목록
  const [showLevelUp, setShowLevelUp] = useState(false)   // 레벨업 연출 유무(지금 현재 true로 바꾸지 않아 항상 숨겨진 상태, 나중에 호출하여 사용)

  const [searchParams] = useSearchParams()      // URL 쿼리 파라미터
  const navigate = useNavigate()

  const subTopicId = Number(searchParams.get("subTopicId"))         // 쿼리에서 서브 토픽 아이디 읽기
  const userId = localStorage.getItem("userId") || "guest"          // 임시 유저 아이디, 로그인 안되어 있으면 게스트로 처리

  // 필기실기 타입 처리
  const rawType = (searchParams.get("type") || "written").toLowerCase()
  const examType = (rawType === "practical" ? "practical" : "written") as "written" | "practical"

  // 백엔드 MCQ 응답을 프론트에서 쓰기 편한 형태로 정규화
  // ProblemSolvingWritten 컴포넌트가 기대하는 필드 구조로 맞춰주는 역할
  function normalizeMcq(items) {
    return items.map((q) => ({
      id: q.questionId,           // 문제 아이디
      question: q.text,           // 문제 본문

      // 선택지
      options: q.choices
        ? q.choices.map(c => ({
          label: c.label,     // A B C D
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

  // 실기 문제 세트 응답을 프론트에서 쓰기 편한 형태로 정규화
  // ProblemSolvingPractical 컴포넌트가 기대하는 필드 구조로 맞춰주는 역할
  function normalizePractical(items) {
    return items.map((q) => ({
      id: String(q.questionId),   // 문제 아이디 (문자열로 변환)
      question: q.text,           // 문제 본문
      imageUrl: q.imageUrl,       // 이미지 URL (실기용)
      
      // 실기는 타이핑 방식이므로 선택지 없음
      options: [],

      // 채점 API를 통해 받아야 하므로 일단 null
      correctAnswer: null,

      // 해설은 채점 응답으로 채울 수 있음, 지금은 비워둠
      explanation: "",

      // 기본값 설정
      difficulty: "medium",
      tags: [],
      type: "typing",             // 실기는 타이핑 타입
      examType: "practical"       // 실기 타입 명시
    }))
  }

  // 1. 개념 불러오기
  useEffect(() => {
    const fetchConcepts = async () => {
      try {
        // api 호출
        // 개념 데이터
        const ConceptRes = await axios.get(`/cert/concepts/${subTopicId}`)
        const parsed = JSON.parse(ConceptRes.data.sectionsJson)     // sectionsJson 문자열을 파싱해서 실제 리치블록 구조로 변환

        // 토픽 제목 데이터 호출
        const topicRes = await axios.get(`/cert/topics/${subTopicId}`)

        // ConceptView에서 바로 쓸 수 있는 형태로 정리
        setConceptData({
          topicId: ConceptRes.data.topicId,
          sections: parsed.sections,
          title: topicRes.data.title || ""   // 없으면 빈 문자열
        })

      } catch (err) {
        console.error(err)
        setError("개념을 불러오는 중 오류가 발생했습니다")
      } finally {
        setLoading(false)     // 성공 유무와 상관 없이 로딩 상태 종료
      }
    }
    // 서브 토픽 아이디가 바뀔 때마다 다시 호출
    fetchConcepts()
  }, [subTopicId])

  // 로딩 중이면 공통 로딩 표시
  if (loading) return <div className="p-8 text-center">불러오는 중</div>
  // 에러가 있다면에러 메시지 출력
  if (error) return <div className="p-8 text-red-500 text-center">{error}</div>
  // 개념 데이터가 없으면 아무것도 렌더링 하지 않음
  if (!conceptData) return null

  // 2. 개념
  // ConceptView는 개념 화면만 담당하고
  // onNext가 호출될 때 다음 단계로 넘어가는 트리거 역할만 함
  if (step === "concept") {
    return (
      <ConceptView
        data={conceptData}
        onNext={async () => {
          try {
            // 미니체크 문제 세트 불러오기
            const res = await axios.get(`/study/${examType}/mini/${subTopicId}`)
            // 응답 구조에서 실제 문제 배열만 뽑아서 저장
            setMiniData(res.data.payload.items)
            // 다음 단게로 이동
            setStep("mini")
          } catch (err) {
            console.error(err)
            setError("미니체크 불러오기 실패")
          }
        }}
      />
    )
  }

  // 3. 미니체크
  // MiniCheck 내부에서 한 문제씩 풀게 하고
  // onComplete에서 점수만 받아서 다음 단계로 넘김
  if (step === "mini") {
    return (
      <MiniCheck
        questions={miniData}
        topicName={conceptData.title}
        userId={userId}
        topicId={subTopicId}
        examType={examType}
        onComplete={async (score) => {
          // 미니체크 점수 저장
          setMiniScore(score)
          try {
            // 필기/실기에 따라 다른 API 호출
            if (examType === "practical") {
              // 실기 문제 세트 호출
              const res = await axios.get(`/study/practical/set/${subTopicId}`)
              // 백엔드 응답을 ProblemSolvingPractical이 쓰기 좋은 구조로 정규화
              setMcqData(normalizePractical(res.data.payload.items))
            } else {
              // 필기 객관식 문제 세트 호출
              const res = await axios.get(`/study/${examType}/mcq/${subTopicId}`)
              // 백엔드 응답을 ProblemSolvingWritten이 쓰기 좋은 구조로 정규화
              setMcqData(normalizeMcq(res.data.payload.items))
            }
            // 다음 단게로 이동(ProblemSolving 렌더링)
            setStep("problem")
          } catch (err) {
            console.error(err)
            setError(examType === "practical" ? "실기 문제 불러오기 실패" : "객관식 문제 불러오기 실패")
          }
        }}
      />
    )
  }

  // 아직 mcqData가 준비되지 않았는데 problem 단계로 오면
  // 잠깐 로딩 텍스트 보여주기
  if (!mcqData) return <div>불러오는 중...</div>

  // 4. 문제 풀이 단계
  // 필기와 실기에 따라 다른 컴포넌트 사용
  if (step === "problem") {
    // 필기 모드: ProblemSolvingWritten 사용
    if (examType === "written") {
      return (
        <ProblemSolvingWritten
          questions={mcqData}
          topicName={conceptData.title}
          topicId={subTopicId}
          userId={userId}
          // 사용자가 한 문제를 제출할 때 마다 호출
          // 이 함수는 grade-one API를 호출해서 해당 문제의 정답 여부만 즉시 확인
          onSubmitOne={async ({ questionId, label }) => {
            const res = await axios.post(`/study/${examType}/mcq/grade-one`, {
              userId,
              topicId: subTopicId,
              questionId,
              label
            })
            // grade-one 응답 구조 확인용 로그
            // 실제 서비스 때는 제거해도 됨
            console.log("grade-one 응답:", res.data.payload.items)     // 디버깅
            // ProblemSolvingWritten이 그대로 사용할 수 있게 응답 전체를 반환
            // 예상 형태  correct  correctLabel  explanation  aiExplanation 등
            return res.data
          }}
          // 모든 문제를 다 풀었을 때 호출
          // score  전체 점수
          // answers  각 문항에 대한 정오 정보와 선택 정보
          onComplete={(score, answers) => {
            // 점수 저장
            setProblemScore(score)
            // 틀린 문제만 따로 추려서 상태로 저장
            setWrongAnswers(answers.filter(a => !a.isCorrect))
            // 다음 단계로 이동(MicroWrongAnswers)
            setStep("wrong")
          }}
        />
      )
    }
    
    // 실기 모드: ProblemSolvingPractical 사용
    return (
      <ProblemSolvingPractical
        questions={mcqData}
        topicName={conceptData.title}
        topicId={subTopicId}
        // 모든 문제를 다 풀었을 때 호출
        // score  전체 점수
        // answers  각 문항에 대한 정오 정보와 선택 정보
        onComplete={(score, answers) => {
          // 점수 저장
          setProblemScore(score)
          // 틀린 문제만 따로 추려서 상태로 저장
          setWrongAnswers(answers.filter(a => !a.isCorrect))
          // 다음 단계로 이동(MicroWrongAnswers)
          setStep("wrong")
        }}
      />
    )
  }

  // 5. 오답 정리
  // MicroWrongAnswers는 틀린 문제 목록을 보여주고
  // 사용자가 이해했다고 눌렀을 때 onContinue로 결과 화면으로 이동
  if (step === "wrong") {
    return (
      <MicroWrongAnswers
        wrongAnswers={wrongAnswers}
        topicName={conceptData.title}
        examType={examType}
        onContinue={() => setStep("result")}
      />
    )
  }

  // 6 최종 결과 화면 단계
  // 여기서 점수와 전체 문제 수를 보여주고
  // 다시 풀기 또는 대시보드로 이동 같은 행동 제공
  if (step === "result") {
    return (
      <>
        <MicroResult
          topicName={conceptData.title}
          miniCheckScore={miniScore}
          problemScore={problemScore}
          totalProblems={mcqData.length}
          onRetry={() => setStep("concept")}
          // 메인 학습 대시보드로 이동
          onBackToDashboard={() => navigate("/learning")}
        />

        {/* 
          레벨업 연출
          지금은 showLevelUp이 항상 false라서 화면에 안 나옴
          점수 조건 맞을 때 setShowLevelUptrue 호출해서 레벨업 연출 켤 수 있음
        */}
        {showLevelUp && (
          <LevelUpScreen
            currentLevel={2}
            currentExp={60}
            earnedExp={40}
            expPerLevel={100}
            onComplete={() => setShowLevelUp(false)}
          />
        )}
      </>
    )
  }
}
