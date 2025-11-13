import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Label } from "../ui/label";
import { Heart, TrendingDown, Play, FileText, Code } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function WeaknessQuiz() {
  const [questionCount, setQuestionCount] = useState("20");
  const [examType, setExamType] = useState<"written" | "practical">("written");

  // 필기 약점 태그
  const weaknessTagsWritten = [
    { tag: "정규화", total: 28, correct: 18, proficiency: 64, weaknessLevel: 85 },
    { tag: "OOP", total: 35, correct: 24, proficiency: 69, weaknessLevel: 78 },
    { tag: "디자인패턴", total: 18, correct: 11, proficiency: 61, weaknessLevel: 72 },
    { tag: "네트워크", total: 38, correct: 29, proficiency: 76, weaknessLevel: 45 },
    { tag: "TCP/IP", total: 22, correct: 15, proficiency: 68, weaknessLevel: 55 },
  ];

  // 실기 약점 태그
  const weaknessTagsPractical = [
    { tag: "알고리즘 구현", total: 30, correct: 19, proficiency: 63, weaknessLevel: 82 },
    { tag: "데이터 처리", total: 22, correct: 14, proficiency: 64, weaknessLevel: 76 },
    { tag: "SQL 구현", total: 25, correct: 18, proficiency: 72, weaknessLevel: 65 },
    { tag: "프로그래밍", total: 28, correct: 22, proficiency: 79, weaknessLevel: 40 },
    { tag: "시스템 구축", total: 20, correct: 16, proficiency: 80, weaknessLevel: 35 },
  ];

  const weaknessTags = examType === "written" ? weaknessTagsWritten : weaknessTagsPractical;
  const navigate = useNavigate()

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-8 h-8 text-red-600" />
            <h1 className="text-red-900">약점 보완 퀴즈</h1>
          </div>
          <p className="text-gray-600">AI가 분석한 내 약점을 집중 학습하세요!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weakness Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Weakness Tags */}
            <Card className="p-6 border-2 border-red-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-red-900">약점 태그 목록</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    약점 레벨이 높을수록 집중 학습이 필요합니다
                  </p>
                </div>

                {/* Exam Type Toggle */}
                <Tabs value={examType} onValueChange={(v) => setExamType(v as "written" | "practical")} className="w-auto">
                  <TabsList className="bg-red-100">
                    <TabsTrigger value="written" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      필기
                    </TabsTrigger>
                    <TabsTrigger value="practical" className="flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      실기
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-4">
                {weaknessTags.map((item) => (
                  <div key={item.tag} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <span className="text-gray-800">#{item.tag}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={
                              item.weaknessLevel >= 70
                                ? "bg-red-100 text-red-700"
                                : item.weaknessLevel >= 50
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-green-100 text-green-700"
                            }
                          >
                            약점도 {item.weaknessLevel}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress value={item.proficiency} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Learning Tips */}
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>
                <div>
                  <h3 className="text-blue-900 mb-2">학습 팁</h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• 약점 태그의 기본 개념을 먼저 복습하세요 (Micro 모드)</li>
                    <li>• 틀린 문제는 해설을 꼼꼼히 읽고 이해하세요</li>
                    <li>• 같은 유형의 문제를 반복해서 풀어보세요</li>
                    <li>• 일주일에 2-3회 약점 보완 퀴즈를 푸는 것을 추천합니다</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          {/* Settings */}
          <div className="space-y-6">
            {/* Question Count */}
            <Card className="p-6 border-2 border-red-200">
              <h3 className="text-red-900 mb-4">문제 수</h3>
              <RadioGroup value={questionCount} onValueChange={setQuestionCount}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="10" id="count-10" />
                    <Label htmlFor="count-10" className="cursor-pointer">
                      10문제 (빠른 복습)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="20" id="count-20" />
                    <Label htmlFor="count-20" className="cursor-pointer">
                      20문제 (추천)
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

            {/* Focus Tags */}
            <Card className="p-6 bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200">
              <h3 className="text-red-900 mb-4">집중 학습 태그</h3>
              <div className="space-y-2">
                {weaknessTags
                  .filter(t => t.weaknessLevel >= 70)
                  .map((item) => (
                    <div
                      key={item.tag}
                      className="flex items-center gap-2 p-2 bg-white/60 rounded"
                    >
                      <Heart className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-gray-800">#{item.tag}</span>
                    </div>
                  ))}
              </div>
              <p className="text-xs text-gray-600 mt-3">
                약점도 70% 이상 태그 우선 출제
              </p>
            </Card>

            {/* Summary */}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => {
                  // 약점 태그 필터링
                  const weakTags = weaknessTags
                    .filter(t => t.weaknessLevel >= 70)
                    .map(t => t.tag)

                  // FlowPage로 이동하면서 선택 정보 전달
                  navigate("/solo/play", {
                    state: {
                      weakTags,                         // 약점 태그 배열
                      questionCount: parseInt(questionCount),
                      examType,                          // 필기 / 실기 정보
                      quizType: "weakness",              // 어떤 퀴즈인지 명시
                    },
                  })
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                퀴즈 시작
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
  );
}
