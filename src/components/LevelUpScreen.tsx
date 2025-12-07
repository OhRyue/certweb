import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Sparkles, Star, Gift, Zap } from "lucide-react";

interface LevelUpScreenProps {
  earnedExp: number; // 얻은 경험치
  currentExp: number; // 얻은 후의 경험치 (현재 레벨 내에서의 경험치)
  currentLevel: number; // 얻은 후의 레벨
  expToNextLevel: number; // 다음 레벨로 가기 위해 필요한 경험치
  isLevelUp: boolean; // 방금 레벨업 유무
  earnedPoints?: number; // 레벨업으로 얻은 포인트 (레벨업 했을 경우만)
  onComplete: () => void;
}

export function LevelUpScreen({ 
  earnedExp,
  currentExp,
  currentLevel,
  expToNextLevel,
  isLevelUp,
  earnedPoints = 0,
  onComplete 
}: LevelUpScreenProps) {
  const [displayExp, setDisplayExp] = useState(currentExp - earnedExp >= 0 ? currentExp - earnedExp : 0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  // 총 필요 경험치 계산 (현재 경험치 + 남은 경험치)
  const totalExpForLevel = currentExp + expToNextLevel;

  useEffect(() => {
    // 경험치 증가 애니메이션
    const animateExp = () => {
      const duration = 2000; // 2초
      const steps = 60;
      const startExp = currentExp - earnedExp >= 0 ? currentExp - earnedExp : 0;
      const increment = earnedExp / steps;
      let currentStep = 0;

      const intervalId = setInterval(() => {
        currentStep++;
        const newExp = startExp + (increment * currentStep);

        setDisplayExp(Math.min(newExp, currentExp));

        if (currentStep >= steps) {
          clearInterval(intervalId);
          setDisplayExp(currentExp);
          
          // 레벨업 체크
          if (isLevelUp) {
            setTimeout(() => {
              setShowLevelUp(true);
              setTimeout(() => {
                setShowLevelUp(false);
                setAnimationComplete(true);
              }, 2500);
            }, 500);
          } else {
            setAnimationComplete(true);
          }
        }
      }, duration / steps);
    };

    animateExp();
  }, []);

  const expPercentage = (displayExp / totalExpForLevel) * 100;
  const startExpPercentage = ((currentExp - earnedExp >= 0 ? currentExp - earnedExp : 0) / totalExpForLevel) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50">
      <div className="relative w-full max-w-2xl p-8">
        {/* 메인 카드 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-8 bg-white border-2 border-blue-200 shadow-2xl">
            {/* 헤더 */}
            <div className="text-center mb-8">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0] 
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full mb-4 shadow-lg"
              >
                <Zap className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-gray-900 mb-3">
                {isLevelUp ? "🎉 레벨업!" : "경험치 획득!"}
              </h2>
              <div className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full shadow-md">
                <Star className="w-5 h-5" />
                <span className="text-2xl">Level {currentLevel}</span>
              </div>
            </div>

            {/* 경험치 바 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">경험치</span>
                <span className="text-sm text-gray-800">
                  {Math.round(displayExp)} / {totalExpForLevel} XP
                </span>
              </div>
              <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden border-2 border-gray-200 shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-end pr-3 shadow-lg"
                  initial={{ width: `${startExpPercentage}%` }}
                  animate={{ width: `${expPercentage}%` }}
                  transition={{ duration: 2, ease: "easeOut" }}
                >
                  <span className="text-white text-sm drop-shadow-md">
                    {Math.round(expPercentage)}%
                  </span>
                </motion.div>
              </div>
            </div>

            {/* 획득 경험치 & 포인트 */}
            <div className="flex flex-col items-center gap-3 mb-6">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-full shadow-md"
              >
                <Sparkles className="w-5 h-5 text-green-600" />
                <span className="text-lg">
                  <span className="text-green-600">+{earnedExp}</span> <span className="text-gray-600">XP</span>
                </span>
              </motion.div>

              {/* 레벨업 포인트 표시 */}
              {isLevelUp && earnedPoints > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-full shadow-md"
                >
                  <Gift className="w-5 h-5 text-purple-600" />
                  <span className="text-lg">
                    <span className="text-purple-600">+{earnedPoints}</span> <span className="text-gray-600">포인트</span>
                  </span>
                </motion.div>
              )}
            </div>

            {/* 완료 버튼 */}
            {animationComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Button
                  onClick={onComplete}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-lg py-6 shadow-xl"
                >
                  확인 ✨
                </Button>
              </motion.div>
            )}
          </Card>
        </motion.div>

        {/* 레벨업 팝업 */}
        <AnimatePresence>
          {showLevelUp && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="relative">
                {/* 빛나는 효과 */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full blur-3xl"
                />

                {/* 별 효과 */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [0, 1, 0],
                      x: [0, Math.cos((i * Math.PI * 2) / 8) * 150],
                      y: [0, Math.sin((i * Math.PI * 2) / 8) * 150],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  >
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                  </motion.div>
                ))}
                
                {/* 레벨업 텍스트 */}
                <motion.div
                  animate={{ 
                    y: [-20, 0, -20],
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="relative bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-12 py-8 rounded-2xl shadow-2xl"
                >
                  <div className="text-center">
                    <Star className="w-16 h-16 mx-auto mb-4 fill-white" />
                    <div className="text-4xl mb-2">LEVEL UP!</div>
                    <div className="text-6xl">Lv. {currentLevel}</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 컨페티 효과 */}
        {showLevelUp && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * window.innerWidth,
                  y: -20,
                  rotate: Math.random() * 360,
                }}
                animate={{ 
                  y: window.innerHeight + 20,
                  rotate: Math.random() * 360 + 360,
                }}
                transition={{ 
                  duration: Math.random() * 2 + 2,
                  delay: Math.random() * 0.5,
                }}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  backgroundColor: [
                    "#fbbf24", "#f59e0b", "#ef4444", "#ec4899", 
                    "#8b5cf6", "#3b82f6", "#10b981"
                  ][Math.floor(Math.random() * 7)],
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}