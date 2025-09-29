import mongoose from "mongoose";

const Savings = new mongoose({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    require: true,
  },

  name: {
    type: String,
    require: true,
  },

  targetAmount: {
    type: Number,
    require: true,
  },

  currentAmount: {
    type: Number,
    require: true,
  },

  description: {
    type: String,
    require: true,
  },
});
export const SavingsModel = mongoose.model("Savings", Savings);

