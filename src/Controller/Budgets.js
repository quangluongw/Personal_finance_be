import { BudgetsModel } from "../Model/Budgets ";
export const getBudget = async (req, res) => {
  try {
    const data = await BudgetsModel.find({ userId :req.params.id}).populate({
      path: "categoryId",
      select: "name",
    });
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

export const addBudget = async (req, res) => {
  try {
    const data = await BudgetsModel(req.body).save();
    return res.status(201).json({
      message: "Thêm ngân sách thành công",
      data,
    });
  } catch (error) {
    return res.status(500).json(error.message);
  } 
};

export const updateBudget = async (req, res) => {
  try {
    await BudgetsModel.findByIdAndUpdate(req.id.params, req.body, {
      new: true,
    });

    return res.status(200).json({
      message: "Cập nhật ngân sách thành công",
    });
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

export const deleteBudget = async (req, res) => {
  try {
    await BudgetsModel.findByIdAndDelete(req.params.id);
    return res.status(201).json({
      message: "Xóa ngân sách thành công",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
