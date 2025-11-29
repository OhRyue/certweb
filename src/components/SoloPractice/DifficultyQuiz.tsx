import { useState } from "react"
import { Card } from "../ui/card"
import { Button } from "../ui/button"
import { BarChart2, Play, TrendingUp, Loader2 } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import { Label } from "../ui/label"
import { useNavigate } from "react-router-dom"
import axios from "../api/axiosConfig"

export function DifficultyQuiz() {
  const [difficulty, setDifficulty] = useState("easy")      // 난이도 상태
  const [questionCount, setQuestionCount] = useState("20")  // 문제 수 상태
  const [selectedExamType, setSelectedExamType] = useState<"written" | "practical">("written")  // 필기 / 실기 토글

  // 난이도 통계
  const difficultyStats = [
    { level: "easy", name: "쉬움", total: 120, solved: 95, accuracy: 87, color: "green" },
    { level: "medium", name: "보통", total: 85, solved: 60, accuracy: 72, color: "yellow" },
    { level: "hard", name: "어려움", total: 45, solved: 18, accuracy: 58, color: "red" },
  ]

  // 추천 문구
  const recommendations = {
    easy: "기본 개념을 다지기에 좋습니다. 처음 학습하는 분들께 추천합니다.",
    medium: "실전 감각을 익히기에 적합합니다. 기본 개념을 이해한 후 도전하세요.",
    hard: "심화 학습과 응용력 향상에 도움이 됩니다. 기본이 탄탄한 분들께 추천합니다.",
  }

  // 퀴즈 시작
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 난이도를 API 형식으로 변환
  const getDifficultyApiFormat = (difficulty: string): "EASY" | "NORMAL" | "HARD" => {
    if (difficulty === "easy") return "EASY"
    if (difficulty === "medium") return "NORMAL"
    return "HARD"
  }

  // 퀴즈 시작 핸들러
  const handleStartQuiz = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const difficultyParam = getDifficultyApiFormat(difficulty)
      const count = parseInt(questionCount)
      
      // 필기/실기 모드에 따라 다른 API 호출
      const apiEndpoint = selectedExamType === "practical" 
        ? "/study/assist/practical/difficulty"
        : "/study/assist/written/difficulty"
      
      const res = await axios.get(apiEndpoint, {
        params: {
          difficulty: difficultyParam,
          count: count
        }
      })

      // API 응답에서 데이터 추출
      const sessionId = res.data.sessionId
      const learningSessionId = res.data.learningSessionId
      const items = res.data.payload?.items || []

      // learningSessionId를 localStorage에 저장
      if (learningSessionId) {
        localStorage.setItem('difficultyQuizLearningSessionId', learningSessionId.toString())
      }

      // 문제를 Question 형식으로 변환
      const questions = items.map((item: any) => {
        if (selectedExamType === "practical") {
          // 실기 모드: choices 없음
          return {
            id: String(item.questionId),
            topicId: "",
            tags: [],
            difficulty: difficulty as "easy" | "medium" | "hard",
            type: "typing" as const,
            examType: "practical" as const,
            question: item.text || "",
            options: [],
            correctAnswer: "",
            explanation: "",
            imageUrl: item.imageUrl || undefined
          }
        } else {
          // 필기 모드: choices 배열을 options로 변환
          const options = (item.choices || []).map((choice: any) => ({
            label: choice.label || "",
            text: choice.text || ""
          }))
          
          return {
            id: String(item.questionId),
            topicId: "",
            tags: [],
            difficulty: difficulty as "easy" | "medium" | "hard",
            type: "multiple" as const,
            examType: "written" as const,
            question: item.text || "",
            options: options,
            correctAnswer: 0, // API에서 받지 않으므로 0으로 설정 (채점 시 API에서 확인)
            explanation: "",
            imageUrl: item.imageUrl || undefined
          }
        }
      })

      // QuizFlowPage로 이동하면서 데이터 전달
      navigate("/solo/play", {
        state: {
          difficulty,
          questionCount: count,
          examType: selectedExamType,
          quizType: "difficulty",
          questions: questions, // API에서 받은 문제
          sessionId: sessionId,
          learningSessionId: learningSessionId,
          topicId: 0 // 난이도 퀴즈는 topicId가 없음
        },
      })
    } catch (err: any) {
      console.error("난이도 퀴즈 시작 실패:", err)
      setError(err.response?.data?.message || "퀴즈를 시작하는 중 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BarChart2 className="w-8 h-8 text-orange-600" />
              <h1 className="text-orange-900">난이도별 퀴즈</h1>
            </div>
            <p className="text-gray-600">내 실력에 맞는 난이도와 시험 유형을 선택하세요!</p>
          </div>
        </div>

        {/* 본문 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 난이도 선택 */}
          <Card className="p-6 border-2 border-orange-200">
            {/* 타이틀 + 필기/실기 토글 한 줄 정렬 */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-orange-900">난이도 선택</h2>

              {/* 필기/실기 토글 버튼 */}
              <div className="flex gap-2 bg-orange-100 p-1 rounded-xl">
                <Button
                  variant={selectedExamType === "written" ? "default" : "ghost"}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${selectedExamType === "written"
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "text-blue-700 hover:bg-blue-100 hover:text-blue-700"
                    }`}
                  onClick={() => setSelectedExamType("written")}
                >
                  📝 필기
                </Button>

                <Button
                  variant={selectedExamType === "practical" ? "default" : "ghost"}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${selectedExamType === "practical"
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "text-orange-700 hover:bg-orange-100 hover:text-orange-700"
                    }`}
                  onClick={() => setSelectedExamType("practical")}
                >
                  💻 실기
                </Button>
              </div>
            </div>

            {/* 난이도 선택 리스트 */}
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

          {/* 우측 설정 */}
          <div className="space-y-4">
            {/* 추천 학습법 */}
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

            {/* 문제 수 */}
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

            {/* 요약 */}
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
                <div>
                  <p className="text-sm text-gray-600">시험 유형</p>
                  <p className="text-orange-600">
                    {selectedExamType === "written" ? "📝 필기" : "💻 실기"}
                  </p>
                </div>
              </div>
            </Card>

            {/* 버튼 */}
            <div className="space-y-3">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              <Button
                onClick={handleStartQuiz}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    시작 중...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    퀴즈 시작
                  </>
                )}
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
  )
}
