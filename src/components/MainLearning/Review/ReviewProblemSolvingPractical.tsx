import { useState, useEffect } from "react"
import { Card } from "../../ui/card"
import { Button } from "../../ui/button"
import { Badge } from "../../ui/badge"
import { Progress } from "../../ui/progress"
import { Input } from "../../ui/input"
import { Popover, PopoverTrigger, PopoverContent } from "../../ui/popover"
import { motion } from "motion/react"
import { CheckCircle2, XCircle, ArrowRight, Sparkles, Loader2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import axios from "../../api/axiosConfig"
import { getTagsByCodes } from "../../api/tagApi"

interface ReviewQuestion {
  id: number
  stem: string
  imageUrl: string | null
  type?: string
  tags?: Array<{ code: string; labelKo: string; labelEn?: string; description?: string; domain: string; orderNo: number }> | string[]
}

interface ReviewProblemSolvingPracticalProps {
  questions: ReviewQuestion[]
  topicName: string
  rootTopicId: number
  learningSessionId: number
  onComplete: () => void
}

export function ReviewProblemSolvingPractical({
  questions,
  topicName,
  rootTopicId,
  learningSessionId,
  onComplete,
}: ReviewProblemSolvingPracticalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [typedAnswer, setTypedAnswer] = useState("")
  const [showResult, setShowResult] = useState(false)
  const [isGrading, setIsGrading] = useState(false)
  const [gradeResult, setGradeResult] = useState<{
    correct: boolean
    answerKey: string
    baseExplanation: string
    aiExplanation: string
    aiExplanationFailed: boolean
  } | null>(null)
  const [tagDescriptions, setTagDescriptions] = useState<Record<string, string>>({})

  // 문제 비었을 때 방어
  if (!questions || questions.length === 0) {
    return (
      <div className="p-8 text-center text-gray-600">
        <p>실기 문제가 없습니다 😢</p>
      </div>
    )
  }

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

  const handleSubmit = async () => {
    if (showResult || !typedAnswer.trim() || isGrading) return
    
    setIsGrading(true)

    try {
      // 실기 Review 모드 한 문제씩 채점 API 호출
      const res = await axios.post(
        `/study/practical/review/grade-one`,
        {
          rootTopicId: rootTopicId,
          questionId: currentQuestion.id,
          userText: typedAnswer.trim()
        },
        {
          params: { sessionId: learningSessionId }
        }
      )

      const result = res.data
      setGradeResult({
        correct: result.correct || false,
        answerKey: result.answerKey || "",
        baseExplanation: result.baseExplanation || "",
        aiExplanation: result.aiExplanation || "",
        aiExplanationFailed: result.aiExplanationFailed || false
      })

      setShowResult(true)
    } catch (err) {
      console.error("채점 API 오류:", err)
      // 에러 발생 시 기본 처리
      setGradeResult({
        correct: false,
        answerKey: "",
        baseExplanation: "채점 중 오류가 발생했습니다.",
        aiExplanation: "",
        aiExplanationFailed: false
      })
      setShowResult(true)
    } finally {
      setIsGrading(false)
    }
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setTypedAnswer("")
      setShowResult(false)
      setGradeResult(null)
    } else {
      // 마지막 문제 완료 시 onComplete 호출
      onComplete()
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-orange-500 text-white">{topicName}</Badge>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              실기
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-orange-600" />
            <h1 className="text-orange-900">Review 실기 문제풀이</h1>
          </div>
          <p className="text-gray-600 mt-2">실전 문제로 실력을 다져보세요!</p>
        </div>

        {/* Progress */}
        <Card className="p-4 mb-6 bg-white border-2 border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">
              문제 {currentIndex + 1} / {questions.length}
            </span>
            <span className="text-orange-600">
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
          <Card className="p-8 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 mb-6">
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

            <div className="text-orange-900 mb-6 prose prose-sm max-w-none overflow-x-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentQuestion.stem || ""}</ReactMarkdown>
            </div>

            <div className="space-y-4">
              <Input
                type="text"
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !showResult && !isGrading) handleSubmit()
                }}
                placeholder="정답을 입력하세요..."
                disabled={showResult || isGrading}
                className="w-full p-4 text-lg border-2 border-orange-200 focus:border-orange-400"
              />

              {!showResult && !isGrading && (
                <Button
                  onClick={handleSubmit}
                  disabled={!typedAnswer.trim()}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                >
                  답안 제출
                </Button>
              )}

              {isGrading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-3 p-6 bg-orange-100 rounded-lg"
                >
                  <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />
                  <span className="text-orange-800">채점 중...</span>
                </motion.div>
              )}

              {showResult && gradeResult && (
                <div
                  className={`p-4 rounded-lg border-2 ${
                    gradeResult.correct
                      ? "bg-green-50 border-green-300"
                      : "bg-red-50 border-red-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {gradeResult.correct ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span
                      className={gradeResult.correct ? "text-green-900" : "text-red-900"}
                    >
                      {gradeResult.correct ? "정답입니다!" : "오답입니다!"}
                    </span>
                  </div>
                  {!gradeResult.correct && gradeResult.answerKey && (
                    <p className="text-gray-700">
                      정답:{" "}
                      <span className="text-green-700">
                        {gradeResult.answerKey}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {showResult && gradeResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card
                className={`p-6 mb-6 border-2 ${
                  gradeResult.correct
                    ? "bg-green-50 border-green-300"
                    : "bg-red-50 border-red-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {gradeResult.correct ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3
                      className={
                        gradeResult.correct
                          ? "text-green-900 mb-2"
                          : "text-red-900 mb-2"
                      }
                    >
                      {gradeResult.correct ? "정답이에요!" : "틀렸어요!"}
                    </h3>
                    {(gradeResult.aiExplanation || gradeResult.baseExplanation) && (
                      <>
                        {!gradeResult.aiExplanationFailed && gradeResult.aiExplanation && (
                          <Badge
                            variant="secondary"
                            className="bg-orange-100 text-orange-700 mb-2"
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI 해설
                          </Badge>
                        )}
                        <p className="text-gray-700 mt-2 whitespace-pre-wrap">
                          {gradeResult.aiExplanationFailed
                            ? (gradeResult.baseExplanation || "해설이 없습니다.")
                            : (gradeResult.aiExplanation || gradeResult.baseExplanation || "해설이 없습니다.")}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={handleNext}
                  size="lg"
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
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
