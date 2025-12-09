import { useState, useEffect } from "react"
import { Card } from "../../ui/card"
import { Button } from "../../ui/button"
import { Badge } from "../../ui/badge"
import { Progress } from "../../ui/progress"
import { Popover, PopoverTrigger, PopoverContent } from "../../ui/popover"
import { motion } from "motion/react"
import { CheckCircle2, XCircle, ArrowRight, Sparkles, Loader2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import axios from "../../api/axiosConfig"
import { getTagsByCodes } from "../../api/tagApi"

interface ReviewQuestion {
  id: number
  stem: string
  choices: { label: string; content: string }[]
  imageUrl: string | null
  tags?: Array<{ code: string; labelKo: string; labelEn?: string; description?: string; domain: string; orderNo: number }> | string[]
}

interface ReviewProblemSolvingProps {
  questions: ReviewQuestion[]
  rootTopicId: number
  learningSessionId: number
  onComplete: () => void
}

export function ReviewProblemSolving({ 
  questions, 
  rootTopicId, 
  learningSessionId, 
  onComplete 
}: ReviewProblemSolvingProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isGrading, setIsGrading] = useState(false)
  const [gradeResult, setGradeResult] = useState<{
    correct: boolean
    correctLabel: string
    explanation: string
  } | null>(null)
  const [tagDescriptions, setTagDescriptions] = useState<Record<string, string>>({})

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100

  // 태그 설명 로드
  useEffect(() => {
    const loadTagDescriptions = async () => {
      if (!currentQuestion?.tags || currentQuestion.tags.length === 0) return;

      // 태그 코드 추출
      const tagCodes = currentQuestion.tags
        .map(tag => typeof tag === 'object' && tag !== null && 'code' in tag ? tag.code : null)
        .filter((code): code is string => code !== null);

      if (tagCodes.length === 0) return;

      // 이미 로드된 태그는 스킵
      const missingCodes = tagCodes.filter(code => !tagDescriptions[code]);
      if (missingCodes.length === 0) return;

      try {
        const tags = await getTagsByCodes(missingCodes);
        const newDescriptions: Record<string, string> = {};
        tags.forEach(tag => {
          if (tag.description) {
            newDescriptions[tag.code] = tag.description;
          }
        });
        setTagDescriptions(prev => ({ ...prev, ...newDescriptions }));
      } catch (err) {
        console.error("태그 설명 로드 실패:", err);
      }
    };

    loadTagDescriptions();
  }, [currentQuestion?.tags, currentIndex]);

  const handleAnswer = async (label: string) => {
    if (showResult || isGrading) return
    
    setSelectedAnswer(label)
    setIsGrading(true)

    try {
      // grade-one API 호출 (한 문제씩 즉시 채점)
      const res = await axios.post(
        `/study/written/mcq/grade-one`,
        {
          topicId: rootTopicId,
          questionId: currentQuestion.id,
          label: label
        },
        {
          params: { sessionId: learningSessionId }
        }
      )

      const result = res.data
      setGradeResult({
        correct: result.correct,
        correctLabel: result.correctLabel,
        explanation: result.explanation || ""
      })

      setShowResult(true)
    } catch (err) {
      console.error("채점 API 오류:", err)
      // 에러 발생 시 기본 처리
      setGradeResult({
        correct: false,
        correctLabel: "",
        explanation: "채점 중 오류가 발생했습니다."
      })
      setShowResult(true)
    } finally {
      setIsGrading(false)
    }
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setGradeResult(null)
    } else {
      // 마지막 문제 완료 시 onComplete 호출
      onComplete()
    }
  }

  if (!currentQuestion) {
    return (
      <div className="p-8 text-center">
        <p>문제를 불러오는 중...</p>
      </div>
    )
  }

  const isCorrect = gradeResult?.correct || false
  const correctLabel = gradeResult?.correctLabel || ""

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-blue-500 text-white">총정리</Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              객관식
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-blue-600" />
            <h1 className="text-blue-900">Review 문제풀이</h1>
          </div>
          <p className="text-gray-600 mt-2">실전 문제로 실력을 다져보세요.</p>
        </div>

        {/* Progress */}
        <Card className="p-4 mb-6 bg-white border-2 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">
              문제 {currentIndex + 1} / {questions.length}
            </span>
            <span className="text-blue-600">
              문제 {currentIndex + 1} / {questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </Card>

        {/* Question */}
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8 bg-gradient-to-br from-blue-50 to-sky-50 border-2 border-blue-200 mb-6">
            {currentQuestion.imageUrl && (
              <div className="mb-6">
                <img 
                  src={currentQuestion.imageUrl} 
                  alt="문제 이미지" 
                  className="max-w-full h-auto rounded-lg"
                />
              </div>
            )}

            {/* 태그 뱃지 */}
            {currentQuestion.tags && currentQuestion.tags.length > 0 && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {currentQuestion.tags.map((tag, index) => {
                  const tagLabel = typeof tag === 'object' && tag !== null && 'labelKo' in tag 
                    ? tag.labelKo 
                    : typeof tag === 'string' 
                      ? tag 
                      : '';
                  const tagCode = typeof tag === 'object' && tag !== null && 'code' in tag 
                    ? tag.code 
                    : null;
                  const tagKey = tagCode || String(index);
                  const description = tagCode ? tagDescriptions[tagCode] : null;
                  
                  if (!tagLabel) return null;
                  
                  return (
                    <Badge 
                      key={tagKey} 
                      variant="outline" 
                      className="bg-blue-50 text-blue-700 border-blue-300 flex items-center gap-1"
                    >
                      {tagLabel}
                      {tagCode && description && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="ml-1 cursor-pointer hover:text-blue-900 transition-colors text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              ⓘ
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-3 text-sm">
                            <div className="font-semibold mb-1 text-blue-900">{tagLabel}</div>
                            <div className="text-gray-700">{description}</div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </Badge>
                  );
                })}
              </div>
            )}

            <h2 className="text-blue-900 mb-6">
              {currentQuestion.stem || "문제를 불러오는 중..."}
            </h2>

            <div className="space-y-3">
              {currentQuestion.choices.map((choice) => {
                const isSelected = selectedAnswer === choice.label
                const isCorrectAnswer = choice.label === correctLabel

                let buttonClass = "w-full p-4 text-left border-2 transition-all"

                if (!showResult && !isGrading) {
                  buttonClass += " hover:border-blue-400 hover:bg-white/60 cursor-pointer"
                } else if (isGrading && isSelected) {
                  // 제출 중일 때는 로딩 상태 표시 (보라색)
                  buttonClass += " border-purple-300 bg-purple-50"
                } else if (showResult && isCorrectAnswer) {
                  // 정답인 경우 초록색 표시 (showResult가 true일 때만)
                  buttonClass += " border-green-400 bg-green-50"
                } else if (showResult && isSelected && !isCorrect) {
                  // 오답인 경우 빨간색 표시 (showResult가 true일 때만)
                  buttonClass += " border-red-400 bg-red-50"
                } else {
                  buttonClass += " opacity-50"
                }

                return (
                  <motion.button
                    key={choice.label}
                    onClick={() => handleAnswer(choice.label)}
                    className={buttonClass}
                    disabled={showResult || isGrading}
                    whileHover={!showResult && !isGrading ? { scale: 1.02 } : {}}
                    whileTap={!showResult && !isGrading ? { scale: 0.98 } : {}}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                          {choice.label}
                        </div>
                        <span>{choice.content}</span>
                      </div>
                      {showResult && isCorrectAnswer && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                      {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600" />}
                      {isGrading && isSelected && <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </Card>

          {/* Explanation */}
          {showResult && gradeResult && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card
                className={`p-6 mb-6 border-2 ${isCorrect ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={isCorrect ? "text-green-900 mb-2" : "text-red-900 mb-2"}>
                      {isCorrect ? "정답이에요!" : "틀렸어요!"}
                    </h3>
                    {gradeResult.explanation && (
                      <div className="text-gray-700 prose prose-sm max-w-none">
                        <ReactMarkdown>{gradeResult.explanation}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={handleNext}
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                >
                  {currentIndex < questions.length - 1 ? "다음 문제" : "오답 보기"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

