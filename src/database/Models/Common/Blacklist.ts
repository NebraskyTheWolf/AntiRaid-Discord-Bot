import mongoose from "mongoose";

export interface IBlacklist {
  type: string;
  endBan: string;
  userID: string;
  reason: string;
  staffID: string;
  staffName: string;
  date: string;
  isRemote: boolean;
  isAcknowledged: boolean;
}

export default mongoose.model<IBlacklist & mongoose.Document>("Blacklist", new mongoose.Schema<IBlacklist & mongoose.Document>({
  type: { type: String, default: 'perm' },
  endBan: { type: String, default: 'perm' },
  userID: { type: String },
  reason: { type: String },
  staffID: { type: String },
  staffName: { type: String },
  date: { type: String },
  isRemote: { type: Boolean },
  isAcknowledged: { type: Boolean }
}));
