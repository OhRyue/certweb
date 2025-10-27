import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { BarChart3, TrendingUp, TrendingDown, Clock, Target, Sparkles, FileText, Code } from "lucide-react";

interface ReportDashboardProps {
  onViewDetails: (resultId: string) => void;
}

// Mock data - 필기
const tagStatsWritten = [
  { tag: "데이터베이스", total: 45, correct: 38, proficiency: 84, trend: "up" },
  { tag: "네트워크", total: 38, correct: 29, proficiency: 76, trend: "up" },
  { tag: "OOP", total: 35, correct: 24, proficiency: 69, trend: "down" },
  { tag: "SQL", total: 32, correct: 28, proficiency: 88, trend: "up" },
  { tag: "정규화", total: 28, correct: 18, proficiency: 64, trend: "down" },
];

// Mock data - 실기
const tagStatsPractical = [
  { tag: "SQL 구현", total: 25, correct: 18, proficiency: 72, trend: "up" },
  { tag: "알고리즘 구현", total: 30, correct: 19, proficiency: 63, trend: "down" },
  { tag: "프로그래밍", total: 28, correct: 22, proficiency: 79, trend: "up" },
  { tag: "데이터 처리", total: 22, correct: 14, proficiency: 64, trend: "down" },
  { tag: "시스템 구축", total: 20, correct: 16, proficiency: 80, trend: "up" },
];

const recentResults = [
  { id: "r1", type: "Micro", topic: "데이터베이스 기초", date: "2025-10-22", score: 89, total: 9 },
  { id: "r2", type: "Review", topic: "네트워크", date: "2025-10-21", score: 75, total: 20 },
  { id: "r3", type: "카테고리", topic: "OOP 종합", date: "2025-10-20", score: 82, total: 20 },
  { id: "r4", type: "Micro", topic: "객체지향", date: "2025-10-19", score: 67, total: 9 },
];

export function ReportDashboard({ onViewDetails }: ReportDashboardProps) {
  const [examType, setExamType] = useState<"written" | "practical">("written");
  const tagStats = examType === "written" ? tagStatsWritten : tagStatsPractical;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-purple-600" />
            <h1 className="text-purple-900">학습 리포트</h1>
          </div>
          <p className="text-gray-600">나의 학습 현황을 확인하고 분석해보세요!</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-purple-900">총 학습 시간</h3>
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-purple-600">
              <span className="text-3xl">24</span>
              <span className="text-sm ml-2">시간</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">지난 주 대비 +3h</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-blue-900">총 문제 수</h3>
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-blue-600">
              <span className="text-3xl">478</span>
              <span className="text-sm ml-2">문제</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">이번 주: 245문제</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-green-900">평균 정답률</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-green-600">
              <span className="text-3xl">78</span>
              <span className="text-sm ml-2">%</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">지난 주 대비 +5%</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-yellow-900">연속 학습</h3>
              <Sparkles className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="text-yellow-600">
              <span className="text-3xl">7</span>
              <span className="text-sm ml-2">일</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">🔥 잘하고 있어요!</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tag Statistics */}
          <div className="lg:col-span-2">
            <Card className="p-6 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-purple-900">태그별 능력지수</h2>
                
                {/* Exam Type Toggle */}
                <Tabs value={examType} onValueChange={(v) => setExamType(v as "written" | "practical")} className="w-auto">
                  <TabsList className="bg-purple-100">
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
                {tagStats.map((stat) => (
                  <div key={stat.tag} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-800">#{stat.tag}</span>
                        {stat.trend === "up" ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                          {stat.correct} / {stat.total}
                        </span>
                        <Badge
                          variant="secondary"
                          className={
                            stat.proficiency >= 80
                              ? "bg-green-100 text-green-700"
                              : stat.proficiency >= 60
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }
                        >
                          {stat.proficiency}%
                        </Badge>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress value={stat.proficiency} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Weakness Analysis */}
              <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">💡</div>
                  <div>
                    <h3 className="text-red-900 mb-2">약점 분석 ({examType === "written" ? "필기" : "실기"})</h3>
                    <p className="text-sm text-gray-700">
                      {examType === "written" ? (
                        <>
                          <strong>정규화</strong>와 <strong>OOP</strong> 태그의 정답률이 낮습니다.
                        </>
                      ) : (
                        <>
                          <strong>알고리즘 구현</strong>과 <strong>데이터 처리</strong> 태그의 정답률이 낮습니다.
                        </>
                      )}
                      {" "}약점 보완 퀴즈로 집중 학습을 추천합니다!
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Results */}
          <div>
            <Card className="p-6 border-2 border-purple-200">
              <h2 className="text-purple-900 mb-6">최근 학습 결과</h2>
              <div className="space-y-4">
                {recentResults.map((result) => (
                  <div
                    key={result.id}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => onViewDetails(result.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge
                        variant="secondary"
                        className={
                          result.type === "Micro"
                            ? "bg-purple-100 text-purple-700"
                            : result.type === "Review"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }
                      >
                        {result.type}
                      </Badge>
                      <span className="text-xs text-gray-500">{result.date}</span>
                    </div>
                    <h4 className="text-gray-900 mb-2">{result.topic}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {Math.round((result.score / result.total) * 100)}% 정답률
                      </span>
                      <span className="text-sm text-gray-600">
                        {result.score}/{result.total}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Button 
                variant="outline" 
                className="w-full mt-4"
              >
                전체 기록 보기
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
