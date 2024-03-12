import mongoose from "mongoose";

export interface IBlacklist {
  type: string;
  endBan: string;
  userID: string;
  reason: string;
  staffID: string;
  staffName: string;
  date: string;
}

export default mongoose.model<IBlacklist & mongoose.Document>("Blacklist", new mongoose.Schema<IBlacklist & mongoose.Document>({
  type: { type: String, default: 'perm' },
  endBan: { type: String },
  userID: { type: String },
  reason: { type: String },
  staffID: { type: String },
  staffName: { type: String },
  date: { type: String }
}));
