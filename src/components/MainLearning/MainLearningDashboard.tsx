import { Card } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"
import { BookOpen, CheckCircle2, ListChecks, Sparkles, ChevronRight, ChevronDown, FileText, Keyboard } from "lucide-react"
import { Subject, MainTopic, SubTopic, Detail } from "../../types"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

// 추가 백엔드 토픽 타입과 트리 빌더
type ExamMode = "WRITTEN" | "PRACTICAL"
interface RawTopic {
  id: number
  parentId: number | null
  code: string
  title: string
  examMode: ExamMode
  children?: RawTopic[]
}

function buildTree(data: RawTopic[]) {
  const map = new Map<number, RawTopic>()
  const roots: RawTopic[] = []
  data.forEach(it => map.set(it.id, { ...it, children: [] }))
  data.forEach(it => {
    if (it.parentId === null) roots.push(map.get(it.id)!)
    else {
      const p = map.get(it.parentId)
      if (p) p.children!.push(map.get(it.id)!)
    }
  })
  const sortRec = (arr?: RawTopic[]) => {
    if (!arr) return
    arr.sort((a, b) => a.code.localeCompare(b.code))
    arr.forEach(n => sortRec(n.children))
  }
  sortRec(roots)
  return roots
}

// 트리 → 기존 Subject 구조 어댑트
function toSubjectsTree(roots: RawTopic[], targetCertification: string): Subject[] {
  // UI 유지용 기본값
  const fallbackColor = "#8b5cf6"
  const subjectIcon = "📘"
  const mainIcon = "📂"

  const mapExam = (m: ExamMode): "written" | "practical" =>
    m === "WRITTEN" ? "written" : "practical"

  // roots는 subject 레벨
  const subjects: Subject[] = roots.map(root => {
    const mainTopics: MainTopic[] =
      (root.children || []).map(mt => {
        const subTopics: SubTopic[] =
          (mt.children || []).map(st => ({
            id: st.id,
            name: st.title,
            completed: false, // 백엔드에 없으니 기본 false
          }))

        return {
          id: mt.id,
          name: mt.title,
          color: fallbackColor,
          icon: mainIcon,
          reviewCompleted: false, // 백엔드에 없으니 기본 false
          subTopics,
        }
      })

    return {
      id: root.id,
      category: targetCertification, // 기존 필터를 위해 주입
      examType: mapExam(root.examMode),
      name: root.title,
      color: fallbackColor,
      icon: subjectIcon,
      mainTopics,
    }
  })

  return subjects
}

interface MainLearningDashboardProps {
  targetCertification: string
  onStartMicro: (detailId: number, detailName: string, examType: "written" | "practical") => void
  onStartReview: (mainTopicId: number, mainTopicName: string, examType: "written" | "practical") => void
}

export function MainLearningDashboard({ targetCertification, onStartMicro, onStartReview }: MainLearningDashboardProps) {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedMainTopic, setExpandedMainTopic] = useState<number | null>(null)
  const [expandedSubTopic, setExpandedSubTopic] = useState<number | null>(null)
  const [selectedExamType, setSelectedExamType] = useState<"written" | "practical">("written")

  // 백엔드에서 데이터 불러오기
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        // 변경점 api 경로와 어댑트
        const res = await axios.get(`/api/study/topics`)
        const tree = buildTree(res.data as RawTopic[])
        const adapted = toSubjectsTree(tree, targetCertification)
        setSubjects(adapted)
      } catch (err) {
        console.log(err)
        setError("데이터를 불러오는 중 오류가 발생했습니다")
      } finally {
        setLoading(false)
      }
    }
    fetchSubjects()
  }, [targetCertification])

  if (loading) return <div className="p-8 text-center text-gray-500">불러오는 중...</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>

  // 기존 필터 그대로 유지
  const currentSubjects = subjects.filter(
    s => s.category === targetCertification && s.examType === selectedExamType
  )

  // 진행률 계산 그대로 유지
  const calculateProgress = () => {
    let totalSubTopics = 0
    let completedSubTopics = 0

    currentSubjects.forEach(subject => {
      subject.mainTopics.forEach(mainTopic => {
        mainTopic.subTopics.forEach(subTopic => {
          totalSubTopics++
          if (subTopic.completed) completedSubTopics++
        })
      })
    })

    const progress = totalSubTopics > 0 ? Math.round((completedSubTopics / totalSubTopics) * 100) : 0
    return { progress, completedSubTopics, totalSubTopics }
  }

  const isMainTopicCompleted = (mainTopic: MainTopic) => {
    return mainTopic.subTopics.every(sub => sub.completed)
  }

  const { progress, completedSubTopics, totalSubTopics } = calculateProgress()

  if (currentSubjects.length === 0) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-600">선택된 자격증에 대한 학습 자료가 없습니다</p>
        </div>
      </div>
    )
  }

  // 아래부터는 네 UI 그대로 유지
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-8 h-8 text-purple-600" />
                <h1 className="text-purple-900">메인 학습</h1>
              </div>
              <p className="text-gray-600">체계적으로 개념을 학습하고 문제를 풀어보세요</p>
            </div>

            {/* Exam Type Toggle */}
            <Tabs
              value={selectedExamType}
              onValueChange={value => setSelectedExamType(value as "written" | "practical")}
            >
              <TabsList className="bg-gradient-to-r from-purple-100 to-pink-100 p-1">
                <TabsTrigger
                  value="written"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-sky-500 data-[state=active]:text-white"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  필기
                </TabsTrigger>
                <TabsTrigger
                  value="practical"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white"
                >
                  <Keyboard className="w-4 h-4 mr-2" />
                  실기
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
                <p className="text-gray-700 text-sm mb-3">개념 학습 → OX 미니체크 → 문제풀이</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-white/60">개념 보기</Badge>
                  <Badge variant="secondary" className="bg-white/60">OX 4문항</Badge>
                  <Badge variant="secondary" className="bg-white/60">문제 5문항</Badge>
                  {selectedExamType === "practical"
                    ? <Badge variant="secondary" className="bg-orange-100 text-orange-700">AI 채점 + AI 해설</Badge>
                    : <Badge variant="secondary" className="bg-blue-100 text-blue-700">AI 해설</Badge>}
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
                  {selectedExamType === "practical"
                    ? <Badge variant="secondary" className="bg-white/60">문제 10문항</Badge>
                    : <Badge variant="secondary" className="bg-white/60">문제 20문항</Badge>}
                  {selectedExamType === "practical"
                    ? <Badge variant="secondary" className="bg-orange-100 text-orange-700">AI 채점 + AI 해설</Badge>
                    : <Badge variant="secondary" className="bg-blue-100 text-blue-700">AI 해설</Badge>}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 전체 진행률 */}
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
                className={selectedExamType === "written" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}
              >
                {completedSubTopics} / {totalSubTopics} 완료
              </Badge>
              <span className="text-purple-900">{progress}%</span>
            </div>
          </div>
          <Progress value={progress} className="h-3 bg-white/60" />
          <style>
            {`.bg-white\\/60 > div {background-color: ${selectedExamType === "written" ? "#3B82F6" : "#F59E0B"} !important;}`}
          </style>
        </Card>

        {/* 과목 리스트 */}
        <div className="space-y-8">
          {currentSubjects.map(subject => (
            <div key={subject.id}>
              {/* Subject Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg text-3xl" style={{ backgroundColor: subject.color + "20" }}>
                    {subject.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-purple-900">{subject.name}</h2>
                      <Badge
                        variant="secondary"
                        className={selectedExamType === "written" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}
                      >
                        {selectedExamType === "written" ? "📝 필기" : "⌨️ 실기"}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm">{subject.mainTopics.length}개 학습 주제</p>
                  </div>
                </div>
              </div>

              {/* Main Topics */}
              <div className="space-y-4">
                {subject.mainTopics.map(mainTopic => (
                  <Card key={mainTopic.id} className="overflow-hidden border-2 hover:border-purple-300 transition-all">
                    <div
                      className="p-5 cursor-pointer bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all"
                      onClick={() =>
                        setExpandedMainTopic(expandedMainTopic === mainTopic.id ? null : mainTopic.id)
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div
                            className="p-3 rounded-lg text-2xl"
                            style={{ backgroundColor: mainTopic.color + "30" }}
                          >
                            {mainTopic.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-purple-900">{mainTopic.name}</h3>
                              <Badge variant="secondary" className="git text-purple-700">
                                {mainTopic.subTopics.length}개 세부 주제
                              </Badge>
                              {mainTopic.subTopics.every(s => s.completed) && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                  완료
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">클릭하여 학습 내용 보기</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            onClick={e => {
                              e.stopPropagation()
                              if (selectedExamType === "written") {
                                navigate(`/learning/review-written?mainTopicId=${mainTopic.id}`)
                              } else {
                                navigate(`/learning/review-practical?mainTopicId=${mainTopic.id}`)
                              }
                            }}
                            className={`text-white ${false
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

                    {/* SubTopics */}
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
                                  <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                                    완료
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                console.log(subTopic.id)
                                navigate(`/learning/micro?subTopicId=${subTopic.id}&type=${selectedExamType}`)
                              }
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
    </div >
  )
}
