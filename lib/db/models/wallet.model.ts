import { HydratedDocument, Model, model, models, Schema, Types } from 'mongoose'
import type { QuizMode } from '@/lib/modes/types' // CHANGED: wallet entries can be tied to the learning mode that generated them.

export type WalletTransactionType =
  | 'ad_reward'
  | 'referral_bonus'
  | 'gift_sent'
  | 'gift_received'
  | 'heart_exchange'
  | 'streak_reward'
  | 'quiz_completion'
  | 'quest_reward'
  | 'premium_grant'
  | 'manual_adjustment'

export interface IWalletTransaction {
  type: WalletTransactionType
  amount: number
  currency: 'hearts' | 'gems' | 'xp'
  mode?: QuizMode
  reason: string
  createdAt?: Date
}

export interface IWallet {
  user: Types.ObjectId
  hearts: number
  gems: number
  xp: number
  leagueTier: string
  leagueTierRank: number
  premium: boolean
  lastHeartRefillAt?: Date
  lastAdRewardAt?: Date
  lastXPAwardAt?: Date
  streakFreezeCount: number
  streakFreezeResetAt?: Date
  referralCode?: string
  referredBy?: string
  adRewardsToday: number
  adRewardsResetAt?: Date
  transactions: IWalletTransaction[]
  createdAt?: Date
  updatedAt?: Date
}

export type IWalletDocument = HydratedDocument<IWallet>

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    type: {
      type: String,
      enum: [
        'ad_reward',
        'referral_bonus',
        'gift_sent',
        'gift_received',
        'heart_exchange',
        'streak_reward',
        'quiz_completion',
        'quest_reward',
        'premium_grant',
        'manual_adjustment',
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      enum: ['hearts', 'gems', 'xp'],
      required: true,
    },
    mode: {
      type: String,
      enum: ['exam', 'cpd'],
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
  },
  {
    _id: false,
    timestamps: { createdAt: true, updatedAt: false },
  },
)

const WalletSchema = new Schema<IWallet>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    hearts: {
      type: Number,
      default: 5,
      min: 0,
    },
    gems: {
      type: Number,
      default: 0,
      min: 0,
    },
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },
    leagueTier: {
      type: String,
      default: 'Bronze',
      trim: true,
    },
    leagueTierRank: {
      type: Number,
      default: 1,
      min: 1,
    },
    premium: {
      type: Boolean,
      default: false,
    },
    lastHeartRefillAt: {
      type: Date,
    },
    lastAdRewardAt: {
      type: Date,
    },
    lastXPAwardAt: {
      type: Date,
    },
    streakFreezeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    streakFreezeResetAt: {
      type: Date,
    },
    referralCode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
    referredBy: {
      type: String,
      trim: true,
      index: true,
    },
    adRewardsToday: {
      type: Number,
      default: 0,
      min: 0,
    },
    adRewardsResetAt: {
      type: Date,
    },
    transactions: {
      type: [WalletTransactionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

WalletSchema.index({ premium: 1 })

export const Wallet: Model<IWallet> =
  (models.Wallet as Model<IWallet>) || model<IWallet>('Wallet', WalletSchema)
