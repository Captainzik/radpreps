import { HydratedDocument, Model, model, models, Schema, Types } from 'mongoose'

// Quiz model (plain interface)
export interface IQuiz {
  name: string
  description: string
  image?: string
  category: 'ARDMS' | 'Sonography Canada' | 'CAMRT' | 'ARRT' | 'CPD'
  tags: ('Radiography' | 'Sonography')[]
  questions: Types.ObjectId[]
  avgRating: number
  numReviews: number
  ratingDistribution: { rating: number; count: number }[]
  reviews: Types.ObjectId[]
  createdAt?: Date
  updatedAt?: Date
  isPublished?: boolean
}

export type IQuizDocument = HydratedDocument<IQuiz>

const QuizSchema = new Schema<IQuiz>(
  {
    name: {
      type: String,
      required: [true, 'Quiz name is required'],
      trim: true,
      minlength: [3, 'Name is too short (min 3 characters)'],
      maxlength: [100, 'Name is too long (max 100 characters)'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description is too short (min 10 characters)'],
      maxlength: [2000, 'Description is too long (max 2000 characters)'],
    },
    image: {
      type: String,
      trim: true,
      validate: {
        validator: (v: string) =>
          !v || /^https?:\/\/[^\s/$.?#].[^\s]*$/.test(v),
        message: 'Invalid image URL',
      },
    },
    category: {
      type: String,
      enum: ['ARDMS', 'Sonography Canada', 'CAMRT', 'ARRT', 'CPD'],
      required: [true, 'Category is required'],
    },
    tags: {
      type: [
        {
          type: String,
          enum: ['Radiography', 'Sonography'],
        },
      ],
      default: [],
    },
    questions: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
      required: [true, 'At least one question is required'],
      minlength: [1, 'At least 1 question required'],
    },
    avgRating: {
      type: Number,
      min: [0, 'Average rating cannot be negative'],
      max: [5, 'Average rating cannot exceed 5'],
      default: 0,
    },
    numReviews: {
      type: Number,
      min: 0,
      default: 0,
    },
    ratingDistribution: {
      type: [
        {
          rating: {
            type: Number,
            min: 1,
            max: 5,
            required: true,
          },
          count: {
            type: Number,
            min: 0,
            required: true,
          },
        },
      ],
      default: [
        { rating: 1, count: 0 },
        { rating: 2, count: 0 },
        { rating: 3, count: 0 },
        { rating: 4, count: 0 },
        { rating: 5, count: 0 },
      ],
    },
    reviews: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    collection: 'quizzes',
  },
)

// Indexes
QuizSchema.index({ category: 1 })
QuizSchema.index({ tags: 1 })
QuizSchema.index({ name: 1 })
QuizSchema.index({ isPublished: 1, updatedAt: -1 })

// Virtual for total score / difficulty calculation (optional)
QuizSchema.virtual('questionCount').get(function () {
  return this.questions?.length || 0
})

// Static method to populate questions when fetching a quiz
QuizSchema.statics.findByIdWithQuestions = async function (id: string) {
  return this.findById(id).populate('questions').lean()
}

// Pre-save: validate question references
QuizSchema.pre('save', async function (this: IQuizDocument) {
  if (!this.isModified('questions')) return

  if (!models.Question) {
    throw new Error('Question model is not registered')
  }

  const QuestionModel = models.Question

  if (!this.questions?.length) return

  const invalidIds = await Promise.all(
    this.questions.map(async (qId) => {
      const exists = await QuestionModel.exists({ _id: qId })
      return !exists
    }),
  )

  if (invalidIds.some(Boolean)) {
    const badIds = this.questions
      .filter((_, index) => invalidIds[index])
      .map((id) => id.toString())
      .join(', ')

    throw new Error(`Invalid question references: ${badIds} do not exist`)
  }
})

export const Quiz: Model<IQuiz> =
  (models.Quiz as Model<IQuiz>) || model<IQuiz>('Quiz', QuizSchema)
