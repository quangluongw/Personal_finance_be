import { BudgetsModel } from "../Model/Budgets ";
export const getBudget = async (req, res) => {
  try {
    const { id } = req.params;
    let query = { userId: id };

    // Get current date and set default to current month
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

    // Check if date range is provided in query parameters
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    } else {
      // Default to current month
      query.createdAt = {
        $gte: startOfMonth,
        $lte: endOfMonth,
      };
    }

    const data = await BudgetsModel.find(query).populate({
      path: "categoryId",
      select: "name",
    });
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
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
    await BudgetsModel.findByIdAndUpdate(req.params.id, req.body, {
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
