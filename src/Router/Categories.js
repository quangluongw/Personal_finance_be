import express from "express";
import { addCategories, deleteCategori, getCategori, updateCategori } from "../Controller/Categories";

const router = express.Router();
router.get("/categories", getCategori);
router.post("/addCategories", addCategories);
router.patch("/updateCategories/:id", updateCategori);
router.delete("/deleteCategories/:id", deleteCategori);
export default router;
