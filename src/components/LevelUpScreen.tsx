import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Sparkles, Trophy, Star, Award, Crown } from "lucide-react";

interface LevelUpScreenProps {
  currentLevel: number;
  currentExp: number;
  earnedExp: number;
  expPerLevel: number;
  onComplete: () => void;
}

// 티어 정의
const TIERS = [
  { name: "브론즈", minLevel: 1, maxLevel: 10, color: "from-amber-700 to-amber-500", emoji: "🥉", bgColor: "from-amber-50 to-orange-50" },
  { name: "실버", minLevel: 11, maxLevel: 20, color: "from-gray-400 to-gray-300", emoji: "🥈", bgColor: "from-gray-50 to-slate-50" },
  { name: "골드", minLevel: 21, maxLevel: 30, color: "from-yellow-500 to-yellow-300", emoji: "🥇", bgColor: "from-yellow-50 to-amber-50" },
  { name: "플래티넘", minLevel: 31, maxLevel: 40, color: "from-cyan-400 to-blue-400", emoji: "💎", bgColor: "from-cyan-50 to-blue-50" },
  { name: "다이아몬드", minLevel: 41, maxLevel: 50, color: "from-blue-500 to-indigo-500", emoji: "💠", bgColor: "from-blue-50 to-indigo-50" },
  { name: "마스터", minLevel: 51, maxLevel: 60, color: "from-purple-500 to-pink-500", emoji: "👑", bgColor: "from-purple-50 to-pink-50" },
];

function getTier(level: number) {
  return TIERS.find(tier => level >= tier.minLevel && level <= tier.maxLevel) || TIERS[0];
}

export function LevelUpScreen({ 
  currentLevel, 
  currentExp, 
  earnedExp, 
  expPerLevel,
  onComplete 
}: LevelUpScreenProps) {
  const [displayExp, setDisplayExp] = useState(currentExp);
  const [displayLevel, setDisplayLevel] = useState(currentLevel);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showTierUp, setShowTierUp] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  const finalExp = currentExp + earnedExp;
  const finalLevel = currentLevel + Math.floor(finalExp / expPerLevel);
  const finalExpInLevel = finalExp % expPerLevel;

  const currentTier = getTier(displayLevel);
  const finalTier = getTier(finalLevel);
  const isTierUp = currentTier.name !== finalTier.name;

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    // 경험치 증가 애니메이션
    const animateExp = () => {
      const duration = 2000; // 2초
      const steps = 60;
      const increment = earnedExp / steps;
      let currentStep = 0;

      const intervalId = setInterval(() => {
        currentStep++;
        const newExp = currentExp + (increment * currentStep);
        const newLevel = currentLevel + Math.floor(newExp / expPerLevel);
        const expInLevel = newExp % expPerLevel;

        setDisplayExp(expInLevel);
        setDisplayLevel(newLevel);

        // 레벨업 체크
        if (newLevel > displayLevel) {
          setShowLevelUp(true);
          setTimeout(() => setShowLevelUp(false), 1500);
        }

        if (currentStep >= steps) {
          clearInterval(intervalId);
          setDisplayExp(finalExpInLevel);
          setDisplayLevel(finalLevel);
          
          // 티어업 체크
          if (isTierUp) {
            timeoutId = setTimeout(() => {
              setShowTierUp(true);
              setTimeout(() => {
                setShowTierUp(false);
                setAnimationComplete(true);
              }, 3000);
            }, 500);
          } else {
            setAnimationComplete(true);
          }
        }
      }, duration / steps);
    };

    animateExp();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const expPercentage = (displayExp / expPerLevel) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
      <div className="relative w-full max-w-2xl p-8">
        {/* 메인 카드 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className={`p-8 bg-gradient-to-br ${currentTier.bgColor} border-4 border-white shadow-2xl`}>
            {/* 헤더 */}
            <div className="text-center mb-8">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block text-6xl mb-4"
              >
                {currentTier.emoji}
              </motion.div>
              <h2 className="text-gray-900 mb-2">경험치 획득!</h2>
              <div className="flex items-center justify-center gap-2">
                <Badge className={`bg-gradient-to-r ${currentTier.color} text-white text-lg px-4 py-1`}>
                  {currentTier.name}
                </Badge>
                <span className="text-2xl">Lv. {displayLevel}</span>
              </div>
            </div>

            {/* 경험치 바 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">경험치</span>
                <span className="text-sm text-gray-800">
                  {Math.round(displayExp)} / {expPerLevel} XP
                </span>
              </div>
              <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${currentTier.color} flex items-center justify-end pr-3`}
                  initial={{ width: `${(currentExp / expPerLevel) * 100}%` }}
                  animate={{ width: `${expPercentage}%` }}
                  transition={{ duration: 2, ease: "easeOut" }}
                >
                  <span className="text-white text-xs drop-shadow">
                    {Math.round(expPercentage)}%
                  </span>
                </motion.div>
              </div>
            </div>

            {/* 획득 경험치 */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-lg"
              >
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <span className="text-xl">
                  <span className="text-green-600">+{earnedExp}</span> XP
                </span>
              </motion.div>
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
                  className={`w-full bg-gradient-to-r ${currentTier.color} hover:opacity-90 text-white text-lg py-6`}
                >
                  확인
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
                
                {/* 레벨업 텍스트 */}
                <motion.div
                  animate={{ y: [-20, 0, -20] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="relative bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-12 py-8 rounded-2xl shadow-2xl"
                >
                  <div className="text-center">
                    <Star className="w-16 h-16 mx-auto mb-4" />
                    <div className="text-4xl mb-2">LEVEL UP!</div>
                    <div className="text-6xl">Lv. {displayLevel}</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 티어업 팝업 */}
        <AnimatePresence>
          {showTierUp && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="relative">
                {/* 화려한 배경 효과 */}
                <motion.div
                  animate={{ 
                    scale: [1, 2, 1],
                    rotate: [0, 180, 360],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className={`absolute inset-0 bg-gradient-to-r ${finalTier.color} rounded-full blur-3xl`}
                />
                
                {/* 별 효과 */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [0, 1, 0],
                      x: [0, Math.cos((i * Math.PI * 2) / 8) * 200],
                      y: [0, Math.sin((i * Math.PI * 2) / 8) * 200],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  >
                    <Sparkles className={`w-6 h-6 text-yellow-400`} />
                  </motion.div>
                ))}
                
                {/* 티어업 텍스트 */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`relative bg-gradient-to-r ${finalTier.bgColor} border-4 border-white px-16 py-12 rounded-3xl shadow-2xl`}
                >
                  <div className="text-center">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.3, 1],
                        rotate: [0, 360],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-8xl mb-6"
                    >
                      {finalTier.emoji}
                    </motion.div>
                    <div className="text-5xl mb-4">🎊 TIER UP! 🎊</div>
                    <Badge className={`bg-gradient-to-r ${finalTier.color} text-white text-3xl px-8 py-3`}>
                      {finalTier.name}
                    </Badge>
                    <div className="text-2xl mt-4 text-gray-700">등급 달성!</div>
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
