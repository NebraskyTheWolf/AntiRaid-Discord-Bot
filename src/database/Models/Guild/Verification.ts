import mongoose from "mongoose";

export declare type Answer = {
    title: string;
    content: string;
}

export interface Verification {
    guildId: string;
    memberId: string;
    memberName?: string;
    issuerId?: string;
    issuerName?: string;
    status?: string ;
    answers?: Object;
    registeredAt: number;
    updatedAt?: number;
    expireAt?: number;
}

export default mongoose.model<Verification & mongoose.Document>("Verification", new mongoose.Schema<Verification & mongoose.Document>({
    guildId: { type: String },
    memberId: { type: String },
    memberName: { type: String },
    issuerId: { type: String, default: 'pending' },
    issuerName: { type: String, default: 'pending' },
    status: { type: String, default: 'pending' },
    answers: { type: Object },
    registeredAt: { type: Number },
    updatedAt: { type: Number },
    expireAt: { type: Number }
}));
