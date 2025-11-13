import { Card } from "../ui/card"
import { Button } from "../ui/button"
import { Swords, Zap, Trophy, Bell } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function BattleDashboard() {
  const navigate = useNavigate()

  const myStats = {
    wins: 42,
    losses: 18,
    winRate: 70,
    rank: 127,
  }

  const ongoingMatches = [
    { id: "m1", opponent: "코딩마스터", mode: "1:1", status: "진행중", round: "3/5" },
    { id: "m2", opponent: "토너먼트 8강", mode: "토너먼트", status: "대기중", round: "8강" },
  ]

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Swords className="w-8 h-8 text-purple-600" />
            <h1 className="text-purple-900">대전/이벤트</h1>
          </div>
          <p className="text-gray-600">친구들과 실력을 겨루고 이벤트에 참여하세요!</p>
        </div>

        {/* My Stats */}
        <Card className="p-6 mb-8 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
          <h2 className="text-purple-900 mb-4">내 대전 기록</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">승리</p>
              <p className="text-2xl text-green-600">{myStats.wins}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">패배</p>
              <p className="text-2xl text-red-600">{myStats.losses}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">승률</p>
              <p className="text-2xl text-purple-600">{myStats.winRate}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">랭킹</p>
              <p className="text-2xl text-blue-600">#{myStats.rank}</p>
            </div>
          </div>
        </Card>

        {/* Battle Modes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 1:1 Battle */}
          <Card className="p-6 hover:shadow-xl transition-all border-2 hover:border-purple-300">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mb-4">
                <Swords className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-purple-900 mb-2">1:1 배틀</h2>
              <p className="text-gray-600 text-sm">친구와 실시간으로 대결하세요</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>실시간 대결</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>카테고리/난이도 선택</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>10문제 5분 제한</span>
              </div>
            </div>

            <Button
              onClick={() => navigate("/battle/onevsone/dashboard")}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              <Zap className="w-4 h-4 mr-2" />
              배틀 시작
            </Button>
          </Card>

          {/* Tournament */}
          <Card className="p-6 hover:shadow-xl transition-all border-2 hover:border-orange-300">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full mb-4">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-orange-900 mb-2">토너먼트</h2>
              <p className="text-gray-600 text-sm">8명이 참여하는 토너먼트</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span>8강 → 4강 → 결승</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span>라운드별 5문제</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span>우승 시 특별 보상</span>
              </div>
            </div>

            <Button
              onClick={() => navigate("/battle/tournament")}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
            >
              <Trophy className="w-4 h-4 mr-2" />
              토너먼트 참가
            </Button>
          </Card>

          {/* Golden Bell */}
          <Card className="p-6 hover:shadow-xl transition-all border-2 hover:border-blue-300">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full mb-4">
                <Bell className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-blue-900 mb-2">골든벨</h2>
              <p className="text-gray-600 text-sm">20명이 참여하는 생존 게임</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>OX → 단답 → 서술</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>틀리면 탈락</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>최후 1인 우승</span>
              </div>
            </div>

            <Button
              onClick={() => navigate("/battle/goldenbell")}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
            >
              <Bell className="w-4 h-4 mr-2" />
              골든벨 참가
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
