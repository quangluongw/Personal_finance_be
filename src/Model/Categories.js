import mongoose from "mongoose";

const Categories = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  type: {
    type: String,
    enum: ["income", "expense"],
    default: "income",
  },

  isActive: {
    type: Boolean,
    require: true,
  },

  note: {
    type: String,
    required: true,
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
export const CategoriesModel = mongoose.model("Categories", Categories);
