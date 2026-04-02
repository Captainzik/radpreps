import { z } from 'zod'
import {
  CreateOptionSchema,
  CreateQuestionSchema,
  CreateQuizSchema,
  CreateReviewSchema,
  QuestionUpdateSchema,
  QuizUpdateSchema,
  CreateUserSchema,
  SubmitQuizAttemptSchema,
  LeaderboardEntrySchema,
  LeaderboardResponseSchema,
  ResetPasswordSchema,
  RequestPasswordResetSchema,
  SubmitQuizAttemptWithKeySchema,
} from '@/lib/validator'

export type IReviewSchema = z.infer<typeof CreateReviewSchema>
export type IUserSchema = z.infer<typeof CreateUserSchema>
export type IOptionSchema = z.infer<typeof CreateOptionSchema>
export type IQuizSchema = z.infer<typeof CreateQuizSchema>
export type IQuestionSchema = z.infer<typeof CreateQuestionSchema>
export type IQuizUpdateSchema = z.infer<typeof QuizUpdateSchema>
export type IQuestionUpdateSchema = z.infer<typeof QuestionUpdateSchema>
export type ISubmitQuizAttemptSchema = z.infer<typeof SubmitQuizAttemptSchema>
export type ILeaderboardEntrySchema = z.infer<typeof LeaderboardEntrySchema>
export type ILeaderboardResponseSchema = z.infer<
  typeof LeaderboardResponseSchema
>
export type IRequestPasswordResetSchema = z.infer<
  typeof RequestPasswordResetSchema
>
export type IResetPasswordSchema = z.infer<typeof ResetPasswordSchema>
export type IQuizWithReviewsSchema = z.infer<typeof CreateQuizSchema> & {
  reviews: IReviewSchema[]
}

export type ISubmitQuizAttemptInput = z.infer<
  typeof SubmitQuizAttemptWithKeySchema
> & {
  attemptKey: string // added by middleware
}
