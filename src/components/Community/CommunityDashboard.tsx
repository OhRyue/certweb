import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Progress } from "../ui/progress";
import { Trophy, Users, Award, Star, Crown, Medal, Target } from "lucide-react";

interface CommunityDashboardProps {
  onViewRanking: (type: string) => void;
}

export function CommunityDashboard({ onViewRanking }: CommunityDashboardProps) {
  const topRankers = [
    { rank: 1, name: "코딩왕", level: 25, xp: 12500, avatar: "👑", streak: 45 },
    { rank: 2, name: "알고마스터", level: 23, xp: 11800, avatar: "🏆", streak: 38 },
    { rank: 3, name: "DB전문가", level: 22, xp: 11200, avatar: "⭐", streak: 42 },
    { rank: 4, name: "네트워크킹", level: 21, xp: 10900, avatar: "💻", streak: 35 },
    { rank: 5, name: "OOP마스터", level: 20, xp: 10500, avatar: "🎯", streak: 30 },
  ];

  const myFriends = [
    { id: "f1", name: "스터디메이트", rank: 45, level: 15, streak: 12, status: "online" },
    { id: "f2", name: "같이공부해요", rank: 89, level: 12, streak: 8, status: "offline" },
    { id: "f3", name: "합격가자", rank: 156, level: 10, streak: 15, status: "online" },
  ];

  const myBadges = [
    { id: "b1", name: "7일 연속 학습", icon: "🔥", rarity: "common", unlocked: true },
    { id: "b2", name: "첫 만점", icon: "💯", rarity: "common", unlocked: true },
    { id: "b3", name: "배틀 첫 승", icon: "⚔️", rarity: "common", unlocked: true },
    { id: "b4", name: "100문제 달성", icon: "📚", rarity: "rare", unlocked: true },
    { id: "b5", name: "골든벨 우승", icon: "🏆", rarity: "epic", unlocked: false },
    { id: "b6", name: "토너먼트 챔피언", icon: "👑", rarity: "legendary", unlocked: false },
  ];

  const topicProgress = [
    { topic: "데이터베이스", cleared: 8, total: 10, percentage: 80, badge: "🗄️" },
    { topic: "네트워크", cleared: 6, total: 10, percentage: 60, badge: "🌐" },
    { topic: "객체지향", cleared: 7, total: 10, percentage: 70, badge: "💻" },
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-100 text-gray-700 border-gray-300";
      case "rare":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "epic":
        return "bg-purple-100 text-purple-700 border-purple-300";
      case "legendary":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-purple-600" />
            <h1 className="text-purple-900">커뮤니티 & 랭킹</h1>
          </div>
          <p className="text-gray-600">다른 사용자들과 경쟁하고 성취를 공유하세요!</p>
        </div>

        <Tabs defaultValue="ranking" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ranking">
              <Trophy className="w-4 h-4 mr-2" />
              랭킹
            </TabsTrigger>
            <TabsTrigger value="badges">
              <Award className="w-4 h-4 mr-2" />
              뱃지
            </TabsTrigger>
            <TabsTrigger value="topics">
              <Target className="w-4 h-4 mr-2" />
              토픽 클리어
            </TabsTrigger>
          </TabsList>

          {/* Ranking Tab */}
          <TabsContent value="ranking">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Rankers */}
              <div className="lg:col-span-2">
                <Card className="p-6 border-2 border-purple-200">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-purple-900">전체 랭킹 Top 5</h2>
                    <Button
                      onClick={() => onViewRanking("global")}
                      variant="outline"
                      size="sm"
                    >
                      전체 보기
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {topRankers.map((ranker) => (
                      <div
                        key={ranker.rank}
                        className={`p-4 rounded-lg ${
                          ranker.rank === 1
                            ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300"
                            : ranker.rank === 2
                            ? "bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-300"
                            : ranker.rank === 3
                            ? "bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300"
                            : "bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-12 h-12">
                              {ranker.rank === 1 ? (
                                <Crown className="w-8 h-8 text-yellow-600" />
                              ) : ranker.rank === 2 ? (
                                <Medal className="w-8 h-8 text-gray-600" />
                              ) : ranker.rank === 3 ? (
                                <Medal className="w-8 h-8 text-orange-600" />
                              ) : (
                                <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center">
                                  {ranker.rank}
                                </div>
                              )}
                            </div>
                            <div className="text-3xl">{ranker.avatar}</div>
                            <div>
                              <h3 className="text-gray-900">{ranker.name}</h3>
                              <p className="text-sm text-gray-600">Level {ranker.level}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-purple-600">{ranker.xp.toLocaleString()} XP</p>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <span>🔥</span>
                              <span>{ranker.streak}일 연속</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* My Ranking & Friends */}
              <div className="space-y-6">
                {/* My Ranking */}
                <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                  <h3 className="text-purple-900 mb-4">내 랭킹</h3>
                  <div className="text-center mb-4">
                    <div className="text-5xl mb-2">👨‍💻</div>
                    <p className="text-3xl text-purple-600 mb-1">#127</p>
                    <p className="text-sm text-gray-600">공부왕</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">레벨</span>
                      <span className="text-purple-600">5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">XP</span>
                      <span className="text-purple-600">1,250</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">연속 학습</span>
                      <span className="text-orange-600">🔥 7일</span>
                    </div>
                  </div>
                </Card>

                {/* Friend Ranking */}
                <Card className="p-6 border-2 border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-purple-900">친구 랭킹</h3>
                    <Button
                      onClick={() => onViewRanking("friends")}
                      variant="outline"
                      size="sm"
                    >
                      전체 보기
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {myFriends.map((friend) => (
                      <div key={friend.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white">
                              {friend.name[0]}
                            </div>
                            {friend.status === "online" && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-gray-900">{friend.name}</p>
                            <p className="text-xs text-gray-600">Lv.{friend.level} · #{friend.rank}</p>
                          </div>
                        </div>
                        <div className="text-right text-xs text-gray-600">
                          🔥 {friend.streak}일
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges">
            <Card className="p-6 border-2 border-purple-200">
              <h2 className="text-purple-900 mb-6">뱃지 컬렉션</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {myBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-lg border-2 text-center transition-all ${
                      badge.unlocked
                        ? `${getRarityColor(badge.rarity)} hover:shadow-lg cursor-pointer`
                        : "bg-gray-100 border-gray-200 opacity-50"
                    }`}
                  >
                    <div className={`text-4xl mb-2 ${!badge.unlocked && "filter grayscale"}`}>
                      {badge.icon}
                    </div>
                    <p className="text-sm mb-1">{badge.name}</p>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getRarityColor(badge.rarity)}`}
                    >
                      {badge.rarity}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-purple-900 mb-1">뱃지 수집률</h3>
                    <p className="text-sm text-gray-600">
                      {myBadges.filter(b => b.unlocked).length} / {myBadges.length} 획득
                    </p>
                  </div>
                  <div className="text-3xl">
                    {Math.round((myBadges.filter(b => b.unlocked).length / myBadges.length) * 100)}%
                  </div>
                </div>
                <Progress
                  value={(myBadges.filter(b => b.unlocked).length / myBadges.length) * 100}
                  className="h-2 mt-3"
                />
              </div>
            </Card>
          </TabsContent>

          {/* Topics Tab */}
          <TabsContent value="topics">
            <Card className="p-6 border-2 border-purple-200">
              <h2 className="text-purple-900 mb-6">토픽별 클리어 현황</h2>
              <div className="space-y-6">
                {topicProgress.map((topic) => (
                  <div key={topic.topic}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{topic.badge}</div>
                        <div>
                          <h3 className="text-gray-900">{topic.topic}</h3>
                          <p className="text-sm text-gray-600">
                            {topic.cleared} / {topic.total} 세부 항목 클리어
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={
                          topic.percentage === 100
                            ? "bg-green-100 text-green-700"
                            : topic.percentage >= 70
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                        }
                      >
                        {topic.percentage}%
                      </Badge>
                    </div>
                    <Progress value={topic.percentage} className="h-3" />
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200">
                <div className="flex items-start gap-3">
                  <Star className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-blue-900 mb-2">클리어 보상</h3>
                    <p className="text-sm text-gray-700 mb-2">
                      토픽을 100% 클리어하면 특별 뱃지와 보너스 XP를 획득할 수 있습니다!
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                        +500 XP
                      </Badge>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                        마스터 뱃지
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
