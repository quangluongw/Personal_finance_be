import { SavingsModel } from "../Model/Savings.js";
import { TransactionsModel } from "../Model/Transactions.js";
import mongoose from "mongoose";

export const getDateRange = (type = "month", date) => {
  const now = new Date();

  if (!date) {
    date =
      type === "year"
        ? now.getFullYear().toString()
        : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  let fromDate, toDate;

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
    const { fromDate, toDate } = getDateRange(type, date);

    const dateFilter = { createdAt: { $gte: fromDate, $lte: toDate } };
    const baseMatch = { userId, ...dateFilter };

    /* ─── Build chart group expressions ─── */
    const isYear = type === "year";
    const groupTime = isYear
      ? { month: { $month: "$createdAt" }, transactionType: "$transactionType" }
      : {
          day: { $dayOfMonth: "$createdAt" },
          transactionType: "$transactionType",
        };

    const labelExpr = isYear
      ? { $concat: ["Tháng ", { $toString: "$_id.month" }] }
      : { $toString: "$_id.day" };

    const sortStage = isYear ? { "_id.month": 1 } : { "_id.day": 1 };

    /* ═══════════════════════════════════════════
     *  Chạy tất cả query SONG SONG với Promise.all
     * ═══════════════════════════════════════════ */
    const [mainAgg, savingsGoals] = await Promise.all([
      /* ── Aggregation duy nhất gộp Summary + Chart + Pie + Recent ── */
      TransactionsModel.aggregate([
        // ── Stage 1: match sớm nhất có thể (dùng compound index) ──
        { $match: baseMatch },

        // ── Stage 2: lookup Categories 1 lần cho tất cả ──
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

        // ── Stage 3: lookup Accounts ──
        {
          $lookup: {
            from: "accounts",
            localField: "accPay",
            foreignField: "_id",
            as: "account",
          },
        },
        { $unwind: { path: "$account", preserveNullAndEmptyArrays: true } },

        // ── Stage 4: facet – tách song song trong 1 pipeline ──
        {
          $facet: {
            /* 4a. Summary */
            summary: [
              {
                $group: {
                  _id: "$transactionType",
                  total: { $sum: "$amount" },
                },
              },
            ],

            /* 4b. Chart theo thời gian */
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

            /* 4c. Pie – chi tiêu theo danh mục */
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

            /* 4d. Recent transactions – top 10 mới nhất */
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

      /* ── Savings: query riêng vì khác collection, không có dateFilter ── */
      SavingsModel.find(
        { userId },
        {
          name: 1,
          description: 1,
          targetAmount: 1,
          currentAmount: 1,
        }
      ).lean(),
    ]);

    /* ─── Unpack facet results ─── */
    const {
      summary,
      chart: chartRaw,
      expenseByCategory,
      recentTransactions,
    } = mainAgg[0];

    /* Summary */
    let income = 0,
      expense = 0;
    summary.forEach((i) => {
      if (i._id === "income") income = i.total;
      if (i._id === "expense") expense = i.total;
    });

    /* Chart */
    const chartMap = {};
    chartRaw.forEach(({ label, transactionType, total }) => {
      if (!chartMap[label]) chartMap[label] = { label, income: 0, expense: 0 };
      chartMap[label][transactionType] = total;
    });
    const chart = Object.values(chartMap);

    /* Savings */
    const formattedSavings = savingsGoals.map((s) => ({
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

    /* ─── Response ─── */
    res.status(200).json({
      filter: { type, fromDate, toDate },
      summary: { income, expense, balance: income - expense },
      chart,
      expenseByCategory,
      recentTransactions,
      savingsGoals: formattedSavings,
    });
  } catch (error) {
    console.error("Dashboard error:", error.message);
    res.status(500).json({ message: "Dashboard error", error: error.message });
  }
};
