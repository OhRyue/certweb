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
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";

export function CertInfoDashboard() {
  const certificationInfo = {
    name: "정보처리기사",
    category: "국가기술자격",
    level: "기사",
    organization: "한국산업인력공단",
    examFee: {
      written: 19400,
      practical: 22600,
    },
    passingScore: {
      written: 60,
      practical: 60,
    },
    subjects: [
      { name: "소프트웨어 설계", questions: 20 },
      { name: "소프트웨어 개발", questions: 20 },
      { name: "데이터베이스 구축", questions: 20 },
      { name: "프로그래밍 언어 활용", questions: 20 },
      { name: "정보시스템 구축관리", questions: 20 },
    ],
    schedule: [
      {
        round: "1회",
        writtenApplication: "2025-01-13 ~ 2025-01-16",
        writtenExam: "2025-02-15",
        writtenResult: "2025-03-05",
        practicalApplication: "2025-03-11 ~ 2025-03-14",
        practicalExam: "2025-04-26 ~ 2025-05-09",
        finalResult: "2025-06-18",
      },
      {
        round: "2회",
        writtenApplication: "2025-04-21 ~ 2025-04-24",
        writtenExam: "2025-05-17",
        writtenResult: "2025-06-04",
        practicalApplication: "2025-06-16 ~ 2025-06-19",
        practicalExam: "2025-07-19 ~ 2025-08-01",
        finalResult: "2025-09-03",
      },
      {
        round: "3회",
        writtenApplication: "2025-08-04 ~ 2025-08-07",
        writtenExam: "2025-08-30",
        writtenResult: "2025-09-17",
        practicalApplication: "2025-09-23 ~ 2025-09-26",
        practicalExam: "2025-11-01 ~ 2025-11-14",
        finalResult: "2025-12-17",
      },
    ],
  };

  const benefits = [
    "소프트웨어 개발 및 설계 전문성 인증",
    "공공기관 및 대기업 우대",
    "승진 및 급여 인센티브",
    "전산직 공무원 응시 자격",
    "SW 마에스트로 등 정부 지원사업 가산점",
  ];

  const tips = [
    {
      title: "필기 시험 준비",
      content: "과목당 40점 이상, 평균 60점 이상 득점해야 합니다. 소프트웨어 설계와 데이터베이스에 집중하세요.",
    },
    {
      title: "실기 시험 준비",
      content: "SQL, 알고리즘, 네트워크 등 실무 중심 문제가 출제됩니다. 기출문제 반복 학습이 중요합니다.",
    },
    {
      title: "학습 기간",
      content: "비전공자 기준 3-6개월, 전공자 기준 1-3개월 정도의 학습 기간이 권장됩니다.",
    },
  ];

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-8 h-8 text-purple-600" />
            <h1 className="text-purple-900">자격증 정보</h1>
          </div>
          <p className="text-gray-600">시험 정보와 일정을 확인하세요</p>
        </div>

        {/* Main Info Card */}
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

        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="schedule">
              <Calendar className="w-4 h-4 mr-2" />
              시험 일정
            </TabsTrigger>
            <TabsTrigger value="subjects">
              <BookOpen className="w-4 h-4 mr-2" />
              시험 과목
            </TabsTrigger>
            <TabsTrigger value="benefits">
              <Award className="w-4 h-4 mr-2" />
              취득 혜택
            </TabsTrigger>
            <TabsTrigger value="tips">
              <FileText className="w-4 h-4 mr-2" />
              합격 팁
            </TabsTrigger>
          </TabsList>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <div className="space-y-4">
              {certificationInfo.schedule.map((schedule, index) => (
                <Card key={index} className="p-6 border-2 border-purple-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className="bg-purple-500 text-white">{schedule.round}</Badge>
                    <h3 className="text-purple-900">2025년 {schedule.round} 일정</h3>
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
              ))}

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

          {/* Subjects Tab */}
          <TabsContent value="subjects">
            <Card className="p-6 border-2 border-purple-200">
              <h3 className="text-purple-900 mb-4">필기 시험 과목 (객관식 5지선다형)</h3>
              <p className="text-gray-600 mb-6">총 100문항 (과목당 20문항) · 150분</p>

              <div className="space-y-3">
                {certificationInfo.subjects.map((subject, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-purple-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center">
                        {index + 1}
                      </div>
                      <span className="text-gray-800">{subject.name}</span>
                    </div>
                    <Badge variant="secondary">{subject.questions}문항</Badge>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-blue-900 mb-2">합격 기준</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• 각 과목 40점 이상</li>
                  <li>• 전 과목 평균 60점 이상</li>
                </ul>
              </div>
            </Card>
          </TabsContent>

          {/* Benefits Tab */}
          <TabsContent value="benefits">
            <Card className="p-6 border-2 border-purple-200">
              <h3 className="text-purple-900 mb-6">자격증 취득 혜택</h3>

              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg"
                  >
                    <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                    <span className="text-gray-800">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">💼</div>
                  <div>
                    <h4 className="text-green-900 mb-2">취업 및 경력</h4>
                    <p className="text-gray-700">
                      정보처리기사는 IT 업계에서 가장 인정받는 자격증 중 하나입니다.
                      소프트웨어 개발, 시스템 구축, 데이터베이스 관리 등 다양한 분야에서 활용할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Tips Tab */}
          <TabsContent value="tips">
            <div className="space-y-4">
              {tips.map((tip, index) => (
                <Card key={index} className="p-6 border-2 border-purple-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-purple-900 mb-2">{tip.title}</h3>
                      <p className="text-gray-700">{tip.content}</p>
                    </div>
                  </div>
                </Card>
              ))}

              <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">🎯</div>
                  <div>
                    <h3 className="text-purple-900 mb-2">학습 로드맵</h3>
                    <ol className="space-y-2 text-gray-700">
                      <li>1. 기본 개념 학습 (Micro 모드 활용)</li>
                      <li>2. 과목별 문제 풀이 (카테고리 퀴즈)</li>
                      <li>3. 난이도별 학습 (쉬움 → 보통 → 어려움)</li>
                      <li>4. 약점 보완 (약점 퀴즈로 집중 학습)</li>
                      <li>5. 종합 복습 (Review 모드)</li>
                      <li>6. 실전 모의고사</li>
                    </ol>
                  </div>
                </div>
              </Card>
            </div>
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
