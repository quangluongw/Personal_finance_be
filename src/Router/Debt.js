import express from "express";
import {
  addTransactionDebt,
  createDebt,
  deleteDebt,
  getDebtDetail,
  getDebtList,
} from "../Controller/Debt";

const router = express.Router();

router.get("/dept/:id", getDebtList);
router.get("/dept/:id", getDebtDetail);
router.post("/dept/:id/transactions", addTransactionDebt);
router.post("/dept/:id/createDebt", createDebt);
router.delete("/dept/:id/createDebt", deleteDebt);
export default router;
