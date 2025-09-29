import mongoose from "mongoose";

const Budgets = new mongoose.Schema({
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

  budgetAmount: {
    type: Number,
    require: true,
  },

  spentAmount: {
    type: Number,
    require: true,
  },

  is_active: {
    type: Boolean,
    default: false,
  },

  startDate: {
    type: String,
    default: true,
  },

  endDate: {
    type: String,
    default: true,
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

export const BudgetsModel = mongoose.model("Budgets", Budgets);
