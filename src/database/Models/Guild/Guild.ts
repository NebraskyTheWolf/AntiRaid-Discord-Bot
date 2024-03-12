import mongoose from "mongoose";

export interface Guild {
  guildID: string,
  guildOwnerID: string,
  logChannelID: string,
  globalDatabase: boolean,
  localDatabase: boolean,
  localCount: number,
  scamLinks: boolean,
  premium: boolean,
  language: string,
}

export default mongoose.model<Guild & mongoose.Document>("Guild", new mongoose.Schema<Guild & mongoose.Document>({
  guildID: { type: String, required: true },
  guildOwnerID: { type: String },
  logChannelID: { type: String },
  globalDatabase: { type: Boolean, default: true},
  localDatabase: { type: Boolean, default: false},
  localCount: { type: Number, default: 0},
  scamLinks: { type: Boolean, default: true},
  premium: { type: Boolean, default: false},
  language: { type: String, default: 'cz'},
}));
