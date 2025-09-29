import { CategoriesModel } from "../Model/Categories";

export const getCategori = async (req, res) => {
  try {
    const data = await CategoriesModel.find();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

export const addCategories = async (req, res) => {
  try {
    const data = await CategoriesModel(req.body).save();
    return res.status(201).json({
      message: "Thêm danh mục thành công",
      data,
    });
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

export const updateCategori = async (req, res) => {
  try {
    await CategoriesModel.findByIdAndUpdate(req.id.params, req.body, {
      new: true,
    });

    return res.status(200).json({
      message: "Cập nhật danh mục thành công",
    });
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

export const deleteCategori = async (req, res) => {
  try {
    await CategoriesModel.findByIdAndDelete(req.params.id);
    return res.status(201).json({
      message: "Xóa danh mục thành công",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
