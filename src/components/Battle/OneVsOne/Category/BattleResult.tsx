import { Card } from "../../../ui/card";
import { Button } from "../../../ui/button";
import { Badge } from "../../../ui/badge";
import { Trophy, TrendingUp, Award, RotateCcw, Home } from "lucide-react";
import { getProfileImage } from "../../../../utils/profileUtils";

interface BattleResultProps {
  myScore: number;
  opponentScore: number;
  myNickname: string | null;
  myUserId: string;
  mySkinId: number | null;
  opponentNickname: string | null;
  opponentUserId: string;
  opponentSkinId: number | null;
  onRematch: () => void;
  onBackToDashboard: () => void;
}

export function BattleResult({
  myScore,
  opponentScore,
  myNickname,
  myUserId,
  mySkinId,
  opponentNickname,
  opponentUserId,
  opponentSkinId,
  onRematch,
  onBackToDashboard
}: BattleResultProps) {
  const isWin = myScore > opponentScore;
  const isDraw = myScore === opponentScore;
  
  // 닉네임이 null이면 userId 표시
  const myDisplayName = myNickname || myUserId || "나";
  const opponentDisplayName = opponentNickname || opponentUserId || "상대";
  
  // skinId 기반 프로필 이미지
  const myProfileImage = mySkinId ? getProfileImage(mySkinId) : "/assets/profile/girl_basic_profile.png";
  const opponentProfileImage = opponentSkinId ? getProfileImage(opponentSkinId) : "/assets/profile/girl_basic_profile.png";

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {/* Result Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 bg-gradient-to-br from-purple-400 to-pink-400">
            <Trophy className="w-12 h-12 text-white" />
          </div>

          <h1 className={`mb-2 ${isWin ? "text-green-600" : isDraw ? "text-yellow-600" : "text-gray-600"
            }`}>
            {isWin ? "승리!" : isDraw ? "무승부" : "패배"}
          </h1>
          <p className="text-gray-600">
            {isWin
              ? "축하합니다! 멋진 승리입니다! 🎉"
              : isDraw
                ? "막상막하의 대결이었습니다!"
                : "다음엔 더 잘할 수 있을 거예요!"}
          </p>
        </div>

        {/* Score Comparison */}
        <Card className="p-8 mb-6 border-2 border-purple-200">
          <div className="grid grid-cols-2 gap-8 mb-6">
            {/* My Score */}
            <div className="text-center">
              <div className="mb-3 flex justify-center">
                <img 
                  src={myProfileImage} 
                  alt={myDisplayName}
                  className="w-16 h-16 rounded-full object-cover"
                />
              </div>
              <p className="text-sm text-gray-600 mb-2">{myDisplayName}</p>
              <div className={`text-4xl mb-2 ${isWin ? "text-green-600" : "text-gray-800"
                }`}>
                {myScore}
              </div>
              {isWin && (
                <Badge className="bg-green-500 text-white">
                  <Trophy className="w-3 h-3 mr-1" />
                  승리
                </Badge>
              )}
            </div>

            {/* Opponent Score */}
            <div className="text-center">
              <div className="mb-3 flex justify-center">
                <img 
                  src={opponentProfileImage} 
                  alt={opponentDisplayName}
                  className="w-16 h-16 rounded-full object-cover"
                />
              </div>
              <p className="text-sm text-gray-600 mb-2">{opponentDisplayName}</p>
              <div className={`text-4xl mb-2 ${!isWin && !isDraw ? "text-red-600" : "text-gray-800"
                }`}>
                {opponentScore}
              </div>
              {!isWin && !isDraw && (
                <Badge className="bg-red-500 text-white">
                  <Trophy className="w-3 h-3 mr-1" />
                  승리
                </Badge>
              )}
            </div>
          </div>

          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full flex">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500"
                style={{ width: `${(myScore / (myScore + opponentScore)) * 100}%` }}
              />
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-500"
                style={{ width: `${(opponentScore / (myScore + opponentScore)) * 100}%` }}
              />
            </div>
          </div>
        </Card>


        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={onRematch}
            variant="outline"
            className="border-2 border-purple-500 text-purple-600 hover:bg-purple-50"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            재대결
          </Button>
          <Button
            onClick={onBackToDashboard}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            <Home className="w-4 h-4 mr-2" />
            대전 메뉴로
          </Button>
        </div>
      </div>
    </div>
  );
}
