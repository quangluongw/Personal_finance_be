import { DebtModel } from "../Model/Debt";

/**
 * 2. LIST PHẢI THU / PHẢI TRẢ
 * GET /api/debts/:userId?type=lending|borrowing
 */
export const getDebtList = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query;

    const query = {
      userId,
      status: "active",
    };

    if (type) {
      query.type = type; // optional filter
    }

    const debts = await DebtModel.find(query).sort({ createdAt: -1 });

    // 👉 LIST
    const list = debts.map((d) => ({
      id: d._id,
      person: d.person,
      description: d.description,
      total: d.amount,
      paid: d.paidAmount,
      remain: d.amount - d.paidAmount,
      type: d.type,
    }));

    // 👉 SUMMARY
    let totalLend = 0; // đang cho vay
    let totalBorrow = 0; // đang nợ
    let totalPaidLend = 0;
    let totalPaidBorrow = 0;

    debts.forEach((d) => {
      if (d.type === "lending") {
        totalLend += d.amount;
        totalPaidLend += d.paidAmount;
      } else if (d.type === "borrowing") {
        totalBorrow += d.amount;
        totalPaidBorrow += d.paidAmount;
      }
    });

    const netAsset = totalLend - totalBorrow;

    res.json({
      summary: {
        lend: {
          total: totalLend,
          paid: totalPaidLend,
          percent: totalLend
            ? Math.round((totalPaidLend / totalLend) * 100)
            : 0,
        },
        borrow: {
          total: totalBorrow,
          paid: totalPaidBorrow,
          percent: totalBorrow
            ? Math.round((totalPaidBorrow / totalBorrow) * 100)
            : 0,
        },
        netAsset,
        activeCount: debts.length,
      },
      list,
    });
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
