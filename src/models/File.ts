import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFile extends Document {
  originalName: string;
  storedName: string;
  size: number;
  mimeType: string;
  storagePath: string; // local absolute path or relative
  s3Key?: string;
  uploader: Types.ObjectId;
  category?: string;
  description?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema: Schema = new Schema(
  {
    originalName: { type: String, required: true },
    storedName: { type: String, required: true, unique: true },
    size: { type: Number, required: true },
    mimeType: { type: String, required: true },
    storagePath: { type: String, required: true },
    s3Key: { type: String },
    uploader: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, index: true },
    description: { type: String, default: '' },
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.File || mongoose.model<IFile>('File', FileSchema);
