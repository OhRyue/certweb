import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Trophy, Users, Clock, ArrowRight } from "lucide-react";

interface TournamentProps {
  onJoin: (tournamentId: string) => void;
  onBack: () => void;
}

export function Tournament({ onJoin, onBack }: TournamentProps) {
  const availableTournaments: any[] = [];
  const myTournaments: any[] = [];

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-orange-600" />
            <h1 className="text-orange-900">토너먼트</h1>
          </div>
          <p className="text-gray-600">8명이 참여하는 토너먼트에 도전하세요!</p>
        </div>

        {/* Tournament Info */}
        <Card className="p-6 mb-8 bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200">
          <div className="flex items-start gap-4">
            <Trophy className="w-8 h-8 text-orange-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-orange-900 mb-2">토너먼트 안내</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                <div>
                  <p className="text-gray-600 mb-1">진행 방식</p>
                  <p>8강 → 4강 → 결승</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">문제 수</p>
                  <p>라운드별 5문제</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">우승 보상</p>
                  <p>XP + 특별 뱃지</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* My Tournaments */}
        {myTournaments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-orange-900 mb-4">참가중인 토너먼트</h2>
            <div className="space-y-4">
              {myTournaments.map((tournament) => (
                <Card
                  key={tournament.id}
                  className="p-6 border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-yellow-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full flex items-center justify-center">
                        <Trophy className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-orange-900 mb-1">{tournament.name}</h3>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            {tournament.round}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            다음 경기: {tournament.nextMatch}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white">
                      경기 준비
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Available Tournaments */}
        <div>
          <h2 className="text-orange-900 mb-4">참가 가능한 토너먼트</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableTournaments.map((tournament) => (
              <Card
                key={tournament.id}
                className="p-6 border-2 border-orange-200 hover:shadow-xl transition-all hover:border-orange-300"
              >
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full mb-3">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-gray-900 mb-2">{tournament.name}</h3>
                  <Badge
                    variant="secondary"
                    className={
                      tournament.status === "모집중"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }
                  >
                    {tournament.status}
                  </Badge>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">카테고리</span>
                    <span className="text-gray-800">{tournament.category}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">난이도</span>
                    <Badge
                      variant="secondary"
                      className={
                        tournament.difficulty === "쉬움"
                          ? "bg-green-100 text-green-700"
                          : tournament.difficulty === "보통"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {tournament.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">참가자</span>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-800">
                        {tournament.participants}/{tournament.maxParticipants}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">시작</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-800">{tournament.startTime}</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-orange-200">
                    <p className="text-sm text-gray-600 mb-1">우승 보상</p>
                    <p className="text-sm text-orange-600">{tournament.prize}</p>
                  </div>
                </div>

                <Button
                  onClick={() => onJoin(tournament.id)}
                  disabled={tournament.status !== "모집중"}
                  className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white disabled:opacity-50"
                >
                  {tournament.status === "모집중" ? "참가하기" : "진행중"}
                </Button>
              </Card>
            ))}
          </div>
        </div>

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
