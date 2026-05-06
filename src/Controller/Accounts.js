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
    const userId = req.params.id;
    // ===== validate userId =====
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "userId không hợp lệ" });
    }
    const now = new Date();
    // ===== time range tháng hiện tại =====
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
    // ===== query song song =====
    const [accounts, transactions] = await Promise.all([
      AccountsModel.find({ userId }).lean(),
      TransactionsModel.find({
        userId,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      }).lean(),
    ]);
    // ===== tính toán transaction =====
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    for (const tx of transactions) {
      if (tx.transactionType === "income") {
        monthlyIncome += tx.amount;
      } else if (tx.transactionType === "expense") {
        monthlyExpense += tx.amount;
      }
    }
    const monthlySaving = monthlyIncome - monthlyExpense;
    const totalTransactions = transactions.length;
    // ===== format accounts =====
    const formattedAccounts = accounts.map((acc) => ({
      _id: acc._id,
      name: acc.name,
      type: acc.type,
      accountNumber: acc.accountNumber,
      balance: acc.balance,
      icon: acc.icon,
      color: acc.color,
      change: acc.change ?? 0,
      isPrimary: acc.isPrimary ?? false,
      linkedAccounts: acc.linkedAccounts ?? 0,
      lastTransaction: acc.lastTransaction,
    }));
    // ===== tổng tài sản =====
    const totalAssets = formattedAccounts.reduce(
      (sum, acc) => sum + (acc.balance || 0),
      0
    );
    // ===== % thay đổi trung bình =====
    const monthlyChangePercent =
      formattedAccounts.reduce((sum, acc) => sum + (acc.change || 0), 0) /
      (formattedAccounts.length || 1);

    // ===== phân bố tài sản theo loại tài khoản =====
    const assetDistributionMap = {};
    for (const acc of formattedAccounts) {
      const type = acc.type || "Khác";
      if (!assetDistributionMap[type]) {
        assetDistributionMap[type] = {
          type,
          name: acc.name,
          color: acc.color,
          totalBalance: 0,
        };
      }
      assetDistributionMap[type].totalBalance += acc.balance || 0;
    }
    const assetDistribution = Object.values(assetDistributionMap).map(
      (item) => ({
        ...item,
        percentage:
          totalAssets > 0
            ? Number(((item.totalBalance / totalAssets) * 100).toFixed(2))
            : 0,
      })
    );

    const data = {
      summary: {
        totalAssets,
        totalAccounts: formattedAccounts.length,
        monthlyChangePercent: Number(monthlyChangePercent.toFixed(2)),
        monthlyIncome,
        monthlyExpense,
        monthlySaving,
        totalTransactions,
        updatedAt: new Date().toISOString(),
      },
      assetDistribution, // 👈 thêm vào đây
      accounts: formattedAccounts,
    };
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

export const getAccountById = async (req, res) => {
  try {
    const data = await AccountsModel.findById(req.params.id);

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json(error.message);
  }
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
    await AccountsModel.findByIdAndDelete(req.params.id);

    return res.status(200).json("Delete success");
  } catch (error) {
    return res.status(500).json(error.message);
  }
};