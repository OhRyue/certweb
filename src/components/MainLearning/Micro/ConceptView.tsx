import { useState } from "react"
import { motion } from "motion/react"
import { Card } from "../../ui/card"
import { Button } from "../../ui/button"
import { BookOpen, ArrowRight, Lightbulb } from "lucide-react"

interface Block {
  type: string
  text: string | null
  items: string[]
  url: string | null
  alt: string | null
  caption: string | null
  headers: string[]
  rows: string[][]
}

interface Section {
  orderNo: number
  subCode: string
  title: string
  importance: number
  blocks: Block[]
}

interface ConceptResponse {
  topicId: number
  sections: Section[]
}

export function ConceptView({
  data,
  onNext
}: {
  data: ConceptResponse
  onNext: () => void
}) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const section = data.sections[currentIndex]
  const isLast = currentIndex === data.sections.length - 1

  const handleNext = () => {
    if (!isLast) setCurrentIndex(prev => prev + 1)
    else onNext()
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">

        <motion.div
          key={section.subCode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-8 h-8 text-purple-600" />
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-purple-900">
                  {section.title}
                </h1>
                <span className="text-xl">
                  {"⭐".repeat(section.importance)}
                </span>
              </div>
            </div>

            <p className="text-gray-600">
              {currentIndex + 1} / {data.sections.length}
            </p>
          </div>

          {/* Content */}
          <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 mb-8">
            {section.blocks.map((block, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="mb-3"
              >
                {block.type === "heading" && (
                  <h2 className="text-lg font-semibold text-purple-800 mb-2">
                    {block.text}
                  </h2>
                )}

                {block.type === "paragraph" && (
                  <p className="text-gray-800 leading-relaxed">
                    {block.text}
                  </p>
                )}

                {block.type === "list" && (
                  <ul className="list-disc list-inside text-gray-800 space-y-2 pl-3">
                    {block.items.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                )}

                {block.type === "table" && (
                  <div className="overflow-x-auto mt-4">
                    <table className="min-w-full border border-purple-200 text-sm">
                      <thead className="bg-purple-100 text-purple-900">
                        <tr>
                          {block.headers.map((h, idx) => (
                            <th key={idx} className="border px-3 py-2 text-left">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {block.rows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="border px-3 py-2">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {block.caption && (
                      <p className="text-sm text-gray-500 mt-2">
                        {block.caption}
                      </p>
                    )}
                  </div>
                )}

                {block.type === "image" && block.url && (
                  <div className="text-center mt-4">
                    <img
                      src={block.url}
                      alt={block.alt || ""}
                      className="rounded-lg shadow-md inline-block max-h-80"
                    />

                    {block.caption && (
                      <p className="text-sm text-gray-500 mt-2">
                        {block.caption}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </Card>

          {/* Tip */}
          <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 mb-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-400 rounded-lg">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>

              <div>
                <h3 className="text-yellow-900 font-semibold mb-2">
                  학습 팁
                </h3>
                <p className="text-gray-700">
                  개념을 이해했다면 미니체크로 빠르게 복습해봐
                </p>
              </div>
            </div>
          </Card>

          {/* Next */}
          <div className="flex justify-end">
            <Button
              onClick={handleNext}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8"
            >
              {isLast ? "미니체크 시작하기" : "다음 개념 보기"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

        </motion.div>
      </div>
    </div>
  )
}
