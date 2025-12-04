import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { motion } from "motion/react";
import { Trophy, Medal, Award, Home, RotateCcw, Users } from "lucide-react";
import type { Scoreboard, ScoreboardItem } from "../../api/versusApi";

interface GoldenBellResultProps {
  scoreboard: Scoreboard;
  myUserId: string;
  onBackToDashboard: () => void;
  onRetry: () => void;
}

export function GoldenBellResult({ scoreboard, myUserId, onBackToDashboard, onRetry }: GoldenBellResultProps) {
  const myItem = scoreboard.items.find(item => item.userId === myUserId);
  const myRank = scoreboard.items.findIndex(item => item.userId === myUserId) + 1;
  const isWinner = myRank === 1;
  
  const myScore = myItem?.score || 0;
  const myCorrectCount = myItem?.correctCount || 0;
  const myTotalCount = myItem?.totalCount || 0;
  const accuracy = myTotalCount > 0 ? Math.round((myCorrectCount / myTotalCount) * 100) : 0;

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-br from-yellow-400 to-orange-400";
    if (rank === 2) return "bg-gradient-to-br from-gray-300 to-gray-400";
    if (rank === 3) return "bg-gradient-to-br from-orange-300 to-amber-400";
    return "bg-gradient-to-br from-purple-400 to-pink-400";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `${rank}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="text-6xl mb-4">🔔</div>
          <h1 className="text-4xl font-bold text-purple-900 mb-2">골든벨 게임 종료</h1>
          <p className="text-gray-600">게임 결과를 확인하세요</p>
        </motion.div>

        {/* My Result Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <Card className={`p-8 border-2 ${
            isWinner 
              ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-xl" 
              : "bg-white border-purple-200"
          }`}>
            <div className="text-center">
              {/* Rank Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                className="mb-6"
              >
                <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getRankBadgeColor(myRank)} mb-4 shadow-lg`}>
                  <span className="text-5xl">{getRankIcon(myRank)}</span>
                </div>
                <h2 className={`text-3xl font-bold mb-2 ${
                  isWinner ? "text-yellow-700" : "text-purple-900"
                }`}>
                  {isWinner ? "우승!" : `${myRank}위`}
                </h2>
              </motion.div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white/80 rounded-lg p-4 border-2 border-purple-100">
                  <div className="text-2xl font-bold text-purple-600 mb-1">{myScore}</div>
                  <div className="text-sm text-gray-600">점수</div>
                </div>
                <div className="bg-white/80 rounded-lg p-4 border-2 border-purple-100">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{myCorrectCount}/{myTotalCount}</div>
                  <div className="text-sm text-gray-600">정답 수</div>
                </div>
                <div className="bg-white/80 rounded-lg p-4 border-2 border-purple-100">
                  <div className="text-2xl font-bold text-green-600 mb-1">{accuracy}%</div>
                  <div className="text-sm text-gray-600">정답률</div>
                </div>
              </div>

              {/* Winner Message */}
              {isWinner && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg p-4 mb-4"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="w-6 h-6" />
                    <span className="text-lg font-bold">골든벨을 울리셨습니다!</span>
                  </div>
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Ranking List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-8"
        >
          <Card className="p-6 border-2 border-purple-200 bg-white">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-purple-900">전체 순위</h2>
            </div>
            
            <div className="space-y-3">
              {scoreboard.items.map((item: ScoreboardItem, index: number) => {
                const rank = index + 1;
                const isMe = item.userId === myUserId;
                const itemAccuracy = item.totalCount > 0 
                  ? Math.round((item.correctCount / item.totalCount) * 100) 
                  : 0;

                return (
                  <motion.div
                    key={item.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isMe
                        ? "bg-purple-50 border-purple-400 shadow-md"
                        : rank <= 3
                        ? "bg-gray-50 border-gray-200"
                        : "bg-white border-gray-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Rank */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                          rank === 1 ? "bg-gradient-to-br from-yellow-400 to-orange-400 text-white"
                          : rank === 2 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white"
                          : rank === 3 ? "bg-gradient-to-br from-orange-300 to-amber-400 text-white"
                          : "bg-purple-100 text-purple-700"
                        }`}>
                          {rank}
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-semibold ${
                              isMe ? "text-purple-700" : "text-gray-800"
                            }`}>
                              {isMe ? "나" : `참가자 ${rank}`}
                            </span>
                            {isMe && (
                              <Badge className="bg-purple-500 text-white text-xs">나</Badge>
                            )}
                            {rank === 1 && (
                              <Badge className="bg-yellow-500 text-white text-xs">
                                <Trophy className="w-3 h-3 mr-1" />
                                우승
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>점수: <span className="font-semibold text-purple-600">{item.score}</span></span>
                            <span>정답: <span className="font-semibold text-blue-600">{item.correctCount}/{item.totalCount}</span></span>
                            <span>정답률: <span className="font-semibold text-green-600">{itemAccuracy}%</span></span>
                          </div>
                        </div>
                      </div>

                      {/* Medal Icon for Top 3 */}
                      {rank <= 3 && (
                        <div className="flex-shrink-0 ml-4">
                          {rank === 1 && <Medal className="w-8 h-8 text-yellow-500" />}
                          {rank === 2 && <Medal className="w-8 h-8 text-gray-400" />}
                          {rank === 3 && <Award className="w-8 h-8 text-orange-500" />}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex gap-4 justify-center"
        >
          <Button
            onClick={onRetry}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-6 text-lg"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            다시 도전
          </Button>
          <Button
            onClick={onBackToDashboard}
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50 px-8 py-6 text-lg"
          >
            <Home className="w-5 h-5 mr-2" />
            대시보드로
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

