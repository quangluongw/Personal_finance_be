export const getDashboard = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.id);
    const { type = "month", date } = req.query;
    const { fromDate, toDate } = getDateRange(type, date);

    const baseMatch = {
      userId,
      createdAt: { $gte: fromDate, $lte: toDate },
    };

    const isYear = type === "year";
    const isWeek = type === "week";

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
            summary: [
              {
                $group: { _id: "$transactionType", total: { $sum: "$amount" } },
              },
            ],
            chart: [
              { $group: { _id: groupTime, total: { $sum: "$amount" } } },
              {
                $project: {
                  label: labelExpr,
                  transactionType: "$_id.transactionType",
                  total: 1,
                },
              },
              { $sort: sortStage },
            ],
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

    const {
      summary,
      chart: chartRaw,
      expenseByCategory,
      recentTransactions,
    } = mainAgg[0];

    let income = 0,
      expense = 0;
    summary.forEach(({ _id, total }) => {
      if (_id === "income") income = total;
      if (_id === "expense") expense = total;
    });

    const chartMap = {};
    chartRaw.forEach(({ label, transactionType, total }) => {
      if (!chartMap[label]) chartMap[label] = { label, income: 0, expense: 0 };
      chartMap[label][transactionType] = total;
    });

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
      chart: Object.values(chartMap),
      expenseByCategory,
      recentTransactions,
      savingsGoals: savingsGoalsFormatted,
    });
  } catch (error) {
    console.error("Dashboard error:", error.message);
    res.status(500).json({ message: "Dashboard error", error: error.message });
  }
};
