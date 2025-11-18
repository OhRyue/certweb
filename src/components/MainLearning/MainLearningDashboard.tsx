import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "../api/axiosConfig"
import { Card } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"
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
  //  - 전체 SubTopic 개수 대비 completed된 SubTopic 개수
  // -------------------------------
  const calculateProgress = () => {
    let total = 0
    let completed = 0

    currentSubjects.forEach(subject => {
      subject.mainTopics.forEach(mt => {
        mt.subTopics.forEach(st => {
          total++
          if (st.completed) completed++
        })
      })
    })

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, percent }
  }

  const { total, completed, percent } = calculateProgress()

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
                        {mainTopic.subTopics.map((subTopic, idx) => (
                          <div
                            key={subTopic.id}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${subTopic.completed
                              ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                              : "bg-gradient-to-r from-purple-50 to-white hover:from-purple-100 hover:to-purple-50 border-purple-100"
                              }`}
                          >
                            {/* SubTopic 상태 표시 
                              - 완료면 체크 아이콘
                              - 미완료면 순번 표시 
                            */}
                            <div className="flex items-center gap-3">
                              {subTopic.completed ? (
                                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                  <CheckCircle2 className="w-5 h-5 text-white" />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 text-sm">
                                  {idx + 1}
                                </div>
                              )}
                              <div>
                                <span className="text-gray-800">{subTopic.name}</span>
                                {subTopic.completed && (
                                  <Badge
                                    variant="secondary"
                                    className="ml-2 bg-green-100 text-green-700"
                                  >
                                    완료
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {/* Micro 학습 진입 버튼
                                - 필기 실기 둘 다 동일한 경로 사용
                                - type 파라미터로 모드 구분
                             */}
                            <Button
                              size="sm"
                              onClick={() =>
                                navigate(
                                  `/learning/micro?subTopicId=${subTopic.id}&type=${selectedExamType}`,
                                )
                              }
                              className={
                                subTopic.completed
                                  ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                                  : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                              }
                            >
                              <Sparkles className="w-3 h-3 mr-1" />
                              {subTopic.completed ? "다시 학습" : "Micro 학습"}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
