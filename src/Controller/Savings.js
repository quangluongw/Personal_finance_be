import { SavingsModel } from "../Model/Savings";

export const getSaving = async (req, res) => {
  try {
    const userId = req.params.id;

    const savings = await SavingsModel.find({ userId });

    let totalSaved = 0;
    let totalTarget = 0;
    let completedCount = 0;

    const savingsData = savings.map((item) => {
      const progressPercent = Math.round(
        (item.currentAmount / item.targetAmount) * 100
      );

      const remainingAmount = item.targetAmount - item.currentAmount;

      let status = "Đang tiến hành";
      if (progressPercent >= 100) {
        status = "Hoàn thành";
        completedCount++;
      } else if (progressPercent >= 70) {
        status = "Gần hoàn thành";
      }

      totalSaved += item.currentAmount;
      totalTarget += item.targetAmount;

      return {
        id: item._id,
        name: item.name,
        description: item.description,
        currentAmount: item.currentAmount,
        targetAmount: item.targetAmount,
        remainingAmount,
        progressPercent,
        status,
      };
    });

    const overallProgress =
      totalTarget === 0 ? 0 : Math.round((totalSaved / totalTarget) * 100);

    return res.status(200).json({
      summary: {
        totalSaved,
        totalTarget,
        overallProgress,
        completedCount,
        totalCount: savings.length,
      },
      savings: savingsData,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


export const addSaving = async (req, res) => {
  try {
    const data = await SavingsModel(req.body).save();
    return res.status(201).json({
      message: "Thêm mục tiêu tiết kiệm thành công",
      data,
    });
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

export const updateSaving = async (req, res) => {
  try {
    await SavingsModel.findByIdAndUpdate(req.id.params, req.body, {
      new: true,
    });

    return res.status(200).json({
      message: "Cập nhật mục tiêu tiết kiệm thành công",
    });
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

export const deleteSaving = async (req, res) => {
  try {
    await SavingsModel.findByIdAndDelete(req.params.id);
    return res.status(201).json({
      message: "Xóa mục tiêu tiết kiệm thành công",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
