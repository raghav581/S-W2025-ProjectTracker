import mongoose, { Schema, Document } from 'mongoose';

export interface IAllowedEmail extends Document {
  urn: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const allowedEmailSchema = new Schema<IAllowedEmail>(
  {
    urn: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.AllowedEmail || mongoose.model<IAllowedEmail>('AllowedEmail', allowedEmailSchema);
