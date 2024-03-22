import mongoose from "mongoose";

export interface IOffence {
    guild: string;
    member: string;
    type: string;
    count: string;
    timestamp: number;
}

export default mongoose.model<IOffence & mongoose.Document>("Offence", new mongoose.Schema<IOffence & mongoose.Document>({
    guild: { type: String, required: true },
    member: { type: String, required: true },
    type: { type: String },
    timestamp: { type: Number, default: Date.now() },
}));
