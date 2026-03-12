import { Document, Model, model, models, Schema } from 'mongoose'

// Plain interface for subdocument (no extends Document)
export interface IOption {
  text: string
  image?: string
  isCorrect: boolean
}

export interface IQuestion extends Document {
  question: string
  image?: string
  quizName?: string
  options: IOption[]
  tips?: string
  isPublished: boolean
  createdAt?: Date
  updatedAt?: Date
}

const OptionSubSchema = new Schema<IOption>(
  {
    text: {
      type: String,
      required: [true, 'Option text is required'],
      trim: true,
      minlength: [1, 'Option text is too short'],
      maxlength: [300, 'Option text is too long'],
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
    isCorrect: {
      type: Boolean,
      required: [true, 'isCorrect flag is required'],
    },
  },
  { _id: false },
)

const QuestionSchema = new Schema<IQuestion>(
  {
    question: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
      minlength: [10, 'Question is too short (min 10 chars)'],
      maxlength: [600, 'Question is too long (max 600 chars)'],
      index: true,
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
    quizName: {
      type: String,
      trim: true,
      minlength: [3, 'Quiz name is too short (min 3 chars)'],
      maxlength: [100, 'Quiz name is too long (max 100 chars)'],
      index: true,
      required: [true, 'Quiz name is required'], // ← aligned with Zod true,
    },
    options: {
      type: [OptionSubSchema],
      required: [true, 'Options are required'],
      minlength: [2, 'At least 2 options required'],
      maxlength: [4, 'Maximum 4 options allowed'],
      validate: {
        validator: (opts: IOption[]) => {
          const texts = opts.map((o) => o.text.trim().toLowerCase())
          return new Set(texts).size === texts.length
        },
        message: 'Option texts must be unique (case-insensitive)',
      },
    },
    tips: {
      type: String,
      trim: true,
      maxlength: [2000, 'Tips too long (max 2000 chars)'], // ← aligned with Zod
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

// Enforce exactly one correct option
QuestionSchema.pre('validate', function (next) {
  const correctCount = this.options.filter((opt) => opt.isCorrect).length
  if (correctCount !== 1) {
    this.invalidate('options', 'Exactly one option must be marked as correct')
  }
  next()
})

export const Question: Model<IQuestion> =
  models.Question || model<IQuestion>('Question', QuestionSchema)
