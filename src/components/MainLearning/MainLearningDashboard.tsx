import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import axios from "../api/axiosConfig"
import { Card } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import {
  BookOpen,
  CheckCircle2,
  ListChecks,
  Sparkles,
  ChevronRight,
  ChevronDown,
  FileText,
  Keyboard,
} from "lucide-react"
import type { Subject, MainTopic, SubTopic } from "../../types"

// -------------------------------
// 백엔드 RawTopic 타입
// - 백엔드에서 내려주는 topic 한 줄에 대한 원본 타입
// - 이걸 기반으로 트리 구조를 만들고 프론트에서 사용하는 Subject 구조로 변환
// -------------------------------
type ExamMode = "WRITTEN" | "PRACTICAL"

// Micro 학습 진행 상태 타입
type MicroStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "TRULY_COMPLETED"

// Micro 학습 진행 상태 API 응답 타입
interface MicroStatusResponse {
  statuses: Array<{
    topicId: number
    status: MicroStatus
    resumable: boolean
  }>
}

// Micro 학습 통계 API 응답 타입
interface MicroStatsResponse {
  totalCount: number
  completedCount: number
  completionRate: number
}

interface RawTopic {
  id: number                    // PK
  parentId: number | null       // 상위 토픽 id, 최상위 과목인 경우 null
  certId: number                // 어떤 자격증에 속하는지
  code: string                  // 정렬이나 추가 규칙에 사용할 수 있는 코드값
  title: string                 // 화면에 보여줄 이름
  emoji?: string | null         // 이 토픽을 대표하는 이모지
  orderNo: number               // 같은 parent 안에서의 표시 순서
  examMode: ExamMode            // 필기 실기 구분
  children?: RawTopic[]         // 프론트에서 트리로 만들기 위해 추가
}

// -------------------------------
// 트리 빌더
// - flat한 RawTopic 배열을 parentId 기준으로 트리 구조로 변환
// -------------------------------
function buildTree(data: RawTopic[]) {
  const map = new Map<number, RawTopic>()     // 각 id를 key로 해서 RawTopic을 저장하는 맵
  const roots: RawTopic[] = []                // parentId가 null인 루트 노드들

  // 1. 모든 RawTopic을 맵에 등록하면서 children 배열을 초기화
  data.forEach(item => {
    map.set(item.id, { ...item, children: [] })
  })

  // 2. ParentId를 보고 부모의 children에 현재 노드를 추가
  data.forEach(item => {
    if (item.parentId === null) {
      // parentId가 null이면 루트 과목
      roots.push(map.get(item.id)!)
    } else {
      // parentId가 있으면 해당 parent의 childrent에 push
      const parent = map.get(item.parentId)
      if (parent && parent.children) parent.children.push(map.get(item.id)!)
    }
  })

  // 재귀적으로 트리 전체를 정렬하는 함수
  const sortRec = (nodes?: RawTopic[]) => {
    if (!nodes) return
    nodes.sort((a, b) => a.orderNo - b.orderNo)     // 같은 깊이에서는 orderNo로 정렬
    nodes.forEach(n => sortRec(n.children))         // 각 노드의 childrent에 대해서도 재귀적으로 정렬
  }

  sortRec(roots) // 전체 트리 정렬 
  return roots
}

// -------------------------------
// 필기/실기 맵핑
// - 백엔드 enum을 프론트에서 쓰는 문자열 값으로 변환
// -------------------------------
function mapExamMode(mode: ExamMode): "written" | "practical" {
  return mode === "WRITTEN" ? "written" : "practical"
}

// -------------------------------
// RawTopic 트리 → Subject 구조로 변환 (UI 유지용)
//  - Subject - MainTopic - SubTopic 구조로 백엔드 트리를 어댑팅
// -------------------------------
function toSubjectsTree(roots: RawTopic[]): Subject[] {
  const fallbackColor = "#8b5cf6"     // 색상은 일단 공통값
  const subjectIcon = "📘"
  const mainIcon = "📂"

  // 루트 노드 하나가 Subject 하나로 변환됨
  return roots.map(root => {
    // 루트의 children이 MainTopic 역할
    const mainTopics: MainTopic[] = (root.children || []).map(mt => {
      // 그 아래 children이 SubTopic 역할
      const subTopics: SubTopic[] = (mt.children || []).map(st => ({
        id: st.id,
        name: st.title,
        completed: false,   // 아직 백엔드 진행률 연동 전이므로 기본값은 미완료
        details: [],
      }))

      return {
        id: mt.id,
        name: mt.title,
        subTopics,
        icon: mt.emoji || mainIcon,     // 백엔드에서 내려준 emoji 우선 사용
        color: fallbackColor,
        reviewCompleted: false,         // MainTopic의 Review 총정리를 다했는지 여부
      }
    })

    return {
      id: root.id,
      name: root.title,
      category: "정보처리기사",                 // 정보처리기사 고정
      examType: mapExamMode(root.examMode),   // 필기 실기 구분
      mainTopics,
      icon: root.emoji || subjectIcon,
      color: fallbackColor,
    }
  })
}

// -------------------------------
// MainLearningDashboard 본체
//  - 메인 학습 화면
//  - 필기 실기 탭 전환
//  - 전체 진행률
//  - 과목별 MainTopic SubTopic 리스트
// -------------------------------
export function MainLearningDashboard() {
  const navigate = useNavigate()

  const [subjects, setSubjects] = useState<Subject[]>([])     // 백엔드에서 가져온 데이터를 Subject 구조로 변환하여 저장
  const [loading, setLoading] = useState(true)                // 초기 로딩 상태
  const [error, setError] = useState<string | null>(null)
  const [expandedMainTopic, setExpandedMainTopic] = useState<number | null>(null)     // 어떤 MainTopic이 펼쳐져 있는지 표시
  const [selectedExamType, setSelectedExamType] = useState<"written" | "practical">("written")    // 현재 선택된 시험 유형(필기/실기)
  const [microStatuses, setMicroStatuses] = useState<Map<number, MicroStatus>>(new Map())  // SubTopic ID별 Micro 학습 진행 상태
  const [resumableMap, setResumableMap] = useState<Map<number, boolean>>(new Map())  // SubTopic ID별 resumable 상태
  const [microStats, setMicroStats] = useState<MicroStatsResponse | null>(null)  // Micro 학습 통계
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false)  // 이어서 학습 다이얼로그 열림 상태
  const [selectedSubTopicId, setSelectedSubTopicId] = useState<number | null>(null)  // 다이얼로그에서 선택된 SubTopic ID
  const fetchedStatusesRef = useRef<string>("")  // 이미 조회한 상태 추적 (examType + topicIds 조합)

  // -------------------------------
  // 백엔드에서 트리 구조 가져오기
  //  - 최초 마운트 시 한 번 호출
  //  - GET study/topics(추후 cert로 변경 예정)
  //  - 응답을 트리로 만들고 UI로 변환
  // -------------------------------
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await axios.get("/cert/topics", {
          params: {
            certId: 1,
            mode: selectedExamType.toUpperCase(),
            parentId: null
          }
        })

        const rawTopics: RawTopic[] = res.data.topics

        const tree = buildTree(rawTopics)

        const adapted = toSubjectsTree(tree)

        setSubjects(adapted)
      } catch (err) {
        console.error(err)
        setError("데이터를 불러오는 중 오류가 발생했습니다")
      } finally {
        setLoading(false)
      }
    }

    fetchSubjects()
  }, [selectedExamType])

  // -------------------------------
  // Micro 학습 진행 상태 조회
  //  - subjects가 로드된 후 모든 SubTopic의 진행 상태를 한 번에 조회
  //  - GET /api/study/topic-progress/micro-status
  // -------------------------------
  useEffect(() => {
    const fetchMicroStatuses = async () => {
      // 로딩 중이거나 subjects가 없으면 리턴
      if (loading || subjects.length === 0) return

      try {
        // 현재 선택된 시험 타입의 모든 SubTopic ID 수집
        const currentSubjects = subjects.filter(s => s.examType === selectedExamType)
        const topicIds: number[] = []
        
        currentSubjects.forEach(subject => {
          subject.mainTopics.forEach(mt => {
            mt.subTopics.forEach(st => {
              topicIds.push(st.id)
            })
          })
        })

        if (topicIds.length === 0) return

        // 이미 조회한 topicIds인지 확인 (무한 루프 방지)
        const topicIdsKey = topicIds.sort((a, b) => a - b).join(",")
        const currentHash = `${selectedExamType}-${topicIdsKey}`
        
        // 같은 조합이면 이미 조회한 것으로 간주 (무한 루프 방지)
        if (fetchedStatusesRef.current === currentHash) {
          return
        }

        // 조회 시작 전에 해시 저장 (중복 호출 방지)
        fetchedStatusesRef.current = currentHash

        // API 호출
        const mode = selectedExamType === "written" ? "WRITTEN" : "PRACTICAL"
        const res = await axios.get<MicroStatusResponse>("/study/topic-progress/micro-status", {
          params: {
            topicIds: topicIds.join(","),
            mode
          }
        })

        // Map으로 변환하여 저장
        const statusMap = new Map<number, MicroStatus>()
        const resumableStatusMap = new Map<number, boolean>()
        res.data.statuses.forEach(item => {
          statusMap.set(item.topicId, item.status)
          resumableStatusMap.set(item.topicId, item.resumable)
        })

        setMicroStatuses(statusMap)
        setResumableMap(resumableStatusMap)

        // subjects의 completed 상태 업데이트 (함수형 업데이트로 무한 루프 방지)
        setSubjects(prevSubjects => {
          // 변경사항이 있는지 확인
          let hasChanges = false
          const updated = prevSubjects.map(subject => {
            if (subject.examType !== selectedExamType) return subject

            const updatedMainTopics = subject.mainTopics.map(mt => ({
              ...mt,
              subTopics: mt.subTopics.map(st => {
                const status = statusMap.get(st.id)
                // TRULY_COMPLETED일 때만 완료로 표시 (COMPLETED는 진정한 완료가 아님)
                const completed = status === "TRULY_COMPLETED"
                if (st.completed !== completed) {
                  hasChanges = true
                }
                return {
                  ...st,
                  completed
                }
              })
            }))

            return {
              ...subject,
              mainTopics: updatedMainTopics
            }
          })

          // 변경사항이 없으면 이전 상태 반환 (무한 루프 방지)
          if (!hasChanges) {
            return prevSubjects
          }

          return updated
        })
      } catch (err) {
        console.error("Micro 학습 진행 상태 조회 실패:", err)
        // 에러가 발생해도 UI는 계속 표시 (기본값 사용)
      }
    }

    fetchMicroStatuses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, selectedExamType])  // subjects를 의존성에서 제거하여 무한 루프 방지 (내부에서 subjects 사용)

  // -------------------------------
  // Micro 학습 통계 조회
  //  - GET /api/study/topic-progress/micro-stats
  //  - 필기/실기 총 진행률 표시용
  // -------------------------------
  useEffect(() => {
    const fetchMicroStats = async () => {
      if (loading) return

      try {
        const mode = selectedExamType === "written" ? "WRITTEN" : "PRACTICAL"
        const res = await axios.get<MicroStatsResponse>("/study/topic-progress/micro-stats", {
          params: {
            mode
          }
        })

        setMicroStats(res.data)
      } catch (err) {
        console.error("Micro 학습 통계 조회 실패:", err)
        // 에러가 발생해도 UI는 계속 표시 (기본값 사용)
      }
    }

    fetchMicroStats()
  }, [loading, selectedExamType])

  // 로딩 주 상태 표시
  if (loading) {
    return <div className="p-8 text-center text-gray-500">불러오는 중...</div>
  }

  // 에러 발생 시 메시지 표시
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>
  }

  // -------------------------------
  // 현재 선택된 시험 타입만 필터링
  //  - 필기 탭이면 필기 과목만, 실기 탭이면 실기 과목만
  // -------------------------------
  const currentSubjects = subjects.filter(s => s.examType === selectedExamType)

  // -------------------------------
  // 진행률 계산
  //  - API에서 받은 통계 데이터 사용
  //  - API 데이터가 없으면 기본값 사용
  //  - completionRate가 1보다 크면 이미 퍼센트 값, 1 이하면 소수점 값
  // -------------------------------
  const getProgress = () => {
    if (microStats) {
      // completionRate가 1보다 크면 이미 퍼센트 값이므로 그대로 사용
      // 1 이하면 소수점 값이므로 100을 곱해서 퍼센트로 변환
      const percent = microStats.completionRate > 1 
        ? Math.round(microStats.completionRate)
        : Math.round(microStats.completionRate * 100)
      
      return {
        total: microStats.totalCount,
        completed: microStats.completedCount,
        percent
      }
    }
    
    // API 데이터가 없을 때는 기본값
    return { total: 0, completed: 0, percent: 0 }
  }

  const { total, completed, percent } = getProgress()

  // MainTopic 단위 완료 여부: 그 아래 SubTopic들이 모두 completed이면 완료로 표시
  const isMainTopicCompleted = (mainTopic: MainTopic) =>
    mainTopic.subTopics.length > 0 && mainTopic.subTopics.every(s => s.completed)

  // -------------------------------
  // UI 렌더링
  // -------------------------------
  if (currentSubjects.length === 0) {
    return (
      <div className="p-8 text-center text-gray-600">
        선택된 시험 유형에 대한 학습 자료가 없습니다
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">

        {/* HEADER
          - 메인 타이틀
          - 필기 실기 탭 전환
           */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-8 h-8 text-purple-600" />
                <h1 className="text-purple-900">메인 학습</h1>
              </div>
              <p className="text-gray-600">체계적으로 개념을 학습하고 문제를 풀어보세요</p>
            </div>

            {/* 필기 실기 탭 */}
            <Tabs value={selectedExamType} onValueChange={v => setSelectedExamType(v as "written" | "practical")}>
              <TabsList className="bg-gradient-to-r from-purple-100 to-pink-100 p-1">
                <TabsTrigger
                  value="written"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-sky-500 data-[state=active]:text-white"
                >
                  <FileText className="w-4 h-4 mr-2" /> 필기
                </TabsTrigger>
                <TabsTrigger
                  value="practical"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white"
                >
                  <Keyboard className="w-4 h-4 mr-2" /> 실기
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* 학습 설명 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-sky-50 border-2 border-blue-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-blue-900 mb-2">Micro 학습</h3>
                <p className="text-gray-700 text-sm mb-3">
                  개념 학습 → OX 미니체크 → 문제풀이
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-white/60">
                    개념 보기
                  </Badge>
                  <Badge variant="secondary" className="bg-white/60">
                    OX 4문항
                  </Badge>
                  <Badge variant="secondary" className="bg-white/60">
                    문제 5문항
                  </Badge>
                  {selectedExamType === "practical" ? (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                      AI 채점 + AI 해설
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      AI 해설
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500 rounded-lg">
                <ListChecks className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-blue-900 mb-2">Review 총정리</h3>
                <p className="text-gray-700 text-sm mb-3">종합 문제 풀이와 AI 요약</p>
                <div className="flex flex-wrap gap-2">
                  {selectedExamType === "practical" ? (
                    <Badge variant="secondary" className="bg-white/60">
                      문제 10문항
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-white/60">
                      문제 20문항
                    </Badge>
                  )}
                  {selectedExamType === "practical" ? (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                      AI 채점 + AI 해설
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      AI 해설
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 전체 진행률 카드 */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-purple-600" />
              <h3 className="text-purple-900">
                {selectedExamType === "written" ? "📝 필기" : "⌨️ 실기"} 총 진행률
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={
                  selectedExamType === "written"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-orange-100 text-orange-700"
                }
              >
                {completed} / {total} 완료
              </Badge>
              <span className="text-purple-900">{percent}%</span>
            </div>
          </div>
          <Progress value={percent} className="h-3 bg-white/60" />
        </Card>

        {/* SUBJECT LIST */}
        <div className="space-y-8">
          {currentSubjects.map(subject => (
            <div key={subject.id}>
              {/* Subject Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="p-3 rounded-lg text-3xl"
                    style={{ backgroundColor: subject.color + "20" }}
                  >
                    {subject.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-purple-900">{subject.name}</h2>
                      <Badge
                        variant="secondary"
                        className={
                          selectedExamType === "written"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-orange-100 text-orange-700"
                        }
                      >
                        {selectedExamType === "written" ? "📝 필기" : "⌨️ 실기"}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {subject.mainTopics.length}개 학습 주제
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Topics */}
              <div className="space-y-4">
                {subject.mainTopics.map(mainTopic => (
                  <Card
                    key={mainTopic.id}
                    className="overflow-hidden border-2 hover:border-purple-300 transition-all"
                  >
                    {/* MainTopic 헤더: 클릭시 SubTopic 목록 토글 */}
                    <div
                      className="p-5 cursor-pointer bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all"
                      onClick={() =>
                        setExpandedMainTopic(
                          expandedMainTopic === mainTopic.id ? null : mainTopic.id,
                        )
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div
                            className="p-3 rounded-lg text-2xl"
                            style={{ backgroundColor: (mainTopic.color || "#a855f7") + "30" }}
                          >
                            {mainTopic.icon || "📂"}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-purple-900">{mainTopic.name}</h3>
                              <Badge variant="secondary" className="text-purple-700">
                                {mainTopic.subTopics.length}개 세부 주제
                              </Badge>
                              {isMainTopicCompleted(mainTopic) && (
                                <Badge
                                  variant="secondary"
                                  className="bg-green-100 text-green-700"
                                >
                                  완료
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              클릭하여 학습 내용 보기
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Reivew 총정리 진입 버튼
                              - 필기 실기 구분해서 다른 경로로 이동 
                          */}
                          <Button
                            onClick={e => {
                              // MainTopic 펼치기 토글 클릭과 구분하기 위해 이벤트 전파 중단
                              e.stopPropagation()
                              if (selectedExamType === "written") {
                                navigate(`/learning/review-written?mainTopicId=${mainTopic.id}`)
                              } else {
                                navigate(`/learning/review-practical?mainTopicId=${mainTopic.id}`)
                              }
                            }}
                            className={`text-white ${mainTopic.reviewCompleted
                              ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                              : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                              }`}
                          >
                            <ListChecks className="w-4 h-4 mr-2" />
                            Review 총정리
                          </Button>
                          {expandedMainTopic === mainTopic.id ? (
                            <ChevronDown className="w-5 h-5 text-purple-600" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-purple-600" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SubTopics 
                        - MainTopic이 펼쳐졌을 때만 렌더링
                      */}
                    {expandedMainTopic === mainTopic.id && (
                      <div className="p-5 bg-white space-y-4">
                        {mainTopic.subTopics.map((subTopic, idx) => {
                          const status = microStatuses.get(subTopic.id) || "NOT_STARTED"
                          const isTrulyCompleted = status === "TRULY_COMPLETED"
                          
                          return (
                          <div
                            key={subTopic.id}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                              isTrulyCompleted
                                ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                                : "bg-gradient-to-r from-purple-50 to-white hover:from-purple-100 hover:to-purple-50 border-purple-100"
                            }`}
                          >
                            {/* SubTopic 상태 표시 
                              - TRULY_COMPLETED일 때만 체크 아이콘
                              - 그 외에는 순번 표시 
                            */}
                            <div className="flex items-center gap-3">
                              {(() => {
                                const status = microStatuses.get(subTopic.id) || "NOT_STARTED"
                                if (status === "TRULY_COMPLETED") {
                                  return (
                                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                      <CheckCircle2 className="w-5 h-5 text-white" />
                                    </div>
                                  )
                                } else {
                                  return (
                                    <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 text-sm">
                                      {idx + 1}
                                    </div>
                                  )
                                }
                              })()}
                              <div>
                                <span className="text-gray-800">{subTopic.name}</span>
                                {(() => {
                                  const status = microStatuses.get(subTopic.id) || "NOT_STARTED"
                                  // TRULY_COMPLETED일 때만 완료 배지 표시
                                  if (status === "TRULY_COMPLETED") {
                                    return (
                                      <Badge
                                        variant="secondary"
                                        className="ml-2 bg-green-100 text-green-700"
                                      >
                                        완료
                                      </Badge>
                                    )
                                  }
                                  return null
                                })()}
                              </div>
                            </div>
                            {/* Micro 학습 진입 버튼
                                - 필기 실기 둘 다 동일한 경로 사용
                                - type 파라미터로 모드 구분
                                - 세션 시작 API 호출 후 sessionId를 포함해서 navigate
                                - 진행 상태에 따라 버튼 텍스트와 스타일 변경
                                - resumable이 true이거나 IN_PROGRESS일 때는 다이얼로그 표시
                             */}
                            <div className="relative">
                              <Button
                                size="sm"
                                onClick={async () => {
                                  const status = microStatuses.get(subTopic.id) || "NOT_STARTED"
                                  const resumable = resumableMap.get(subTopic.id) || false
                                  
                                  // resumable이 true이거나 IN_PROGRESS일 때는 다이얼로그 표시
                                  if (status === "IN_PROGRESS" || (resumable && (status === "COMPLETED" || status === "TRULY_COMPLETED"))) {
                                    setSelectedSubTopicId(subTopic.id)
                                    setResumeDialogOpen(true)
                                    return
                                  }
                                  
                                  // 그 외의 경우는 바로 세션 시작
                                  try {
                                    // 세션 시작 API 호출
                                    const mode = selectedExamType === "written" ? "WRITTEN" : "PRACTICAL"
                                    const res = await axios.post("/study/session/start", {
                                      topicId: subTopic.id,
                                      mode,
                                      resume: false
                                    })
                                    
                                    // 응답으로 받은 sessionId를 포함해서 navigate
                                    const sessionId = res.data.sessionId
                                    navigate(
                                      `/learning/micro?subTopicId=${subTopic.id}&type=${selectedExamType}&sessionId=${sessionId}`,
                                    )
                                  } catch (err) {
                                    console.error("세션 시작 실패:", err)
                                    // 에러 발생 시에도 기존 방식으로 fallback (선택사항)
                                    navigate(
                                      `/learning/micro?subTopicId=${subTopic.id}&type=${selectedExamType}`,
                                    )
                                  }
                                }}
                                className={(() => {
                                  const status = microStatuses.get(subTopic.id) || "NOT_STARTED"
                                  if (status === "TRULY_COMPLETED") {
                                    return "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                                  } else if (status === "COMPLETED") {
                                    return "bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white"
                                  } else {
                                    // NOT_STARTED와 IN_PROGRESS는 모두 파란색
                                    return "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                                  }
                                })()}
                              >
                                <Sparkles className="w-3 h-3 mr-1" />
                                {(() => {
                                  const status = microStatuses.get(subTopic.id) || "NOT_STARTED"
                                  if (status === "TRULY_COMPLETED") {
                                    return "학습 완료"
                                  } else if (status === "COMPLETED") {
                                    return "다시 도전"
                                  } else {
                                    // NOT_STARTED와 IN_PROGRESS는 모두 "Micro 학습"
                                    return "Micro 학습"
                                  }
                                })()}
                              </Button>
                              {/* resumable이 true이거나 IN_PROGRESS일 때 빨간색 점 표시 */}
                              {(() => {
                                const status = microStatuses.get(subTopic.id) || "NOT_STARTED"
                                const resumable = resumableMap.get(subTopic.id) || false
                                const showDot = status === "IN_PROGRESS" || (resumable && (status === "COMPLETED" || status === "TRULY_COMPLETED"))
                                
                                if (showDot) {
                                  return (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                                  )
                                }
                                return null
                              })()}
                            </div>
                          </div>
                          )
                        })}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 이어서 학습 선택 다이얼로그 */}
      <Dialog 
        open={resumeDialogOpen} 
        onOpenChange={(open) => {
          setResumeDialogOpen(open)
          if (!open) {
            setSelectedSubTopicId(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>학습 방법 선택</DialogTitle>
            <DialogDescription>
              이어서 진행할 수 있는 학습이 있습니다. 어떻게 진행하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                if (!selectedSubTopicId) return
                
                try {
                  // 처음부터 하기
                  const mode = selectedExamType === "written" ? "WRITTEN" : "PRACTICAL"
                  const res = await axios.post("/study/session/start", {
                    topicId: selectedSubTopicId,
                    mode,
                    resume: false
                  })
                  
                  const sessionId = res.data.sessionId
                  setResumeDialogOpen(false)
                  navigate(
                    `/learning/micro?subTopicId=${selectedSubTopicId}&type=${selectedExamType}&sessionId=${sessionId}`,
                  )
                } catch (err) {
                  console.error("세션 시작 실패:", err)
                  setResumeDialogOpen(false)
                  navigate(
                    `/learning/micro?subTopicId=${selectedSubTopicId}&type=${selectedExamType}`,
                  )
                }
              }}
              className="w-full sm:w-auto"
            >
              처음부터 하기
            </Button>
            <Button
              onClick={async () => {
                if (!selectedSubTopicId) return
                
                try {
                  // 이어서 하기
                  const mode = selectedExamType === "written" ? "WRITTEN" : "PRACTICAL"
                  const res = await axios.post("/study/session/start", {
                    topicId: selectedSubTopicId,
                    mode,
                    resume: true
                  })
                  
                  const sessionId = res.data.sessionId
                  setResumeDialogOpen(false)
                  navigate(
                    `/learning/micro?subTopicId=${selectedSubTopicId}&type=${selectedExamType}&sessionId=${sessionId}`,
                  )
                } catch (err) {
                  console.error("세션 시작 실패:", err)
                  setResumeDialogOpen(false)
                  navigate(
                    `/learning/micro?subTopicId=${selectedSubTopicId}&type=${selectedExamType}`,
                  )
                }
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
            >
              이어서 하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
