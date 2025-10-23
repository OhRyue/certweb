import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Bell, Users, Clock, Award, Zap } from "lucide-react";

interface GoldenBellProps {
  onJoin: (sessionId: string) => void;
  onBack: () => void;
}

export function GoldenBell({ onJoin, onBack }: GoldenBellProps) {
  const activeSessions = [
    {
      id: "g1",
      name: "정보처리기사 골든벨",
      category: "정보처리기사",
      participants: 18,
      maxParticipants: 20,
      currentRound: "대기중",
      prize: "5000 XP + 골든벨 뱃지",
      startTime: "5분 후",
      status: "모집중",
    },
    {
      id: "g2",
      name: "데이터베이스 골든벨",
      category: "데이터베이스",
      participants: 20,
      maxParticipants: 20,
      currentRound: "OX 라운드 (12명 생존)",
      prize: "3000 XP + 실버 뱃지",
      startTime: "진행중",
      status: "진행중",
    },
  ];

  const myRecords = [
    { rank: 2, participants: 20, category: "네트워크", date: "2025-10-20" },
    { rank: 5, participants: 20, category: "OOP", date: "2025-10-18" },
    { rank: 1, participants: 20, category: "데이터베이스", date: "2025-10-15" },
  ];

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-8 h-8 text-blue-600" />
            <h1 className="text-blue-900">골든벨</h1>
          </div>
          <p className="text-gray-600">최후 1인이 되어 골든벨의 주인공이 되세요!</p>
        </div>

        {/* Golden Bell Info */}
        <Card className="p-6 mb-8 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
          <div className="flex items-start gap-4">
            <Bell className="w-8 h-8 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-blue-900 mb-3">골든벨 게임 안내</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-white/60 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <span className="text-xl">⭕</span>
                    <span>1라운드: OX</span>
                  </div>
                  <p className="text-gray-700">10문제 (10초/문제)</p>
                </div>
                <div className="p-4 bg-white/60 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <span className="text-xl">✍️</span>
                    <span>2라운드: 단답형</span>
                  </div>
                  <p className="text-gray-700">5문제 (20초/문제)</p>
                </div>
                <div className="p-4 bg-white/60 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <span className="text-xl">📝</span>
                    <span>3라운드: 서술형</span>
                  </div>
                  <p className="text-gray-700">3문제 (30초/문제)</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-900">
                  ⚠️ 한 문제라도 틀리면 즉시 탈락! 긴장감 넘치는 생존 게임
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* My Records */}
        <div className="mb-8">
          <h2 className="text-blue-900 mb-4">내 최근 기록</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {myRecords.map((record, index) => (
              <Card
                key={index}
                className={`p-6 border-2 ${
                  record.rank === 1
                    ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300"
                    : record.rank <= 3
                    ? "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Badge
                    variant="secondary"
                    className={
                      record.rank === 1
                        ? "bg-yellow-100 text-yellow-700"
                        : record.rank <= 3
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }
                  >
                    {record.rank}위
                  </Badge>
                  {record.rank === 1 && <Award className="w-5 h-5 text-yellow-600" />}
                </div>
                <h3 className="text-gray-900 mb-2">{record.category}</h3>
                <p className="text-sm text-gray-600">
                  {record.participants}명 참가 · {record.date}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Active Sessions */}
        <div>
          <h2 className="text-blue-900 mb-4">참가 가능한 골든벨</h2>
          <div className="space-y-4">
            {activeSessions.map((session) => (
              <Card
                key={session.id}
                className="p-6 border-2 border-blue-200 hover:shadow-xl transition-all hover:border-blue-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 flex-1">
                    <div
                      className={`w-20 h-20 rounded-full flex items-center justify-center ${
                        session.status === "모집중"
                          ? "bg-gradient-to-br from-blue-400 to-cyan-400"
                          : "bg-gradient-to-br from-green-400 to-emerald-400"
                      }`}
                    >
                      <Bell className="w-10 h-10 text-white" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-gray-900">{session.name}</h3>
                        <Badge
                          variant="secondary"
                          className={
                            session.status === "모집중"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }
                        >
                          {session.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 mb-1">카테고리</p>
                          <p className="text-gray-800">{session.category}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">참가자</p>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-800">
                              {session.participants}/{session.maxParticipants}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">진행 상황</p>
                          <p className="text-gray-800">{session.currentRound}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">시작 시간</p>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-800">{session.startTime}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-600">{session.prize}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ml-6">
                    <Button
                      onClick={() => onJoin(session.id)}
                      disabled={session.status !== "모집중"}
                      size="lg"
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white disabled:opacity-50"
                    >
                      {session.status === "모집중" ? (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          참가하기
                        </>
                      ) : (
                        "진행중"
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Strategy Tips */}
        <Card className="p-6 mt-8 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h3 className="text-purple-900 mb-2">골든벨 전략 팁</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• 1라운드는 빠른 판단력이 중요합니다. 너무 오래 고민하지 마세요!</li>
                <li>• 2라운드 단답형은 정확한 용어를 기억하는 것이 핵심입니다.</li>
                <li>• 3라운드 서술형은 핵심 키워드를 포함하여 간결하게 작성하세요.</li>
                <li>• 평소 Micro 학습으로 기본 개념을 탄탄히 하면 유리합니다.</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Back Button */}
        <div className="mt-8 flex justify-center">
          <Button onClick={onBack} variant="outline" className="border-2">
            뒤로 가기
          </Button>
        </div>
      </div>
    </div>
  );
}
