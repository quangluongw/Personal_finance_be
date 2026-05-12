import mongoose from "mongoose";

const Accounts = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  name: {
    type: String,
    required: true,
  },

  type: {
    type: String,
    enum: ["bank", "wallet", "cash"],
    default: "bank",
  },

  balance: {
    type: Number,
    required: true,
    default: 0,
  },
  icon: {
    type: String, 
  },
  accountNumber: {
    type: String,
  },

  change: {
    type: Number,
    default: 0,
  },

  isPrimary: {
    type: Boolean,
    default: false,
  },

  lastTransaction: {
    type: Date,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const AccountsModel = mongoose.model("Accounts", Accounts);
