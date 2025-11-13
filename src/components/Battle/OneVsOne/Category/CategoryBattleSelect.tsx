import { useState } from "react"
import { Card } from "../../../ui/card"
import { Button } from "../../../ui/button"
import { Swords, Target, ChevronRight, ChevronDown } from "lucide-react"
import { subjects } from "../../../../data/mockData"
import { useNavigate } from "react-router-dom"

export function CategoryBattleSelect() {
  const [selectedExamType, setSelectedExamType] = useState<"written" | "practical">("written")
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null)
  const [expandedMainTopic, setExpandedMainTopic] = useState<number | null>(null)
  const [selectedSubTopicId, setSelectedSubTopicId] = useState<number | null>(null)
  const [selectedSubTopicName, setSelectedSubTopicName] = useState<string>("")

  const navigate = useNavigate()

  const currentSubjects = subjects.filter(s => s.examType === selectedExamType)

  const startMatching = () => {
    if (!selectedSubTopicId) return  
    navigate("/battle/onevsone/category/matching", {
      state: {
        subTopicId: selectedSubTopicId,
        subTopicName: selectedSubTopicName,
        examType: selectedExamType
      },
    })
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
                      setSelectedSubTopicId(null)
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
                      setSelectedSubTopicId(null)
                      setExpandedSubject(null)
                    }}
                  >
                    💻 실기
                  </Button>
                </div>
              </div>

              {/* Subject → MainTopic → SubTopic */}
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
                              onClick={() =>
                                setExpandedMainTopic(expandedMainTopic === main.id ? null : main.id)
                              }
                              className="cursor-pointer flex items-center justify-between hover:bg-purple-50 p-2 rounded"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{main.icon}</span>
                                <h4 className="text-purple-800">{main.name}</h4>
                              </div>

                              {expandedMainTopic === main.id
                                ? <ChevronDown className="w-4 h-4 text-purple-600" />
                                : <ChevronRight className="w-w h-4 text-purple-600" />
                              }
                            </div>

                            {/* SubTopic */}
                            {expandedMainTopic === main.id && (
                              <div className="ml-6 space-y-2 mt-2">
                                {main.subTopics.map(sub => (
                                  <div key={sub.id} className="border-l-2 border-purple-200 pl-3">
                                    <div
                                      onClick={() => {
                                        setSelectedSubTopicId(sub.id)
                                        setSelectedSubTopicName(sub.name)
                                      }}
                                      className={`border rounded-lg p-3 transition-all cursor-pointer ${
                                        selectedSubTopicId === sub.id
                                          ? "border-purple-500 bg-purple-50"
                                          : "border-gray-200 bg-white hover:bg-purple-50"
                                      }`}
                                    >
                                      <div className="text-sm font-medium text-purple-800">
                                        {sub.name}
                                      </div>

                                      <div className="mt-2 space-y-1">
                                        {sub.details.map(detail => (
                                          <div key={detail.id} className="text-sm text-gray-700 pl-5">
                                            • {detail.name}
                                          </div>
                                        ))}
                                      </div>
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
                    {selectedSubTopicId ? selectedSubTopicName : "선택 안 됨"}
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
                disabled={!selectedSubTopicId}
                className="w-full h-11 bg-gradient-to-r from-purple-500 to-pink-500 text-white disabled:opacity-50"
              >
                매칭 시작
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
