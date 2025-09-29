import express from "express";
import { deleteUser, getUser, signin, signup, updateUser } from "../Controller/User";

const router = express.Router();
router.post("/register", signup);
router.post("/login", signin);
router.get("/user/:id", getUser);
router.patch("/user/:id", updateUser);
router.delete("/user/:id", deleteUser);
export default router;
