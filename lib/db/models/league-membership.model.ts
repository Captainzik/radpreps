import { HydratedDocument, Model, model, models, Schema, Types } from 'mongoose'

export interface ILeagueMembership {
  user: Types.ObjectId
  group: Types.ObjectId
  tier: string
  tierRank: number
  weeklyXp: number
  weekStart: Date
  promotedFrom?: string
  demotedFrom?: string
  settled: boolean
  createdAt?: Date
  updatedAt?: Date
}

export type ILeagueMembershipDocument = HydratedDocument<ILeagueMembership>

const LeagueMembershipSchema = new Schema<ILeagueMembership>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: 'LeagueGroup',
      required: true,
      index: true,
    },
    tier: { type: String, required: true, trim: true },
    tierRank: { type: Number, required: true, min: 1 },
    weeklyXp: { type: Number, default: 0, min: 0 },
    weekStart: { type: Date, required: true },
    promotedFrom: { type: String, trim: true },
    demotedFrom: { type: String, trim: true },
    settled: { type: Boolean, default: false },
  },
  { timestamps: true },
)

// Each user can only have one membership per week.
LeagueMembershipSchema.index({ user: 1, weekStart: 1 }, { unique: true })
// Fast ranked fetch for a group.
LeagueMembershipSchema.index({ group: 1, weeklyXp: -1 })

export const LeagueMembership: Model<ILeagueMembership> =
  (models.LeagueMembership as Model<ILeagueMembership>) ||
  model<ILeagueMembership>('LeagueMembership', LeagueMembershipSchema)
