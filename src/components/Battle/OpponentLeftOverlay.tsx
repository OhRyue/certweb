import { motion, AnimatePresence } from "motion/react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { UserX, Trophy, AlertTriangle } from "lucide-react";

interface OpponentLeftOverlayProps {
  opponentName: string;
  myScore: number;
  opponentScore: number;
  onConfirm: () => void;
}

export function OpponentLeftOverlay({ 
  opponentName, 
  myScore, 
  opponentScore,
  onConfirm 
}: OpponentLeftOverlayProps) {
  const iWon = myScore >= opponentScore;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl p-8">
        {/* 메인 카드 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          <Card className="p-8 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 border-4 border-white shadow-2xl">
            {/* 경고 아이콘 */}
            <div className="text-center mb-6">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, -10, 10, 0]
                }}
                transition={{ duration: 1, repeat: Infinity }}
                className="inline-block"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-orange-400 rounded-full blur-xl opacity-50"></div>
                  <div className="relative bg-white rounded-full p-6 border-4 border-orange-400">
                    <UserX className="w-16 h-16 text-orange-600" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* 메시지 */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-gray-900 mb-4">상대가 나갔습니다</h2>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Badge className="bg-red-500 text-white px-4 py-2 text-lg">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    배틀 중단
                  </Badge>
                </div>
                <p className="text-gray-700 text-lg mb-2">
                  <span className="font-medium text-blue-700">{opponentName}</span>님이
                </p>
                <p className="text-gray-700 text-lg">
                  배틀에서 퇴장했습니다
                </p>
              </motion.div>
            </div>

            {/* 점수 표시 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-8"
            >
              <Card className="p-6 bg-white/80 backdrop-blur border-2 border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className={`text-center p-4 rounded-xl ${
                    iWon 
                      ? "bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-green-400" 
                      : "bg-gray-50"
                  }`}>
                    <p className="text-sm text-gray-600 mb-1">나</p>
                    <p className="text-3xl text-purple-700 mb-1">{myScore}점</p>
                    {iWon && (
                      <Badge className="bg-green-500 text-white">
                        <Trophy className="w-3 h-3 mr-1" />
                        승리
                      </Badge>
                    )}
                  </div>
                  <div className={`text-center p-4 rounded-xl ${
                    !iWon 
                      ? "bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-400" 
                      : "bg-gray-50"
                  }`}>
                    <p className="text-sm text-gray-600 mb-1">{opponentName}</p>
                    <p className="text-3xl text-blue-700 mb-1">{opponentScore}점</p>
                    {!iWon && (
                      <Badge className="bg-blue-500 text-white">
                        <Trophy className="w-3 h-3 mr-1" />
                        리드 중
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* 결과 메시지 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center mb-6"
            >
              <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full ${
                iWon 
                  ? "bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-400" 
                  : "bg-gradient-to-r from-blue-100 to-cyan-100 border-2 border-blue-400"
              }`}>
                <span className="text-2xl">{iWon ? "🎉" : "💪"}</span>
                <span className="text-lg">
                  {iWon 
                    ? "부전승으로 승리했습니다!" 
                    : "아쉽지만 다음 기회에!"}
                </span>
              </div>
            </motion.div>

            {/* 확인 버튼 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Button
                onClick={onConfirm}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg py-6 shadow-xl"
              >
                확인
              </Button>
            </motion.div>
          </Card>
        </motion.div>

        {/* 빛나는 테두리 효과 */}
        <motion.div
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 rounded-3xl blur-2xl -z-10"
        />
      </div>
    </div>
  );
}
