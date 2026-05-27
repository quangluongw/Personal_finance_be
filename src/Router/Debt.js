import express from "express";
import {
  createDebt,
  deleteDebt,
  getDebtDetail,
  getDebtList,
  updateTransactionDebt,
} from "../Controller/Debt";

const router = express.Router();

router.get("/dept/:id", getDebtList);
router.get("/dept/:id", getDebtDetail);
router.patch("/dept/:id/transactions", updateTransactionDebt);
router.post("/createDebt", createDebt);
router.delete("/dept/:id/createDebt", deleteDebt);
export default router;
