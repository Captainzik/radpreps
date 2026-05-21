import { HydratedDocument, Model, model, models, Schema, Types } from 'mongoose'
import type {
  QuizMode,
  ResultVisibility,
  SessionStatus,
} from '@/lib/modes/types' // CHANGED: attempts now explicitly track mode and timer-driven session status.

export type AttemptEndReason =
  | 'user_ended'
  | 'restart_requested'
  | 'completed'
  | 'timeout'
  | 'system_cleanup' // CHANGED: allows exact cleanup/discard semantics.

export interface IQuizAttempt {
  user: Types.ObjectId
  quiz: Types.ObjectId
  mode: QuizMode // CHANGED: exam and CPD attempts have different behavior.
  status: SessionStatus // CHANGED: enables paused/resumed/completed flow.
  resultVisibility: ResultVisibility // CHANGED: exam hides results until completion.
  startedAt: Date
  completedAt?: Date
  pausedAt?: Date
  resumedAt?: Date
  endedAt?: Date
  endedReason?: AttemptEndReason // CHANGED: records why the session ended or was discarded.
  timeTakenMs?: number
  questionTimeLimitMs?: number // CHANGED: stored for exam-mode timer enforcement.
  checkpointDeadlineMs?: number // CHANGED: stored for checkpoint/break timing logic.
  timedOut?: boolean // CHANGED: indicates forced exam completion on timeout.
  forceCompletedByTimeout?: boolean // CHANGED: indicates quiz was finalized because time expired.
  score: number
  maxScore: number
  percentage: number
  attemptKey?: string
  sessionKey?: string // CHANGED: stable session identity for resume/discard flows.
  completed: boolean
  questionsAnswered: number
  currentQuestionIndex: number // CHANGED: exact current position for resume.
  checkpointIndex: number // CHANGED: zero-based checkpoint boundary for resume/break.
  lastCheckpointAt?: Date // CHANGED: tracks the last persisted checkpoint boundary.
  lastSeenQuestionIndex?: number // CHANGED: tracks the furthest question the user actually reached.
  checkpointSavedAt?: Date
  adsServedCount: number
  heartsConsumed: number
  gemsEarned: number
  xpEarned: number
  answers: {
    question: Types.ObjectId
    selectedOptionIndex?: number
    isCorrect: boolean
    pointsEarned: number
    timeSpentMs?: number
  }[]
  /** Per-part completion records for CPD mode (one entry per finished part). */
  completedParts?: {
    partKey: string
    score: number
    maxScore: number
    percentage: number
    xpEarned: number
    gemsEarned: number
    completedAt: Date
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
      index: true,
    },
    quiz: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ['exam', 'cpd'],
      required: true,
      default: 'cpd',
      index: true,
    },
    status: {
      type: String,
      enum: ['in_progress', 'paused', 'completed', 'ended', 'abandoned'],
      required: true,
      default: 'in_progress',
      index: true,
    },
    resultVisibility: {
      type: String,
      enum: ['hidden_until_end', 'per_question'],
      required: true,
      default: 'per_question',
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      index: true,
    },
    pausedAt: {
      type: Date,
      index: true,
    },
    resumedAt: {
      type: Date,
      index: true,
    },
    endedAt: {
      type: Date,
      index: true,
    },
    endedReason: {
      type: String,
      enum: [
        'user_ended',
        'restart_requested',
        'completed',
        'timeout',
        'system_cleanup',
      ],
      index: true,
    }, // CHANGED: stores exact terminal cause.
    timeTakenMs: {
      type: Number,
      min: 0,
    },
    questionTimeLimitMs: {
      type: Number,
      min: 0,
    },
    checkpointDeadlineMs: {
      type: Number,
      min: 0,
    },
    timedOut: {
      type: Boolean,
      default: false,
    },
    forceCompletedByTimeout: {
      type: Boolean,
      default: false,
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
    attemptKey: {
      type: String,
      trim: true,
    },
    sessionKey: {
      type: String,
      trim: true,
      index: true,
    }, // CHANGED: separate session identity for resumable exam runs.
    completed: {
      type: Boolean,
      default: false,
      index: true,
    },
    questionsAnswered: {
      type: Number,
      min: 0,
      default: 0,
    },
    currentQuestionIndex: {
      type: Number,
      min: 0,
      default: 0,
    },
    checkpointIndex: {
      type: Number,
      min: 0,
      default: 0,
    },
    lastCheckpointAt: {
      type: Date,
      index: true,
    }, // CHANGED: last safe checkpoint save time.
    lastSeenQuestionIndex: {
      type: Number,
      min: 0,
      default: 0,
      index: true,
    }, // CHANGED: last question the user actually reached.
    checkpointSavedAt: {
      type: Date,
    },
    adsServedCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    heartsConsumed: {
      type: Number,
      min: 0,
      default: 0,
    },
    gemsEarned: {
      type: Number,
      min: 0,
      default: 0,
    },
    xpEarned: {
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
      enum: ['Radiography', 'Sonography'],
      index: true,
    },
    completedParts: {
      type: [
        {
          partKey: { type: String, required: true },
          score: { type: Number, default: 0 },
          maxScore: { type: Number, min: 1, default: 10 },
          percentage: { type: Number, default: 0 },
          xpEarned: { type: Number, min: 0, default: 0 },
          gemsEarned: { type: Number, min: 0, default: 0 },
          completedAt: { type: Date, required: true },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    bufferCommands: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

QuizAttemptSchema.index({ user: 1, quiz: 1 })
QuizAttemptSchema.index({ quiz: 1, completed: 1, score: -1 })
QuizAttemptSchema.index({ user: 1, completedAt: -1 })
QuizAttemptSchema.index({ user: 1, mode: 1, status: 1 })
QuizAttemptSchema.index({ user: 1, quiz: 1, mode: 1, status: 1 }) // CHANGED: lets us find unfinished attempts per mode quickly.
QuizAttemptSchema.index(
  { user: 1, quiz: 1, attemptKey: 1 },
  { unique: true, sparse: true },
)
QuizAttemptSchema.index(
  { user: 1, quiz: 1, sessionKey: 1 },
  { unique: true, sparse: true },
) // CHANGED: prevents duplicate sessions for the same attempt identity.

QuizAttemptSchema.virtual('durationMinutes').get(function () {
  if (!this.completedAt || !this.startedAt) return 0
  const ms = this.completedAt.getTime() - this.startedAt.getTime()
  return Math.round(ms / 60000)
})

QuizAttemptSchema.pre('save', function (this: QuizAttemptDoc) {
  if (this.isModified('score') || this.isModified('maxScore')) {
    this.percentage = this.maxScore > 0 ? (this.score / this.maxScore) * 100 : 0
  }
})

export const QuizAttempt: Model<IQuizAttempt> =
  (models.QuizAttempt as Model<IQuizAttempt>) ||
  model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema)
