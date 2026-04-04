import { AccountsModel } from "../Model/Accounts";
import { TransactionsModel } from "../Model/Transactions";

export const createAccount = async (req, res) => {
  try {
    const { userId, balance, name } = req.body;

    // kiểm tra dữ liệu
    if (!userId || !balance || !name) {
      return res.status(400).json({
        message: "Thiếu dữ liệu",
      });
    }

    const newAccount = new AccountsModel({
      userId,
      balance,
      name,
    });

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
    const accounts = await AccountsModel.find({ userId: req.params.id });

    const now = new Date();

    // ===== Lấy giao dịch trong tháng hiện tại =====
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

    const transactions = await TransactionsModel.find({
      userId: req.params.id,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    // ===== Tính thu nhập & chi tiêu tháng này =====
    let monthlyIncome = 0;
    let monthlyExpense = 0;

    transactions.forEach((tx) => {
      if (tx.transactionType === "income") {
        monthlyIncome += tx.amount;
      } else if (tx.transactionType === "expense") {
        monthlyExpense += tx.amount;
      }
    });

    const monthlySaving = monthlyIncome - monthlyExpense;
    const totalTransactions = transactions.length;

    // ===== Format danh sách tài khoản =====
    const formattedAccounts = accounts.map((acc) => {
      const lastMonthBalance = acc.lastMonthBalance || acc.balance;
      const monthlyChange =
        lastMonthBalance === 0
          ? 0
          : ((acc.balance - lastMonthBalance) / lastMonthBalance) * 100;

      return {
        _id: acc._id,
        bankName: acc.name,
        accountNumber: acc.accountNumber,
        balance: acc.balance,
        monthlyChange: Number(monthlyChange.toFixed(2)),
      };
    });

    // ===== Tổng tài sản =====
    const totalAssets = formattedAccounts.reduce(
      (sum, acc) => sum + (acc.balance || 0),
      0
    );

    // ===== Trung bình % thay đổi =====
    const monthlyChangePercent =
      formattedAccounts.reduce(
        (sum, acc) => sum + (acc.monthlyChange || 0),
        0
      ) / (formattedAccounts.length || 1);

    const data = {
      summary: {
        totalAssets,
        totalAccounts: formattedAccounts.length,
        monthlyChangePercent: Number(monthlyChangePercent.toFixed(2)),
        // ===== Dữ liệu mới từ Transactions =====
        monthlyIncome, // Thu nhập tháng này   (+72M)
        monthlyExpense, // Chi tiêu tháng này   (-48M)
        monthlySaving, // Tiết kiệm            (+24M)
        totalTransactions, // Số giao dịch         (1,165)
        updatedAt: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      accounts: formattedAccounts,
    };

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
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