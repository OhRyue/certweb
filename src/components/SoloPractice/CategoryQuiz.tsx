import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Tag, Play, ChevronRight, ChevronDown } from "lucide-react";
import { subjects } from "../../data/mockData";

interface CategoryQuizProps {
  onStart: (detailIds: number[], count: number) => void;
  onBack: () => void;
  targetCertification: string;
}

export function CategoryQuiz({ onStart, onBack, targetCertification }: CategoryQuizProps) {
  const [selectedDetails, setSelectedDetails] = useState<number[]>([])
  const [questionCount, setQuestionCount] = useState("10")
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null)
  const [expandedMainTopic, setExpandedMainTopic] = useState<number | null>(null)
  const [expandedSubTopic, setExpandedSubTopic] = useState<number | null>(null)

  // 추가: 필기 / 실기 토글 상태
  const [selectedExamType, setSelectedExamType] = useState<"written" | "practical">("written")

  // 필기/실기 토글 버튼 핸들러
  const toggleExamType = (type: "written" | "practical") => {
    setSelectedExamType(type)
    setExpandedSubject(null)
    setExpandedMainTopic(null)
    setExpandedSubTopic(null)
    setSelectedDetails([])
  }

  // 필터 조건: 자격증 + 필기/실기 둘 다
  const currentSubjects = subjects.filter(
    s => s.category === targetCertification && s.examType === selectedExamType
  )

  const toggleDetail = (detailId: number) => {
    if (selectedDetails.includes(detailId)) {
      setSelectedDetails(selectedDetails.filter(d => d !== detailId))
    } else {
      setSelectedDetails([...selectedDetails, detailId])
    }
  }

  const handleStart = () => {
    if (selectedDetails.length > 0) {
      onStart(selectedDetails, parseInt(questionCount))
    }
  }

  // subject 기준으로 모든 detail id 모으기
  const getAllDetailIdsInSubject = (subject: any) => {
    return subject.mainTopics.flatMap(main =>
      main.subTopics.flatMap(sub => sub.details.map(d => d.id))
    )
  }

  // mainTopic 기준
  const getAllDetailIdsInMainTopic = (mainTopic: any) => {
    return mainTopic.subTopics.flatMap(sub => sub.details.map(d => d.id))
  }

  // subTopic 기준
  const getAllDetailIdsInSubTopic = (subTopic: any) => {
    return subTopic.details.map(d => d.id)
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

        {/* 기존 코드 아래 그대로 유지 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Topic Selection */}
          <div className="lg:col-span-2">
            <Card className="p-6 border-2 border-purple-200">
              {/* 제목 + 토글 같은 줄 */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-purple-900">학습 주제 선택</h2>

                {/* 필기/실기 토글 */}
                <div className="flex gap-2 bg-blue-100 p-1 rounded-xl">
                  <Button
                    variant={selectedExamType === "written" ? "default" : "ghost"}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${selectedExamType === "written"
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "text-blue-700 hover:bg-blue-100 hover:text-blue-700"
                      }`}
                    onClick={() => toggleExamType("written")}
                  >
                    📝 필기
                  </Button>
                  <Button
                    variant={selectedExamType === "practical" ? "default" : "ghost"}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${selectedExamType === "practical"
                      ? "bg-orange-500 text-white hover:bg-orange-600"
                      : "text-orange-700 hover:bg-orange-100 hover:text-orange-700"
                      }`}
                    onClick={() => toggleExamType("practical")}
                  >
                    💻 실기
                  </Button>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                {selectedExamType === "written"
                  ? "필기 과목의 세부 주제를 선택하세요"
                  : "실기 과목의 세부 주제를 선택하세요"}
              </p>
              {/* Subject List */}
              <div className="space-y-4">
                {currentSubjects.map(subject => (
                  <div key={subject.id} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                    {/* Subject Header */}
                    <div
                      onClick={() =>
                        setExpandedSubject(expandedSubject === subject.id ? null : subject.id)
                      }
                      className="p-4 cursor-pointer bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            onClick={(e) => e.stopPropagation()}
                            checked={getAllDetailIdsInSubject(subject).every(id => selectedDetails.includes(id))}
                            onCheckedChange={() => {
                              const allIds = getAllDetailIdsInSubject(subject)
                              const isAllSelected = allIds.every(id => selectedDetails.includes(id))
                              if (isAllSelected) {
                                setSelectedDetails(selectedDetails.filter(id => !allIds.includes(id)))
                              } else {
                                setSelectedDetails([...new Set([...selectedDetails, ...allIds])])
                              }
                            }}
                          />
                          <div className="p-2 rounded-lg text-2xl" style={{ backgroundColor: subject.color + "20" }}>
                            {subject.icon}
                          </div>
                          <div>
                            <h3 className="text-purple-900">{subject.name}</h3>
                            <Badge
                              variant="secondary"
                              className={subject.examType === "written"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-orange-100 text-orange-700"}
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
                    {/* 기존 topic 구조 그대로 */}
                    {expandedSubject === subject.id && (
                      <div className="p-4 bg-white space-y-3">
                        {subject.mainTopics.map(mainTopic => (
                          <div key={mainTopic.id} className="border-l-4 border-purple-300 pl-4">
                            <div className="cursor-pointer flex items-center justify-between hover:bg-purple-50 p-2 rounded transition-all">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={getAllDetailIdsInMainTopic(mainTopic).every(id => selectedDetails.includes(id))}
                                  onCheckedChange={() => {
                                    const allIds = getAllDetailIdsInMainTopic(mainTopic)
                                    const isAllSelected = allIds.every(id => selectedDetails.includes(id))
                                    if (isAllSelected) {
                                      setSelectedDetails(selectedDetails.filter(id => !allIds.includes(id)))
                                    } else {
                                      setSelectedDetails([...new Set([...selectedDetails, ...allIds])])
                                    }
                                  }}
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
                            {expandedMainTopic === mainTopic.id && (
                              <div className="ml-6 space-y-2 mt-2">
                                {mainTopic.subTopics.map(subTopic => (
                                  <div key={subTopic.id} className="border-l-2 border-purple-200 pl-3">
                                    <div className="cursor-pointer flex items-center justify-between hover:bg-purple-50 p-2 rounded transition-all">
                                      <div className="flex items-center gap-2">
                                        <Checkbox
                                          checked={getAllDetailIdsInSubTopic(subTopic).every(id => selectedDetails.includes(id))}
                                          onCheckedChange={() => {
                                            const allIds = getAllDetailIdsInSubTopic(subTopic)
                                            const isAllSelected = allIds.every(id => selectedDetails.includes(id))
                                            if (isAllSelected) {
                                              setSelectedDetails(selectedDetails.filter(id => !allIds.includes(id)))
                                            } else {
                                              setSelectedDetails([...new Set([...selectedDetails, ...allIds])])
                                            }
                                          }}
                                        />
                                        <span className="text-sm text-purple-700">{subTopic.name}</span>
                                        <Badge variant="outline" className="border-purple-200 text-purple-600 text-xs">
                                          {subTopic.details.length}개
                                        </Badge>
                                      </div>
                                      {expandedSubTopic === subTopic.id
                                        ? <ChevronDown className="w-3 h-3 text-purple-600" />
                                        : <ChevronRight className="w-3 h-3 text-purple-600" />}
                                    </div>
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
            </Card>
          </div>

          {/* Settings */}
          <div className="space-y-6">
            {/* Question Count */}
            <Card className="p-6 border-2 border-purple-200">
              <h3 className="text-purple-900 mb-4">문제 수</h3>
              <RadioGroup value={questionCount} onValueChange={setQuestionCount}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="10" id="count-10" />
                    <Label htmlFor="count-10" className="cursor-pointer">
                      10문제 (빠른 학습)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="20" id="count-20" />
                    <Label htmlFor="count-20" className="cursor-pointer">
                      20문제 (표준)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="50" id="count-50" />
                    <Label htmlFor="count-50" className="cursor-pointer">
                      50문제 (집중 학습)
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </Card>

            {/* Summary */}
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

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleStart}
                disabled={selectedDetails.length === 0}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4 mr-2" />
                퀴즈 시작
              </Button>
              <Button
                onClick={onBack}
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
  );
}
