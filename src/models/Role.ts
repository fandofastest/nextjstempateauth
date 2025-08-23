import mongoose, { Document, Schema } from 'mongoose';

export interface IRole extends Document {
  name: string;
  description: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, required: true, trim: true },
    permissions: { type: [String], required: true, default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);
