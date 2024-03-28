import mongoose from "mongoose";

export interface Reminder {
  memberId: string;
  reminders: number;
  locked: boolean;
  notified: boolean;
}

export default mongoose.model<Reminder & mongoose.Document>("ReminderVerification", new mongoose.Schema<Reminder & mongoose.Document>({
  memberId: { type: String },
  reminders: { type: Number },
  locked: { type: Boolean, default: false },
  notified: { type: Boolean, default: false },
}));
