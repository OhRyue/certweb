import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Card } from "../..//ui/card";
import { Button } from "../../ui/button";
import { Trophy, FileText, Code, Users, Zap, ArrowLeft } from "lucide-react";

interface TournamentProps {
  onBack?: () => void;
}

type ExamType = "written" | "practical";

export function Tournament({ onBack }: TournamentProps) {
  const navigate = useNavigate();

  const handleSelectType = (type: ExamType) => {
    navigate("/battle/tournament/matching", {
      state: {
        examType: type,
        topicName: "토너먼트",
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-gray-900">토너먼트</h1>
          </div>
          <p className="text-gray-600">
            8명이 참여하는 실시간 토너먼트에 도전하세요!
          </p>
        </motion.div>

        {/* Tournament Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 mb-8 bg-white/80 backdrop-blur-sm border border-white/50 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-gray-900 mb-4">토너먼트 안내</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-blue-50/50 p-3 rounded-lg">
                    <p className="text-gray-600 mb-1">진행 방식</p>
                    <p className="text-gray-900">8강 → 4강 → 결승</p>
                  </div>
                  <div className="bg-sky-50/50 p-3 rounded-lg">
                    <p className="text-gray-600 mb-1">문제 수</p>
                    <p className="text-gray-900">라운드별 5문제</p>
                  </div>
                  <div className="bg-cyan-50/50 p-3 rounded-lg">
                    <p className="text-gray-600 mb-1">우승 보상</p>
                    <p className="text-gray-900">2000 XP + 특별 뱃지</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Type Selection */}
        <div>
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-900 mb-6 text-center"
          >
            참가 유형을 선택하세요
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Written Exam */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card 
                className="p-8 bg-white/80 backdrop-blur-sm border border-white/50 hover:shadow-2xl transition-all cursor-pointer group hover:border-blue-300"
                onClick={() => handleSelectType("written")}
              >
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <FileText className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-gray-900 mb-3">필기 토너먼트</h3>
                  <p className="text-gray-600 mb-6 text-sm">
                    4지선다 객관식 문제로 진행되는 빠른 대결
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Zap className="w-4 h-4 text-blue-600" />
                      <span>빠른 문제 해결</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>4지선다 객관식</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>8명 실시간 대결</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Practical Exam */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card 
                className="p-8 bg-white/80 backdrop-blur-sm border border-white/50 hover:shadow-2xl transition-all cursor-pointer group hover:border-cyan-300"
                onClick={() => handleSelectType("practical")}
              >
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-cyan-600 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Code className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-gray-900 mb-3">실기 토너먼트</h3>
                  <p className="text-gray-600 mb-6 text-sm">
                    타이핑 입력 방식으로 진행되는 심화 대결
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Code className="w-4 h-4 text-cyan-600" />
                      <span>타이핑 직접 입력</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Zap className="w-4 h-4 text-cyan-600" />
                      <span>AI 실시간 채점</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-cyan-600" />
                      <span>8명 실시간 대결</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Back Button */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center"
        >
          <Button 
            onClick={onBack || (() => navigate("/battle"))} 
            variant="outline" 
            className="border-2 border-gray-300 hover:border-blue-400 hover:text-blue-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로 가기
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
