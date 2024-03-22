import mongoose from "mongoose";

export interface IRaidSession {
  session: string;
  userId: string;
  isAcknowledged: string;
}

export default mongoose.model<IRaidSession & mongoose.Document>("RaidSession", new mongoose.Schema<IRaidSession & mongoose.Document>({
  session: { type: String, required: true },
  userId: { type: String, required: true }
}));
