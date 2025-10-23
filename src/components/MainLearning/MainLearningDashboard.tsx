import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { BookOpen, CheckCircle2, ListChecks, Sparkles, ChevronRight, ChevronDown } from "lucide-react";
import { Subject, MainTopic, SubTopic, Detail } from "../../types";
import { useState } from "react";

interface MainLearningDashboardProps {
  subjects: Subject[];
  targetCertification: string;
  onStartMicro: (detailId: number, detailName: string) => void;
  onStartReview: (mainTopicId: number, mainTopicName: string) => void;
}

export function MainLearningDashboard({ subjects, targetCertification, onStartMicro, onStartReview }: MainLearningDashboardProps) {
  const [expandedMainTopic, setExpandedMainTopic] = useState<number | null>(null);
  const [expandedSubTopic, setExpandedSubTopic] = useState<number | null>(null);

  // Filter subjects by target certification
  const currentSubjects = subjects.filter(s => s.category === targetCertification);

  if (currentSubjects.length === 0) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-600">선택된 자격증에 대한 학습 자료가 없습니다.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-purple-600" />
            <h1 className="text-purple-900">메인 학습</h1>
          </div>
          <p className="text-gray-600">체계적으로 개념을 학습하고 문제를 풀어보세요!</p>
        </div>

        {/* Learning Modes Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-sky-50 border-2 border-blue-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-blue-900 mb-2">Micro 학습</h3>
                <p className="text-gray-700 text-sm mb-3">
                  개념 학습 → O/X 미니체크 → 문제풀이
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-white/60">개념 보기</Badge>
                  <Badge variant="secondary" className="bg-white/60">O/X 4문항</Badge>
                  <Badge variant="secondary" className="bg-white/60">문제 5문항</Badge>
                  <Badge variant="secondary" className="bg-white/60">AI 해설</Badge>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500 rounded-lg">
                <ListChecks className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-blue-900 mb-2">Review 총정리</h3>
                <p className="text-gray-700 text-sm mb-3">
                  종합 문제 풀이와 AI 요약
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-white/60">문제 20문항</Badge>
                  <Badge variant="secondary" className="bg-white/60">문항별 해설</Badge>
                  <Badge variant="secondary" className="bg-white/60">AI 총정리</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Subjects List */}
        <div className="space-y-8">
          {currentSubjects.map((subject) => (
            <div key={subject.id}>
              {/* Subject Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-3 rounded-lg text-3xl"
                    style={{ backgroundColor: subject.color + "20" }}
                  >
                    {subject.icon}
                  </div>
                  <div>
                    <h2 className="text-purple-900">{subject.name}</h2>
                    <p className="text-gray-600 text-sm">
                      {subject.mainTopics.length}개 학습 주제
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Topics */}
              <div className="space-y-4">
                {subject.mainTopics.map((mainTopic) => (
                  <Card
                    key={mainTopic.id}
                    className="overflow-hidden border-2 hover:border-purple-300 transition-all"
                  >
                    {/* Main Topic Header with Review Button */}
                    <div 
                      className="p-5 cursor-pointer bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all"
                      onClick={() => setExpandedMainTopic(expandedMainTopic === mainTopic.id ? null : mainTopic.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div 
                            className="p-3 rounded-lg text-2xl"
                            style={{ backgroundColor: mainTopic.color + "30" }}
                          >
                            {mainTopic.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-purple-900">{mainTopic.name}</h3>
                              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                {mainTopic.subTopics.length}개 세부 주제
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              클릭하여 학습 내용 보기
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartReview(mainTopic.id, mainTopic.name);
                            }}
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                          >
                            <ListChecks className="w-4 h-4 mr-2" />
                            Review 총정리
                          </Button>
                          {expandedMainTopic === mainTopic.id ? (
                            <ChevronDown className="w-5 h-5 text-purple-600" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-purple-600" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sub Topics (Expandable) */}
                    {expandedMainTopic === mainTopic.id && (
                      <div className="p-5 bg-white space-y-4">
                        {mainTopic.subTopics.map((subTopic) => (
                          <div key={subTopic.id} className="border-l-4 border-purple-300 pl-4">
                            <div 
                              className="cursor-pointer mb-2 flex items-center justify-between hover:bg-purple-50 p-2 rounded transition-all"
                              onClick={() => setExpandedSubTopic(expandedSubTopic === subTopic.id ? null : subTopic.id)}
                            >
                              <div className="flex items-center gap-2">
                                <h4 className="text-purple-800">{subTopic.name}</h4>
                                <Badge variant="outline" className="border-purple-300 text-purple-700">
                                  {subTopic.details.length}개
                                </Badge>
                              </div>
                              {expandedSubTopic === subTopic.id ? (
                                <ChevronDown className="w-4 h-4 text-purple-600" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-purple-600" />
                              )}
                            </div>

                            {/* Details (Expandable) */}
                            {expandedSubTopic === subTopic.id && (
                              <div className="ml-4 space-y-2 mt-2">
                                {subTopic.details.map((detail) => (
                                  <div 
                                    key={detail.id}
                                    className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-white rounded-lg hover:from-purple-100 hover:to-purple-50 transition-all border border-purple-100"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 text-sm">
                                        {detail.id}
                                      </div>
                                      <span className="text-gray-800">{detail.name}</span>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => onStartMicro(detail.id, detail.name)}
                                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                                    >
                                      <Sparkles className="w-3 h-3 mr-1" />
                                      Micro 학습
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
