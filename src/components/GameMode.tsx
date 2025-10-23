import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { motion } from "motion/react";
import { ArrowLeft, Trophy, Star, Zap } from "lucide-react";

interface FlashCard {
  id: string;
  term: string;
  definition: string;
}

interface GameModeProps {
  categoryName: string;
  flashCards: FlashCard[];
  onExit: () => void;
}

export function GameMode({ categoryName, flashCards, onExit }: GameModeProps) {
  const [gameCards, setGameCards] = useState<Array<{ id: string; text: string; type: 'term' | 'definition'; matched: boolean }>>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);

  useEffect(() => {
    // Create pairs of cards (terms and definitions)
    const cards = flashCards.slice(0, 6).flatMap(card => [
      { id: card.id + '-term', text: card.term, type: 'term' as const, matched: false },
      { id: card.id + '-def', text: card.definition, type: 'definition' as const, matched: false }
    ]);
    
    // Shuffle cards
    const shuffled = cards.sort(() => Math.random() - 0.5);
    setGameCards(shuffled);
  }, [flashCards]);

  const handleCardClick = (index: number) => {
    if (selectedCards.length >= 2 || selectedCards.includes(index) || gameCards[index].matched) {
      return;
    }

    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setMoves(moves + 1);
      const [first, second] = newSelected;
      const firstCard = gameCards[first];
      const secondCard = gameCards[second];

      // Check if cards match (same base id but different types)
      const firstId = firstCard.id.replace('-term', '').replace('-def', '');
      const secondId = secondCard.id.replace('-term', '').replace('-def', '');

      if (firstId === secondId && firstCard.type !== secondCard.type) {
        // Match found!
        setTimeout(() => {
          setGameCards(prev => prev.map((card, i) => 
            i === first || i === second ? { ...card, matched: true } : card
          ));
          setScore(score + 100);
          setMatchedPairs(matchedPairs + 1);
          setSelectedCards([]);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setSelectedCards([]);
        }, 1000);
      }
    }
  };

  const allMatched = matchedPairs === flashCards.slice(0, 6).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button onClick={onExit} variant="ghost" className="hover:bg-white/80">
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2">
            {categoryName}
          </Badge>
        </div>

        {/* Score Panel */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 bg-white/80 backdrop-blur border-2 border-purple-200 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="text-gray-600">점수</span>
            </div>
            <div className="text-purple-600">{score}</div>
          </Card>
          <Card className="p-4 bg-white/80 backdrop-blur border-2 border-purple-200 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-orange-500" />
              <span className="text-gray-600">이동 횟수</span>
            </div>
            <div className="text-purple-600">{moves}</div>
          </Card>
          <Card className="p-4 bg-white/80 backdrop-blur border-2 border-purple-200 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-purple-500" />
              <span className="text-gray-600">매칭</span>
            </div>
            <div className="text-purple-600">{matchedPairs} / {flashCards.slice(0, 6).length}</div>
          </Card>
        </div>

        {/* Game Board */}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-6">
          {gameCards.map((card, index) => {
            const isSelected = selectedCards.includes(index);
            const isMatched = card.matched;

            return (
              <motion.div
                key={card.id}
                whileHover={!isMatched ? { scale: 1.05 } : {}}
                whileTap={!isMatched ? { scale: 0.95 } : {}}
              >
                <Card
                  className={`p-6 cursor-pointer transition-all border-2 min-h-[120px] flex items-center justify-center text-center ${
                    isMatched
                      ? "bg-gradient-to-br from-green-100 to-emerald-100 border-green-400 opacity-70"
                      : isSelected
                      ? "bg-gradient-to-br from-purple-100 to-pink-100 border-purple-400 shadow-lg"
                      : "bg-white/80 backdrop-blur border-purple-200 hover:border-purple-300 hover:shadow-md"
                  }`}
                  onClick={() => handleCardClick(index)}
                >
                  {(isSelected || isMatched) && (
                    <motion.p
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-gray-800"
                    >
                      {card.text}
                    </motion.p>
                  )}
                  {!isSelected && !isMatched && (
                    <div className="text-4xl">
                      {card.type === 'term' ? '📖' : '💡'}
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Victory Message */}
        {allMatched && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="p-8 bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-300 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-purple-900 mb-2">축하합니다!</h2>
              <p className="text-gray-700 mb-4">
                모든 카드를 매칭했습니다! 점수: {score}점 ({moves}회 이동)
              </p>
              <Button
                onClick={onExit}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                대시보드로 돌아가기
              </Button>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
