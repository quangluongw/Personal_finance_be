import mongoose from "mongoose";
import { AccountsModel } from "../Model/Accounts";
import { TransactionsModel } from "../Model/Transactions";

export const createAccount = async (req, res) => {
  try {
    const {
      userId,
      name,
      balance,
      type,
      accountNumber,
      icon,
      color,
      change,
      isPrimary,
      linkedAccounts,
      lastTransaction,
    } = req.body;

    // validate cơ bản
    if (!userId || !name) {
      return res.status(400).json({
        message: "Thiếu userId hoặc name",
      });
    }

    if (balance === undefined || balance === null) {
      return res.status(400).json({
        message: "Thiếu balance",
      });
    }

    // tạo account
    const newAccount = new AccountsModel({
      userId,
      name,
      balance,

      type: type || "bank",
      accountNumber,
      icon,
      color,
      change: change ?? 0,
      isPrimary: isPrimary ?? false,
      linkedAccounts: linkedAccounts ?? 0,
      lastTransaction: lastTransaction ? new Date(lastTransaction) : null,
    });

    // nếu là tài khoản chính → reset các tài khoản khác
    if (isPrimary) {
      await AccountsModel.updateMany(
        { userId },
        { $set: { isPrimary: false } }
      );
    }

    const data = await newAccount.save();

    return res.status(201).json({
      message: "Thêm tài khoản thành công",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

export const getAccounts = async (req, res) => {
  try {
    const { id: userId } = req.params;

    // ===== Validate userId =====
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "userId không hợp lệ" });
    }

    // ===== Time range tháng hiện tại =====
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    // ===== Query song song =====
    const [accounts, transactions] = await Promise.all([
      AccountsModel.find({ userId }).lean(),
      TransactionsModel.find({
        userId,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      }).lean(),
    ]);

    // ===== Tính toán income / expense =====
    const { monthlyIncome, monthlyExpense } = transactions.reduce(
      (acc, tx) => {
        if (tx.transactionType === "income")
          acc.monthlyIncome += tx.amount ?? 0;
        else if (tx.transactionType === "expense")
          acc.monthlyExpense += tx.amount ?? 0;
        return acc;
      },
      { monthlyIncome: 0, monthlyExpense: 0 }
    );

    const monthlySaving = monthlyIncome - monthlyExpense;

    // ===== Format accounts =====
    const formattedAccounts = accounts.map((acc) => ({
      _id: acc._id,
      name: acc.name ?? "",
      type: acc.type ?? "Khác",
      accountNumber: acc.accountNumber ?? "",
      balance: acc.balance ?? 0,
      icon: acc.icon ?? "",
      color: acc.color ?? "#000000",
      change: acc.change ?? 0,
      isPrimary: acc.isPrimary ?? false,
      linkedAccounts: acc.linkedAccounts ?? 0,
      lastTransaction: acc.lastTransaction ?? null,
    }));

    // ===== Tổng tài sản =====
    const totalAssets = formattedAccounts.reduce(
      (sum, acc) => sum + acc.balance,
      0
    );

    // ===== % thay đổi trung bình =====
    const monthlyChangePercent =
      formattedAccounts.length > 0
        ? formattedAccounts.reduce((sum, acc) => sum + acc.change, 0) /
          formattedAccounts.length
        : 0;

    // ===== Phân bố tài sản theo loại tài khoản =====
    // Bug fix: trước đây dùng acc.name thay vì group đúng theo type
    const assetDistributionMap = formattedAccounts.reduce((map, acc) => {
      const type = acc.type;
      if (!map[type]) {
        map[type] = {
          type,
          color: acc.color,
          totalBalance: 0,
          accountCount: 0,
        };
      }
      map[type].totalBalance += acc.balance;
      map[type].accountCount += 1;
      return map;
    }, {});

    const assetDistribution = Object.values(assetDistributionMap).map(
      (item) => ({
        ...item,
        percentage:
          totalAssets > 0
            ? Number(((item.totalBalance / totalAssets) * 100).toFixed(2))
            : 0,
      })
    );

    // ===== Response =====
    return res.status(200).json({
      summary: {
        totalAssets,
        totalAccounts: formattedAccounts.length,
        monthlyChangePercent: Number(monthlyChangePercent.toFixed(2)),
        monthlyIncome,
        monthlyExpense,
        monthlySaving,
        totalTransactions: transactions.length,
        updatedAt: new Date().toISOString(),
      },
      assetDistribution,
      accounts: formattedAccounts,
    });
  } catch (error) {
    console.error("[getAccounts]", error);
    return res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

export const getAccountById = async (req, res) => {
  try {
    const account = await AccountsModel.findById(req.params.id);

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    // ✅ Sửa accountId -> accPay
    const transactions = await TransactionsModel.find({
      accPay: req.params.id,
    }).sort({ createdAt: -1 });

    const total_income = transactions
      .filter((tx) => tx.transactionType === "income")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const total_expense = transactions
      .filter((tx) => tx.transactionType === "expense")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const total_transactions = transactions.length;

    const monthSet = new Set(
      transactions.map((tx) => {
        const d = new Date(tx.createdAt);
        return `${d.getFullYear()}-${d.getMonth()}`;
      })
    );
    const monthCount = monthSet.size || 1;
    const monthly_average = (total_income + total_expense) / monthCount;

    // ✅ Sửa dùng transactionType thay vì amount âm/dương
    const recent_transactions = transactions.slice(0, 5).map((tx) => ({
      id: tx._id,
      description: tx.description,
      createdAt: tx.createdAt,
      amount: tx.amount,
      type: tx.transactionType,
    }));

    const response = {
      account: {
        id: account._id,
        name: account.name,
        type: account.type,
        icon: account.icon,
        accountNumber: account.accountNumber,
        balance: account.balance,
        isPrimary: account.isPrimary,
      },
      summary: {
        total_income,
        total_expense,
        monthly_average: Math.round(monthly_average),
        total_transactions,
      },
      charts: {
        trend_6_months: getLast6MonthsTrend(transactions),
        income_expense_monthly: getLast6MonthsIncomeExpense(transactions),
      },
      recent_transactions,
    };

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getLast6MonthsTrend = (transactions) => {
  const result = {};
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `T${d.getMonth() + 1}`;
    result[key] = 0;
  }

  transactions.forEach((tx) => {
    const d = new Date(tx.createdAt); // ✅ Sửa date -> createdAt
    const key = `T${d.getMonth() + 1}`;
    if (key in result) {
      // ✅ Sửa dùng transactionType
      result[key] += tx.transactionType === "income" ? tx.amount : -tx.amount;
    }
  });

  return Object.entries(result).map(([month, value]) => ({ month, value }));
};

const getLast6MonthsIncomeExpense = (transactions) => {
  const result = {};
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `T${d.getMonth() + 1}`;
    result[key] = { month: key, income: 0, expense: 0 };
  }

  transactions.forEach((tx) => {
    const d = new Date(tx.createdAt); // ✅ Sửa date -> createdAt
    const key = `T${d.getMonth() + 1}`;
    if (key in result) {
      // ✅ Sửa dùng transactionType
      if (tx.transactionType === "income") result[key].income += tx.amount;
      else result[key].expense += tx.amount;
    }
  });

  return Object.values(result);
};

export const updateAccount = async (req, res) => {
  try {
    const updated = await AccountsModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "accountId không hợp lệ" });
    }

    const account = await AccountsModel.findById(id).lean();
    if (!account) {
      return res.status(404).json({ message: "Tài khoản không tồn tại" });
    }

    // ===== Kiểm tra có giao dịch liên quan không =====
    const transactionCount = await TransactionsModel.countDocuments({
      accPay: id,
    });
    if (transactionCount > 0) {
      return res.status(400).json({
        message: `Không thể xóa tài khoản vì đang có ${transactionCount} giao dịch liên quan`,
      });
    }

    await AccountsModel.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Xóa tài khoản thành công",
      deletedAccountId: id,
    });
  } catch (error) {
    console.error("[deleteAccount]", error);
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};

export const deleteAllAccounts = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "userId không hợp lệ" });
    }

    // ===== Xóa song song toàn bộ accounts + transactions của user =====
    const [deletedAccounts, deletedTransactions] = await Promise.all([
      AccountsModel.deleteMany({ userId }),
      TransactionsModel.deleteMany({ userId }),
    ]);

    return res.status(200).json({
      message: "Xóa toàn bộ tài khoản và dữ liệu liên quan thành công",
      deletedAccounts: deletedAccounts.deletedCount,
      deletedTransactions: deletedTransactions.deletedCount,
    });
  } catch (error) {
    console.error("[deleteAllAccounts]", error);
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};
