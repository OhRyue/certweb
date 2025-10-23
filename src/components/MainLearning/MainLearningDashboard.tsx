import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { BookOpen, CheckCircle2, ListChecks, Sparkles } from "lucide-react";
import { Topic } from "../../types";

interface MainLearningDashboardProps {
  topics: Topic[];
  onStartMicro: (topicId: string) => void;
  onStartReview: (topicId: string) => void;
}

export function MainLearningDashboard({ topics, onStartMicro, onStartReview }: MainLearningDashboardProps) {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-purple-600" />
            <h1 className="text-purple-900">메인 학습</h1>
          </div>
          <p className="text-gray-600">체계적으로 개념을 학습하고 문제를 풀어보세요!</p>
        </div>

        {/* Learning Modes Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-purple-900 mb-2">Micro 학습</h3>
                <p className="text-gray-700 text-sm mb-3">
                  개념 학습 → O/X 미니체크 → 문제풀이
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-white/60">개념 보기</Badge>
                  <Badge variant="secondary" className="bg-white/60">O/X 4문항</Badge>
                  <Badge variant="secondary" className="bg-white/60">문제 5문항</Badge>
                  <Badge variant="secondary" className="bg-white/60">AI 해설</Badge>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500 rounded-lg">
                <ListChecks className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-blue-900 mb-2">Review 총정리</h3>
                <p className="text-gray-700 text-sm mb-3">
                  종합 문제 풀이와 AI 요약
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-white/60">문제 20문항</Badge>
                  <Badge variant="secondary" className="bg-white/60">문항별 해설</Badge>
                  <Badge variant="secondary" className="bg-white/60">AI 총정리</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Topics List */}
        <div className="space-y-4">
          <h2 className="text-purple-900 mb-4">학습 주제</h2>
          {topics.map((topic) => (
            <Card
              key={topic.id}
              className="p-6 hover:shadow-lg transition-all border-2 hover:border-purple-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div 
                    className="p-4 rounded-lg text-3xl"
                    style={{ backgroundColor: topic.color + "20" }}
                  >
                    {topic.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3>{topic.name}</h3>
                      <Badge 
                        variant="secondary"
                        style={{ backgroundColor: topic.color + "20", color: topic.color }}
                      >
                        {topic.category}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {topic.tags.map((tag) => (
                        <span 
                          key={tag}
                          className="text-sm text-gray-600 px-2 py-1 bg-gray-100 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="text-sm text-gray-600">
                      진행률: 65% (예시)
                    </div>
                    <Progress value={65} className="h-2 mt-2" />
                  </div>
                </div>

                <div className="flex gap-3 ml-4">
                  <Button
                    onClick={() => onStartMicro(topic.id)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Micro 시작
                  </Button>
                  <Button
                    onClick={() => onStartReview(topic.id)}
                    variant="outline"
                    className="border-2"
                    style={{ borderColor: topic.color }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Review
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
