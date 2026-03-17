import mongoose from "mongoose";

const debt = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["lending", "borrowing"],
      required: true,
    },
    person: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: String, // hoặc Date
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    description: String,
    paidAmount: {
      type: Number,
      default: 0,
    },

  },
  {
    timestamps: true,
  }
);

export const DebtModel = mongoose.model("Debt", debt);
