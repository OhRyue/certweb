import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Swords, ArrowLeft, Zap, Users, Target } from "lucide-react";
import { motion } from "motion/react";
import { subjects } from "../../data/mockData";

interface OneVsOneBattleProps {
  onStartMatching: (topicId: string, topicName: string, difficulty: string) => void;
  onBack: () => void;
}

export function OneVsOneBattle({ onStartMatching, onBack }: OneVsOneBattleProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedMainTopicId, setSelectedMainTopicId] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState("medium");

  // 선택된 subject와 mainTopic 가져오기
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
  const selectedMainTopic = selectedSubject?.mainTopics.find(mt => mt.id === selectedMainTopicId);

  const handleStartMatching = () => {
    if (selectedSubjectId && selectedMainTopicId && selectedMainTopic) {
      const topicId = `${selectedSubjectId}-${selectedMainTopicId}`;
      onStartMatching(topicId, selectedMainTopic.name, difficulty);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy": return "text-green-600";
      case "medium": return "text-yellow-600";
      case "hard": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const getDifficultyLabel = (diff: string) => {
    switch (diff) {
      case "easy": return "쉬움";
      case "medium": return "보통";
      case "hard": return "어려움";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={onBack}
            variant="ghost"
            className="mb-4 text-gray-600 hover:text-purple-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로 가기
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Swords className="w-8 h-8 text-purple-600" />
            <h1 className="text-purple-900">1:1 배틀</h1>
          </div>
          <p className="text-gray-600">토픽과 난이도를 선택하고 상대를 찾아보세요! ⚔️</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 토픽 선택 */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 border-2 border-purple-200 bg-white/80 backdrop-blur">
              <div className="flex items-center gap-2 mb-6">
                <Target className="w-5 h-5 text-purple-600" />
                <h2 className="text-purple-900">배틀 토픽 선택</h2>
              </div>

              {/* Subject 선택 */}
              <div className="space-y-4">
                {subjects.map((subject) => (
                  <div key={subject.id}>
                    <button
                      onClick={() => {
                        setSelectedSubjectId(subject.id);
                        setSelectedMainTopicId(null);
                      }}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedSubjectId === subject.id
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-purple-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{subject.icon}</div>
                        <div className="flex-1">
                          <h3 className="text-gray-900">{subject.name}</h3>
                        </div>
                      </div>
                    </button>

                    {/* MainTopic 선택 */}
                    {selectedSubjectId === subject.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.3 }}
                        className="ml-4 mt-3 space-y-2"
                      >
                        {subject.mainTopics.map((mainTopic) => (
                          <button
                            key={mainTopic.id}
                            onClick={() => setSelectedMainTopicId(mainTopic.id)}
                            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                              selectedMainTopicId === mainTopic.id
                                ? "border-pink-500 bg-pink-50"
                                : "border-gray-200 hover:border-pink-300"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="text-xl">{mainTopic.icon}</div>
                              <span className="text-sm text-gray-900">{mainTopic.name}</span>
                              {selectedMainTopicId === mainTopic.id && (
                                <Zap className="w-4 h-4 text-pink-600 ml-auto" />
                              )}
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* 설정 & 시작 */}
          <div className="space-y-6">
            {/* 난이도 */}
            <Card className="p-6 border-2 border-purple-200 bg-white/80 backdrop-blur">
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

            {/* 선택 요약 */}
            {selectedMainTopic && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                  <h3 className="text-purple-900 mb-4">배틀 설정</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">토픽</p>
                      <p className="text-gray-900">{selectedMainTopic.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">난이도</p>
                      <p className={getDifficultyColor(difficulty)}>
                        {getDifficultyLabel(difficulty)}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* 배틀 규칙 */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
              <h3 className="text-blue-900 mb-4">⚡ 배틀 규칙</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• 총 10문제</li>
                <li>• 제한 시간 5분</li>
                <li>• 빠른 정답 가산점</li>
                <li>• 콤보 보너스 점수</li>
              </ul>
            </Card>

            {/* 매칭 시작 버튼 */}
            <Button
              onClick={handleStartMatching}
              disabled={!selectedSubjectId || !selectedMainTopicId}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-6 disabled:opacity-50"
            >
              <Users className="w-4 h-4 mr-2" />
              매칭 시작
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
