import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Swords, Search, Users, Play } from "lucide-react";

interface OneVsOneBattleProps {
  onStart: (opponentId: string, category: string, difficulty: string) => void;
  onBack: () => void;
}

export function OneVsOneBattle({ onStart, onBack }: OneVsOneBattleProps) {
  const [category, setCategory] = useState("db");
  const [difficulty, setDifficulty] = useState("medium");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOpponent, setSelectedOpponent] = useState("");

  const onlineUsers = [
    { id: "u1", name: "코딩마스터", level: 12, winRate: 75, status: "online" },
    { id: "u2", name: "알고킹", level: 10, winRate: 68, status: "online" },
    { id: "u3", name: "DB전문가", level: 15, winRate: 82, status: "online" },
    { id: "u4", name: "네트워크천재", level: 8, winRate: 71, status: "online" },
    { id: "u5", name: "OOP마스터", level: 11, winRate: 77, status: "online" },
  ];

  const categories = [
    { id: "db", name: "데이터베이스", icon: "🗄️" },
    { id: "network", name: "네트워크", icon: "🌐" },
    { id: "oop", name: "객체지향", icon: "💻" },
    { id: "all", name: "전체", icon: "📚" },
  ];

  const filteredUsers = onlineUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStart = () => {
    if (selectedOpponent) {
      onStart(selectedOpponent, category, difficulty);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Swords className="w-8 h-8 text-purple-600" />
            <h1 className="text-purple-900">1:1 배틀</h1>
          </div>
          <p className="text-gray-600">상대를 선택하고 배틀을 시작하세요!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Opponent Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search */}
            <Card className="p-4 border-2 border-purple-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="상대 검색..."
                  className="pl-10"
                />
              </div>
            </Card>

            {/* Online Users */}
            <Card className="p-6 border-2 border-purple-200">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-purple-600" />
                <h2 className="text-purple-900">온라인 사용자</h2>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {filteredUsers.length}명
                </Badge>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedOpponent(user.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedOpponent === user.id
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white">
                          {user.name[0]}
                        </div>
                        <div>
                          <h3 className="text-gray-900">{user.name}</h3>
                          <p className="text-sm text-gray-600">Level {user.level}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                          승률 {user.winRate}%
                        </Badge>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-gray-600">온라인</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Random Match */}
            <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-yellow-900 mb-1">랜덤 매칭</h3>
                  <p className="text-sm text-gray-700">비슷한 실력의 상대와 자동 매칭</p>
                </div>
                <Button
                  variant="outline"
                  className="border-2 border-yellow-500"
                  onClick={() => {
                    const randomUser = onlineUsers[Math.floor(Math.random() * onlineUsers.length)];
                    setSelectedOpponent(randomUser.id);
                  }}
                >
                  랜덤 매칭
                </Button>
              </div>
            </Card>
          </div>

          {/* Battle Settings */}
          <div className="space-y-6">
            {/* Category */}
            <Card className="p-6 border-2 border-purple-200">
              <h3 className="text-purple-900 mb-4">카테고리</h3>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      category === cat.id
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-purple-300"
                    }`}
                  >
                    <div className="text-2xl mb-1">{cat.icon}</div>
                    <p className="text-xs text-gray-700">{cat.name}</p>
                  </button>
                ))}
              </div>
            </Card>

            {/* Difficulty */}
            <Card className="p-6 border-2 border-purple-200">
              <h3 className="text-purple-900 mb-4">난이도</h3>
              <RadioGroup value={difficulty} onValueChange={setDifficulty}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="easy" id="easy" />
                    <Label htmlFor="easy" className="cursor-pointer flex items-center gap-2">
                      <span className="text-green-600">●</span>
                      쉬움
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium" className="cursor-pointer flex items-center gap-2">
                      <span className="text-yellow-600">●</span>
                      보통
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hard" id="hard" />
                    <Label htmlFor="hard" className="cursor-pointer flex items-center gap-2">
                      <span className="text-red-600">●</span>
                      어려움
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </Card>

            {/* Battle Rules */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
              <h3 className="text-purple-900 mb-4">배틀 규칙</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• 총 10문제</li>
                <li>• 제한 시간 5분</li>
                <li>• 먼저 푸는 사람 가산점</li>
                <li>• 정답 시 10점 획득</li>
              </ul>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleStart}
                disabled={!selectedOpponent}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white disabled:opacity-50"
              >
                <Play className="w-4 h-4 mr-2" />
                배틀 시작
              </Button>
              <Button
                onClick={onBack}
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
  );
}
