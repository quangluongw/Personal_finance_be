import { BudgetsModel } from "../Model/Budgets .js";
import { SavingsModel } from "../Model/Savings.js";
import { TransactionsModel } from "../Model/Transactions";

import mongoose from "mongoose";

export const getDateRange = (type = "month", date) => {
  let fromDate, toDate;
  const now = new Date();

  if (!date) {
    if (type === "year") {
      date = now.getFullYear().toString();
    } else {
      date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }
  }

  if (type === "year") {
    const year = Number(date);
    if (isNaN(year)) throw new Error("Invalid year");

    fromDate = new Date(year, 0, 1, 0, 0, 0, 0);
    toDate = new Date(year, 11, 31, 23, 59, 59, 999);
  } else if (type === "week") {
    const baseDate = new Date(date);
    if (isNaN(baseDate)) throw new Error("Invalid week date");

    const day = baseDate.getDay() || 7;

    fromDate = new Date(baseDate);
    fromDate.setDate(baseDate.getDate() - day + 1);
    fromDate.setHours(0, 0, 0, 0);

    toDate = new Date(fromDate);
    toDate.setDate(fromDate.getDate() + 6);
    toDate.setHours(23, 59, 59, 999);
  } else {
    const [year, month] = date.split("-").map(Number);
    if (!year || !month) throw new Error("Invalid month");

    fromDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    toDate = new Date(year, month, 0, 23, 59, 59, 999);
  }

  return { fromDate, toDate };
};

export const getDashboard = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.id);
    const { type = "month", date } = req.query;

    /* ===============================
     *  Filter thời gian
     * =============================== */
    const { fromDate, toDate } = getDateRange(type, date);

    const dateFilter = {
      createdAt: { $gte: fromDate, $lte: toDate },
    };

    /* ===============================
     *  1. SUMMARY
     * =============================== */
    const summaryAgg = await TransactionsModel.aggregate([
      { $match: { userId, ...dateFilter } },
      {
        $group: {
          _id: "$transactionType",
          total: { $sum: "$amount" },
        },
      },
    ]);

    let income = 0;
    let expense = 0;

    summaryAgg.forEach((i) => {
      if (i._id === "income") income = i.total;
      if (i._id === "expense") expense = i.total;
    });

    const balance = income - expense;

    /* ===============================
     *  2. CHART – LOGIC ĐÚNG
     * =============================== */
    let groupTime = {};
    let labelExpr = {};
    let sortStage = {};

    if (type === "week") {
      // Các NGÀY trong tuần
      groupTime = {
        day: { $dayOfMonth: "$createdAt" },
        transactionType: "$transactionType",
      };
      labelExpr = { $toString: "$_id.day" };
      sortStage = { "_id.day": 1 };
    } else if (type === "month") {
      // Các NGÀY trong tháng
      groupTime = {
        day: { $dayOfMonth: "$createdAt" },
        transactionType: "$transactionType",
      };
      labelExpr = { $toString: "$_id.day" };
      sortStage = { "_id.day": 1 };
    } else {
      // Các THÁNG trong năm
      groupTime = {
        month: { $month: "$createdAt" },
        transactionType: "$transactionType",
      };
      labelExpr = {
        $concat: ["Tháng ", { $toString: "$_id.month" }],
      };
      sortStage = { "_id.month": 1 };
    }

    const chartAgg = await TransactionsModel.aggregate([
      { $match: { userId, ...dateFilter } },
      {
        $group: {
          _id: groupTime,
          total: { $sum: "$amount" },
        },
      },
      {
        $project: {
          label: labelExpr,
          transactionType: "$_id.transactionType",
          total: 1,
        },
      },
      { $sort: sortStage },
    ]);

    const chartMap = {};
    chartAgg.forEach((item) => {
      if (!chartMap[item.label]) {
        chartMap[item.label] = {
          label: item.label,
          income: 0,
          expense: 0,
        };
      }
      chartMap[item.label][item.transactionType] = item.total;
    });

    const chart = Object.values(chartMap);

    /* ===============================
     *  3. PIE – CHI TIÊU THEO DANH MỤC
     * =============================== */
    const expenseByCategory = await TransactionsModel.aggregate([
      {
        $match: {
          userId,
          transactionType: "expense",
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: "$categoryId",
          total: { $sum: "$amount" },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $project: {
          _id: 0,
          categoryId: "$category._id",
          categoryName: "$category.name",
          total: 1,
        },
      },
    ]);

    /* ===============================
     *  4. RECENT TRANSACTIONS
     * =============================== */
    const recentTransactions = await TransactionsModel.find({
      userId,
      ...dateFilter,
    })
      .populate("categoryId", "name")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    /* ===============================
     *  5. SAVINGS
     * =============================== */
    const savingsGoals = await SavingsModel.find({ userId }).lean();

    /* ===============================
     *  RESPONSE
     * =============================== */
    res.status(200).json({
      filter: { type, fromDate, toDate },
      summary: { income, expense, balance },
      chart,
      expenseByCategory,
      recentTransactions,
      savingsGoals,
    });
  } catch (error) {
    console.error("Dashboard error:", error.message);
    res.status(500).json({
      message: "Dashboard error",
      error: error.message,
    });
  }
};