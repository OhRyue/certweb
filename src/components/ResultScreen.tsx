import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { motion } from "motion/react";
import { Trophy, Star, Sparkles, Home } from "lucide-react";

interface ResultScreenProps {
  score: number;
  totalQuestions: number;
  onBackToDashboard: () => void;
  onRetry: () => void;
}

export function ResultScreen({ score, totalQuestions, onBackToDashboard, onRetry }: ResultScreenProps) {
  const percentage = Math.round((score / totalQuestions) * 100);
  
  const getMessage = () => {
    if (percentage >= 90) return { emoji: "🎉", text: "완벽해요!", color: "from-yellow-400 to-orange-400" };
    if (percentage >= 70) return { emoji: "😊", text: "잘했어요!", color: "from-green-400 to-emerald-400" };
    if (percentage >= 50) return { emoji: "💪", text: "좋아요!", color: "from-blue-400 to-cyan-400" };
    return { emoji: "📚", text: "다시 도전!", color: "from-purple-400 to-pink-400" };
  };

  const message = getMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <Card className="p-12 bg-white/80 backdrop-blur border-2 border-purple-200 shadow-2xl text-center">
          {/* Trophy Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-6"
          >
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br ${message.color} mb-4`}>
              <Trophy className="w-12 h-12 text-white" />
            </div>
          </motion.div>

          {/* Result Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-6xl mb-4">{message.emoji}</div>
            <h1 className="text-purple-900 mb-2">{message.text}</h1>
            <p className="text-gray-600 mb-8">퀴즈를 완료했습니다!</p>
          </motion.div>

          {/* Score Display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
              <div className="flex items-center justify-center gap-8">
                <div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-gray-600">정답률</span>
                  </div>
                  <div className="text-purple-600">{percentage}%</div>
                </div>
                <div className="h-12 w-px bg-purple-200" />
                <div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    <span className="text-gray-600">맞춘 문제</span>
                  </div>
                  <div className="text-purple-600">{score} / {totalQuestions}</div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-2 gap-4"
          >
            <Button
              onClick={onRetry}
              variant="outline"
              className="py-6 border-2 border-purple-300 hover:bg-purple-50"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              다시 풀기
            </Button>
            <Button
              onClick={onBackToDashboard}
              className="py-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              <Home className="w-4 h-4 mr-2" />
              대시보드
            </Button>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
}
