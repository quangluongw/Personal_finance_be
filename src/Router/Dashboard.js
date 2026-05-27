import express from "express";
import  { getDashboard } from "../Controller/Dashboard";

const router = express.Router();
router.get("/dashboard/:id", getDashboard);
export default router;
