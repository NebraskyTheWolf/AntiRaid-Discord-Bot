import mongoose from "mongoose";

export interface IPrevention {
  session: string;
}

export default mongoose.model<IPrevention & mongoose.Document>("Prevention", new mongoose.Schema<IPrevention & mongoose.Document>({
  session: { type: String, required: true }
}));
