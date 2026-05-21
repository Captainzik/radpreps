export const PART_SIZE = 10

export type CpdPartEntry = {
  partKey: string
  score: number
  maxScore: number
  percentage: number
  xpEarned: number
  gemsEarned: number
  completedAt: Date
}

export type CpdPartAnswer = {
  questionId: string
  questionText: string
  questionImage?: string
  selectedOptionIndex?: number
  correctOptionIndex: number
  isCorrect: boolean
  pointsEarned: number
  tips?: string
  options: { text?: string; image?: string }[]
}

export type CpdPartPageData = {
  attemptId: string
  partIndex: number
  partNumber: number
  totalParts: number
  isLastPart: boolean
  canRedo: boolean
  quiz: { id: string; name: string; category: string; image?: string }
  partSummary: CpdPartEntry
  answers: CpdPartAnswer[]
  allCompletedParts: Array<
    CpdPartEntry & { partIndex: number; partNumber: number }
  >
  overallXp: number
  overallGems: number
  overallScore: number
  overallMaxScore: number
  overallPercentage: number
}
