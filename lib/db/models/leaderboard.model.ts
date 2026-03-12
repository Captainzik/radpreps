import { Document, Model, model, models, Schema, Types } from 'mongoose';

export interface ILeaderboardEntry extends Document {
  period: string;               // e.g. '2025-week-10', '2025-month-03'
  user: Types.ObjectId;
  totalScore: number;
  quizAttempts: number;
  averagePercentage: number;
  bestPercentage: number;
  lastAttemptAt: Date;
  categoryScores?: Map<string, number>; // optional: per-category breakdown
  rank?: number;                // computed on read (not stored)
  createdAt?: Date;
  updatedAt?: Date;
}

const LeaderboardSchema = new Schema<ILeaderboardEntry>(
  {
    period: {
      type: String,
      required: true,
      index: true, // fast filter by week/month
      // Example format: '2025-week-10' or '2025-month-03'
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    totalScore: {
      type: Number,
      required: true,
      min: 0,
      index: -1, // descending for leaderboard sort
    },
    quizAttempts: {
      type: Number,
      required: true,
      min: 1,
    },
    averagePercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    bestPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    lastAttemptAt: {
      type: Date,
      required: true,
    },
    categoryScores: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
  },
  {
    timestamps: true,
  }
);

// Unique per user + period
LeaderboardSchema.index({ period: 1, user: 1 }, { unique: true });
LeaderboardSchema.index({ period: 1, totalScore: -1 }); // global leaderboard per period

// Virtual: rank within period (computed on read, not stored)
LeaderboardSchema.virtual('rank').get(function () {
  // This would be populated via aggregation — not stored
  return null;
});

// Pre-save: update lastAttemptAt
LeaderboardSchema.pre('save', function (next) {
  this.lastAttemptAt = new Date();
  next();
});

export const Leaderboard: Model<ILeaderboardEntry> =
  models.Leaderboard || model<ILeaderboardEntry>('Leaderboard', LeaderboardSchema);