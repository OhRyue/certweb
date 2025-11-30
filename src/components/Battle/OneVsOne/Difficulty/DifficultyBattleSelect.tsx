import { useState } from "react"
import { Card } from "../../../ui/card"
import { Button } from "../../../ui/button"
import { Play, Swords, TrendingUp } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function DifficultyBattleSelect() {
  const [difficulty, setDifficulty] = useState("easy")
  const [selectedExamType, setSelectedExamType] = useState<"written" | "practical">("written")

  // 문제 수 고정값
  const QUESTION_COUNT = 10

  const difficultyStats = [
    { level: "easy", name: "쉬움", total: 120, accuracy: 87, color: "green" },
    { level: "medium", name: "보통", total: 85, accuracy: 72, color: "yellow" },
    { level: "hard", name: "어려움", total: 45, accuracy: 58, color: "red" },
  ]

  const recommendations = {
    easy: "기본 개념을 다지기에 좋습니다. 처음 학습하는 분들께 추천합니다.",
    medium: "실전 감각을 익히기에 적합합니다. 기본 개념을 이해한 후 도전하세요.",
    hard: "심화 학습과 응용력 향상에 도움이 됩니다. 기본이 탄탄한 분들께 추천합니다.",
  }

  const navigate = useNavigate()

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Swords className="w-8 h-8 text-purple-600" />
                <h1 className="text-purple-900">1:1 배틀</h1>
              </div>
              <p className="text-gray-600">토픽을 선택하고 상대를 찾아보세요</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* 난이도 + 필기/실기 */}
              <Card className="p-6 border-2 border-orange-200">

                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-orange-900">난이도 선택</h2>

                  {/* 필기/실기 선택 */}
                  <div className="flex gap-2 bg-orange-100 p-1 rounded-xl">
                    <Button
                      variant={selectedExamType === "written" ? "default" : "ghost"}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${selectedExamType === "written"
                        ? "bg-blue-500 text-white"
                        : "text-blue-700 hover:bg-blue-100"
                        }`}
                      onClick={() => setSelectedExamType("written")}
                    >
                      📝 필기
                    </Button>

                    <Button
                      variant={selectedExamType === "practical" ? "default" : "ghost"}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${selectedExamType === "practical"
                        ? "bg-orange-500 text-white"
                        : "text-orange-700 hover:bg-orange-100"
                        }`}
                      onClick={() => setSelectedExamType("practical")}
                    >
                      💻 실기
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {difficultyStats.map(stat => (
                    <div
                      key={stat.level}
                      onClick={() => setDifficulty(stat.level)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${difficulty === stat.level
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-orange-300 hover:bg-gray-50"
                        }`}
                    >
                      <div className="flex items-center justify-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${stat.color === "green"
                            ? "bg-green-500"
                            : stat.color === "yellow"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                            }`}
                        >
                          {stat.level === "easy" ? "😊" : stat.level === "medium" ? "🤔" : "😰"}
                        </div>
                        <h3 className="text-gray-900">{stat.name}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 우측 */}
              <div className="space-y-4">

                {/* 추천 */}
                <Card className="p-6 bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                    <div>
                      <h3 className="text-orange-900 mb-2">추천 학습법</h3>
                      <p className="text-gray-700">
                        {recommendations[difficulty as keyof typeof recommendations]}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* 선택 요약 */}
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
                      <p className="text-sm text-gray-600">시험 유형</p>
                      <p className="text-orange-600">
                        {selectedExamType === "written" ? "📝 필기" : "💻 실기"}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* 시작 버튼 */}
                <Button
                  onClick={() =>
                    navigate("/battle/onevsone/difficulty/matching", {
                      state: {
                        difficulty,
                        questionCount: QUESTION_COUNT,
                        examType: selectedExamType,
                        quizType: "difficulty",
                      },
                    })
                  }
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                >
                  <Play className="w-4 h-4 mr-2" />
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
    </div>
  )
}
