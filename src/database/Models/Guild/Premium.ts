import mongoose from 'mongoose'

export interface Premium {
  code: string,
  redeemed: boolean,
  usage: string,
  guildID: string
}

export default mongoose.model<Premium & mongoose.Document>("Premium", new mongoose.Schema<Premium & mongoose.Document>({
  code: { type: String },
  redeemed: { type: Boolean },
  usage: { type: String },
  guildID: { type: String }
}));
