import { HydratedDocument, Model, model, models, Schema, Types } from 'mongoose'

export interface IReview {
  quiz: Types.ObjectId
  user: Types.ObjectId
  title: string
  comment: string
  rating: number
  createdAt?: Date
  updatedAt?: Date
}

export type IReviewDocument = HydratedDocument<IReview>

const ReviewSchema = new Schema<IReview>(
  {
    quiz: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: [true, 'Quiz reference is required'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Review title is required'],
      trim: true,
      minlength: [2, 'Title is too short (min 2 characters)'],
      maxlength: [50, 'Title is too long (max 50 characters)'],
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
      minlength: [10, 'Comment is too short (min 10 characters)'],
      maxlength: [2000, 'Comment is too long (max 2000 characters)'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must be at most 5'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be an integer',
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Optional: prevent multiple reviews from same user on same quiz
ReviewSchema.index({ quiz: 1, user: 1 }, { unique: true })
ReviewSchema.index({ quiz: 1 })
ReviewSchema.index({ user: 1 })

// Optional: virtual to show username or other user info when populated
ReviewSchema.virtual('username').get(function () {
  if (this.user && typeof this.user === 'object' && 'username' in this.user) {
    const populated = this.user as { username?: string }
    return populated.username || 'Anonymous'
  }
  return this.user?._id?.toString() || 'Anonymous'
})

export const Review: Model<IReview> =
  (models.Review as Model<IReview>) || model<IReview>('Review', ReviewSchema)
