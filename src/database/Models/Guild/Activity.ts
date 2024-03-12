import mongoose from "mongoose";

export interface Activity {
    guildId: string;
    memberId: string;
    type: string;
    action: string;
    registeredAt: number;
}

export default mongoose.model<Activity & mongoose.Document>("Activity", new mongoose.Schema<Activity & mongoose.Document>({
    guildId: { type: String },
    memberId: { type: String },
    type: { type: String },
    action: { type: String },
    registeredAt: { type: Number },
}));
