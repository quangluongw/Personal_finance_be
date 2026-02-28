import { AccountsModel } from "../Model/Accounts";

export const createAccount = async (req, res) => {
  try {
    const account = new AccountsModel(req.body);
    const saved = await account.save();

    return res.status(201).json(saved);
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

export const getAccounts = async (req, res) => {
  try {
    const data = await AccountsModel.find({
      userId: req.params.id,
    });

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json(error.message);
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