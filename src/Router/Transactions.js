import express from "express";
import {
  addTransaction,
  deleteTransaction,
  getTransaction,
  totalTransaction,
  updateTransaction,
} from "../Controller/Transactions";

const router = express.Router();
router.get("/transaction/:id", getTransaction);
router.get("/totalTransaction/:id", totalTransaction);
router.post("/addTransactions", addTransaction);
router.patch("/updateTransactions/:id", updateTransaction);
router.delete("/deleteTransactions/:id", deleteTransaction);
export default router;
