import { useState, useEffect, useCallback } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  BookOpen,
  Calendar,
  DollarSign,
  Clock,
  Award,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { syncCertData, getExamSchedule, getQualificationInfo, getQualificationBasicInfo } from "../api/certInfoApi";
import type { ExamSchedule, QualificationInfoItem, QualificationBasicInfo } from "../api/certInfoApi";

// 시험 일정 변환 타입 (UI에서 사용)
interface ScheduleItem {
  year: string;
  round: string;
  writtenApplication: string;
  writtenExam: string;
  writtenResult: string;
  practicalApplication: string;
  practicalExam: string;
  finalResult: string;
}

export function CertInfoDashboard() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [certificationInfo, setCertificationInfo] = useState<{
    name: string;
    category: string;
    level: string;
    organization: string;
    examFee: {
      written: number;
      practical: number;
    };
    passingScore: {
      written: number;
      practical: number;
    };
    subjects: Array<{ name: string; questions: number }>;
  } | null>(null);
  const [isLoadingCertInfo, setIsLoadingCertInfo] = useState(false);
  const [qualificationInfoItems, setQualificationInfoItems] = useState<QualificationInfoItem[]>([]);
  const [basicInfo, setBasicInfo] = useState<QualificationBasicInfo | null>(null);
  const [isLoadingBasicInfo, setIsLoadingBasicInfo] = useState(false);

  // 날짜 포맷팅 헬퍼 함수
  const formatDateRange = useCallback((startDate: string, endDate: string): string => {
    if (startDate === endDate) {
      return startDate;
    }
    return `${startDate} ~ ${endDate}`;
  }, []);

  // API 응답을 UI 형식으로 변환
  const transformScheduleData = useCallback((apiData: ExamSchedule[]): ScheduleItem[] => {
    // implSeq로 그룹화 (같은 회차의 중복 데이터 제거)
    const grouped = new Map<string, ExamSchedule>();

    apiData.forEach((item) => {
      const key = `${item.implYy}-${item.implSeq}`;
      if (!grouped.has(key) || item.id > (grouped.get(key)?.id || 0)) {
        grouped.set(key, item);
      }
    });

    return Array.from(grouped.values())
      .sort((a, b) => {
        // 연도와 회차로 정렬
        const yearCompare = a.implYy.localeCompare(b.implYy);
        if (yearCompare !== 0) return yearCompare;
        return a.implSeq.localeCompare(b.implSeq);
      })
      .map((item) => ({
        year: item.implYy,
        round: `${item.implSeq}회`,
        writtenApplication: formatDateRange(item.docRegStartDt, item.docRegEndDt),
        writtenExam: item.docExamStartDt === item.docExamEndDt
          ? item.docExamStartDt
          : formatDateRange(item.docExamStartDt, item.docExamEndDt),
        writtenResult: item.docPassDt,
        practicalApplication: formatDateRange(item.pracRegStartDt, item.pracRegEndDt),
        practicalExam: item.pracExamStartDt === item.pracExamEndDt
          ? item.pracExamStartDt
          : formatDateRange(item.pracExamStartDt, item.pracExamEndDt),
        finalResult: item.pracPassDt,
      }));
  }, [formatDateRange]);

  // HTML 태그 제거 및 텍스트 정리
  const cleanHtmlContent = useCallback((html: string): string => {
    return html
      .replace(/<[^>]*>/g, "") // HTML 태그 제거
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#9312;/g, "①")
      .replace(/&#9313;/g, "②")
      .replace(/&#9314;/g, "③")
      .replace(/&#9315;/g, "④")
      .replace(/&#9316;/g, "⑤")
      .replace(/\s+/g, " ")
      .trim();
  }, []);

  // 자격증 정보 파싱
  const parseQualificationInfo = useCallback((items: QualificationInfoItem[]) => {
    const 취득방법 = items.find((item) => item.infogb === "취득방법");

    if (!취득방법) return null;

    const contents = cleanHtmlContent(취득방법.contents);

    // 기본 정보 추출
    const name = 취득방법.jmfldnm || "정보처리기사";
    const category = "국가기술자격";
    const level = "기사";

    // 시행처 추출
    const orgMatch = contents.match(/시\s*행\s*처\s*[:：]\s*([^②③④⑤]+)/);
    const organization = orgMatch ? orgMatch[1].trim() : "한국산업인력공단";

    // 필기 과목 추출
    const subjectsMatch = contents.match(/필기\s*[1-9]\s*\.\s*([^2-9]+)2\.\s*([^3]+)3\.\s*([^4]+)4\.\s*([^5]+)5\.\s*([^실기]+)/);
    const subjects = subjectsMatch
      ? [
        { name: subjectsMatch[1].trim(), questions: 20 },
        { name: subjectsMatch[2].trim(), questions: 20 },
        { name: subjectsMatch[3].trim(), questions: 20 },
        { name: subjectsMatch[4].trim(), questions: 20 },
        { name: subjectsMatch[5].trim(), questions: 20 },
      ]
      : [
        { name: "소프트웨어 설계", questions: 20 },
        { name: "소프트웨어 개발", questions: 20 },
        { name: "데이터베이스 구축", questions: 20 },
        { name: "프로그래밍 언어 활용", questions: 20 },
        { name: "정보시스템 구축관리", questions: 20 },
      ];

    // 합격기준 추출
    const passingMatch = contents.match(/합격기준[^:]*[:：]\s*필기[^:]*[:：]\s*([^.]+)\.\s*실기[^:]*[:：]\s*([^.]+)/);
    const writtenPassing = passingMatch ? parseInt(passingMatch[1].match(/\d+/)?.[0] || "60") : 60;
    const practicalPassing = passingMatch ? parseInt(passingMatch[2].match(/\d+/)?.[0] || "60") : 60;

    return {
      name,
      category,
      level,
      organization,
      examFee: {
        written: 19400, // API에 없으므로 기본값 유지
        practical: 22600, // API에 없으므로 기본값 유지
      },
      passingScore: {
        written: writtenPassing,
        practical: practicalPassing,
      },
      subjects,
    };
  }, [cleanHtmlContent]);

  // 자격증 정보 가져오기
  const fetchQualificationInfo = useCallback(async () => {
    setIsLoadingCertInfo(true);
    try {
      const data = await getQualificationInfo("1320");
      const items = data.body.items.item;
      setQualificationInfoItems(items);
      const parsed = parseQualificationInfo(items);
      if (parsed) {
        setCertificationInfo(parsed);
      }
    } catch (error) {
      console.error("자격증 정보 조회 오류:", error);
    } finally {
      setIsLoadingCertInfo(false);
    }
  }, [parseQualificationInfo]);

  // 자격증 기본 정보 가져오기
  const fetchQualificationBasicInfo = useCallback(async () => {
    setIsLoadingBasicInfo(true);
    try {
      const data = await getQualificationBasicInfo("1320");
      setBasicInfo(data);
    } catch (error) {
      console.error("자격증 기본 정보 조회 오류:", error);
    } finally {
      setIsLoadingBasicInfo(false);
    }
  }, []);

  // 시험 일정 데이터 가져오기
  const fetchExamSchedule = useCallback(async () => {
    setIsLoadingSchedule(true);
    try {
      const data = await getExamSchedule({
        year: "2026",
        qualgbCd: "T",
        jmCd: "1320",
      });
      const transformed = transformScheduleData(data);
      setSchedules(transformed);
    } catch (error) {
      console.error("시험 일정 조회 오류:", error);
      // 오류 발생 시 기본 데이터 유지
    } finally {
      setIsLoadingSchedule(false);
    }
  }, [transformScheduleData]);

  // 최초 1회 동기화 실행 및 데이터 가져오기
  useEffect(() => {
    const hasSynced = localStorage.getItem("cert_sync_completed");

    if (!hasSynced) {
      handleSync();
    }

    // 자격증 정보 가져오기
    fetchQualificationInfo();
    // 자격증 기본 정보 가져오기
    fetchQualificationBasicInfo();
    // 시험 일정 가져오기
    fetchExamSchedule();
  }, [fetchQualificationInfo, fetchQualificationBasicInfo, fetchExamSchedule]);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const result = await syncCertData({
        source: "all",
        jmCd: "1320", // 정보처리기사 고유번호
      });

      if (result.failed) {
        setSyncResult({
          success: false,
          message: result.message || "동기화에 실패했습니다.",
        });
      } else {
        setSyncResult({
          success: true,
          message: `동기화 완료: ${result.inserted}개 추가, ${result.updated}개 업데이트`,
        });
        // 동기화 완료 플래그 저장
        localStorage.setItem("cert_sync_completed", "true");
      }
    } catch (error) {
      console.error("동기화 오류:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message
        || "동기화 중 오류가 발생했습니다.";
      setSyncResult({
        success: false,
        message: errorMessage,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // 특정 정보 항목 가져오기
  const getInfoByType = (type: string) => {
    return qualificationInfoItems.find((item) => item.infogb === type);
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-purple-600" />
              <h1 className="text-purple-900">자격증 정보</h1>
            </div>
            {isSyncing && (
              <div className="flex items-center gap-2 text-purple-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">동기화 중...</span>
              </div>
            )}
          </div>
          <p className="text-gray-600">시험 정보와 일정을 확인하세요</p>

          {/* 동기화 결과 메시지 */}
          {syncResult && (
            <div className={`mt-4 p-3 rounded-lg ${syncResult.success
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
              }`}>
              <div className="flex items-center gap-2">
                {syncResult.success ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="text-sm">{syncResult.message}</span>
              </div>
            </div>
          )}
        </div>

        {/* Main Info Card */}
        {isLoadingCertInfo ? (
          <Card className="p-8 mb-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
            <div className="flex items-center justify-center gap-2 text-purple-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>자격증 정보를 불러오는 중...</span>
            </div>
          </Card>
        ) : certificationInfo ? (
          <Card className="p-8 mb-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-purple-900">{certificationInfo.name}</h1>
                  <Badge className="bg-purple-500 text-white">
                    {certificationInfo.level}
                  </Badge>
                </div>
                <p className="text-gray-600">
                  {certificationInfo.category} · {certificationInfo.organization}
                </p>
              </div>
              <div className="text-6xl">🏆</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-white/60 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">필기 응시료</p>
                  <p className="text-purple-900">{certificationInfo.examFee.written.toLocaleString()}원</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/60 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">실기 응시료</p>
                  <p className="text-purple-900">{certificationInfo.examFee.practical.toLocaleString()}원</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/60 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">합격 기준</p>
                  <p className="text-purple-900">{certificationInfo.passingScore.written}점 이상</p>
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="info">
              <Award className="w-4 h-4 mr-2" />
              시험 정보
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <Calendar className="w-4 h-4 mr-2" />
              시험 일정
            </TabsTrigger>
            <TabsTrigger value="trend">
              <FileText className="w-4 h-4 mr-2" />
              출제 경향
            </TabsTrigger>
            <TabsTrigger value="standard">
              <BookOpen className="w-4 h-4 mr-2" />
              출제 기준
            </TabsTrigger>
            <TabsTrigger value="method">
              <FileText className="w-4 h-4 mr-2" />
              취득 방법
            </TabsTrigger>
          </TabsList>

          {/* 시험 정보 Tab */}
          <TabsContent value="info">
            {isLoadingBasicInfo ? (
              <Card className="p-6 border-2 border-purple-200">
                <div className="flex items-center justify-center gap-2 text-purple-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>시험 정보를 불러오는 중...</span>
                </div>
              </Card>
            ) : basicInfo ? (
              <div className="space-y-4">
                {/* 기본 정보 */}
                <Card className="p-6 border-2 border-purple-200">
                  <h3 className="text-purple-900 mb-4">기본 정보</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">자격증명</p>
                      <p className="text-gray-800 font-medium">{basicInfo.jmNm}</p>
                      <p className="text-sm text-gray-500">{basicInfo.engJmNm}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">등급</p>
                      <p className="text-gray-800 font-medium">{basicInfo.seriesNm}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">시행기관</p>
                      <p className="text-gray-800 font-medium">{basicInfo.implNm}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">주관기관</p>
                      <p className="text-gray-800 font-medium">{basicInfo.instiNm}</p>
                    </div>
                  </div>
                </Card>

                {/* 개요 */}
                <Card className="p-6 border-2 border-purple-200">
                  <h3 className="text-purple-900 mb-4">개요</h3>
                  <p className="text-gray-700 leading-relaxed">{basicInfo.summary}</p>
                </Card>

                {/* 직무 */}
                <Card className="p-6 border-2 border-purple-200">
                  <h3 className="text-purple-900 mb-4">주요 직무</h3>
                  <p className="text-gray-700 leading-relaxed">{basicInfo.job}</p>
                </Card>

                {/* 전망 */}
                <Card className="p-6 border-2 border-purple-200">
                  <h3 className="text-purple-900 mb-4">전망</h3>
                  <p className="text-gray-700 leading-relaxed">{basicInfo.trend}</p>
                </Card>

                {/* 진로 */}
                <Card className="p-6 border-2 border-purple-200">
                  <h3 className="text-purple-900 mb-4">진로</h3>
                  <p className="text-gray-700 leading-relaxed">{basicInfo.career}</p>
                </Card>

                {/* 연혁 */}
                <Card className="p-6 border-2 border-purple-200">
                  <h3 className="text-purple-900 mb-4">연혁</h3>
                  <p className="text-gray-700 leading-relaxed">{basicInfo.hist}</p>
                </Card>
              </div>
            ) : (
              <Card className="p-6 border-2 border-purple-200">
                <div className="text-center text-gray-600">
                  시험 정보가 없습니다.
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <div className="space-y-4">
              {isLoadingSchedule ? (
                <Card className="p-6 border-2 border-purple-200">
                  <div className="flex items-center justify-center gap-2 text-purple-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>시험 일정을 불러오는 중...</span>
                  </div>
                </Card>
              ) : schedules.length === 0 ? (
                <Card className="p-6 border-2 border-purple-200">
                  <div className="text-center text-gray-600">
                    시험 일정 정보가 없습니다.
                  </div>
                </Card>
              ) : (
                schedules.map((schedule, index) => (
                  <Card key={index} className="p-6 border-2 border-purple-200">
                    <div className="flex items-center gap-3 mb-4">
                      <Badge className="bg-purple-500 text-white">{schedule.round}</Badge>
                      <h3 className="text-purple-900">{schedule.year}년 {schedule.round} 일정</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Written Exam */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-purple-600">
                          <FileText className="w-4 h-4" />
                          <span>필기시험</span>
                        </div>
                        <div className="space-y-2 pl-6">
                          <div className="flex items-start gap-2">
                            <Clock className="w-4 h-4 text-gray-400 mt-1" />
                            <div>
                              <p className="text-sm text-gray-600">원서접수</p>
                              <p className="text-gray-800">{schedule.writtenApplication}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 text-gray-400 mt-1" />
                            <div>
                              <p className="text-sm text-gray-600">시험일</p>
                              <p className="text-gray-800">{schedule.writtenExam}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-gray-400 mt-1" />
                            <div>
                              <p className="text-sm text-gray-600">합격발표</p>
                              <p className="text-gray-800">{schedule.writtenResult}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Practical Exam */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-blue-600">
                          <FileText className="w-4 h-4" />
                          <span>실기시험</span>
                        </div>
                        <div className="space-y-2 pl-6">
                          <div className="flex items-start gap-2">
                            <Clock className="w-4 h-4 text-gray-400 mt-1" />
                            <div>
                              <p className="text-sm text-gray-600">원서접수</p>
                              <p className="text-gray-800">{schedule.practicalApplication}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 text-gray-400 mt-1" />
                            <div>
                              <p className="text-sm text-gray-600">시험일</p>
                              <p className="text-gray-800">{schedule.practicalExam}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-gray-400 mt-1" />
                            <div>
                              <p className="text-sm text-gray-600">최종발표</p>
                              <p className="text-gray-800">{schedule.finalResult}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}

              <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-yellow-900 mb-2">알림</h3>
                    <p className="text-gray-700">
                      일정은 한국산업인력공단 사정에 따라 변경될 수 있습니다.
                      정확한 일정은 큐넷(Q-Net) 홈페이지에서 확인하세요.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* 출제 경향 Tab */}
          <TabsContent value="trend">
            {isLoadingCertInfo ? (
              <Card className="p-6 border-2 border-purple-200">
                <div className="flex items-center justify-center gap-2 text-purple-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>출제 경향을 불러오는 중...</span>
                </div>
              </Card>
            ) : (
              <Card className="p-6 border-2 border-purple-200">
                <h3 className="text-purple-900 mb-4">출제 경향</h3>
                {getInfoByType("출제경향") ? (
                  <div className="text-gray-700 whitespace-pre-line">
                    {cleanHtmlContent(getInfoByType("출제경향")!.contents)}</div>
                ) : (
                  <p className="text-gray-600">출제 경향 정보가 없습니다.</p>
                )}
              </Card>
            )}
          </TabsContent>

          {/* 출제 기준 Tab */}
          <TabsContent value="standard">
            {isLoadingCertInfo ? (
              <Card className="p-6 border-2 border-purple-200">
                <div className="flex items-center justify-center gap-2 text-purple-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>출제 기준을 불러오는 중...</span>
                </div>
              </Card>
            ) : (
              <Card className="p-6 border-2 border-purple-200">
                <h3 className="text-purple-900 mb-4">출제 기준</h3>
                {getInfoByType("출제기준") ? (
                  <div className="text-gray-700 whitespace-pre-line">
                    {cleanHtmlContent(getInfoByType("출제기준")!.contents)}
                  </div>

                ) : (
                  <p className="text-gray-600">출제 기준 정보가 없습니다.</p>
                )}
              </Card>
            )}
          </TabsContent>

          {/* 취득 방법 Tab */}
          <TabsContent value="method">
            {isLoadingCertInfo ? (
              <Card className="p-6 border-2 border-purple-200">
                <div className="flex items-center justify-center gap-2 text-purple-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>취득 방법을 불러오는 중...</span>
                </div>
              </Card>
            ) : (
              <Card className="p-6 border-2 border-purple-200">
                <h3 className="text-purple-900 mb-4">취득 방법</h3>
                {getInfoByType("취득방법") ? (
                  <div className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">
                    {cleanHtmlContent(getInfoByType("취득방법")!.contents)}
                  </div>

                ) : (
                  <p className="text-gray-600">취득 방법 정보가 없습니다.</p>
                )}
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <Card className="p-6 mt-6 bg-gradient-to-r from-purple-500 to-pink-500 border-0 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white mb-2">지금 바로 시작하세요!</h3>
              <p className="text-white/90">체계적인 학습으로 합격의 꿈을 이루세요 🚀</p>
            </div>
            <Button
              asChild
              size="lg"
              className="bg-white text-purple-600 hover:bg-white/90"
            >
              <Link to="/learning" className="flex items-center justify-center">
                학습 시작하기
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
