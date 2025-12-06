import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { motion } from "motion/react";
import { Trophy, Star, Home, RotateCcw, Sparkles, Loader2 } from "lucide-react";

interface MicroResultProps {
  topicName: string;
  miniCheckScore?: number; // API에서 받은 미니체크 정답 수
  problemScore?: number; // API에서 받은 문제풀이 정답 수
  totalProblems?: number; // 전체 문제 수 (미니체크 + MCQ)
  miniTotal?: number; // 미니체크 총 문제 수
  mcqTotal?: number; // MCQ 총 문제 수
  aiSummary?: string;
  loadingSummary?: boolean; // 요약 로딩 중 여부
  onBackToDashboard: () => void;
  onRetry: () => void;
}

export function MicroResult({ 
  topicName, 
  miniCheckScore, 
  problemScore, 
  totalProblems,
  miniTotal,
  mcqTotal,
  aiSummary,
  loadingSummary = false,
  onBackToDashboard,
  onRetry 
}: MicroResultProps) {
  // 로딩 중이거나 데이터가 없으면 로딩 상태로 처리
  const isLoading = loadingSummary || miniCheckScore === undefined || problemScore === undefined;
  
  // 전체 정답 수 = 미니체크 정답 + MCQ 정답 (API 데이터만 사용)
  const totalScore = !isLoading && miniCheckScore !== undefined && problemScore !== undefined
    ? miniCheckScore + problemScore
    : undefined;
  
  // 전체 문제 수 = 미니체크 문제 수 + MCQ 문제 수 (API 데이터만 사용)
  const actualTotalProblems = !isLoading && miniTotal !== undefined && mcqTotal !== undefined
    ? (totalProblems || (miniTotal + mcqTotal))
    : undefined;
  
  // 정답률 계산 (API 데이터만 사용)
  const percentage = !isLoading && totalScore !== undefined && actualTotalProblems !== undefined && actualTotalProblems > 0
    ? Math.round((totalScore / actualTotalProblems) * 100)
    : undefined;

  const getMessage = () => {
    if (percentage === undefined) return { emoji: "⏳", text: "결과 확인 중...", color: "from-gray-400 to-gray-500" };
    if (percentage >= 90) return { emoji: "🎉", text: "완벽해요!", color: "from-yellow-400 to-orange-400" };
    if (percentage >= 70) return { emoji: "😊", text: "잘했어요!", color: "from-green-400 to-emerald-400" };
    if (percentage >= 50) return { emoji: "💪", text: "좋아요!", color: "from-blue-400 to-cyan-400" };
    return { emoji: "📚", text: "다시 도전!", color: "from-purple-400 to-pink-400" };
  };

  const message = getMessage();

  return (
    <div className="p-8 flex items-center justify-center min-h-screen">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <Card className="p-12 bg-white/80 backdrop-blur border-2 border-purple-200 shadow-2xl text-center">
          {/* Trophy */}
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

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Badge className="bg-purple-500 text-white mb-4">{topicName}</Badge>
            <div className="text-6xl mb-4">{message.emoji}</div>
            <h1 className="text-purple-900 mb-2">{message.text}</h1>
            <p className="text-gray-600 mb-8">Micro 학습을 완료했습니다!</p>
          </motion.div>

          {/* Score Display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-gray-600">정답률</span>
                  </div>
                  {isLoading || percentage === undefined ? (
                    <div className="flex items-center justify-center gap-2 text-purple-600">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>계산 중...</span>
                    </div>
                  ) : (
                    <div className="text-purple-600">{percentage}%</div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-2xl">⭕</span>
                    <span className="text-gray-600">미니체크</span>
                  </div>
                  {isLoading || miniCheckScore === undefined || miniTotal === undefined ? (
                    <div className="flex items-center justify-center gap-2 text-purple-600">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>확인 중...</span>
                    </div>
                  ) : (
                    <div className="text-purple-600">{miniCheckScore} / {miniTotal}</div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    <span className="text-gray-600">문제풀이</span>
                  </div>
                  {isLoading || problemScore === undefined || mcqTotal === undefined ? (
                    <div className="flex items-center justify-center gap-2 text-purple-600">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>확인 중...</span>
                    </div>
                  ) : (
                    <div className="text-purple-600">{problemScore} / {mcqTotal}</div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* AI Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mb-8"
          >
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 text-left">
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-blue-900">AI 학습 요약</h3>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                      Beta
                    </Badge>
                  </div>
                  {loadingSummary ? (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>요약을 생성하는 중...</span>
                    </div>
                  ) : (
                    <p className="text-gray-700 whitespace-pre-line">
                      {aiSummary || "요약 정보가 없습니다."}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="grid grid-cols-2 gap-4"
          >
            <Button
              onClick={onRetry}
              variant="outline"
              className="py-6 border-2 border-purple-300 hover:bg-purple-50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              다시 학습하기
            </Button>
            <Button
              onClick={onBackToDashboard}
              className="py-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              <Home className="w-4 h-4 mr-2" />
              메인으로
            </Button>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
}
