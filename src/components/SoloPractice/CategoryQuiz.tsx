// CategoryQuiz.tsx
import { useState, useEffect } from "react"
import axios from "../api/axiosConfig"
import { Card } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Checkbox } from "../ui/checkbox"
import { Label } from "../ui/label"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import { Tag, Play, ChevronRight, ChevronDown, FileText, Keyboard, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"

interface CategoryQuizProps {
  onStart?: () => void
  onBack?: () => void
  targetCertification?: string
}

// 카테고리 기반 퀴즈 시작 화면
export function CategoryQuiz({ }: CategoryQuizProps) {
  const [subjects, setSubjects] = useState<any[]>([])
  const [selectedDetails, setSelectedDetails] = useState<number[]>([])
  const [questionCount, setQuestionCount] = useState("10")
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null)
  const [expandedMainTopic, setExpandedMainTopic] = useState<number | null>(null)
  const [expandedSubTopic, setExpandedSubTopic] = useState<number | null>(null)
  const [selectedExamType, setSelectedExamType] = useState<"written" | "practical">("written")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()

  // ------------------------------
  // ⭐ API → 트리 구조 변환
  // ------------------------------
  const buildSubjectTree = (topics: any[]) => {
    const subjectNodes = topics.filter(t => t.parentId === null)

    return subjectNodes.map(subject => {
      const mainTopics = topics.filter(t => t.parentId === subject.id)

      return {
        id: subject.id,
        name: subject.title,
        icon: subject.emoji,
        examType: subject.examMode.toLowerCase(), // written/practical
        color: "#A78BFA",
        mainTopics: mainTopics.map(main => {
          const subTopics = topics.filter(t => t.parentId === main.id)

          return {
            id: main.id,
            name: main.title,
            icon: main.emoji,
            subTopics: subTopics.map(sub => {
              const details = topics.filter(t => t.parentId === sub.id)

              return {
                id: sub.id,
                name: sub.title,
                details: details.map(detail => ({
                  id: detail.id,
                  name: detail.title
                }))
              }
            })
          }
        })
      }
    })
  }

  // ------------------------------
  // ⭐ API FETCH
  // ------------------------------
  const fetchTopics = async (type: "written" | "practical") => {
    try {
      const mode = type === "written" ? "WRITTEN" : "PRACTICAL"

      const res = await axios.get("/cert/topics", {
        params: {
          certId: 1,
          mode,
          parentId: null
        }
      })

      const tree = buildSubjectTree(res.data.topics)
      setSubjects(tree)
    } catch (err) {
      console.error("❌ 토픽 로딩 실패", err)
    }
  }

  useEffect(() => {
    fetchTopics("written")
  }, [])

  // ------------------------------
  // 필기 / 실기 토글
  // ------------------------------
  const toggleExamType = (type: "written" | "practical") => {
    setSelectedExamType(type)
    setExpandedSubject(null)
    setExpandedMainTopic(null)
    setExpandedSubTopic(null)
    setSelectedDetails([])

    fetchTopics(type)
  }

  // ------------------------------
  // 선택 ID 집계 함수들
  // ------------------------------
  const getAllDetailIdsInSubject = (subject: any) => {
    if (!subject || !subject.mainTopics || subject.mainTopics.length === 0) {
      return []
    }

    return subject.mainTopics.flatMap(main => {
      if (!main || !main.subTopics || main.subTopics.length === 0) {
        return []
      }
      return main.subTopics.flatMap(sub => {
        if (!sub || !sub.details || sub.details.length === 0) {
          return [sub.id]
        }
        return sub.details.map(d => d.id)
      })
    })
  }

  const getAllDetailIdsInMainTopic = (mainTopic: any) => {
    if (!mainTopic || !mainTopic.subTopics || mainTopic.subTopics.length === 0) {
      return []
    }
    return mainTopic.subTopics.flatMap(sub => {
      if (!sub || !sub.details || sub.details.length === 0) {
        return [sub.id]
      }
      return sub.details.map(d => d.id)
    })
  }

  const getAllDetailIdsInSubTopic = (subTopic: any) => {
    if (!subTopic || !subTopic.details || subTopic.details.length === 0) {
      return [subTopic.id]
    }
    return subTopic.details.map(d => d.id)
  }

  // ------------------------------
  // 특정 시험 타입만 필터링
  // ------------------------------
  const currentSubjects = subjects.filter(
    s => s.examType === selectedExamType
  )

  // 전체 detail ID 가져오기
  const getAllDetailIds = () => {
    return currentSubjects.flatMap(subject => getAllDetailIdsInSubject(subject))
  }

  const toggleDetail = (detailId: number) => {
    setSelectedDetails(prev => {
      if (prev.includes(detailId)) {
        return prev.filter(d => d !== detailId)
      } else {
        return [...prev, detailId]
      }
    })
  }

  // ------------------------------
  // ⭐ 퀴즈 시작 핸들러 (learningSession 기반)
  // ------------------------------
  const handleStartQuiz = async () => {
    if (selectedDetails.length === 0) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const count = parseInt(questionCount)
      
      // 필기/실기 모드에 따라 다른 API 호출
      const apiEndpoint = selectedExamType === "practical" 
        ? "/study/assist/practical/category"
        : "/study/assist/written/category"
      
      const res = await axios.get(apiEndpoint, {
        params: {
          topicIds: selectedDetails,
          count: count
        }
      })

      // API 응답에서 데이터 추출
      const sessionId = res.data.sessionId
      const learningSessionId = res.data.learningSessionId
      const items = res.data.payload?.items || []

      // learningSessionId를 localStorage에 저장
      if (learningSessionId) {
        localStorage.setItem('categoryQuizLearningSessionId', learningSessionId.toString())
      }

      // 문제를 Question 형식으로 변환
      const questions = items.map((item: any) => {
        if (selectedExamType === "practical") {
          // 실기 모드: choices 없음
          return {
            id: String(item.questionId),
            topicId: "",
            tags: [],
            difficulty: "medium" as const,
            type: "typing" as const,
            examType: "practical" as const,
            question: item.text || "",
            options: [],
            correctAnswer: "",
            explanation: "",
            imageUrl: item.imageUrl || undefined
          }
        } else {
          // 필기 모드: choices 배열을 options로 변환
          const options = (item.choices || []).map((choice: any) => ({
            label: choice.label || "",
            text: choice.text || ""
          }))
          
          return {
            id: String(item.questionId),
            topicId: "",
            tags: [],
            difficulty: "medium" as const,
            type: "multiple" as const,
            examType: "written" as const,
            question: item.text || "",
            options: options,
            correctAnswer: 0, // API에서 받지 않으므로 0으로 설정 (채점 시 API에서 확인)
            explanation: "",
            imageUrl: item.imageUrl || undefined
          }
        }
      })

      // QuizFlowPage로 이동하면서 데이터 전달
      navigate("/solo/play", {
        state: {
          selectedDetails,
          questionCount: count,
          examType: selectedExamType,
          quizType: "category",
          questions: questions, // API에서 받은 문제
          sessionId: sessionId,
          learningSessionId: learningSessionId,
          topicId: 0 // 카테고리 퀴즈는 여러 topicId를 사용하므로 0으로 설정
        },
      })
    } catch (err: any) {
      console.error("카테고리 퀴즈 시작 실패:", err)
      setError(err.response?.data?.message || "퀴즈를 시작하는 중 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Tag className="w-8 h-8 text-purple-600" />
              <h1 className="text-purple-900">카테고리 퀴즈</h1>
            </div>
            <p className="text-gray-600">
              원하는 학습 주제를 선택하고 퀴즈를 시작하세요!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 좌측 트리 */}
          <div className="lg:col-span-2">
            <Card className="p-0 px-4 pt-4 pb-3 border-2 border-purple-200">
              <div className="space-y-2 mb-4">
                {/* 제목 + 토글 */}
                <div className="flex items-center justify-between">
                  <h2 className="text-xl text-purple-900">학습 주제 선택</h2>

                  <Tabs value={selectedExamType} onValueChange={v => toggleExamType(v as "written" | "practical")}>
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

                {/* 설명 */}
                <p className="text-sm text-gray-600">
                  {selectedExamType === "written"
                    ? "필기 과목의 세부 주제를 선택하세요"
                    : "실기 과목의 세부 주제를 선택하세요"}
                </p>
              </div>

              {/* 전체 선택 + 트리 렌더링 */}
              <div className="space-y-4">
                {/* 전체 선택 */}
                <div className="flex justify-end">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={(() => {
                        const allIds = getAllDetailIds()
                        return allIds.length > 0 && allIds.every(id => selectedDetails.includes(id))
                      })()}
                      onCheckedChange={(checked) => {
                        const allIds = getAllDetailIds()
                        checked ? setSelectedDetails([...allIds]) : setSelectedDetails([])
                      }}
                    />
                    <Label className="text-sm text-gray-600 cursor-pointer">
                      전체 선택
                    </Label>
                  </div>
                </div>

                {/* 트리 렌더링 */}
                <div className="space-y-4">
                {currentSubjects.map(subject => (
                  <div key={subject.id} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                    <div
                      onClick={() =>
                        setExpandedSubject(expandedSubject === subject.id ? null : subject.id)
                      }
                      className="p-4 cursor-pointer bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={(() => {
                                const allIds = getAllDetailIdsInSubject(subject)
                                return allIds.length > 0 && allIds.every(id =>
                                  selectedDetails.includes(id)
                                )
                              })()}
                              onCheckedChange={(checked) => {
                                setSelectedDetails(prev => {
                                  const allIds = getAllDetailIdsInSubject(subject)
                                  if (checked) {
                                    return [...new Set([...prev, ...allIds])]
                                  } else {
                                    return prev.filter(id => !allIds.includes(id))
                                  }
                                })
                              }}
                            />
                          </div>
                          <div className="p-2 rounded-lg text-2xl" style={{ backgroundColor: subject.color + "20" }}>
                            {subject.icon}
                          </div>
                          <div>
                            <h3 className="text-purple-900">{subject.name}</h3>
                            <Badge
                              variant="secondary"
                              className={
                                subject.examType === "written"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-orange-100 text-orange-700"
                              }
                            >
                              {subject.examType === "written" ? "📝 필기" : "⌨️ 실기"}
                            </Badge>
                          </div>
                        </div>

                        {expandedSubject === subject.id
                          ? <ChevronDown className="w-5 h-5 text-purple-600" />
                          : <ChevronRight className="w-5 h-5 text-purple-600" />}
                      </div>
                    </div>

                    {/* 메인토픽 */}
                    {expandedSubject === subject.id && (
                      <div className="p-4 bg-white space-y-3">
                        {subject.mainTopics.map(mainTopic => (
                          <div key={mainTopic.id} className="border-l-4 border-purple-300 pl-4">
                            <div
                              onClick={() =>
                                setExpandedMainTopic(
                                  expandedMainTopic === mainTopic.id ? null : mainTopic.id
                                )
                              }
                              className="cursor-pointer flex items-center justify-between hover:bg-purple-50 p-2 rounded transition-all"
                            >
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={(() => {
                                    const allIds = getAllDetailIdsInMainTopic(mainTopic)
                                    return allIds.length > 0 && allIds.every(id =>
                                      selectedDetails.includes(id)
                                    )
                                  })()}
                                  onCheckedChange={(checked) => {
                                    setSelectedDetails(prev => {
                                      const allIds = getAllDetailIdsInMainTopic(mainTopic)
                                      if (checked) {
                                        return [...new Set([...prev, ...allIds])]
                                      } else {
                                        return prev.filter(id => !allIds.includes(id))
                                      }
                                    })
                                  }}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                />
                                <span className="text-lg">{mainTopic.icon}</span>
                                <h4 className="text-purple-800">{mainTopic.name}</h4>
                                <Badge variant="outline" className="border-purple-300 text-purple-700">
                                  {mainTopic.subTopics.length}개
                                </Badge>
                              </div>

                              {expandedMainTopic === mainTopic.id
                                ? <ChevronDown className="w-4 h-4 text-purple-600" />
                                : <ChevronRight className="w-4 h-4 text-purple-600" />}
                            </div>

                            {/* 서브토픽 */}
                            {expandedMainTopic === mainTopic.id && (
                              <div className="ml-6 space-y-2 mt-2">
                                {mainTopic.subTopics.map(subTopic => (
                                  <div key={subTopic.id} className="border-l-2 border-purple-200 pl-3">
                                    <div
                                      onClick={() =>
                                        setExpandedSubTopic(
                                          expandedSubTopic === subTopic.id ? null : subTopic.id
                                        )
                                      }
                                      className="cursor-pointer flex items-center justify-between hover:bg-purple-50 p-2 rounded transition-all"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Checkbox
                                          checked={(() => {
                                            const allIds = getAllDetailIdsInSubTopic(subTopic)
                                            return allIds.length > 0 && allIds.every(id =>
                                              selectedDetails.includes(id)
                                            )
                                          })()}
                                          onCheckedChange={(checked) => {
                                            setSelectedDetails(prev => {
                                              const allIds = getAllDetailIdsInSubTopic(subTopic)
                                              if (checked) {
                                                return [...new Set([...prev, ...allIds])]
                                              } else {
                                                return prev.filter(id => !allIds.includes(id))
                                              }
                                            })
                                          }}
                                          onPointerDown={(e) => e.stopPropagation()}
                                          onMouseDown={(e) => e.stopPropagation()}
                                        />
                                        <span className="text-sm text-purple-700">{subTopic.name}</span>

                                      </div>

                                      {expandedSubTopic === subTopic.id
                                        ? <ChevronDown className="w-3 h-3 text-purple-600" />
                                        : <ChevronRight className="w-3 h-3 text-purple-600" />}
                                    </div>

                                    {/* 디테일 */}
                                    {expandedSubTopic === subTopic.id && (
                                      <div className="ml-4 space-y-1 mt-2">
                                        {subTopic.details.map(detail => (
                                          <div
                                            key={detail.id}
                                            onClick={() => toggleDetail(detail.id)}
                                            className={`p-2 rounded-lg cursor-pointer transition-all border ${selectedDetails.includes(detail.id)
                                              ? "border-purple-500 bg-purple-50"
                                              : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                                              }`}
                                          >
                                            <div className="flex items-center gap-2">
                                              <Checkbox
                                                checked={selectedDetails.includes(detail.id)}
                                                className="pointer-events-none"
                                              />
                                              <Label className="cursor-pointer pointer-events-none text-sm font-normal">
                                                {detail.name}
                                              </Label>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                </div>

                {currentSubjects.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    해당 유형({selectedExamType === "written" ? "필기" : "실기"})의 학습 자료가 없습니다.
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* 우측 */}
          <div className="space-y-6">
            {/* 문제 수 */}
            <Card className="p-6 border-2 border-purple-200">
              <h3 className="text-purple-900 mb-4">문제 수</h3>
              <RadioGroup value={questionCount} onValueChange={setQuestionCount}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="10" id="count-10" />
                    <Label htmlFor="count-10">10문제 (빠른 학습)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="20" id="count-20" />
                    <Label htmlFor="count-20">20문제 (표준)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="50" id="count-50" />
                    <Label htmlFor="count-50">50문제 (집중 학습)</Label>
                  </div>
                </div>
              </RadioGroup>
            </Card>

            {/* 선택 요약 */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
              <h3 className="text-purple-900 mb-4">선택 요약</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">선택한 주제</p>
                  <p className="text-purple-600">
                    {selectedDetails.length > 0 ? `${selectedDetails.length}개` : "없음"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">문제 수</p>
                  <p className="text-purple-600">{questionCount}문제</p>
                </div>
              </div>
            </Card>

            {/* 에러 메시지 */}
            {error && (
              <Card className="p-4 bg-red-50 border-2 border-red-200">
                <p className="text-red-600 text-sm">{error}</p>
              </Card>
            )}

            {/* 버튼 */}
            <div className="space-y-3">
              <Button
                onClick={handleStartQuiz}
                disabled={selectedDetails.length === 0 || isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    시작 중...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    퀴즈 시작
                  </>
                )}
              </Button>

              <Button
                onClick={() => navigate("/solo")}
                variant="outline"
                className="w-full border-2"
              >
                뒤로 가기
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
