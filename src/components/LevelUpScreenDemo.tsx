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
  const [earnedExpInput, setEarnedExpInput] = useState(100);
  
  // 예시 데이터 (레벨업 전)
  const beforeLevel = 9;
  const beforeExp = 100; // 레벨 내 현재 경험치
  const totalExpNeeded = 600; // 레벨당 총 필요 경험치
  
  // 서버에서 받은 데이터 시뮬레이션
  const earnedExp = earnedExpInput; // 획득한 경험치
  const afterTotalExp = beforeExp + earnedExp; // 경험치 획득 후
  const levelUpCount = Math.floor(afterTotalExp / totalExpNeeded); // 레벨업 횟수
  const currentLevel = beforeLevel + levelUpCount; // 현재 레벨
  const currentExp = afterTotalExp % totalExpNeeded; // 현재 레벨 내 경험치
  const expToNextLevel = totalExpNeeded - currentExp; // 남은 경험치
  const isLevelUp = levelUpCount > 0; // 레벨업 여부
  const earnedPoints = levelUpCount * 5; // 레벨당 5포인트

  return (
    <div className="p-8">
      <Card className="p-6 max-w-2xl mx-auto">
        <h2 className="text-gray-900 mb-4">레벨업 화면 테스트</h2>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm mb-2">획득 경험치</label>
            <input
              type="number"
              value={earnedExpInput}
              onChange={(e) => setEarnedExpInput(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-600 mb-3">레벨업 전</div>
              <div className="space-y-2 text-sm">
                <div>레벨: Lv. {beforeLevel}</div>
                <div>경험치: {beforeExp} XP</div>
                <div>남은 경험치: {totalExpNeeded - beforeExp} XP</div>
                <div>총 필요: {totalExpNeeded} XP</div>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded">
              <div className="text-sm text-blue-900 mb-3">레벨업 후 (서버 데이터)</div>
              <div className="space-y-2 text-sm">
                <div>레벨: Lv. {currentLevel} {isLevelUp && <span className="text-green-600">(+{levelUpCount})</span>}</div>
                <div>경험치: {currentExp} XP</div>
                <div>남은 경험치: {expToNextLevel} XP</div>
                <div>총 필요: {currentExp + expToNextLevel} XP</div>
                <div>획득 경험치: <span className="text-green-600">+{earnedExp}</span> XP</div>
                {isLevelUp && <div className="text-purple-600">포인트: +{earnedPoints}P</div>}
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-amber-50 border border-amber-200 rounded">
            <div className="text-sm text-amber-900 mb-2">시뮬레이션 결과</div>
            <div className="text-xs text-gray-700 space-y-1">
              <div>• 레벨업 여부: {isLevelUp ? '✅ 레벨업!' : '❌ 레벨업 안함'}</div>
              {isLevelUp && (
                <>
                  <div>• 레벨업 횟수: {levelUpCount}회</div>
                  <div>• 획득 포인트: {earnedPoints}P</div>
                </>
              )}
              <div>• 진행률: {Math.round((currentExp / (currentExp + expToNextLevel)) * 100)}%</div>
            </div>
          </div>
        </div>
        
        <Button
          onClick={() => setShowLevelUp(true)}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
        >
          레벨업 화면 보기
        </Button>

        <div className="mt-4 text-sm text-gray-600">
          <p className="mb-2"><strong>팁:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>획득 경험치를 조절하여 레벨업 애니메이션을 테스트해보세요</li>
            <li>500 XP 이상 입력 시 레벨업을 경험할 수 있습니다</li>
            <li>1100 XP 이상 입력 시 2단계 레벨업을 경험할 수 있습니다</li>
          </ul>
        </div>
      </Card>

      {showLevelUp && (
        <LevelUpScreen
          earnedExp={earnedExp}
          currentExp={currentExp}
          currentLevel={currentLevel}
          expToNextLevel={expToNextLevel}
          isLevelUp={isLevelUp}
          earnedPoints={isLevelUp ? earnedPoints : undefined}
          onComplete={() => setShowLevelUp(false)}
        />
      )}
    </div>
  );
}

/**
 * 실제 사용 예시:
 * 
 * 서버 응답 데이터 구조:
 * {
 *   earnedExp: 150,           // 획득한 경험치
 *   currentExp: 50,           // 현재 레벨 내 경험치 (획득 후)
 *   currentLevel: 10,         // 현재 레벨 (획득 후)
 *   expToNextLevel: 550,      // 다음 레벨까지 남은 경험치
 *   isLevelUp: true,          // 레벨업 여부
 *   earnedPoints: 5           // 획득한 포인트 (레벨업 시에만)
 * }
 * 
 * 예시: currentExp(50) + expToNextLevel(550) = 총 600 XP 필요
 * 
 * 1. MicroResult.tsx에서 사용하는 경우:
 * 
 * const [showLevelUp, setShowLevelUp] = useState(false);
 * const [expData, setExpData] = useState(null);
 * 
 * const handleComplete = async () => {
 *   // 서버에 퀴즈 결과 제출 및 경험치 데이터 받기
 *   const response = await submitQuizResult({
 *     score: score,
 *     totalQuestions: totalQuestions
 *   });
 *   
 *   setExpData(response.data);
 *   setShowLevelUp(true);
 * };
 * 
 * return (
 *   <>
 *     <MicroResultContent onComplete={handleComplete} />
 *     {showLevelUp && expData && (
 *       <LevelUpScreen
 *         earnedExp={expData.earnedExp}
 *         currentExp={expData.currentExp}
 *         currentLevel={expData.currentLevel}
 *         expToNextLevel={expData.expToNextLevel}
 *         isLevelUp={expData.isLevelUp}
 *         earnedPoints={expData.earnedPoints}
 *         onComplete={() => {
 *           // 유저 프로필 업데이트
 *           updateUserProfile({ 
 *             level: expData.currentLevel, 
 *             xp: expData.currentExp,
 *             points: userProfile.points + (expData.earnedPoints || 0)
 *           });
 *           setShowLevelUp(false);
 *         }}
 *       />
 *     )}
 *   </>
 * );
 */