import mongoose from "mongoose";

const Transactions = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    require: true,
  },

  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Categories",
    require: true,
  },

  transactionType: {
    type: String,
    enum: ["income", "expense"],
    default: "income",
  },

  amount: {
    type: Number,
    require: true,
  },

  description: {
    type: String,
    require: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});
export const TransactionsModel = mongoose.model("Transactions", Transactions);