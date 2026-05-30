import { SavingsModel } from "../Model/Savings.js";
import { TransactionsModel } from "../Model/Transactions.js";
import mongoose from "mongoose";

export const getDateRange = (type = "month", date) => {
  const now = new Date();

  let fromDate, toDate;

  if (type === "year") {
    const year = date ? Number(date) : now.getFullYear();
    if (isNaN(year)) throw new Error("Invalid year");
    fromDate = new Date(year, 0, 1, 0, 0, 0, 0);
    toDate = new Date(year, 11, 31, 23, 59, 59, 999);
  } else if (type === "week") {
    const baseDate = date ? new Date(date) : now;
    if (isNaN(baseDate)) throw new Error("Invalid week date");
    const day = baseDate.getDay() === 0 ? 7 : baseDate.getDay(); // 1=Mon ... 7=Sun
    fromDate = new Date(baseDate);
    fromDate.setDate(baseDate.getDate() - day + 1);
    fromDate.setHours(0, 0, 0, 0);
    toDate = new Date(fromDate);
    toDate.setDate(fromDate.getDate() + 6);
    toDate.setHours(23, 59, 59, 999);
  } else {
    // month (default)
    const str =
      date ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const [year, month] = str.split("-").map(Number);
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
    const { fromDate, toDate } = getDateRange(type, date);

    const baseMatch = {
      userId,
      createdAt: { $gte: fromDate, $lte: toDate },
    };

    /* ─── Chart grouping theo type ─── */
    const isYear = type === "year";
    const isWeek = type === "week";

    // Năm  → nhóm theo tháng
    // Tuần → nhóm theo thứ (dayOfWeek: 1=Sun…7=Sat → đổi sang 1=Mon…7=Sun)
    // Tháng→ nhóm theo ngày
    const groupTime = isYear
      ? { month: { $month: "$createdAt" }, transactionType: "$transactionType" }
      : isWeek
        ? {
            dow: { $dayOfWeek: "$createdAt" },
            transactionType: "$transactionType",
          }
        : {
            day: { $dayOfMonth: "$createdAt" },
            transactionType: "$transactionType",
          };

    const labelExpr = isYear
      ? { $concat: ["Tháng ", { $toString: "$_id.month" }] }
      : isWeek
        ? {
            $arrayElemAt: [
              ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
              { $subtract: ["$_id.dow", 1] },
            ],
          }
        : { $toString: "$_id.day" };

    const sortStage = isYear
      ? { "_id.month": 1 }
      : isWeek
        ? { "_id.dow": 1 }
        : { "_id.day": 1 };

    /* ─── Chạy song song ─── */
    const [mainAgg, savingsGoals] = await Promise.all([
      TransactionsModel.aggregate([
        { $match: baseMatch },

        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

        {
          $lookup: {
            from: "accounts",
            localField: "accPay",
            foreignField: "_id",
            as: "account",
          },
        },
        { $unwind: { path: "$account", preserveNullAndEmptyArrays: true } },

        {
          $facet: {
            /* Summary */
            summary: [
              {
                $group: {
                  _id: "$transactionType",
                  total: { $sum: "$amount" },
                },
              },
            ],

            /* Chart */
            chart: [
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
            ],

            /* Pie – chi tiêu theo danh mục */
            expenseByCategory: [
              { $match: { transactionType: "expense" } },
              {
                $group: {
                  _id: {
                    categoryId: "$category._id",
                    categoryName: "$category.name",
                  },
                  total: { $sum: "$amount" },
                },
              },
              {
                $project: {
                  _id: 0,
                  categoryId: "$_id.categoryId",
                  categoryName: "$_id.categoryName",
                  total: 1,
                },
              },
              { $sort: { total: -1 } },
            ],

            /* 10 giao dịch gần nhất */
            recentTransactions: [
              { $sort: { createdAt: -1 } },
              { $limit: 10 },
              {
                $project: {
                  transactionType: 1,
                  amount: 1,
                  description: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  category: {
                    $cond: {
                      if: { $ifNull: ["$category._id", false] },
                      then: { _id: "$category._id", name: "$category.name" },
                      else: null,
                    },
                  },
                  account: {
                    $cond: {
                      if: { $ifNull: ["$account._id", false] },
                      then: { _id: "$account._id", name: "$account.name" },
                      else: null,
                    },
                  },
                },
              },
            ],
          },
        },
      ]),

      SavingsModel.find(
        { userId },
        { name: 1, description: 1, targetAmount: 1, currentAmount: 1 }
      ).lean(),
    ]);

    /* ─── Unpack ─── */
    const {
      summary,
      chart: chartRaw,
      expenseByCategory,
      recentTransactions,
    } = mainAgg[0];

    // Summary
    let income = 0,
      expense = 0;
    summary.forEach(({ _id, total }) => {
      if (_id === "income") income = total;
      if (_id === "expense") expense = total;
    });

    // Chart
    const chartMap = {};
    chartRaw.forEach(({ label, transactionType, total }) => {
      if (!chartMap[label]) chartMap[label] = { label, income: 0, expense: 0 };
      chartMap[label][transactionType] = total;
    });
    const chart = Object.values(chartMap);

    // Savings
    const savingsGoalsFormatted = savingsGoals.map((s) => ({
      _id: s._id,
      name: s.name,
      description: s.description,
      targetAmount: s.targetAmount,
      currentAmount: s.currentAmount,
      progress:
        s.targetAmount > 0
          ? Math.min(100, Math.round((s.currentAmount / s.targetAmount) * 100))
          : 0,
      remaining: Math.max(0, s.targetAmount - s.currentAmount),
    }));

    res.status(200).json({
      filter: { type, fromDate, toDate },
      summary: { income, expense, balance: income - expense },
      chart,
      expenseByCategory,
      recentTransactions,
      savingsGoals: savingsGoalsFormatted,
    });
  } catch (error) {
    console.error("Dashboard error:", error.message);
    res.status(500).json({ message: "Dashboard error", error: error.message });
  }
};
