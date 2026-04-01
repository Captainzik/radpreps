import { HydratedDocument, Model, model, models, Schema, Types } from 'mongoose'

export interface IQuizAttempt {
  user: Types.ObjectId
  quiz: Types.ObjectId
  startedAt: Date
  completedAt?: Date
  timeTakenMs?: number
  score: number
  maxScore: number
  percentage: number
  completed: boolean
  questionsAnswered: number
  answers: {
    question: Types.ObjectId
    selectedOptionIndex?: number
    isCorrect: boolean
    pointsEarned: number
    timeSpentMs?: number
  }[]
  category?: string
  createdAt?: Date
  updatedAt?: Date
}

export type QuizAttemptDoc = HydratedDocument<IQuizAttempt>

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quiz: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    timeTakenMs: {
      type: Number,
      min: 0,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    maxScore: {
      type: Number,
      required: true,
      min: 1,
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    questionsAnswered: {
      type: Number,
      min: 0,
      default: 0,
    },
    answers: {
      type: [
        {
          question: {
            type: Schema.Types.ObjectId,
            ref: 'Question',
            required: true,
          },
          selectedOptionIndex: {
            type: Number,
            min: 0,
            max: 3,
            default: undefined,
          },
          isCorrect: {
            type: Boolean,
            required: true,
          },
          pointsEarned: {
            type: Number,
            min: 0,
            default: 0,
          },
          timeSpentMs: {
            type: Number,
            min: 0,
          },
        },
      ],
      default: [],
    },
    category: {
      type: String,
      enum: ['ARDMS', 'Sonography Canada', 'CAMRT', 'ARRT', 'CPD'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Indexes
QuizAttemptSchema.index({ user: 1, quiz: 1 })
QuizAttemptSchema.index({ quiz: 1, completed: 1, score: -1 })
QuizAttemptSchema.index({ user: 1, completedAt: -1 })
QuizAttemptSchema.index({ category: 1 })

// Virtual: duration in minutes
QuizAttemptSchema.virtual('durationMinutes').get(function () {
  if (!this.completedAt || !this.startedAt) return 0
  const ms = this.completedAt.getTime() - this.startedAt.getTime()
  return Math.round(ms / 60000)
})

// Pre-save: calculate percentage
QuizAttemptSchema.pre('save', function (this: QuizAttemptDoc) {
  if (this.isModified('score') || this.isModified('maxScore')) {
    this.percentage = this.maxScore > 0 ? (this.score / this.maxScore) * 100 : 0
  }
})

export const QuizAttempt: Model<IQuizAttempt> =
  (models.QuizAttempt as Model<IQuizAttempt>) ||
  model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema)
