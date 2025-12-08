import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Sparkles, Star, Gift, Zap } from "lucide-react"
import { getLevelInternalXP, getRequiredXP } from "./utils/leveling"

interface LevelUpScreenProps {
  earnedExp: number
  totalXP: number              // 획득 후 전체 누적 경험치
  currentLevel: number         // 획득 후 레벨
  isLevelUp: boolean
  earnedPoints?: number
  onComplete: () => void
}

export function LevelUpScreen({
  earnedExp,
  totalXP,
  currentLevel,
  isLevelUp,
  earnedPoints = 0,
  onComplete
}: LevelUpScreenProps) {

  const finalExp = getLevelInternalXP(totalXP, currentLevel)
  const requiredXP = getRequiredXP(currentLevel)
  const startExp = Math.max(0, finalExp - earnedExp)

  // 숫자 애니메이션
  const [displayExp, setDisplayExp] = useState(startExp)

  // 실제 width를 움직일 progress state
  const [progressWidth, setProgressWidth] = useState((startExp / requiredXP) * 100)

  const [showLevelUp, setShowLevelUp] = useState(false)
  const [animationComplete, setAnimationComplete] = useState(false)

  /**
   * start → end (경험치 / width) 애니메이션
   */
  const animateExp = (
    start: number,
    end: number,
    duration: number,
    onFinish?: () => void
  ) => {
    const steps = 60
    const interval = duration / steps
    const increment = (end - start) / steps

    let step = 0
    const id = setInterval(() => {
      step++

      const value = start + increment * step

      // 숫자 증가
      setDisplayExp(Math.min(value, end))

      // width 증가
      setProgressWidth(Math.min((value / requiredXP) * 100, 100))

      if (step >= steps) {
        clearInterval(id)

        setDisplayExp(end)
        setProgressWidth((end / requiredXP) * 100)

        onFinish?.()
      }
    }, interval)
  }

  /**
   * 전체 동작: (레벨업이면 2단계, 아니면 1단계)
   */
  useEffect(() => {
    if (!isLevelUp) {
      // 단일 애니메이션
      animateExp(startExp, finalExp, 1500, () => setAnimationComplete(true))
      return
    }

    // 🔥 레벨업 애니메이션 2단계

    // 1단계: startExp → requiredXP (이전 레벨 끝까지)
    animateExp(startExp, requiredXP, 1200, () => {
      // 잠깐 멈추기
      setTimeout(() => {
        // 2단계 시작 전 초기화
        setDisplayExp(0)
        setProgressWidth(0)

        // 2단계: 0 → finalExp (새 레벨에서 다시 채우기)
        animateExp(0, finalExp, 1200, () => {
          setShowLevelUp(true)
          setTimeout(() => {
            setShowLevelUp(false)
            setAnimationComplete(true)
          }, 2500)
        })
      }, 300)
    })
  }, [])

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
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
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
                  {Math.round(displayExp)} / {requiredXP} XP
                </span>
              </div>

              <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden border-2 border-gray-200 shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-end pr-3 shadow-lg"
                  animate={{ width: `${progressWidth}%` }}
                  transition={{ duration: 0 }}
                >
                  <span className="text-white text-sm drop-shadow-md">
                    {Math.round(progressWidth)}%
                  </span>
                </motion.div>
              </div>
            </div>

            {/* 획득 경험치 / 포인트 */}
            <div className="flex flex-col items-center gap-3 mb-6">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-full shadow-md"
              >
                <Sparkles className="w-5 h-5 text-green-600" />
                <span className="text-lg">
                  <span className="text-green-600">+{earnedExp}</span> XP
                </span>
              </motion.div>

              {isLevelUp && earnedPoints > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-full shadow-md"
                >
                  <Gift className="w-5 h-5 text-purple-600" />
                  <span className="text-lg">
                    <span className="text-purple-600">+{earnedPoints}</span> 포인트
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

                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full blur-3xl"
                />

                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [0, 1, 0],
                      x: [0, Math.cos((i * Math.PI * 2) / 8) * 150],
                      y: [0, Math.sin((i * Math.PI * 2) / 8) * 150],
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  >
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                  </motion.div>
                ))}

                <motion.div
                  animate={{ y: [-20, 0, -20] }}
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

      </div>
    </div>
  )
}
