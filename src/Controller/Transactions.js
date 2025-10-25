import { TransactionsModel } from "../Model/Transactions";

export const getTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    let query = { userId: id };

    // Get current date and set default to current month
    const now = new Date();
    let startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    let endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    // Filter by month if provided (format: "MM/YYYY")
    if (req.query.month) {
      const monthStr = req.query.month.trim();
      if (monthStr.includes("/")) {
        const [month, year] = monthStr.split("/");
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);

        // Validate basic (month 1-12, year > 0)
        if (monthNum >= 1 && monthNum <= 12 && yearNum > 0) {
          startOfMonth = new Date(yearNum, monthNum - 1, 1);
          endOfMonth = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
        }
        // If invalid, fallback to current month (no error thrown)
      }
    }

    // Set date filter (always, either from query or default)
    query.createdAt = {
      $gte: startOfMonth,
      $lte: endOfMonth,
    };

    if (req.query.transactionType != null) {
      const validTypes = ["income", "expense"];
      const t = String(req.query.transactionType).trim().toLowerCase();
      if (validTypes.includes(t)) {
        query.transactionType = t;
      }
    }

    // Filter by description if provided (case-insensitive partial match)
    if (req.query.description) {
      query.description = { $regex: req.query.description, $options: "i" };
    }

    const data = await TransactionsModel.find(query)
      .populate({
        path: "categoryId",
        select: "name",
      })
      .sort({ createdAt: -1 }); // Sort by newest first

    return res.status(200).json({
      transactions: data,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const totalTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    let query = { userId: id };

    // Get current date and set default to current month
    const now = new Date();
    let startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    let endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    if (req.query.categoryId) {
      query.categoryId = req.query.categoryId;
    }
    
    // Filter by month if provided (format: "MM/YYYY")
    if (req.query.month) {
      const monthStr = req.query.month.trim();
      if (monthStr.includes("/")) {
        const [month, year] = monthStr.split("/");
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);

        // Validate basic (month 1-12, year > 0)
        if (monthNum >= 1 && monthNum <= 12 && yearNum > 0) {
          startOfMonth = new Date(yearNum, monthNum - 1, 1);
          endOfMonth = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
        }
        // If invalid, fallback to current month (no error thrown)
      }
    }

    // Set date filter (always, either from query or default)
    query.createdAt = {
      $gte: startOfMonth,
      $lte: endOfMonth,
    };

    const data = await TransactionsModel.find(query)
      .populate({
        path: "categoryId",
        select: "name",
      })
      .sort({ createdAt: -1 }); // Sort by newest first

    // Calculate total income and expense
    const totals = data.reduce(
      (acc, transaction) => {
        if (transaction.transactionType === "income") {
          acc.totalIncome += transaction.amount || 0;
        } else if (transaction.transactionType === "expense") {
          acc.totalExpense += transaction.amount || 0;
        }
        return acc;
      },
      { totalIncome: 0, totalExpense: 0 }
    );

    return res.status(200).json({
      totals: {
        totalIncome: totals.totalIncome,
        totalExpense: totals.totalExpense,
        balance: totals.totalIncome - totals.totalExpense,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const addTransaction = async (req, res) => {
  try {
    const data = await TransactionsModel(req.body).save();
    return res.status(201).json({
      message: "Thêm giao dịch thành công",
      data,
    });
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

export const updateTransaction = async (req, res) => {
  try {
    await TransactionsModel.findByIdAndUpdate(req.id.params, req.body, {
      new: true,
    });

    return res.status(200).json({
      message: "Cập nhật giao dịch thành công",
    });
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    await TransactionsModel.findByIdAndDelete(req.params.id);
    return res.status(201).json({
      message: "Xóa giao dịch thành công",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
