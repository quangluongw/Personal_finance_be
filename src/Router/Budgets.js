import express from "express";
import { addBudget, deleteBudget, getBudget, updateBudget } from "../Controller/Budgets";

const router = express.Router();
router.get("/budget/:id", getBudget);
router.post("/addbudget", addBudget);
router.patch("/updatebudget/:id", updateBudget);
router.delete("/deletebudget/:id", deleteBudget);
export default router;
