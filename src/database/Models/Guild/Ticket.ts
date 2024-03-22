import mongoose from "mongoose";

export interface ITicket {
  channelId: string;
  userId: string;
  isClosed: boolean;
}

export default mongoose.model<ITicket & mongoose.Document>("Ticket", new mongoose.Schema<ITicket & mongoose.Document>({
  channelId: { type: String, required: true },
  userId: { type: String, required: true },
  isClosed: { type: Boolean, default: false },
}));
