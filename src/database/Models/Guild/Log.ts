import mongoose from 'mongoose'

export interface Log {
  type: string,
  manipulatedUserID: string,
  reason: string,
  reasonChangedFrom: string,
  reasonChangedTo: string,
  staffID: string,
  staffName: string,
  date: string
}

export default mongoose.model<Log & mongoose.Document>("Log", new mongoose.Schema<Log & mongoose.Document>({
  type: { type: String },
  manipulatedUserID: { type: String },
  reasonChangedFrom: { type: String },
  reasonChangedTo: { type: String },
  staffID: { type: String },
  staffName: { type: String },
  date: { type: String }
}));
