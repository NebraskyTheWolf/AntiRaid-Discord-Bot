import mongoose from "mongoose";

export interface File {
  guildId: string;
  memberId: string;
  interactionId?: string;
  messageId: string;
  deleted: boolean;
}

export default mongoose.model<File & mongoose.Document>("Interaction", new mongoose.Schema<File & mongoose.Document>({
  guildId: { type: String },
  memberId: { type: String },
  interactionId: { type: String },
  messageId: { type: String },
  deleted: { type: Boolean }
}));
