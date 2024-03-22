import mongoose from "mongoose";

export interface IPrevention {
  userId: string;
}

export default mongoose.model<IPrevention & mongoose.Document>("Preventions", new mongoose.Schema<IPrevention & mongoose.Document>({
  userId: { type: String, required: true }
}));
