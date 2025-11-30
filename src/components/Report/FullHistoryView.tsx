import { useEffect, useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
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
} from "lucide-react";
import axios from "../api/axiosConfig"

interface HistoryItem {
  id: string
  type: string
  topic: string
  category: string
  examType: string
  date: string
  time: string
  score: number
  total: number
  duration: number
  trend: string
}

const ITEMS_PER_PAGE = 10;

export function FullHistoryView() {
  const [currentPage, setCurrentPage] = useState(1);
  const [historyData, setHistoryData] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  // type 필터 조정
  const [typeFilter, setTypeFilter] = useState<"all" | "Micro" | "Review" | "Assist" | "카테고리" | "난이도" | "약점">("all")

  async function fetchFullHistory() {
    try {
      setLoading(true)
      const userId = localStorage.getItem("userId")

      const res = await axios.get("/progress/report/recent-records", {
        params: { userId }
      })

      // records → HistoryItem 포맷으로 변환
      const mapped = res.data.records.map((r: any, idx: number) => ({
        id: `rec_${idx}`,
        type: r.type,                 // Micro, Review, Assist
        topic: r.partTitle,           // UI에서 기대하는 필드명으로 변경
        category: "정보처리기사",
        examType: "written",          // ← 서버가 주지 않으니 기본값(추후 변경 가능)
        date: r.date,
        time: "00:00",                // 시간 없음 → 기본값
        score: r.correct,
        total: r.total,
        duration: 0,                  // duration 없음 → 0
        trend: "neutral"
      }))

      setHistoryData(mapped)

    } catch (err) {
      console.error(err)
      setHistoryData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFullHistory()
  }, [])

  // Filter 
  const filteredData =
    typeFilter === "all"
      ? historyData
      : historyData.filter(item => item.type === typeFilter)

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentItems = filteredData.slice(startIndex, endIndex)
  
  // Get badge color based on type
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "Micro":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "Review":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "카테고리":
        return "bg-green-100 text-green-700 border-green-200";
      case "난이도":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "약점":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // Calculate percentage
  const getPercentage = (score: number, total: number) => {
    return Math.round((score / total) * 100);
  };

  // Get performance color
  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 70) return "text-blue-600";
    if (percentage >= 50) return "text-orange-600";
    return "text-red-600";
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("ellipsis");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("ellipsis");
        pages.push(totalPages);
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
                총 {filteredData.length}개의 학습 기록이 있습니다 📚
              </p>
            </div>

            {/* Exam Type Filter */}
            <Tabs value={typeFilter} onValueChange={(v) => {
              setTypeFilter(v as any)
              setCurrentPage(1)
            }}>
              <TabsList className="bg-purple-100">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  전체
                </TabsTrigger>
                <TabsTrigger value="Micro">Micro</TabsTrigger>
                <TabsTrigger value="Review">Review</TabsTrigger>
                <TabsTrigger value="Assist">Assist</TabsTrigger>
                <TabsTrigger value="카테고리">카테고리</TabsTrigger>
                <TabsTrigger value="난이도">난이도</TabsTrigger>
                <TabsTrigger value="약점">약점</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-4 mb-8">
          {currentItems.map((item) => {
            const percentage = getPercentage(item.score, item.total);
            const isPassed = percentage >= 60;

            return (
              <Card
                key={item.id}
                className="p-6 border-2 hover:border-purple-300 transition-all cursor-pointer hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-6">
                  {/* Left: Main Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className={`${getTypeBadgeColor(item.type)} border`}>
                        {item.type}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={item.examType === "written"
                          ? "border-blue-300 text-blue-700 bg-blue-50"
                          : "border-green-300 text-green-700 bg-green-50"
                        }
                      >
                        {item.examType === "written" ? (
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
                      {item.trend === "up" && (
                        <Badge className="bg-green-100 text-green-700 border border-green-200">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          상승
                        </Badge>
                      )}
                      {item.trend === "down" && (
                        <Badge className="bg-red-100 text-red-700 border border-red-200">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          하락
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-gray-900 mb-2">{item.topic}</h3>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {item.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {item.time}
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        {item.duration}분
                      </div>
                    </div>
                  </div>

                  {/* Right: Score Display */}
                  <div className="flex flex-col items-end gap-2">
                    <div className={`flex items-center gap-2 ${getPerformanceColor(percentage)}`}>
                      {isPassed ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                      <span className="text-3xl">{percentage}%</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {item.score} / {item.total} 문제
                    </div>
                    <Badge
                      className={
                        percentage >= 90
                          ? "bg-green-100 text-green-700"
                          : percentage >= 70
                            ? "bg-blue-100 text-blue-700"
                            : percentage >= 50
                              ? "bg-orange-100 text-orange-700"
                              : "bg-red-100 text-red-700"
                      }
                    >
                      {percentage >= 90 ? "🌟 완벽" :
                        percentage >= 70 ? "😊 우수" :
                          percentage >= 50 ? "🙂 보통" : "😅 노력"}
                    </Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>

                {getPageNumbers().map((pageNum, idx) => (
                  <PaginationItem key={idx}>
                    {pageNum === "ellipsis" ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNum as number)}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Empty State */}
        {filteredData.length === 0 && (
          <Card className="p-12 text-center border-2 border-dashed border-gray-300">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-gray-900 mb-2">학습 기록이 없습니다</h3>
            <p className="text-gray-600">
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
