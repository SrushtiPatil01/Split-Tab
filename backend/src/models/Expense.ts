import mongoose, { Schema, Document, Types } from "mongoose";

export interface IExpense extends Document {
  groupId: Types.ObjectId;
  paidBy: string;
  amount: number;
  currency: string;
  convertedAmount: number;
  splitType: "equal" | "custom";
  splitAmong: string[];
  customAmounts?: Map<string, number>;
  note?: string;
  createdAt: Date;
}

const ExpenseSchema = new Schema<IExpense>({
  groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true, index: true },
  paidBy: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0.01 },
  currency: { type: String, required: true, default: "USD" },
  convertedAmount: { type: Number, required: true },
  splitType: { type: String, enum: ["equal", "custom"], default: "equal" },
  splitAmong: [{ type: String, trim: true }],
  customAmounts: { type: Map, of: Number },
  note: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IExpense>("Expense", ExpenseSchema);