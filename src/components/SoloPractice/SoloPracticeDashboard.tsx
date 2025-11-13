import { useNavigate } from "react-router-dom"
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Dumbbell, Tag, BarChart2, Heart } from "lucide-react";


interface SoloPracticeDashboardProps {
  onStartCategoryQuiz: () => void;
  onStartDifficultyQuiz: () => void;
  onStartWeaknessQuiz: () => void;
}

export function SoloPracticeDashboard({
}: SoloPracticeDashboardProps) {
  const navigate = useNavigate()

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Dumbbell className="w-8 h-8 text-purple-600" />
            <h1 className="text-purple-900">보조 학습 (혼자풀기)</h1>
          </div>
          <p className="text-gray-600">내 방식대로 자유롭게 학습하세요!</p>
        </div>

        {/* Quiz Modes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Category Quiz */}
          <Card className="p-6 hover:shadow-xl transition-all border-2 hover:border-purple-300">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mb-4">
                <Tag className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-purple-900 mb-2">카테고리 퀴즈</h2>
              <p className="text-gray-600">
                원하는 태그/토픽을 선택해서 학습하세요
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>태그별 문제 선택</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>10 / 20 / 50 문항</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>즉시 채점 및 해설</span>
              </div>
            </div>

            <Button
              onClick={() => navigate("/solo/category")}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              시작하기
            </Button>
          </Card>

          {/* Difficulty Quiz */}
          <Card className="p-6 hover:shadow-xl transition-all border-2 hover:border-orange-300">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full mb-4">
                <BarChart2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-orange-900 mb-2">난이도별 퀴즈</h2>
              <p className="text-gray-600">
                난이도를 선택하고 실력을 키워보세요
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span>쉬움 / 보통 / 어려움</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span>단계별 학습 추천</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span>실력 향상 트래킹</span>
              </div>
            </div>

            <Button
              onClick={() => navigate("/solo/difficulty")}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
            >
              시작하기
            </Button>
          </Card>

          {/* Weakness Quiz */}
          <Card className="p-6 hover:shadow-xl transition-all border-2 hover:border-red-300">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-400 to-pink-400 rounded-full mb-4">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-red-900 mb-2">약점 보완 퀴즈</h2>
              <p className="text-gray-600">
                내가 약한 태그를 집중 학습하세요
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span>AI가 분석한 약점</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span>맞춤형 문제 제공</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span>약점 극복 가이드</span>
              </div>
            </div>

            <Button
              onClick={() => navigate("/solo/weakness")}
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
            >
              시작하기
            </Button>
          </Card>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
            <h3 className="text-purple-900 mb-2">오늘의 목표</h3>
            <p className="text-gray-600 mb-2">50문제 풀기</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-purple-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: "60%" }} />
              </div>
              <span className="text-sm text-purple-600">30/50</span>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
            <h3 className="text-blue-900 mb-2">이번 주 학습</h3>
            <div className="text-blue-600">
              <span className="text-3xl">245</span>
              <span className="text-sm ml-2">문제</span>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
            <h3 className="text-green-900 mb-2">평균 정답률</h3>
            <div className="text-green-600">
              <span className="text-3xl">78</span>
              <span className="text-sm ml-2">%</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
