import { useEffect, useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  FileText,
  Code,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
} from "lucide-react";
import axios from "../api/axiosConfig"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { ActivityDetail, ActivityListResponse, ActivityDetailResponse } from "../../types"
import { useNavigate } from "react-router-dom"

const ITEMS_PER_PAGE = 10;

export function FullHistoryView() {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(0); // API는 0부터 시작
  const [historyData, setHistoryData] = useState<ActivityDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  // activityGroup 필터 조정
  const [typeFilter, setTypeFilter] = useState<"all" | "MAIN" | "ASSIST" | "BATTLE">("all")
  const [selectedActivity, setSelectedActivity] = useState<ActivityDetailResponse | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  async function fetchFullHistory(page: number = 0) {
    try {
      setLoading(true)

      const res = await axios.get<ActivityListResponse>("/progress/activity/list", {
        params: {
          page,
          size: ITEMS_PER_PAGE
        }
      })

      setHistoryData(res.data.content || [])
      setTotalPages(res.data.totalPages || 0)
      setTotalElements(res.data.totalElements || 0)

    } catch (err) {
      console.error(err)
      setHistoryData([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFullHistory(currentPage)
  }, [currentPage])

  // Filter (클라이언트 사이드 필터링)
  const filteredData =
    typeFilter === "all"
      ? historyData
      : historyData.filter(item => item.activityGroup === typeFilter)

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function fetchActivityDetail(activityId: number) {
    try {
      setDetailLoading(true)
      const res = await axios.get<ActivityDetailResponse>(`/progress/activity/${activityId}`)
      setSelectedActivity(res.data)
    } catch (err) {
      console.error(err)
      setSelectedActivity(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleActivityClick = (activity: ActivityDetail) => {
    setModalOpen(true)
    fetchActivityDetail(activity.activityId)
  }

  // Get badge color based on activityGroup
  const getActivityGroupBadgeColor = (activityGroup: string) => {
    switch (activityGroup) {
      case "MAIN":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "ASSIST":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "BATTLE":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // Get activityGroup display name
  const getActivityGroupDisplayName = (activityGroup: string) => {
    switch (activityGroup) {
      case "MAIN":
        return "Main";
      case "ASSIST":
        return "Assist";
      case "BATTLE":
        return "Battle";
      default:
        return activityGroup;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  // Get performance color
  const getPerformanceColor = (percentage?: number) => {
    if (percentage === undefined) return "text-gray-600"
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 70) return "text-blue-600";
    if (percentage >= 50) return "text-orange-600";
    return "text-red-600";
  };

  // Generate page numbers to show (0-based to 1-based for display)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    const displayCurrentPage = currentPage + 1; // 0-based to 1-based
    const displayTotalPages = totalPages;

    if (displayTotalPages <= maxVisible) {
      for (let i = 1; i <= displayTotalPages; i++) {
        pages.push(i);
      }
    } else {
      if (displayCurrentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(displayTotalPages);
      } else if (displayCurrentPage >= displayTotalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = displayTotalPages - 3; i <= displayTotalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("ellipsis");
        pages.push(displayCurrentPage - 1);
        pages.push(displayCurrentPage);
        pages.push(displayCurrentPage + 1);
        pages.push("ellipsis");
        pages.push(displayTotalPages);
      }
    }

    return pages;
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4 -ml-2"
            onClick={() => navigate("/report")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로 가기
          </Button>

          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-8 h-8 text-purple-600" />
                <h1 className="text-purple-900">전체 학습 기록</h1>
              </div>
              <p className="text-gray-600">
                총 {totalElements}개의 학습 기록이 있습니다 📚
              </p>
            </div>

            {/* Activity Group Filter */}
            <Tabs value={typeFilter} onValueChange={(v) => {
              setTypeFilter(v as any)
              setCurrentPage(0)
            }}>
              <TabsList className="bg-purple-100">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  전체
                </TabsTrigger>
                <TabsTrigger value="MAIN">Main</TabsTrigger>
                <TabsTrigger value="ASSIST">Assist</TabsTrigger>
                <TabsTrigger value="BATTLE">Battle</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-4 mb-8">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">불러오는 중...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <Card className="p-12 text-center border-2 border-dashed border-gray-300">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-gray-900 mb-2">학습 기록이 없습니다</h3>
            </Card>
          ) : (
            filteredData.map((item) => {
              const percentage = item.accuracyPct;
              const isPassed = percentage !== undefined && percentage >= 60;

              return (
                <Card
                  key={item.activityId}
                  onClick={() => handleActivityClick(item)}
                  className="p-6 border-2 hover:border-purple-300 transition-all hover:shadow-lg cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-6">
                    {/* Left: Main Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className={`${getActivityGroupBadgeColor(item.activityGroup)} border`}>
                          {getActivityGroupDisplayName(item.activityGroup)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={item.mode === "WRITTEN"
                            ? "border-blue-300 text-blue-700 bg-blue-50"
                            : "border-green-300 text-green-700 bg-green-50"
                          }
                        >
                          {item.mode === "WRITTEN" ? (
                            <>
                              <FileText className="w-3 h-3 mr-1" />
                              필기
                            </>
                          ) : (
                            <>
                              <Code className="w-3 h-3 mr-1" />
                              실기
                            </>
                          )}
                        </Badge>
                        {item.assistType && (
                          <Badge variant="outline" className="bg-gray-50">
                            {item.assistType}
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-gray-900 mb-2">
                        {item.topicName || item.weaknessTagName || "학습 활동"}
                      </h3>

                      <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(item.performedAt)}
                        </div>
                        {item.difficulty && (
                          <div className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            난이도: {item.difficulty}
                          </div>
                        )}
                        {item.weaknessTagName && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            약점: {item.weaknessTagName}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Right: Score Display */}
                    <div className="flex flex-col items-end gap-2">
                      {percentage !== undefined ? (
                        <div className={`flex items-center gap-2 ${getPerformanceColor(percentage)}`}>
                          {isPassed ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <XCircle className="w-5 h-5" />
                          )}
                          <span className="text-3xl">{percentage.toFixed(1)}%</span>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">정보 없음</div>
                      )}
                      {item.finalRank !== null && item.finalRank !== undefined && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Award className="w-4 h-4 text-yellow-600" />
                          {item.finalRank}위
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
                    className={currentPage === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>

                {getPageNumbers().map((pageNum, idx) => (
                  <PaginationItem key={idx}>
                    {pageNum === "ellipsis" ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        onClick={() => handlePageChange((pageNum as number) - 1)} // 1-based to 0-based
                        isActive={currentPage + 1 === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))}
                    className={currentPage >= totalPages - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Activity Detail Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="w-[70vw] max-w-[90vw] !sm:max-w-[90vw] !max-w-[90vw] max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>학습 상세 정보</DialogTitle>
            <DialogDescription>
              학습 활동의 자세한 정보를 확인하세요
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="py-8 text-center">
              <p className="text-gray-600">정보를 불러오는 중...</p>
            </div>
          ) : selectedActivity ? (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={getActivityGroupBadgeColor(selectedActivity.header.activityGroup)}>
                  {getActivityGroupDisplayName(selectedActivity.header.activityGroup)}
                </Badge>
                <Badge variant="outline" className="bg-gray-50">
                  {selectedActivity.header.mainType}
                </Badge>
                {selectedActivity.header.assistType && (
                  <Badge variant="outline" className="bg-gray-50">
                    {selectedActivity.header.assistType}
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={selectedActivity.header.mode === "WRITTEN"
                    ? "border-blue-300 text-blue-700 bg-blue-50"
                    : "border-green-300 text-green-700 bg-green-50"
                  }
                >
                  {selectedActivity.header.mode === "WRITTEN" ? (
                    <>
                      <FileText className="w-3 h-3 mr-1" />
                      필기
                    </>
                  ) : (
                    <>
                      <Code className="w-3 h-3 mr-1" />
                      실기
                    </>
                  )}
                </Badge>
              </div>

              {/* 상세 정보 */}
              {(selectedActivity.header.topicName || selectedActivity.header.weaknessTagName || selectedActivity.header.difficulty) && (
                <Card className="p-4 border-2">
                  <h3 className="font-semibold mb-3 text-gray-900">상세 정보</h3>
                  <div className="space-y-2">
                    {selectedActivity.header.topicName && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">주제</span>
                        <span className="text-sm font-medium text-gray-900">{selectedActivity.header.topicName}</span>
                      </div>
                    )}
                    {selectedActivity.header.weaknessTagName && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">약점 태그</span>
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          {selectedActivity.header.weaknessTagName}
                        </Badge>
                      </div>
                    )}
                    {selectedActivity.header.difficulty && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">난이도</span>
                        <Badge variant="outline">
                          {selectedActivity.header.difficulty}
                        </Badge>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* 성과 정보 */}
              <Card className="p-4 border-2">
                <h3 className="font-semibold mb-3 text-gray-900">학습 성과</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">정답률</span>
                      <span className={`text-sm font-semibold ${selectedActivity.header.accuracyPct >= 90 ? "text-green-600" :
                          selectedActivity.header.accuracyPct >= 70 ? "text-blue-600" :
                            selectedActivity.header.accuracyPct >= 50 ? "text-orange-600" :
                              "text-red-600"
                        }`}>
                        {selectedActivity.header.accuracyPct.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={selectedActivity.header.accuracyPct}
                      className="h-2"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">정답 수</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {selectedActivity.header.correctCount} / {selectedActivity.header.questionCount}
                    </span>
                  </div>
                  {selectedActivity.header.finalRank !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">최종 순위</span>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-semibold text-gray-900">
                          {selectedActivity.header.finalRank}위
                        </span>
                      </div>
                    </div>
                  )}
                  {selectedActivity.header.xpGained > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">획득 경험치</span>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-semibold text-purple-700">
                          +{selectedActivity.header.xpGained} XP
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* 문제 목록 */}
              {selectedActivity.questions && selectedActivity.questions.length > 0 && (
                <Card className="p-4 border-2">
                  <h3 className="font-semibold mb-3 text-gray-900">문제 내역</h3>
                  <div className="space-y-4">
                    {selectedActivity.questions.map((question) => (
                      <div
                        key={question.questionId}
                        className={`p-4 rounded-lg border-2 ${question.isCorrect
                            ? "bg-green-50 border-green-200"
                            : "bg-red-50 border-red-200"
                          }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-600">
                              {question.order}번
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {question.questionType}
                            </Badge>
                            {question.isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {Math.round(question.timeTakenMs / 1000)}초
                            </span>
                            <Badge
                              className={
                                question.isCorrect
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }
                            >
                              {question.score}점
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm text-gray-900 mb-2 prose prose-sm max-w-none overflow-x-auto">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {question.stem}
                          </ReactMarkdown>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div>
                            <span className="text-gray-600">내 답: </span>
                            <span className={`font-medium ${question.isCorrect ? "text-green-700" : "text-red-700"
                              }`}>
                              {question.myAnswer}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">정답: </span>
                            <span className="font-medium text-gray-900">
                              {question.correctAnswer}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* 시간 정보 */}
              <Card className="p-4 bg-gray-50 border-gray-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">학습 시간</span>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {formatDate(selectedActivity.header.performedAt)}
                </p>
              </Card>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-600">정보를 불러올 수 없습니다</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
