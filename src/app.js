import express from "express";
import cors from "cors";

import userRouter from "./Router/User";
import categoriesRouter from "./Router/Categories";
import budgetRouter from "./Router/Budgets";
import transactionRouter from "./Router/Transactions";
import savingRouter from "./Router/Savings";
import { ConnectDb } from "./Config/Db";
import cookieParser from "cookie-parser";

const app = express();

// Cấu hình CORS
app.use(
  cors({
    origin: "http://localhost:5173", // URL của frontend
    credentials: true, // Cho phép gửi cookies
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Các methods được phép
    allowedHeaders: ["Content-Type", "Authorization"], // Headers được phép
  })
);
  app.use(cookieParser());

app.use(express.json());

ConnectDb();

app.use("/api", userRouter);
app.use("/api", budgetRouter);
app.use("/api", categoriesRouter);
app.use("/api", transactionRouter);
app.use("/api", savingRouter);

// export const viteNodeApp = app;
export default app;