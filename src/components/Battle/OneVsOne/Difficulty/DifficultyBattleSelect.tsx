import { useState } from "react"
import { Card } from "../../../ui/card"
import { Button } from "../../../ui/button"
import { Play, Swords, TrendingUp, Bot } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { matchWithBot, saveRoomId } from "../../../api/versusApi"

export function DifficultyBattleSelect() {
  const [difficulty, setDifficulty] = useState("easy")
  const [selectedExamType, setSelectedExamType] = useState<"written" | "practical">("written")

  // 문제 수 고정값
  const QUESTION_COUNT = 10

  const navigate = useNavigate()

  const startBotMatching = async () => {
    try {
      const examMode = selectedExamType === "written" ? "WRITTEN" : "PRACTICAL"
      const difficultyLevel: "EASY" | "NORMAL" | "HARD" = 
        difficulty === "easy" ? "EASY" :
        difficulty === "medium" ? "NORMAL" : "HARD"
      
      const response = await matchWithBot({
        examMode: examMode as "WRITTEN" | "PRACTICAL",
        scopeType: "DIFFICULTY",
        difficulty: difficultyLevel,
      })

      // roomId 저장
      saveRoomId(response.roomId)

      // 봇 매칭 성공 시 바로 게임 시작 페이지로 이동
      navigate("/battle/onevsone/difficulty/start", {
        state: {
          roomId: response.roomId,
          botUserId: response.botUserId,
          botNickname: response.botNickname,
          difficulty: difficulty,
          examType: selectedExamType,
          scopeJson: response.scopeJson,
          isBotMatch: true,
        }
      })
    } catch (err: any) {
      console.error("봇 매칭 실패", err)
      alert(err.response?.data?.message || "봇 매칭에 실패했습니다.")
    }
  }

  return (
      <div>
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
                  {["easy", "medium", "hard"].map(level => (
                    <div
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${difficulty === level
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-orange-300 hover:bg-gray-50"
                        }`}
                    >
                      <div className="flex items-center justify-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${level === "easy"
                            ? "bg-green-500"
                            : level === "medium"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                            }`}
                        >
                          {level === "easy" ? "😊" : level === "medium" ? "🤔" : "😰"}
                        </div>
                        <h3 className="text-gray-900">
                          {level === "easy" ? "쉬움" : level === "medium" ? "보통" : "어려움"}
                        </h3>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 우측 */}
              <div className="space-y-4">


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
                  onClick={startBotMatching}
                  variant="outline"
                  className="w-full h-11 border-2 border-gray-300 hover:bg-gray-50"
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
