import mongoose from 'mongoose'

export interface LocalBlacklist {
  userID: string,
  reason: string,
  staff: string,
  guildID: string,
  date: string
}

export default mongoose.model<LocalBlacklist & mongoose.Document>("LocalBlacklist", new mongoose.Schema<LocalBlacklist & mongoose.Document>({
  userID: { type: String },
  reason: { type: String },
  staff: { type: String },
  guildID: { type: String },
  date: { type: String },
}));
