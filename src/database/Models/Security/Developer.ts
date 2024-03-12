import mongoose from "mongoose";

export interface Developer {
  userId: string;
}

export default mongoose.model<Developer & mongoose.Document>("Developer", new mongoose.Schema<Developer & mongoose.Document>({
  userId: { type: String }
}));
