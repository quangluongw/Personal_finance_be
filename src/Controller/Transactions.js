import { TransactionsModel } from "../Model/Transactions";

export const getTransaction = async (req, res) => {
  try {
    const data = await TransactionsModel.find({ userId: req.params.id }).populate({
      path: "categoryId",
      select: "name",
    });
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json(error.message);
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
