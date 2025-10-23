import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Heart, TrendingDown, Sparkles, Play, AlertCircle } from "lucide-react";
import { useState } from "react";

interface WeaknessQuizProps {
  onStart: (weakTags: string[], count: number) => void;
  onBack: () => void;
}

export function WeaknessQuiz({ onStart, onBack }: WeaknessQuizProps) {
  const [questionCount, setQuestionCount] = useState("20");

  const weaknessTags = [
    { tag: "정규화", total: 28, correct: 18, proficiency: 64, weaknessLevel: 85 },
    { tag: "OOP", total: 35, correct: 24, proficiency: 69, weaknessLevel: 78 },
    { tag: "디자인패턴", total: 18, correct: 11, proficiency: 61, weaknessLevel: 72 },
    { tag: "네트워크", total: 38, correct: 29, proficiency: 76, weaknessLevel: 45 },
    { tag: "TCP/IP", total: 22, correct: 15, proficiency: 68, weaknessLevel: 55 },
  ];

  const handleStart = () => {
    const weakTags = weaknessTags
      .filter(t => t.weaknessLevel >= 70)
      .map(t => t.tag);
    onStart(weakTags, parseInt(questionCount));
  };

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
            {/* AI Analysis */}
            <Card className="p-6 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200">
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-red-900">AI 약점 분석</h3>
                    <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                      Beta
                    </Badge>
                  </div>
                  <p className="text-gray-700 mb-3">
                    최근 학습 기록을 분석한 결과, <strong>정규화</strong>와 <strong>OOP</strong> 태그의 
                    정답률이 낮습니다. 이 영역을 집중적으로 학습하면 전체 점수를 크게 향상시킬 수 있습니다.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>약점 보완으로 예상 점수 향상: +15점</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Weakness Tags */}
            <Card className="p-6 border-2 border-red-200">
              <h2 className="text-red-900 mb-4">약점 태그 목록</h2>
              <p className="text-sm text-gray-600 mb-4">
                약점 레벨이 높을수록 집중 학습이 필요합니다
              </p>

              <div className="space-y-4">
                {weaknessTags.map((item) => (
                  <div key={item.tag} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <span className="text-gray-800">#{item.tag}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                          {item.correct} / {item.total}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={
                              item.proficiency >= 80
                                ? "bg-green-100 text-green-700"
                                : item.proficiency >= 60
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }
                          >
                            {item.proficiency}%
                          </Badge>
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
            <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200">
              <h3 className="text-yellow-900 mb-4">예상 효과</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">현재 평균 점수</span>
                  <span className="text-gray-800">68점</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">목표 점수</span>
                  <span className="text-yellow-600">83점 (+15)</span>
                </div>
                <Progress value={68} className="h-2" />
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleStart}
                className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                약점 보완 시작
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
