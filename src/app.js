import express from "express";
import cors from "cors";

import userRouter from "./Router/User";
import categoriesRouter from "./Router/Categories";
import budgetRouter from "./Router/Budgets";
import { ConnectDb } from "./Config/Db";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Cấu hình CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", // URL của frontend
    credentials: true, // Cho phép gửi cookies
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Các methods được phép
    allowedHeaders: ["Content-Type", "Authorization"], // Headers được phép
  })
);

app.use(express.json());

ConnectDb();

app.use("/api", userRouter);
app.use("/api", budgetRouter);
app.use("/api", categoriesRouter);

// export const viteNodeApp = app;
export default app;