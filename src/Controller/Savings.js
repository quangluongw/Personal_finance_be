import { SavingsModel } from "../Model/Savings";

export const getSaving = async (req, res) => {
  try {
    const data = await SavingsModel.find({ userId: req.params.id });
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json(error.message);
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
    await SavingsModel.findByIdAndUpdate(
      req.params.id, // ✅ đúng
      req.body,
      { new: true }
    );

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
