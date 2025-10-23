import { motion } from "motion/react";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Calendar,
  Flame,
  Star,
  Award,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { examSchedules, mockRankingData, categoryProgress } from "../data/mockData";
import { UserProfile } from "../types";

interface HomeDashboardProps {
  userProfile: UserProfile;
  onNavigate: (view: string) => void;
}

export function HomeDashboard({ userProfile, onNavigate }: HomeDashboardProps) {
  // Get the target certification exam
  const targetExam = examSchedules.find(
    exam => exam.category === userProfile.targetCertification
  );
  
  const dDay = targetExam 
    ? Math.ceil((targetExam.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Get progress for the target certification only
  const targetProgress = categoryProgress.find(
    cat => cat.category === userProfile.targetCertification
  );

  const currentUserRank = mockRankingData.find(r => r.isCurrentUser);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-blue-900 mb-2 flex items-center justify-center gap-2">
            ✨ 환영합니다, {userProfile.name}님! ✨
          </h1>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-4 py-1">
              {targetExam?.icon} {userProfile.targetCertification} 도전 중!
            </Badge>
          </div>
          <p className="text-purple-600 mt-2">오늘도 즐겁게 공부해볼까요? 📚</p>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Character & D-Day */}
          <div className="space-y-6">
            {/* Character Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-purple-100 to-pink-100 border-0 shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center gap-2 mb-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="text-purple-700">Level {userProfile.level}</span>
                      <Star className="w-5 h-5 text-yellow-500" />
                    </div>
                  </div>
                  
                  {/* Character Display */}
                  <motion.div 
                    className="relative"
                    animate={{ 
                      y: [0, -10, 0],
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <div className="text-center bg-white/50 backdrop-blur rounded-2xl p-8 mb-4">
                      <div className="text-9xl mb-4">{userProfile.avatar}</div>
                      <h3 className="text-purple-800 mb-1">{userProfile.name}</h3>
                      <p className="text-purple-600 text-sm">{userProfile.targetCertification} 도전 중!</p>
                    </div>
                  </motion.div>

                  {/* XP Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-purple-700">경험치</span>
                      <span className="text-purple-700">{userProfile.xp} / {(userProfile.level + 1) * 500} XP</span>
                    </div>
                    <Progress 
                      value={(userProfile.xp / ((userProfile.level + 1) * 500)) * 100} 
                      className="h-3 bg-purple-200"
                    />
                  </div>

                  {/* Streak */}
                  <div className="mt-4 flex items-center justify-center gap-2 bg-orange-100 rounded-lg p-3">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="text-orange-700">{userProfile.studyStreak}일 연속 학습 🔥</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* D-Day Card */}
            {targetExam && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-gradient-to-br from-blue-100 to-cyan-100 border-0 shadow-lg">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <h3 className="text-blue-800">목표 시험 📅</h3>
                    </div>
                    
                    <div className="bg-white/50 backdrop-blur rounded-xl p-4 mb-3">
                      <div className="text-center">
                        <div className="text-4xl mb-2">{targetExam.icon}</div>
                        <p className="text-blue-900 mb-2">{targetExam.name}</p>
                        <p className="text-blue-600 text-sm">
                          {targetExam.date.toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>

                    <div className="text-center">
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <div className="text-5xl text-blue-600 mb-1">D-{Math.abs(dDay)}</div>
                      </motion.div>
                      <p className="text-blue-700 text-sm">
                        {dDay && dDay <= 30 ? "열심히 준비해요! 💪" : "시간이 충분해요! 😊"}
                      </p>
                    </div>

                    <Button 
                      onClick={() => onNavigate("certinfo")}
                      className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      시험 정보 보기
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Middle Column - Progress & Quick Actions */}
          <div className="space-y-6">
            {/* Overall Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-purple-600" />
                    <h3 className="text-purple-800">학습 진행률 📈</h3>
                  </div>

                  {targetProgress && (
                    <div className="space-y-4">
                      {/* Overall Progress Bar */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-3xl">{targetProgress.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-purple-800">{targetProgress.category}</span>
                              <span className="text-purple-600">{targetProgress.progress}%</span>
                            </div>
                            <Progress 
                              value={targetProgress.progress} 
                              className="h-3"
                              style={{
                                background: `${targetProgress.color}20`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-purple-600 ml-14">
                          <span>전체 토픽: {targetProgress.topics}개</span>
                          <span>완료: {targetProgress.completed}개</span>
                          <span>남은: {targetProgress.topics - targetProgress.completed}개</span>
                        </div>
                      </motion.div>

                      {/* Achievement Badges */}
                      <div className="grid grid-cols-2 gap-3">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 }}
                          className="bg-gradient-to-br from-yellow-100 to-amber-100 rounded-lg p-3 text-center"
                        >
                          <div className="text-2xl mb-1">🎯</div>
                          <div className="text-amber-800 text-xs">달성률</div>
                          <div className="text-amber-700">{targetProgress.progress}%</div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 }}
                          className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg p-3 text-center"
                        >
                          <div className="text-2xl mb-1">✅</div>
                          <div className="text-green-800 text-xs">완료 토픽</div>
                          <div className="text-green-700">{targetProgress.completed}개</div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.7 }}
                          className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg p-3 text-center"
                        >
                          <div className="text-2xl mb-1">📚</div>
                          <div className="text-blue-800 text-xs">총 토픽</div>
                          <div className="text-blue-700">{targetProgress.topics}개</div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.8 }}
                          className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg p-3 text-center"
                        >
                          <div className="text-2xl mb-1">⏳</div>
                          <div className="text-purple-800 text-xs">남은 토픽</div>
                          <div className="text-purple-700">{targetProgress.topics - targetProgress.completed}개</div>
                        </motion.div>
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={() => onNavigate("report")}
                    className="w-full mt-4 bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    상세 리포트 보기
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-gradient-to-br from-yellow-100 to-orange-100 border-0 shadow-lg">
                <div className="p-6">
                  <h3 className="text-orange-800 mb-4">빠른 시작 🚀</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={() => onNavigate("main")}
                      className="bg-white hover:bg-purple-50 text-purple-700 border-2 border-purple-200 h-auto py-4 flex flex-col items-center gap-2"
                      variant="outline"
                    >
                      <div className="text-2xl">📖</div>
                      <span className="text-sm">메인학습</span>
                    </Button>
                    
                    <Button 
                      onClick={() => onNavigate("solo")}
                      className="bg-white hover:bg-pink-50 text-pink-700 border-2 border-pink-200 h-auto py-4 flex flex-col items-center gap-2"
                      variant="outline"
                    >
                      <div className="text-2xl">💪</div>
                      <span className="text-sm">보조학습</span>
                    </Button>
                    
                    <Button 
                      onClick={() => onNavigate("battle")}
                      className="bg-white hover:bg-red-50 text-red-700 border-2 border-red-200 h-auto py-4 flex flex-col items-center gap-2"
                      variant="outline"
                    >
                      <div className="text-2xl">⚔️</div>
                      <span className="text-sm">대전</span>
                    </Button>
                    
                    <Button 
                      onClick={() => onNavigate("community")}
                      className="bg-white hover:bg-blue-50 text-blue-700 border-2 border-blue-200 h-auto py-4 flex flex-col items-center gap-2"
                      variant="outline"
                    >
                      <div className="text-2xl">🏆</div>
                      <span className="text-sm">커뮤니티</span>
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Ranking */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-gradient-to-br from-amber-100 to-yellow-100 border-0 shadow-lg">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-5 h-5 text-amber-600" />
                    <h3 className="text-amber-800">실시간 랭킹 🏅</h3>
                  </div>

                  <div className="space-y-3">
                    {mockRankingData.slice(0, 5).map((user, idx) => (
                      <motion.div
                        key={user.rank}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + idx * 0.1 }}
                        className={`rounded-lg p-3 ${
                          user.isCurrentUser 
                            ? "bg-gradient-to-r from-purple-200 to-pink-200 border-2 border-purple-400" 
                            : "bg-white/50 backdrop-blur"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 min-w-[60px]">
                            {user.rank === 1 && <span className="text-xl">🥇</span>}
                            {user.rank === 2 && <span className="text-xl">🥈</span>}
                            {user.rank === 3 && <span className="text-xl">🥉</span>}
                            {user.rank > 3 && (
                              <span className="text-purple-600 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-sm">
                                {user.rank}
                              </span>
                            )}
                          </div>
                          
                          <div className="text-2xl">{user.avatar}</div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-purple-900 text-sm truncate">
                                {user.name}
                              </span>
                              {user.isCurrentUser && (
                                <Badge className="bg-purple-500 text-white text-xs">나</Badge>
                              )}
                            </div>
                            <p className="text-purple-600 text-xs">Lv.{user.level} · {user.score.toLocaleString()}점</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <Button 
                    onClick={() => onNavigate("community")}
                    className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    전체 랭킹 보기
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Today's Achievements */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="bg-gradient-to-br from-green-100 to-emerald-100 border-0 shadow-lg">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-green-600" />
                    <h3 className="text-green-800">오늘의 성과 ✨</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white/50 backdrop-blur rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-xl">📝</div>
                        <span className="text-green-800 text-sm">문제 풀이</span>
                      </div>
                      <span className="text-green-600">15문제</span>
                    </div>

                    <div className="bg-white/50 backdrop-blur rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-xl">⏱️</div>
                        <span className="text-green-800 text-sm">학습 시간</span>
                      </div>
                      <span className="text-green-600">45분</span>
                    </div>

                    <div className="bg-white/50 backdrop-blur rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-xl">✅</div>
                        <span className="text-green-800 text-sm">정답률</span>
                      </div>
                      <span className="text-green-600">87%</span>
                    </div>

                    <div className="bg-white/50 backdrop-blur rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-xl">⭐</div>
                        <span className="text-green-800 text-sm">획득 XP</span>
                      </div>
                      <span className="text-green-600">+250 XP</span>
                    </div>
                  </div>

                  <div className="mt-4 text-center text-green-700 text-sm">
                    <TrendingUp className="w-4 h-4 inline-block mr-1" />
                    어제보다 20% 향상되었어요! 🎉
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
