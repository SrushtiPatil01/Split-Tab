import mongoose, { Schema, Document } from "mongoose";

export interface IGroup extends Document {
  name: string;
  code: string;
  creatorName: string;
  members: string[];
  baseCurrency: string;
  createdAt: Date;
}

const GroupSchema = new Schema<IGroup>({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, length: 6 },
  creatorName: { type: String, required: true, trim: true },
  members: [{ type: String, trim: true }],
  baseCurrency: { type: String, default: "USD" },
  createdAt: { type: Date, default: Date.now },
});

GroupSchema.index({ code: 1 });

export default mongoose.model<IGroup>("Group", GroupSchema);