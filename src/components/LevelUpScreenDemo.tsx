import { useState } from "react";
import { LevelUpScreen } from "./LevelUpScreen";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

/**
 * LevelUpScreen 사용 예시 컴포넌트
 * 실제 사용 시 이 컴포넌트는 필요하지 않으며, 
 * 아래 예시를 참고하여 적절한 위치에서 LevelUpScreen을 호출하면 됩니다.
 */

export function LevelUpScreenDemo() {
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [earnedExp, setEarnedExp] = useState(100);
  
  // 예시 데이터
  const currentLevel = 9; // 현재 레벨
  const currentExp = 350; // 현재 경험치
  const expPerLevel = 500; // 레벨당 필요 경험치

  return (
    <div className="p-8">
      <Card className="p-6 max-w-2xl mx-auto">
        <h2 className="text-gray-900 mb-4">레벨업 화면 테스트</h2>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm mb-2">획득 경험치</label>
            <input
              type="number"
              value={earnedExp}
              onChange={(e) => setEarnedExp(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded">
            <div>
              <div className="text-sm text-gray-600">현재 레벨</div>
              <div className="text-xl">Lv. {currentLevel}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">현재 경험치</div>
              <div className="text-xl">{currentExp} XP</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">레벨당 필요 경험치</div>
              <div className="text-xl">{expPerLevel} XP</div>
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <div className="text-sm text-blue-900 mb-2">시뮬레이션 결과</div>
            <div className="text-xs text-gray-700">
              총 경험치: {currentExp + earnedExp} XP<br />
              최종 레벨: Lv. {currentLevel + Math.floor((currentExp + earnedExp) / expPerLevel)}<br />
              레벨 내 경험치: {(currentExp + earnedExp) % expPerLevel} / {expPerLevel} XP
              {currentLevel === 10 && Math.floor((currentExp + earnedExp) / expPerLevel) > 0 && (
                <div className="text-purple-600 mt-1">🎉 티어업! 브론즈 → 실버</div>
              )}
            </div>
          </div>
        </div>
        
        <Button
          onClick={() => setShowLevelUp(true)}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
        >
          레벨업 화면 보기
        </Button>

        <div className="mt-4 text-sm text-gray-600">
          <p className="mb-2"><strong>팁:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>획득 경험치를 조절하여 레벨업 애니메이션을 테스트해보세요</li>
            <li>150 XP 이상 입력 시 레벨업을 경험할 수 있습니다</li>
            <li>650 XP 이상 입력 시 티어업(브론즈→실버)을 경험할 수 있습니다</li>
          </ul>
        </div>
      </Card>

      {showLevelUp && (
        <LevelUpScreen
          currentLevel={currentLevel}
          currentExp={currentExp}
          earnedExp={earnedExp}
          expPerLevel={expPerLevel}
          onComplete={() => setShowLevelUp(false)}
        />
      )}
    </div>
  );
}

/**
 * 실제 사용 예시:
 * 
 * 1. MicroResult.tsx에서 사용하는 경우:
 * 
 * const [showLevelUp, setShowLevelUp] = useState(false);
 * const earnedExp = calculateExp(score); // 점수에 따라 경험치 계산
 * 
 * const handleComplete = () => {
 *   setShowLevelUp(true);
 * };
 * 
 * return (
 *   <>
 *     <MicroResultContent onComplete={handleComplete} />
 *     {showLevelUp && (
 *       <LevelUpScreen
 *         currentLevel={userProfile.level}
 *         currentExp={userProfile.xp}
 *         earnedExp={earnedExp}
 *         expPerLevel={500}
 *         onComplete={() => {
 *           // 유저 프로필 업데이트
 *           updateUserProfile({ 
 *             level: newLevel, 
 *             xp: newExp 
 *           });
 *           setShowLevelUp(false);
 *         }}
 *       />
 *     )}
 *   </>
 * );
 * 
 * 2. 경험치 계산 함수 예시:
 * 
 * function calculateExp(score: number, totalQuestions: number): number {
 *   const baseExp = 50;
 *   const bonusExp = Math.floor((score / totalQuestions) * 100);
 *   return baseExp + bonusExp;
 * }
 */
