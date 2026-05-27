import { number } from "joi";
import mongoose from "mongoose";

const debt = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["lending", "borrowing"],
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    person: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: String,
    paidAmount: {
      type: Number,
      default: 0,
    },
    transactions: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        amount: Number,
        note: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const DebtModel = mongoose.model("Debt", debt);
