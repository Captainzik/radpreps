import { HydratedDocument, Model, model, models, Schema, Types } from 'mongoose'

type EmailTokenPurpose = 'verify-email' | 'reset-password'

export interface IEmailToken {
  _id?: Types.ObjectId
  user: Types.ObjectId
  email: string
  purpose: EmailTokenPurpose
  tokenHash: string
  expiresAt: Date
  usedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

export type IEmailTokenDocument = HydratedDocument<IEmailToken>

const EmailTokenSchema = new Schema<IEmailToken>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    purpose: {
      type: String,
      required: [true, 'Purpose is required'],
      enum: ['verify-email', 'reset-password'],
      index: true,
    },
    tokenHash: {
      type: String,
      required: [true, 'Token hash is required'],
      index: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration is required'],
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

EmailTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
EmailTokenSchema.index({ user: 1, purpose: 1 })
EmailTokenSchema.index({ email: 1, purpose: 1 })

export const EmailToken: Model<IEmailToken> =
  (models.EmailToken as Model<IEmailToken>) ||
  model<IEmailToken>('EmailToken', EmailTokenSchema)
