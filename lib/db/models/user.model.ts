import { Document, Model, model, models, Schema } from 'mongoose'

export interface IUser extends Document {
  email: string
  username?: string
  password?: string
  fullName?: string
  avatar?: string
  role: 'user' | 'admin' | 'moderator'
  isVerified: boolean
  favoriteCategories: string[]
  lifetimeTotalScore: number
  lastActive?: Date
  createdAt?: Date
  updatedAt?: Date
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email'],
    },
    username: {
      type: String,
      trim: true,
      minlength: [3, 'Username too short'],
      maxlength: [30, 'Username too long'],
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      select: false,
    },
    fullName: {
      type: String,
      trim: true,
      maxlength: [100, 'Name too long'],
    },
    avatar: {
      type: String,
      trim: true,
      validate: {
        validator: (v: string) =>
          !v || /^https?:\/\/[^\s/$.?#].[^\s]*$/.test(v),
        message: 'Invalid avatar URL',
      },
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    favoriteCategories: {
      type: [
        {
          type: String,
          enum: ['ARDMS', 'Sonography Canada', 'CAMRT', 'ARRT', 'CPD'],
        },
      ],
      default: [],
    },
    lifetimeTotalScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete ret.password
        return ret
      },
      virtuals: true,
    },
    toObject: { virtuals: true },
  },
)

// Indexes
UserSchema.index({ email: 1 }, { unique: true })
UserSchema.index({ username: 1 }, { unique: true, sparse: true })
UserSchema.index({ role: 1 })
UserSchema.index({ lifetimeTotalScore: -1, role: 1 }) // global leaderboard (exclude admins)
UserSchema.index({ lastActive: -1 }) // recent active users

// Virtuals
UserSchema.virtual('reviewCount', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'user',
  count: true,
})

// Pre-save: update lastActive
UserSchema.pre('save', function (next) {
  this.lastActive = new Date()
  next()
})

export const User: Model<IUser> =
  models.User || model<IUser>('User', UserSchema)
