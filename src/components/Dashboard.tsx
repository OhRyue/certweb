import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { BookOpen, Gamepad2, Trophy, Star, Sparkles } from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  progress: number;
  totalQuestions: number;
  completedQuestions: number;
}

interface DashboardProps {
  onStartQuiz: (categoryId: string) => void;
  onStartGame: (categoryId: string) => void;
  categories: Category[];
}

export function Dashboard({ onStartQuiz, onStartGame, categories }: DashboardProps) {
  const totalProgress = Math.round(
    categories.reduce((acc, cat) => acc + cat.progress, 0) / categories.length
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-purple-500" />
            <h1 className="text-purple-600">자격증 마스터</h1>
            <Sparkles className="w-8 h-8 text-purple-500" />
          </div>
          <p className="text-gray-600">재미있게 공부하고 자격증을 따보세요! 🎯</p>
        </div>

        {/* Overall Progress */}
        <Card className="p-6 mb-8 bg-white/80 backdrop-blur border-2 border-purple-200 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2>전체 진행도</h2>
                <p className="text-gray-600">계속 화이팅! 💪</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="text-purple-600">{totalProgress}%</span>
              </div>
            </div>
          </div>
          <Progress value={totalProgress} className="h-3" />
        </Card>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="p-6 bg-white/80 backdrop-blur border-2 hover:border-purple-300 transition-all hover:shadow-xl hover:scale-105"
              style={{ borderColor: category.color + "40" }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="p-3 rounded-full text-2xl"
                    style={{ backgroundColor: category.color + "20" }}
                  >
                    {category.icon}
                  </div>
                  <div>
                    <h3>{category.name}</h3>
                    <p className="text-gray-600">
                      {category.completedQuestions} / {category.totalQuestions} 문제
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="text-white"
                  style={{ backgroundColor: category.color }}
                >
                  {category.progress}%
                </Badge>
              </div>

              <Progress value={category.progress} className="mb-4 h-2" />

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => onStartQuiz(category.id)}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  퀴즈 풀기
                </Button>
                <Button
                  onClick={() => onStartGame(category.id)}
                  variant="outline"
                  className="border-2 hover:bg-blue-50"
                  style={{ borderColor: category.color }}
                >
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  게임하기
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
