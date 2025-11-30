import { useState, useEffect } from "react";
import { Card } from "../../../ui/card";
import { Badge } from "../../../ui/badge";
import { Users } from "lucide-react";
import { motion } from "motion/react";
import { useLocation, useNavigate } from "react-router-dom";

// 가능한 상대 목록 (Mock)
const potentialOpponents = [
  { id: "opp1", name: "코딩마스터", level: 12, avatar: "👨‍💻", winRate: 75 },
  { id: "opp2", name: "알고킹", level: 10, avatar: "🧑‍🎓", winRate: 68 },
  { id: "opp3", name: "DB전문가", level: 15, avatar: "👩‍💼", winRate: 82 },
  { id: "opp4", name: "네트워크천재", level: 8, avatar: "🤓", winRate: 71 },
  { id: "opp5", name: "OOP마스터", level: 11, avatar: "👨‍🔬", winRate: 77 },
  { id: "opp6", name: "SQL마법사", level: 13, avatar: "🧙", winRate: 79 },
  { id: "opp7", name: "자바킹", level: 9, avatar: "👑", winRate: 72 },
  { id: "opp8", name: "파이썬러버", level: 14, avatar: "🐍", winRate: 85 },
];

export function DifficultyMatching() {
  const [matchingProgress, setMatchingProgress] = useState(0);
  const [step, setStep] = useState<"matching" | "matched">("matching");
  const [matchedOpponent, setMatchedOpponent] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation() as any   // 임시
  const { topicName, difficulty } = location.state || { topicName: "미정", difficulty: "medium" }

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

  // 매칭 시뮬레이션
  useEffect(() => {
    setMatchingProgress(0);

    // 진행 상태 애니메이션
    const progressInterval = setInterval(() => {
      setMatchingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 200);

    // 2-4초 후 매칭 완료
    const matchTimeout = setTimeout(() => {
      const randomOpponent = potentialOpponents[Math.floor(Math.random() * potentialOpponents.length)];
      setMatchedOpponent(randomOpponent);
      setStep("matched");

      // 1.5초 후 자동으로 게임 시작
      setTimeout(() => {
        navigate("/battle/onevsone/difficulty/start", {
          state: {
            opponentName: randomOpponent.name,
            topicName: topicName,   // topicId 대신 topicName 사용
            difficulty: difficulty, // 그대로 전달
            examType: "practical"    // 나중에 필기/실기 구분할 거면 변경 가능
          }
        });
      }, 1500);
    }, Math.random() * 2000 + 2000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(matchTimeout);
    };
  }, []);

  // Matching Step
  if (step === "matching") {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto"
          >
            <Card className="p-8 border-2 border-purple-200 bg-white/80 backdrop-blur text-center">
              {/* 아이콘 */}
              <div className="text-7xl mb-6">🎯</div>

              {/* 매칭 중 텍스트 */}
              <h2 className="text-purple-900 mb-2">매칭 중</h2>
              <p className="text-gray-600 mb-6">상대를 찾고 있습니다</p>

              {/* 선택 정보 */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-6 border border-purple-100">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">토픽</span>
                    <span className="text-gray-900">{topicName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">난이도</span>
                    <span className={getDifficultyColor(difficulty)}>
                      {getDifficultyLabel(difficulty)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 프로그레스 바 */}
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500"
                  initial={{ width: "0%" }}
                  animate={{ width: `${Math.min(matchingProgress, 100)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* 매칭 상태 */}
              <div className="space-y-2">
                <motion.p
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-sm text-gray-600"
                >
                  {matchingProgress < 30
                    ? "상대를 탐색하는 중..."
                    : matchingProgress < 70
                      ? "비슷한 실력의 상대를 찾는 중..."
                      : "거의 다 됐어요!"}
                </motion.p>
              </div>

              {/* 온라인 사용자 수 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500"
              >
                <Users className="w-4 h-4" />
                <span>현재 {Math.floor(Math.random() * 100) + 50}명 온라인</span>
              </motion.div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Matched Step
  if (step === "matched" && matchedOpponent) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="p-8 border-2 border-purple-200 bg-white/80 backdrop-blur">
              {/* 성공 아이콘 */}
              <div className="text-center mb-6">
                <div className="text-7xl mb-4">🎉</div>
                <h2 className="text-purple-900 mb-2">매칭 완료!</h2>
                <p className="text-gray-600">상대를 찾았습니다</p>
              </div>

              {/* VS 대결 */}
              <div className="grid grid-cols-3 gap-4 items-center mb-6">
                {/* 나 */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-4xl mb-2">
                    👨‍💻
                  </div>
                  <p className="text-sm text-gray-900">나</p>
                  <p className="text-xs text-gray-600">Level 5</p>
                </motion.div>

                {/* VS */}
                <div className="text-center">
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2">
                    VS
                  </Badge>
                </div>

                {/* 상대 */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-4xl mb-2">
                    {matchedOpponent.avatar}
                  </div>
                  <p className="text-sm text-gray-900">{matchedOpponent.name}</p>
                  <p className="text-xs text-gray-600">Level {matchedOpponent.level}</p>
                </motion.div>
              </div>

              {/* 배틀 정보 */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 text-center border border-purple-100"
              >
                <p className="text-sm text-gray-600 mb-1">곧 배틀이 시작됩니다</p>
                <p className="text-xs text-purple-700">{topicName} · {getDifficultyLabel(difficulty)}</p>
              </motion.div>

              {/* 로딩 표시 */}
              <div className="mt-6 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
}
