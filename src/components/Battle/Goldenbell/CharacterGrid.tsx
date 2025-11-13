import { motion, AnimatePresence } from "motion/react";
import type { GoldenBellCharacter } from "../../../types";

interface CharacterGridProps {
  characters: GoldenBellCharacter[];
  onCharacterClick?: (character: GoldenBellCharacter) => void;
}

export function CharacterGrid({ characters, onCharacterClick }: CharacterGridProps) {
  // Sort characters by grid position
  const sortedCharacters = [...characters].sort((a, b) => {
    if (a.gridPosition.row !== b.gridPosition.row) {
      return a.gridPosition.row - b.gridPosition.row;
    }
    return a.gridPosition.col - b.gridPosition.col;
  });

  const getCharacterImage = (status: GoldenBellCharacter["status"]) => {
    // Currently all states use the same image
    // Later: use different images for correct/wrong states
    switch (status) {
      case "normal":
        return "/assets/characters/character_normal.png"
      case "correct":
        return "/assets/characters/character_normal.png"  // TODO: Use sketchbook character image
      case "wrong":
        return "/assets/characters/character_normal.png"  // TODO: Use crying character image
      case "eliminated":
        return "/assets/characters/character_normal.png"
      default:
        return "/assets/characters/character_normal.png"
    }
  };

  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center pb-8 px-4">
      <div className="grid grid-cols-8 gap-2 md:gap-3 lg:gap-4 w-full max-w-6xl">
        <AnimatePresence mode="popLayout">
          {sortedCharacters.map((character) => {
            const isEliminated = character.status === "eliminated";

            return (
              <motion.div
                key={character.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: isEliminated ? 0 : 1,
                  scale: isEliminated ? 0.5 : 1,
                  y: isEliminated ? 20 : 0,
                }}
                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                transition={{
                  duration: 0.5,
                  ease: "easeOut",
                }}
                className={`relative flex flex-col items-center justify-center ${!isEliminated && onCharacterClick ? "cursor-pointer" : ""
                  }`}
                onClick={() => {
                  if (!isEliminated && onCharacterClick) {
                    onCharacterClick(character);
                  }
                }}
              >
                {/* Answer Bubble */}
                <AnimatePresence>
                  {character.showAnswer && character.answer && !isEliminated && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.8 }}
                      transition={{ type: "spring", damping: 15 }}
                      className="absolute -top-16 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap"
                    >
                      <div className="relative bg-white/95 backdrop-blur px-3 py-2 rounded-xl border-2 border-purple-300 shadow-lg">
                        <p className="text-sm text-gray-900">{character.answer}</p>
                        {/* Bubble tail */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/95 border-r-2 border-b-2 border-purple-300 rotate-45"></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* User Arrow Indicator */}
                {character.id === 1 && !isEliminated && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="absolute -top-24 left-1/2 -translate-x-1/2 z-5"
                  >
                    <img
                      src="/assets/ui/arrow.png"
                      alt="You"
                      className="w-12 h-12 object-contain"
                    />
                  </motion.div>
                )}

                {/* Character Image */}
                <motion.div
                  animate={{
                    scale: character.status === "correct" ? [1, 1.1, 1] : 1,
                  }}
                  transition={{
                    duration: 0.5,
                    ease: "easeInOut",
                  }}
                  className="relative"
                >
                  <img
                    src={getCharacterImage(character.status)}
                    alt={character.name}
                    className={`w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 object-contain ${isEliminated ? "grayscale" : ""}`}
                  />

                  {/* Status indicator */}
                  {character.status === "correct" && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg"
                    >
                      <span className="text-white text-lg">✓</span>
                    </motion.div>
                  )}

                  {character.status === "wrong" && !isEliminated && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg"
                    >
                      <span className="text-white text-lg">✗</span>
                    </motion.div>
                  )}
                </motion.div>

                {/* Character Name */}
                {!isEliminated && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-1 px-2 py-0.5 bg-white/90 backdrop-blur rounded-full border-2 border-purple-200 shadow-sm"
                  >
                    <p className="text-xs text-gray-800">
                      {character.name}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
