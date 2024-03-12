import mongoose from 'mongoose'

export interface Whitelist {
  userID: string,
  staff: string,
  guildID: string,
  date: string,
}

export default mongoose.model<Whitelist & mongoose.Document>("Whitelisted", new mongoose.Schema<Whitelist & mongoose.Document>({
  userID: { type: String },
  staff: { type: String },
  guildID: { type: String },
  date: { type: String },
}));
