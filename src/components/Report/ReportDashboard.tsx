import { useState, useEffect } from "react"
import axios from "../api/axiosConfig"

import { Card } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Sparkles,
  FileText,
  Code
} from "lucide-react"
import { useNavigate } from "react-router-dom"

const recentResults = [
  { id: "r1", type: "Micro", topic: "데이터베이스 기초", date: "2025-10-22", score: 89, total: 9 },
  { id: "r2", type: "Review", topic: "네트워크", date: "2025-10-21", score: 75, total: 20 },
  { id: "r3", type: "카테고리", topic: "OOP 종합", date: "2025-10-20", score: 82, total: 20 },
  { id: "r4", type: "Micro", topic: "객체지향", date: "2025-10-19", score: 67, total: 9 },
]

export function ReportDashboard() {

  const [examType, setExamType] = useState<"written" | "practical">("written")
  const [tagStats, setTagStats] = useState<any[]>([])
  const [weaknessTags, setWeaknessTags] = useState<string[]>([])
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<any | null>(null)
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [recentRecords, setRecentRecords] = useState<any[]>([])
  const [recentLoading, setRecentLoading] = useState(true)
  const navigate = useNavigate()



  // userId는 나중에 토큰 기반으로 제거됨. 지금은 임시 유지
  const userId = localStorage.getItem("userId")

  async function fetchReport(mode: "written" | "practical") {
    try {
      setLoading(true)

      const res = await axios.get("/progress/report/ability-by-tag", {
        params: {
          userId,
          mode: mode === "written" ? "WRITTEN" : "PRACTICAL",
          limit: 10
        }
      })

      const data = res.data

      setTagStats(
        data.items.map((item: any) => ({
          tag: item.tag,
          total: item.total,
          correct: item.correct,
          proficiency: Math.round(item.accuracy),
        }))
      )

      setWeaknessTags(data.weaknessTags)
      setMessage(data.message)

    } catch (error: any) {
      console.error(error)
      setTagStats([])
      setWeaknessTags([])
      setMessage("데이터를 불러오는 중 오류가 발생했습니다")
    } finally {
      setLoading(false)
    }
  }

  async function fetchOverview() {
    try {
      setOverviewLoading(true)

      const res = await axios.get("/progress/report/overview", {
        params: {
          userId,
          mode: "WRITTEN" // 실제로는 무관. 뒤에서 제거 예정
        }
      })

      setOverview(res.data)

    } catch (err) {
      console.error(err)
      setOverview(null)
    } finally {
      setOverviewLoading(false)
    }
  }

  async function fetchRecentRecords() {
    try {
      setRecentLoading(true)

      const res = await axios.get("/progress/report/recent-records", {
        params: {
          userId,
          limit: 4
        }
      })

      setRecentRecords(res.data.records || [])

    } catch (err) {
      console.error(err)
      setRecentRecords([])
    } finally {
      setRecentLoading(false)
    }
  }



  // 처음 로딩 + examType 변경 시 다시 호출
  useEffect(() => {
    fetchReport(examType)
  }, [examType])

  useEffect(() => {
    fetchOverview()
    fetchRecentRecords()
  }, [])

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-purple-600" />
            <h1 className="text-purple-900">학습 리포트</h1>
          </div>
          <p className="text-gray-600">나의 학습 현황을 확인하고 분석해보세요!</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

          {/* 총 학습 시간 */}
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-purple-900">총 학습 시간</h3>
              <Clock className="w-5 h-5 text-purple-600" />
            </div>

            {overviewLoading ? (
              <p className="text-gray-500">불러오는 중...</p>
            ) : (
              <>
                <div className="text-purple-600">
                  <span className="text-3xl">
                    {Math.floor((overview?.totalStudyMinutes || 0) / 60)}
                  </span>
                  <span className="text-sm ml-2">시간</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  지난 주 대비 {Math.floor(((overview?.totalStudyMinutesThisWeek || 0) - (overview?.totalStudyMinutesLastWeek || 0)) / 60)}h
                </p>
              </>
            )}
          </Card>

          {/* 총 문제 수 */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-blue-900">총 문제 수</h3>
              <Target className="w-5 h-5 text-blue-600" />
            </div>

            {overviewLoading ? (
              <p className="text-gray-500">불러오는 중...</p>
            ) : (
              <>
                <div className="text-blue-600">
                  <span className="text-3xl">{overview?.totalProblems || 0}</span>
                  <span className="text-sm ml-2">문제</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  이번 주: {overview?.problemsThisWeek || 0}문제
                </p>
              </>
            )}
          </Card>

          {/* 평균 정답률 */}
          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-green-900">평균 정답률</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>

            {overviewLoading ? (
              <p className="text-gray-500">불러오는 중...</p>
            ) : (
              <>
                <div className="text-green-600">
                  <span className="text-3xl">{overview?.avgAccuracy || 0}</span>
                  <span className="text-sm ml-2">%</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  지난 주 대비 {overview?.weekAccuracyDelta || 0}%
                </p>
              </>
            )}
          </Card>

          {/* 연속 학습 */}
          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-yellow-900">연속 학습</h3>
              <Sparkles className="w-5 h-5 text-yellow-600" />
            </div>

            {overviewLoading ? (
              <p className="text-gray-500">불러오는 중...</p>
            ) : (
              <>
                <div className="text-yellow-600">
                  <span className="text-3xl">{overview?.streakDays || 0}</span>
                  <span className="text-sm ml-2">일</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  🔥 잘하고 있어요!
                </p>
              </>
            )}
          </Card>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 태그 분석 */}
          <div className="lg:col-span-2">
            <Card className="p-6 border-2 border-purple-200">

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-purple-900">태그별 능력지수</h2>

                <Tabs value={examType} onValueChange={(v) => setExamType(v as "written" | "practical")} className="w-auto">
                  <TabsList className="bg-purple-100">
                    <TabsTrigger value="written" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" /> 필기
                    </TabsTrigger>
                    <TabsTrigger value="practical" className="flex items-center gap-2">
                      <Code className="w-4 h-4" /> 실기
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* 데이터 로딩 */}
              {loading && <p className="text-gray-600">불러오는 중...</p>}

              {/* 데이터 부족 */}
              {!loading && tagStats.length === 0 && (
                <Card className="p-6 bg-pink-50 border-2 border-pink-200">
                  <p className="text-gray-700 text-center">{message}</p>
                </Card>
              )}

              {/* 데이터 있을 때 */}
              {!loading && tagStats.length > 0 && (
                <div className="space-y-4">
                  {tagStats.map((stat: any) => (
                    <div key={stat.tag} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-800">#{stat.tag}</span>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">
                            {stat.correct}/{stat.total}
                          </span>

                          <Badge
                            variant="secondary"
                            className={
                              stat.proficiency >= 80
                                ? "bg-green-100 text-green-700"
                                : stat.proficiency >= 60
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                            }
                          >
                            {stat.proficiency}%
                          </Badge>
                        </div>
                      </div>

                      <Progress value={stat.proficiency} className="h-2" />
                    </div>
                  ))}
                </div>
              )}

              {/* 약점 분석 */}
              <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">💡</div>
                  <div>
                    <h3 className="text-red-900 mb-2">
                      약점 분석 ({examType === "written" ? "필기" : "실기"})
                    </h3>

                    {weaknessTags.length === 0 ? (
                      <p className="text-sm text-gray-700">{message}</p>
                    ) : (
                      <p className="text-sm text-gray-700">
                        {weaknessTags.join(", ")} 태그의 정답률이 낮습니다.
                        {" "}약점 보완 퀴즈로 집중 학습을 추천합니다!
                      </p>
                    )}
                  </div>
                </div>
              </div>

            </Card>
          </div>

          {/* Recent Results SIDE */}
          <div>
            <Card className="p-6 border-2 border-purple-200">
              <h2 className="text-purple-900 mb-6">최근 학습 결과</h2>

              {/* Loading */}
              {recentLoading && (
                <p className="text-gray-600">불러오는 중...</p>
              )}

              {/* No Data */}
              {!recentLoading && recentRecords.length === 0 && (
                <p className="text-gray-600 text-center">최근 학습 기록이 없습니다</p>
              )}

              {/* Records */}
              {!recentLoading && recentRecords.length > 0 && (
                <div className="space-y-4">
                  {recentRecords.map((r, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge
                          variant="secondary"
                          className={
                            r.type === "Micro"
                              ? "bg-purple-100 text-purple-700"
                              : r.type === "Review"
                                ? "bg-blue-100 text-blue-700"
                                : r.type === "Assist"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                          }
                        >
                          {r.type}
                        </Badge>

                        <span className="text-xs text-gray-500">
                          {r.date}
                        </span>
                      </div>

                      <h4 className="text-gray-900 mb-2">{r.partTitle}</h4>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {r.accuracy}% 정답률
                        </span>

                        <span className="text-sm text-gray-600">
                          {r.correct}/{r.total}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button variant="outline" className="w-full mt-4" onClick={()=> navigate(`/report/history`)}>
                전체 기록 보기
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
