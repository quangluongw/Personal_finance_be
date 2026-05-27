import { DebtModel } from "../Model/Debt";

/**
 * 2. LIST PHẢI THU / PHẢI TRẢ
 * GET /api/debts/:userId?type=lending|borrowing
 */
export const getDebtList = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    const query = {
      userId: id,
    };

    if (type) {
      query.type = type;
    }

    const debts = await DebtModel.find(query).sort({ createdAt: -1 });

    const list = debts.map((d) => ({
      id: d._id,
      person: d.person,
      description: d.description,
      total: d.amount,
      paid: d.paidAmount,
      remain: d.amount - d.paidAmount,
      type: d.type,
      createdAt: d.createdAt,

      transactions: d.transactions.map((t) => ({
        amount: t.amount,
        note: t.note,
        type: t.type,
        date: t.createdAt || t.date,
      })),
    }));

    // summary
    let totalLend = 0;
    let totalBorrow = 0;
    let totalPaidLend = 0;
    let totalPaidBorrow = 0;

    debts.forEach((d) => {
      if (d.type === "lending") {
        totalLend += d.amount;
        totalPaidLend += d.paidAmount;
      }

      if (d.type === "borrowing") {
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
    res.status(500).json({
      message: e.message,
    });
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
    const { paidAmount, description, ...rest } = req.body;

    const debtData = {
      ...rest,
    };

    // nếu có paidAmount > 0 thì thêm transaction
    if (paidAmount && paidAmount > 0) {
      debtData.paidAmount = paidAmount;
      debtData.transactions = [
        {
          amount: paidAmount,
          note: description || "Thanh toán ban đầu",
          date: new Date(),
        },
      ];
    }

    const debt = await DebtModel.create(debtData);

    return res.status(201).json({
      message: "Thêm thành công",
      debt,
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

/**
 * 5. THÊM GIAO DỊCH TRẢ / THU
 * POST /api/debts/transaction/:userId/:debtId
 */
export const updateTransactionDebt = async (req, res) => {
  try {
    const { id } = req.params;
    let { amount, note, action } = req.body;
    // Validate
    action = action || "payment";
    amount = Number(amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Số tiền không hợp lệ" });
    }

    const debt = await DebtModel.findById(id);
    const remain = debt.amount - debt.paidAmount;

    if (!debt) {
      return res.status(404).json({ message: "Không có khoản này" });
    }

    if (action === "payment") {
      if (remain < amount) {
        return res.status(400).json({ message: "Số dư không đủ" });
      }
      debt.paidAmount = debt.paidAmount + amount;
    } else {
      debt.amount += amount;
    }
    debt.transactions.push({
      amount,
      note: note || "",
      date: new Date(), // optional vì đã có default
    });

    await debt.save();

    return res.json({
      message: "Cập nhật thành công",
      data: debt,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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
