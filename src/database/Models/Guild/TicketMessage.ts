import mongoose from "mongoose";

export interface ITicketMessage {
  ticketId: string;
  userId: string;
  message: string;
  createdAt: number;
}

export default mongoose.model<ITicketMessage & mongoose.Document>("TicketMessages", new mongoose.Schema<ITicketMessage & mongoose.Document>({
  ticketId: { type: String, required: true },
  userId: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Number, default: Date.now() },
}));
