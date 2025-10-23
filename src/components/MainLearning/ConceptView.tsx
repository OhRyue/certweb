import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { motion } from "motion/react";
import { BookOpen, ArrowRight, Lightbulb } from "lucide-react";
import { Concept } from "../../types";

interface ConceptViewProps {
  concept: Concept;
  topicName: string;
  onNext: () => void;
}

export function ConceptView({ concept, topicName, onNext }: ConceptViewProps) {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-6">
            <Badge className="bg-purple-500 text-white mb-3">
              {topicName}
            </Badge>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-8 h-8 text-purple-600" />
              <h1 className="text-purple-900">{concept.title}</h1>
            </div>
            <p className="text-gray-600">개념을 차근차근 학습해보세요! 📚</p>
          </div>

          {/* Main Content */}
          <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 mb-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-purple-500 rounded-lg flex-shrink-0">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-purple-900 mb-4">핵심 개념</h2>
                <p className="text-gray-800 leading-relaxed">
                  {concept.content}
                </p>
              </div>
            </div>

            <div className="border-t-2 border-purple-200 pt-6">
              <h3 className="text-purple-900 mb-4">주요 포인트</h3>
              <div className="space-y-3">
                {concept.keyPoints.map((point, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    className="flex items-start gap-3 p-4 bg-white/60 rounded-lg"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center">
                      {index + 1}
                    </div>
                    <p className="text-gray-800 pt-1">{point}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </Card>

          {/* Tips */}
          <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div>
                <h3 className="text-yellow-900 mb-2">학습 팁</h3>
                <p className="text-gray-700">
                  개념을 이해했다면 다음 단계로 넘어가 미니체크로 확인해보세요!
                  O/X 문제를 통해 핵심 내용을 빠르게 점검할 수 있습니다.
                </p>
              </div>
            </div>
          </Card>

          {/* Action Button */}
          <div className="flex justify-end">
            <Button
              onClick={onNext}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8"
            >
              미니체크 시작하기
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
