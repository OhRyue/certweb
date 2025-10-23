import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Progress } from "../ui/progress";
import { BarChart2, Play, TrendingUp } from "lucide-react";

interface DifficultyQuizProps {
  onStart: (difficulty: string, count: number) => void;
  onBack: () => void;
}

export function DifficultyQuiz({ onStart, onBack }: DifficultyQuizProps) {
  const [difficulty, setDifficulty] = useState("easy");
  const [questionCount, setQuestionCount] = useState("20");

  const difficultyStats = [
    { level: "easy", name: "쉬움", total: 120, solved: 95, accuracy: 87, color: "green" },
    { level: "medium", name: "보통", total: 85, solved: 60, accuracy: 72, color: "yellow" },
    { level: "hard", name: "어려움", total: 45, solved: 18, accuracy: 58, color: "red" },
  ];

  const recommendations = {
    easy: "기본 개념을 다지기에 좋습니다. 처음 학습하는 분들께 추천합니다.",
    medium: "실전 감각을 익히기에 적합합니다. 기본 개념을 이해한 후 도전하세요.",
    hard: "심화 학습과 응용력 향상에 도움이 됩니다. 기본이 탄탄한 분들께 추천합니다.",
  };

  const handleStart = () => {
    onStart(difficulty, parseInt(questionCount));
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart2 className="w-8 h-8 text-orange-600" />
            <h1 className="text-orange-900">난이도별 퀴즈</h1>
          </div>
          <p className="text-gray-600">내 실력에 맞는 난이도를 선택하세요!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Difficulty Stats */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6 border-2 border-orange-200">
              <h2 className="text-orange-900 mb-4">난이도별 현황</h2>
              
              <div className="space-y-4">
                {difficultyStats.map((stat) => (
                  <div
                    key={stat.level}
                    onClick={() => setDifficulty(stat.level)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      difficulty === stat.level
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-orange-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                            stat.color === "green"
                              ? "bg-green-500"
                              : stat.color === "yellow"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                        >
                          {stat.level === "easy" ? "😊" : stat.level === "medium" ? "🤔" : "😰"}
                        </div>
                        <div>
                          <h3 className="text-gray-900">{stat.name}</h3>
                          <p className="text-sm text-gray-600">
                            {stat.solved} / {stat.total} 문제 풀이
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={
                          stat.accuracy >= 80
                            ? "bg-green-100 text-green-700"
                            : stat.accuracy >= 60
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {stat.accuracy}%
                      </Badge>
                    </div>
                    <Progress value={(stat.solved / stat.total) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </Card>

            {/* Recommendation */}
            <Card className="p-6 bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-6 h-6 text-orange-600 flex-shrink-0" />
                <div>
                  <h3 className="text-orange-900 mb-2">추천 학습법</h3>
                  <p className="text-gray-700">
                    {recommendations[difficulty as keyof typeof recommendations]}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Settings */}
          <div className="space-y-6">
            {/* Difficulty Selection */}
            <Card className="p-6 border-2 border-orange-200">
              <h3 className="text-orange-900 mb-4">난이도 선택</h3>
              <RadioGroup value={difficulty} onValueChange={setDifficulty}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="easy" id="diff-easy" />
                    <Label htmlFor="diff-easy" className="cursor-pointer flex items-center gap-2">
                      <span className="text-green-600">●</span>
                      쉬움
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="diff-medium" />
                    <Label htmlFor="diff-medium" className="cursor-pointer flex items-center gap-2">
                      <span className="text-yellow-600">●</span>
                      보통
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hard" id="diff-hard" />
                    <Label htmlFor="diff-hard" className="cursor-pointer flex items-center gap-2">
                      <span className="text-red-600">●</span>
                      어려움
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </Card>

            {/* Question Count */}
            <Card className="p-6 border-2 border-orange-200">
              <h3 className="text-orange-900 mb-4">문제 수</h3>
              <RadioGroup value={questionCount} onValueChange={setQuestionCount}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="10" id="count-10" />
                    <Label htmlFor="count-10" className="cursor-pointer">
                      10문제
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="20" id="count-20" />
                    <Label htmlFor="count-20" className="cursor-pointer">
                      20문제
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="50" id="count-50" />
                    <Label htmlFor="count-50" className="cursor-pointer">
                      50문제
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </Card>

            {/* Summary */}
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200">
              <h3 className="text-orange-900 mb-4">선택 요약</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">난이도</p>
                  <p className="text-orange-600">
                    {difficulty === "easy" ? "쉬움" : difficulty === "medium" ? "보통" : "어려움"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">문제 수</p>
                  <p className="text-orange-600">{questionCount}문제</p>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleStart}
                className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
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
