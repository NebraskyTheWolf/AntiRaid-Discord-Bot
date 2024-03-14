import mongoose from 'mongoose'

export interface IRemote {
  id: string
}

export default mongoose.model<IRemote & mongoose.Document>("RemoteObject", new mongoose.Schema<IRemote & mongoose.Document>({
  id: { type: String }
}));
