import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Trophy, Swords, Crown, Medal, Users } from "lucide-react";

interface TournamentBracketProps {
  tournamentId: string;
  onStartMatch: () => void;
  onBack: () => void;
}

export function TournamentBracket({ tournamentId, onStartMatch, onBack }: TournamentBracketProps) {
  const bracket = {
    name: "데이터베이스 마스터 토너먼트",
    currentRound: "8강",
    quarterFinals: [
      { id: "q1", player1: "공부왕", player2: "코딩마스터", winner: "공부왕", score: "80 - 65" },
      { id: "q2", player1: "DB전문가", player2: "알고킹", winner: null, score: null },
      { id: "q3", player1: "네트워크천재", player2: "OOP마스터", winner: "네트워크천재", score: "75 - 70" },
      { id: "q4", player1: "SQL고수", player2: "정규화왕", winner: "정규화왕", score: "85 - 60" },
    ],
    semiFinals: [
      { id: "s1", player1: "공부왕", player2: "TBD", winner: null, score: null },
      { id: "s2", player1: "네트워크천재", player2: "정규화왕", winner: null, score: null },
    ],
    finals: {
      id: "f1",
      player1: "TBD",
      player2: "TBD",
      winner: null,
      score: null,
    },
  };

  const renderMatch = (match: any, isMyMatch: boolean = false) => {
    const isCompleted = match.winner !== null;
    
    return (
      <Card
        className={`p-4 border-2 ${
          isMyMatch
            ? "border-purple-300 bg-purple-50"
            : isCompleted
            ? "border-gray-300 bg-gray-50"
            : "border-orange-300 bg-orange-50"
        }`}
      >
        <div className="space-y-2">
          <div className={`flex items-center justify-between p-2 rounded ${
            match.winner === match.player1 ? "bg-green-100" : "bg-white"
          }`}>
            <span className="text-sm text-gray-800">{match.player1}</span>
            {match.winner === match.player1 && <Crown className="w-4 h-4 text-yellow-600" />}
          </div>
          <div className="text-center text-xs text-gray-500">VS</div>
          <div className={`flex items-center justify-between p-2 rounded ${
            match.winner === match.player2 ? "bg-green-100" : "bg-white"
          }`}>
            <span className="text-sm text-gray-800">{match.player2}</span>
            {match.winner === match.player2 && <Crown className="w-4 h-4 text-yellow-600" />}
          </div>
          
          {match.score && (
            <div className="text-center text-xs text-gray-600 pt-1">
              {match.score}
            </div>
          )}

          {isMyMatch && !isCompleted && (
            <Button
              onClick={onStartMatch}
              size="sm"
              className="w-full mt-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            >
              <Swords className="w-3 h-3 mr-1" />
              경기 시작
            </Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-orange-600" />
            <h1 className="text-orange-900">{bracket.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-orange-500 text-white">
              {bracket.currentRound}
            </Badge>
            <p className="text-gray-600">토너먼트 대진표</p>
          </div>
        </div>

        {/* Bracket */}
        <Card className="p-8 border-2 border-orange-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Quarter Finals */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Medal className="w-5 h-5 text-orange-600" />
                <h3 className="text-orange-900">8강</h3>
              </div>
              <div className="space-y-4">
                {bracket.quarterFinals.map((match, index) => (
                  <div key={match.id}>
                    {renderMatch(match, index === 1)}
                  </div>
                ))}
              </div>
            </div>

            {/* Semi Finals */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-orange-600" />
                <h3 className="text-orange-900">4강</h3>
              </div>
              <div className="space-y-4">
                <div className="h-16"></div>
                {bracket.semiFinals.map((match) => (
                  <div key={match.id}>
                    {renderMatch(match)}
                  </div>
                ))}
              </div>
            </div>

            {/* Finals */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-yellow-600" />
                <h3 className="text-yellow-900">결승</h3>
              </div>
              <div className="space-y-4">
                <div className="h-32"></div>
                {renderMatch(bracket.finals)}
              </div>
            </div>
          </div>
        </Card>

        {/* Tournament Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-orange-600" />
              <h3 className="text-orange-900">참가자 정보</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">총 참가자</span>
                <span className="text-gray-800">8명</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">남은 참가자</span>
                <span className="text-gray-800">5명</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">내 순위</span>
                <span className="text-orange-600">8강 진출</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-6 h-6 text-purple-600" />
              <h3 className="text-purple-900">우승 보상</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🥇</span>
                <div className="text-sm">
                  <p className="text-gray-800">1위: 1000 XP + 골드 뱃지</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🥈</span>
                <div className="text-sm">
                  <p className="text-gray-800">2위: 500 XP + 실버 뱃지</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🥉</span>
                <div className="text-sm">
                  <p className="text-gray-800">3-4위: 250 XP</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Back Button */}
        <div className="mt-8 flex justify-center">
          <Button onClick={onBack} variant="outline" className="border-2">
            대전 메뉴로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  );
}
