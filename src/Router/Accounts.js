import express from "express";
import {
  createAccount,
  deleteAccount,
  deleteAllAccounts,
  getAccountById,
  getAccounts,
} from "../Controller/Accounts";
const router = express.Router();

router.post("/account", createAccount);
router.get("/account/:id", getAccounts);
router.get("/accountdetail/:id", getAccountById);
router.delete("/account/:id", deleteAccount);
router.delete("/accounts/user/:userId/all", deleteAllAccounts);
export default router;
