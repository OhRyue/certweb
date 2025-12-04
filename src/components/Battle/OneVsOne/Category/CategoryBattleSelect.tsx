import { useState, useEffect } from "react"
import { Card } from "../../../ui/card"
import { Button } from "../../../ui/button"
import { Swords, Target, ChevronRight, ChevronDown, Bot } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { matchWithBot, saveRoomId } from "../../../api/versusApi"
import axios from "../../../api/axiosConfig"
import type { Subject } from "../../../../types"

interface RawTopic {
  id: number
  parentId: number | null
  certId: number
  code: string
  title: string
  emoji?: string | null
  orderNo: number
  examMode: "WRITTEN" | "PRACTICAL"
  children?: RawTopic[]
}

// 트리 빌더
function buildTree(data: RawTopic[]): RawTopic[] {
  const map = new Map<number, RawTopic>()
  const roots: RawTopic[] = []

  data.forEach(item => {
    map.set(item.id, { ...item, children: [] })
  })

  data.forEach(item => {
    if (item.parentId === null) {
      roots.push(map.get(item.id)!)
    } else {
      const parent = map.get(item.parentId)
      if (parent && parent.children) parent.children.push(map.get(item.id)!)
    }
  })

  const sortRec = (nodes?: RawTopic[]) => {
    if (!nodes) return
    nodes.sort((a, b) => a.orderNo - b.orderNo)
    nodes.forEach(node => sortRec(node.children))
  }

  sortRec(roots)
  return roots
}

// RawTopic 트리 → Subject 구조로 변환
function toSubjectsTree(roots: RawTopic[]): Subject[] {
  const fallbackColor = "#8b5cf6"
  const subjectIcon = "📘"
  const mainIcon = "📂"

  return roots.map(root => {
    const mainTopics = (root.children || []).map(mt => {
      const subTopics = (mt.children || []).map(st => ({
        id: st.id,
        name: st.title,
        completed: false,
        details: [],
      }))

      return {
        id: mt.id,
        name: mt.title,
        subTopics,
        icon: mt.emoji || mainIcon,
        color: fallbackColor,
        reviewCompleted: false,
      }
    })

    return {
      id: root.id,
      name: root.title,
      category: "정보처리기사",
      examType: root.examMode === "WRITTEN" ? "written" : "practical",
      mainTopics,
      icon: root.emoji || subjectIcon,
      color: fallbackColor,
    }
  })
}

export function CategoryBattleSelect() {
  const [selectedExamType, setSelectedExamType] = useState<"written" | "practical">("written")
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null)
  const [selectedMainTopicId, setSelectedMainTopicId] = useState<number | null>(null)
  const [selectedMainTopicName, setSelectedMainTopicName] = useState<string>("")
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()

  // 백엔드에서 topic 데이터 가져오기
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true)
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
        console.error("토픽 데이터 불러오기 실패", err)
      } finally {
        setLoading(false)
      }
    }

    fetchSubjects()
  }, [selectedExamType])

  const currentSubjects = subjects.filter(s => s.examType === selectedExamType)

  const startMatching = () => {
    if (!selectedMainTopicId) return  
    navigate("/battle/onevsone/category/matching", {
      state: {
        topicId: selectedMainTopicId,
        topicName: selectedMainTopicName,
        examType: selectedExamType
      },
    })
  }

  const startBotMatching = async () => {
    if (!selectedMainTopicId) return

    try {
      const examMode = selectedExamType === "written" ? "WRITTEN" : "PRACTICAL"
      const response = await matchWithBot({
        examMode: examMode as "WRITTEN" | "PRACTICAL",
        scopeType: "CATEGORY",
        topicId: selectedMainTopicId,
      })

      // roomId 저장
      saveRoomId(response.roomId)

      // 봇 매칭 성공 시 바로 게임 시작 페이지로 이동
      navigate("/battle/onevsone/category/start", {
        state: {
          roomId: response.roomId,
          botUserId: response.botUserId,
          botNickname: response.botNickname,
          topicName: selectedMainTopicName,
          topicId: selectedMainTopicId,
          examType: selectedExamType,
          scopeJson: response.scopeJson,
          isBotMatch: true,
        }
      })
    } catch (err: unknown) {
      console.error("봇 매칭 실패", err)
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "봇 매칭에 실패했습니다."
      alert(errorMessage)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Swords className="w-8 h-8 text-purple-600" />
            <h1 className="text-purple-900">1:1 배틀</h1>
          </div>
          <p className="text-gray-600">토픽을 선택하고 상대를 찾아보세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 왼쪽: 토픽 선택 */}
          <div className="lg:col-span-2">
            <Card className="p-6 border-2 border-purple-200 bg-white/80 backdrop-blur">

              {/* 필기/실기 토글 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <h2 className="text-purple-900">배틀 토픽 선택</h2>
                </div>

                <div className="flex gap-2 bg-blue-100 p-1 rounded-xl">
                  <Button
                    variant={selectedExamType === "written" ? "default" : "ghost"}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      selectedExamType === "written"
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "text-blue-700 hover:bg-blue-100"
                    }`}
                    onClick={() => {
                      setSelectedExamType("written")
                      setSelectedMainTopicId(null)
                      setExpandedSubject(null)
                    }}
                  >
                    📝 필기
                  </Button>

                  <Button
                    variant={selectedExamType === "practical" ? "default" : "ghost"}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      selectedExamType === "practical"
                        ? "bg-orange-500 text-white hover:bg-orange-600"
                        : "text-orange-700 hover:bg-orange-100"
                    }`}
                    onClick={() => {
                      setSelectedExamType("practical")
                      setSelectedMainTopicId(null)
                      setExpandedSubject(null)
                    }}
                  >
                    💻 실기
                  </Button>
                </div>
              </div>

              {/* Subject → MainTopic → SubTopic */}
              {loading ? (
                <div className="text-center py-8 text-gray-600">토픽을 불러오는 중...</div>
              ) : (
              <div className="space-y-4">
                {currentSubjects.map(subject => (
                  <div key={subject.id} className="border-2 border-gray-200 rounded-lg overflow-hidden">

                    {/* Subject */}
                    <div
                      onClick={() =>
                        setExpandedSubject(expandedSubject === subject.id ? null : subject.id)
                      }
                      className="p-4 cursor-pointer bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 text-2xl rounded-lg"
                            style={{ backgroundColor: subject.color + "20" }}
                          >
                            {subject.icon}
                          </div>
                          <h3 className="text-purple-900">{subject.name}</h3>
                        </div>
                        {expandedSubject === subject.id
                          ? <ChevronDown className="w-5 h-5 text-purple-600" />
                          : <ChevronRight className="w-5 h-5 text-purple-600" />
                        }
                      </div>
                    </div>

                    {/* MainTopic */}
                    {expandedSubject === subject.id && (
                      <div className="p-4 bg-white space-y-3">
                        {subject.mainTopics.map(main => (
                          <div key={main.id} className="border-l-4 border-purple-300 pl-4">
                            <div
                              onClick={() => {
                                setSelectedMainTopicId(main.id)
                                setSelectedMainTopicName(main.name)
                              }}
                              className={`border rounded-lg p-4 transition-all cursor-pointer ${
                                selectedMainTopicId === main.id
                                  ? "border-purple-500 bg-purple-50"
                                  : "border-gray-200 bg-white hover:bg-purple-50"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{main.icon}</span>
                                <h4 className="text-purple-800 font-medium">{main.name}</h4>
                              </div>

                              {/* SubTopics 표시 (선택 불가, 정보만) */}
                              {main.subTopics && main.subTopics.length > 0 && (
                                <div className="mt-3 space-y-1 pl-7">
                                  {main.subTopics.map(sub => (
                                    <div key={sub.id} className="text-sm text-gray-600">
                                      • {sub.name}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              )}
            </Card>
          </div>

          {/* 오른쪽 카드들 */}
          <div className="space-y-6">

            {/* 선택 요약 */}
            <Card className="p-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
              <h3 className="text-purple-900 mb-4">배틀 설정</h3>
              <div className="text-sm space-y-2">
                <div>
                  <p className="text-gray-600">토픽</p>
                  <p className="text-purple-900">
                    {selectedMainTopicId ? selectedMainTopicName : "선택 안 됨"}
                  </p>
                </div>
              </div>
            </Card>

            {/* 규칙 */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
              <h3 className="text-blue-900 mb-4">⚡ 배틀 규칙</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• 총 10문제</li>
                <li>• 제한 시간 5분</li>
                <li>• 빠른 정답 가산점</li>
                <li>• 콤보 보너스 점수</li>
              </ul>
            </Card>

            {/* 버튼 */}
            <div className="space-y-3">
              <Button
                onClick={startMatching}
                disabled={!selectedMainTopicId}
                className="w-full h-11 bg-gradient-to-r from-purple-500 to-pink-500 text-white disabled:opacity-50"
              >
                매칭 시작
              </Button>

              <Button
                onClick={startBotMatching}
                disabled={!selectedMainTopicId}
                variant="outline"
                className="w-full h-11 border-2 border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <Bot className="w-4 h-4 mr-2" />
                봇과 매칭
              </Button>

              <Button
                onClick={() => navigate("/battle/onevsone/dashboard")}
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
