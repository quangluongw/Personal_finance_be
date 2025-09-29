import express from "express";
import { addSaving, deleteSaving, getSaving, updateSaving } from "../Controller/Savings";
const router = express.Router();
router.get("/saving/:id", getSaving);
router.post("/addSaving", addSaving);
router.patch("/updateSaving/:id", updateSaving);
router.delete("/deleteSaving/:id", deleteSaving);
export default router;
