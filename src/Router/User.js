import express from "express";
import {
  checkout,
  deleteUser,
  getMe,
  getUser,
  signin,
  signup,
  updateUser,
} from "../Controller/User";

const router = express.Router();
router.post("/register", signup);
router.post("/login", signin);
router.get("/user/:id", checkout, getUser);
router.get("/me", checkout, getMe);
router.patch("/user/:id", updateUser);
router.delete("/user/:id", deleteUser);
export default router;
