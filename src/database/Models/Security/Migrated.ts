import mongoose from "mongoose";

export interface IMigrated {
  guildId: string;
}

export default mongoose.model<IMigrated & mongoose.Document>("Migrated", new mongoose.Schema<IMigrated & mongoose.Document>({
  guildId: { type: String }
}));
