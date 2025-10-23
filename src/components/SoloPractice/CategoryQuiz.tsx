import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Tag, Play } from "lucide-react";

interface CategoryQuizProps {
  onStart: (tags: string[], count: number) => void;
  onBack: () => void;
}

const availableTags = [
  { id: "db", name: "데이터베이스", color: "#8B5CF6", count: 45 },
  { id: "sql", name: "SQL", color: "#EC4899", count: 32 },
  { id: "normalization", name: "정규화", color: "#F59E0B", count: 28 },
  { id: "network", name: "네트워크", color: "#10B981", count: 38 },
  { id: "osi", name: "OSI", color: "#3B82F6", count: 25 },
  { id: "tcp", name: "TCP/IP", color: "#EF4444", count: 22 },
  { id: "oop", name: "OOP", color: "#8B5CF6", count: 35 },
  { id: "design", name: "디자인패턴", color: "#EC4899", count: 18 },
  { id: "java", name: "Java", color: "#F59E0B", count: 30 },
];

export function CategoryQuiz({ onStart, onBack }: CategoryQuizProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState("10");

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(t => t !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleStart = () => {
    if (selectedTags.length > 0) {
      onStart(selectedTags, parseInt(questionCount));
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Tag className="w-8 h-8 text-purple-600" />
            <h1 className="text-purple-900">카테고리 퀴즈</h1>
          </div>
          <p className="text-gray-600">원하는 태그를 선택하고 학습을 시작하세요!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tag Selection */}
          <div className="lg:col-span-2">
            <Card className="p-6 border-2 border-purple-200">
              <h2 className="text-purple-900 mb-4">태그 선택</h2>
              <p className="text-sm text-gray-600 mb-4">
                학습하고 싶은 태그를 선택하세요 (중복 선택 가능)
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableTags.map((tag) => (
                  <div
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTags.includes(tag.id)
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox 
                        checked={selectedTags.includes(tag.id)}
                        className="pointer-events-none"
                      />
                      <Label className="cursor-pointer pointer-events-none">
                        {tag.name}
                      </Label>
                    </div>
                    <p className="text-xs text-gray-500">{tag.count}개 문제</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Settings */}
          <div className="space-y-6">
            {/* Question Count */}
            <Card className="p-6 border-2 border-purple-200">
              <h3 className="text-purple-900 mb-4">문제 수</h3>
              <RadioGroup value={questionCount} onValueChange={setQuestionCount}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="10" id="count-10" />
                    <Label htmlFor="count-10" className="cursor-pointer">
                      10문제 (빠른 학습)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="20" id="count-20" />
                    <Label htmlFor="count-20" className="cursor-pointer">
                      20문제 (표준)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="50" id="count-50" />
                    <Label htmlFor="count-50" className="cursor-pointer">
                      50문제 (집중 학습)
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </Card>

            {/* Summary */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
              <h3 className="text-purple-900 mb-4">선택 요약</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">선택한 태그</p>
                  <p className="text-purple-600">
                    {selectedTags.length > 0 ? `${selectedTags.length}개` : "없음"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">문제 수</p>
                  <p className="text-purple-600">{questionCount}문제</p>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleStart}
                disabled={selectedTags.length === 0}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4 mr-2" />
                퀴즈 시작
              </Button>
              <Button
                onClick={onBack}
                variant="outline"
                className="w-full border-2"
              >
                뒤로 가기
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
