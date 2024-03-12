import mongoose from 'mongoose'

export interface Staff {
  userID: string,
  rank: string,
  name: string,
}

export default mongoose.model<Staff & mongoose.Document>("Staff", new mongoose.Schema<Staff & mongoose.Document>({
  userID: { type: String },
  rank: { type: String },
  name: { type: String }
}));
