import { HydratedDocument, Model, model, models, Schema } from 'mongoose'

export type LeagueGroupStatus = 'active' | 'completed'

export interface ILeagueGroup {
  tier: string
  tierRank: number
  weekStart: Date
  weekEnd: Date
  status: LeagueGroupStatus
  memberCount: number
  maxMembers: number
  createdAt?: Date
  updatedAt?: Date
}

export type ILeagueGroupDocument = HydratedDocument<ILeagueGroup>

const LeagueGroupSchema = new Schema<ILeagueGroup>(
  {
    tier: { type: String, required: true, trim: true },
    tierRank: { type: Number, required: true, min: 1 },
    weekStart: { type: Date, required: true },
    weekEnd: { type: Date, required: true },
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
    },
    memberCount: { type: Number, default: 0, min: 0 },
    maxMembers: { type: Number, default: 25 },
  },
  { timestamps: true },
)

LeagueGroupSchema.index({ tier: 1, weekStart: 1, status: 1 })
LeagueGroupSchema.index({ weekStart: 1, status: 1 })

export const LeagueGroup: Model<ILeagueGroup> =
  (models.LeagueGroup as Model<ILeagueGroup>) ||
  model<ILeagueGroup>('LeagueGroup', LeagueGroupSchema)
