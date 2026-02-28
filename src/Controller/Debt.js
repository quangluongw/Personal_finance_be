import { DebtModel } from "../Model/Debt";

/**
 * 1. DASHBOARD SUMMARY
 * GET /api/debts/summary/:userId
 */
export const getSummaryDept = async (req, res) => {
  try {
    const { userId } = req.params;

    const debts = await DebtModel.find({
      userId,
      status: "active",
    });

    const lending = debts.filter((d) => d.type === "lending");
    const borrowing = debts.filter((d) => d.type === "borrowing");

    const sum = (arr, key) => arr.reduce((t, i) => t + i[key], 0);

    const lendingTotal = sum(lending, "amount");
    const lendingPaid = sum(lending, "paidAmount");

    const borrowingTotal = sum(borrowing, "amount");
    const borrowingPaid = sum(borrowing, "paidAmount");

    res.json({
      lending: {
        total: lendingTotal,
        paid: lendingPaid,
        remain: lendingTotal - lendingPaid,
        percent: lendingTotal
          ? Math.round((lendingPaid / lendingTotal) * 100)
          : 0,
      },
      borrowing: {
        total: borrowingTotal,
        paid: borrowingPaid,
        remain: borrowingTotal - borrowingPaid,
        percent: borrowingTotal
          ? Math.round((borrowingPaid / borrowingTotal) * 100)
          : 0,
      },
      netAsset: lendingTotal - lendingPaid - (borrowingTotal - borrowingPaid),
      activeCount: debts.length,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/**
 * 2. LIST PHẢI THU / PHẢI TRẢ
 * GET /api/debts/:userId?type=lending|borrowing
 */
export const getDebtList = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query;

    const debts = await DebtModel.find({
      userId,
      type,
      status: "active",
    }).sort({ createdAt: -1 });

    res.json(
      debts.map((d) => ({
        id: d._id,
        person: d.person,
        description: d.description,
        avatarColor: d.avatarColor,
        total: d.amount,
        paid: d.paidAmount,
        remain: d.amount - d.paidAmount,
      }))
    );
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/**
 * 3. CHI TIẾT KHOẢN NỢ
 * GET /api/debts/detail/:userId/:debtId
 */
export const getDebtDetail = async (req, res) => {
  try {
    const d = await Debt.findById(req.params.id);
    if (!d) return res.status(404).json({ message: "Not found" });

    res.json({
      id: d._id,
      person: d.person,
      avatarColor: d.avatarColor,
      amount: d.amount,
      paidAmount: d.paidAmount,
      remain: d.amount - d.paidAmount,
      date: d.date,
      description: d.description,
      transactions: d.transactions,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/**
 * 4. TẠO KHOẢN NỢ
 * POST /api/debts/:userId
 */
export const createDebt = async (req, res) => {
  try {
    const { userId } = req.params;

    const debt = await DebtModel.create({
      ...req.body,
      userId,
    });

    res.status(201).json(debt);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

/**
 * 5. THÊM GIAO DỊCH TRẢ / THU
 * POST /api/debts/transaction/:userId/:debtId
 */
export const addTransactionDebt = async (req, res) => {
  try {
    const { userId, debtId } = req.params;
    const { amount, date, note } = req.body;

    const debt = await DebtModel.findOne({
      _id: debtId,
      userId,
    });

    if (!debt) {
      return res.status(404).json({ message: "Debt not found" });
    }

    debt.transactions.push({
      date,
      amount,
      type: "payment",
      note,
    });

    debt.paidAmount += amount;

    if (debt.paidAmount >= debt.amount) {
      debt.status = "completed";
    }

    await debt.save();
    res.json(debt);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

/**
 * 6. XÓA KHOẢN NỢ
 * DELETE /api/debts/:userId/:debtId
 */
export const deleteDebt = async (req, res) => {
  try {

    await DebtModel.findByIdAndDelete(req.params.id);

    res.json({ message: "Deleted successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
