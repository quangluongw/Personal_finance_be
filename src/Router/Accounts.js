import express from "express";
import {
  createAccount,
  deleteAccount,
  getAccounts,
} from "../Controller/Accounts";
const router = express.Router();

router.post("/account", createAccount);
router.get("/account/:id", getAccounts);
// router.get("/account/:id", getAccountById);
router.delete("/account/:id", deleteAccount);

export default router;
