import mongoose from "mongoose";

const Accounts = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    require: true,
  },

  balance: {
    type: Number,
    require: true,
  },

  name: {
    type: String,
    require: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const AccountsModel = mongoose.model("Accounts", Accounts);
