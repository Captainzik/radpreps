import { z } from 'zod'
import { getCurrentWeekPeriod } from './utils'

// ─── Common Helpers ──────────────────────────────────────────────────────────
const UrlOptional = z
  .string()
  .url({ message: 'Invalid URL' })
  .optional()
  .or(z.literal(''))

const Rating = z.coerce.number().int().min(1).max(5)

const MongoId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid MongoDB ID' })

const CategoryEnum = z.enum([
  'ARDMS',
  'Sonography Canada',
  'CAMRT',
  'ARRT',
  'CPD',
])

// ─── Option & Question ───────────────────────────────────────────────────────
export const CreateOptionSchema = z.object({
  text: z.string().min(1, 'Option text is required').max(300).trim(),
  image: UrlOptional,
  isCorrect: z.boolean(),
})

export const CreateQuestionSchema = z
  .object({
    question: z.string().min(10, 'Question too short').max(600).trim(),
    image: UrlOptional,
    quizName: z.string().min(3).max(100).trim(),
    tips: z.string().max(2000).trim().optional().default(''),
    isPublished: z.boolean().default(false),
    options: z
      .array(CreateOptionSchema)
      .min(2, 'At least 2 options required')
      .max(4, 'Max 4 options allowed')
      .refine(
        (opts) =>
          new Set(opts.map((o) => o.text.trim().toLowerCase())).size ===
          opts.length,
        {
          message: 'Option texts must be unique (case-insensitive)',
          path: ['options'],
        },
      ),
  })
  .refine((q) => q.options.filter((o) => o.isCorrect).length === 1, {
    message: 'Exactly one correct option required',
    path: ['options'],
  })

export const QuestionUpdateSchema = CreateQuestionSchema.extend({
  _id: MongoId,
})
export const QuestionPatchSchema = CreateQuestionSchema.partial().extend({
  _id: MongoId,
})

// ─── Quiz ────────────────────────────────────────────────────────────────────
export const CreateQuizSchema = z.object({
  name: z.string().min(3).max(100).trim(),
  description: z.string().min(10).max(2000).trim(),
  image: UrlOptional,
  category: CategoryEnum,
  isPublished: z.boolean().default(false),
  tags: z.enum(['Radiography', 'Sonography']).array().default([]),
  questions: z
    .array(MongoId)
    .min(1, 'At least 1 question required')
    .max(200, 'Maximum 200 questions allowed'),
})

export const QuizWithReviewSchema = CreateQuizSchema.extend({
  _id: MongoId,
  avgRating: z.number().min(0).max(5).default(0),
  numReviews: z.number().int().nonnegative().default(0),
  ratingDistribution: z
    .array(
      z.object({
        rating: z.number().int().min(1).max(5),
        count: z.number().int().nonnegative(),
      }),
    )
    .length(5)
    .default(() =>
      Array.from({ length: 5 }, (_, i) => ({ rating: i + 1, count: 0 })),
    ),
  reviews: z.array(MongoId).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const QuizUpdateSchema = CreateQuizSchema.extend({
  _id: MongoId,
})
export const QuizPatchSchema = CreateQuizSchema.partial().extend({
  _id: MongoId,
})

// ─── Publish Quiz ─────────────────────────────────────────────────────────────
export const PublishQuizSchema = z.object({
  quizId: MongoId,
  isPublished: z.boolean().default(true),
})

// ─── Review ──────────────────────────────────────────────────────────────────
export const CreateReviewSchema = z.object({
  quiz: MongoId,
  user: MongoId,
  title: z.string().min(2).max(100).trim(),
  comment: z.string().min(10).max(2000).trim(),
  rating: Rating,
})

// ─── User ────────────────────────────────────────────────────────────────────
export const CreateUserSchema = z.object({
  email: z.string().email({ message: 'Invalid email' }),
  username: z.string().min(3).max(30).trim().optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100),
  fullName: z.string().min(2).max(100).trim().optional(),
  avatar: UrlOptional,
  role: z.enum(['user', 'admin', 'moderator']).default('user'),

  // Streak fields (optional on create)
  currentStreak: z.number().int().nonnegative().default(0),
  longestStreak: z.number().int().nonnegative().default(0),
  lastStreakDate: z.date().optional(),
})

export const UserUpdateSchema = CreateUserSchema.partial().extend({
  _id: MongoId,
  lifetimeTotalScore: z.number().int().nonnegative().optional(), // admin/read-only
})

// ─── Password Reset ──────────────────────────────────────────────────────────
/**
 * Request password reset (send email)
 */
export const RequestPasswordResetSchema = z.object({
  email: z.string().email({ message: 'Invalid email' }),
})

/**
 * Reset password (after receiving token)
 */
export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password too long')
      .trim()
      .refine((val) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(val), {
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      }),
    confirmPassword: z.string().min(1, 'please confirm password').trim(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// ─── Quiz Attempt / Submission ──────────────────────────────────────────────
export const SubmitQuizAttemptSchema = z.object({
  quizId: MongoId,
  answers: z
    .array(
      z.object({
        questionId: MongoId,
        selectedOptionIndex: z.number().int().min(0).max(3).optional(), // allow skipping
        timeSpentMs: z.number().min(0).optional(),
      }),
    )
    .min(1, 'At least one answer required')
    .refine(
      (answers) =>
        new Set(answers.map((a) => a.questionId)).size === answers.length,
      { message: 'Duplicate question answers are not allowed' },
    ),
  timeTakenMs: z.number().min(0).optional(),
})
export const SubmitQuizAttemptWithKeySchema = SubmitQuizAttemptSchema.extend({
  attemptKey: z
    .string()
    .min(8, 'attemptKey too short')
    .max(128, 'attemptKey too long'),
})

// ─── Leaderboard ─────────────────────────────────────────────────────────────
/**
 * Single leaderboard entry (response shape)
 */
export const LeaderboardEntrySchema = z.object({
  _id: MongoId,
  period: z.string(), // e.g. "2025-week-10"
  user: MongoId,
  totalScore: z.number().min(0),
  quizAttempts: z.number().int().min(1),
  totalPercentage: z.number().min(0),
  averagePercentage: z.number().min(0).max(100),
  bestPercentage: z.number().min(0).max(100),
  lastAttemptAt: z.date(),
  categoryScores: z.record(CategoryEnum, z.number().min(0)).optional(),
  rank: z.number().int().min(1).optional(), // computed on read
  userInfo: z
    .object({
      username: z.string().optional(),
      avatar: UrlOptional,
      fullName: z.string().optional(),
    })
    .optional(), // when populated
  createdAt: z.date(),
  updatedAt: z.date(),
})

/**
 * Array of leaderboard entries (common response)
 */
export const LeaderboardResponseSchema = z.array(LeaderboardEntrySchema)

/**
 * Query params for leaderboard endpoints
 */
export const LeaderboardQuerySchema = z.object({
  period: z.string().optional().default(getCurrentWeekPeriod()), // auto-default to current e.g. "2025-week-10"
  category: CategoryEnum.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['score', 'attempts', 'average']).default('score'),
  sortOrder: z.enum(['desc', 'asc']).default('desc'),
})
