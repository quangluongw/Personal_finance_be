import mongoose from "mongoose";

const User = new mongoose.Schema({
  email: {
    type: String,
    require: true,
  },

  password: {
    type: String,
    require: true,
  },

  fullName: {
    type: String,
    require: false,
  },

  userName: {
    type: String,
    require: true,
  },

  phone: {
    type: String,
    require: false,
  },

  avatar: {
    type: String,
    require: false,
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
export const UserModel = mongoose.model("User", User);
