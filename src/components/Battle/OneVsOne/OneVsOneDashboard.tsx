import { useNavigate } from "react-router-dom"
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Dumbbell, Tag, BarChart2 } from "lucide-react";

export function OneVsOneDashboard(){
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              onClick={() => navigate("/battle/onevsone/category/select")}
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
              onClick={() => navigate("/battle/onevsone/difficulty/select")}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
            >
              시작하기
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
