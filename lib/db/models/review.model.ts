import { Document, Model, model, models, Schema, Types } from 'mongoose'

export interface IReview extends Document {
  quiz: Types.ObjectId // reference to Quiz
  user: Types.ObjectId // reference to User
  title: string
  comment: string
  rating: number // 1–5
  createdAt?: Date
  updatedAt?: Date
}

const ReviewSchema = new Schema<IReview>(
  {
    quiz: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: [true, 'Quiz reference is required'],
      index: true, // fast lookup by quiz
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User', // assuming you have a User model
      required: [true, 'User reference is required'],
      index: true,
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

// Optional: virtual to show username or other user info when populated
ReviewSchema.virtual('username').get(function () {
  // If populated → use username
  if (this.user && typeof this.user === 'object' && 'username' in this.user) {
    const populated = this.user as { username?: string }
    return populated.username || 'Anonymous'
  }
  // If only reference (ObjectId) → return ID or fallback
  return this.user?._id?.toString() || 'Anonymous'
})

export const Review: Model<IReview> =
  models.Review || model<IReview>('Review', ReviewSchema)
