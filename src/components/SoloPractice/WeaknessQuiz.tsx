import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Label } from "../ui/label";
import { Heart, TrendingDown, Play, FileText, Code, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axiosConfig";

interface WeaknessTag {
  tag: string;
  total: number;
  correct: number;
  proficiency: number;
  weaknessLevel: number;
}

export function WeaknessQuiz() {
  const [questionCount, setQuestionCount] = useState("20");
  const [examType, setExamType] = useState<"written" | "practical">("written");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weaknessTags, setWeaknessTags] = useState<WeaknessTag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);

  const navigate = useNavigate();

  // 약점 태그 API 호출
  useEffect(() => {
    const fetchWeaknessTags = async () => {
      setTagsLoading(true);
      try {
        const mode = examType === "written" ? "WRITTEN" : "PRACTICAL";
        const response = await axios.get("/progress/report/ability-by-tag", {
          params: {
            mode: mode,
            limit: 5,
          },
        });

        // API 응답을 WeaknessTag 형식으로 변환
        const transformedTags: WeaknessTag[] = response.data.items.map((item: any) => ({
          tag: item.tag,
          total: item.total,
          correct: item.correct,
          proficiency: Math.round(item.accuracy), // 정답률을 proficiency로 사용
          weaknessLevel: Math.round(100 - item.accuracy), // 정답률이 낮을수록 약점도가 높음
        }));

        setWeaknessTags(transformedTags);
      } catch (err: any) {
        console.error("약점 태그 로딩 오류:", err);
        setWeaknessTags([]);
      } finally {
        setTagsLoading(false);
      }
    };

    fetchWeaknessTags();
  }, [examType]);

  // 퀴즈 시작 핸들러
  const handleStartQuiz = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const count = parseInt(questionCount);

      // 필기/실기에 따라 다른 API 엔드포인트 호출
      const apiEndpoint = examType === "written" 
        ? "/study/assist/written/weakness"
        : "/study/assist/practical/weakness";

      const response = await axios.get(apiEndpoint, {
        params: {
          count: count,
        },
      });

      // API 응답 데이터를 navigate state에 포함
      // 약점도가 높은 순서로 정렬한 후 상위 3개 태그 선택
      const topWeakTags = [...weaknessTags]
        .sort((a, b) => b.weaknessLevel - a.weaknessLevel)
        .slice(0, 3)
        .map(t => t.tag);

      navigate("/solo/play", {
        state: {
          weakTags: topWeakTags,
          questionCount: count,
          examType: examType,
          quizType: "weakness",
          apiResponse: response.data, // API 응답 전체 포함
          questions: response.data.payload?.items || [], // 문제 목록
        },
      });
    } catch (err: any) {
      console.error("퀴즈 시작 API 오류:", err);
      setError(
        err.response?.data?.message || 
        "퀴즈를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요."
      );
      setIsLoading(false);
    }
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
                {tagsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-red-600" />
                    <span className="ml-2 text-gray-600">약점 태그를 불러오는 중...</span>
                  </div>
                ) : weaknessTags.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    약점 태그 데이터가 없습니다.
                  </div>
                ) : (
                  weaknessTags.map((item) => (
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
                  ))
                )}
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
                {tagsLoading ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    로딩 중...
                  </div>
                ) : weaknessTags.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    집중 학습이 필요한 태그가 없습니다.
                  </div>
                ) : (
                  [...weaknessTags]
                    .sort((a, b) => b.weaknessLevel - a.weaknessLevel)
                    .slice(0, 3)
                    .map((item) => (
                      <div
                        key={item.tag}
                        className="flex items-center gap-2 p-2 bg-white/60 rounded"
                      >
                        <Heart className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-gray-800">#{item.tag}</span>
                      </div>
                    ))
                )}
              </div>
            </Card>

            {/* Summary */}

            {/* 에러 메시지 */}
            {error && (
              <Card className="p-4 bg-red-50 border-2 border-red-200">
                <p className="text-red-600 text-sm">{error}</p>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleStartQuiz}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    불러오는 중...
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
                disabled={isLoading}
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
