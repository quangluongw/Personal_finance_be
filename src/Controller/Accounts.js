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
