import express from "express";
import { addTransaction, deleteTransaction, getTransaction, updateTransaction } from "../Controller/Transactions";

const router = express.Router();
router.get("/transaction/:id", getTransaction);
router.post("/addTransactions", addTransaction);
router.patch("/updateTransactions/:id", updateTransaction);
router.delete("/deleteTransactions/:id", deleteTransaction);
export default router;
