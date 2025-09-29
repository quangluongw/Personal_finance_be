import { UserModel } from "../Model/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { loginSchema, reqSchema } from "../Schema/User";
export const signup = async (req, res) => {
  try {
    const { userName, email, password } = req.body;

    const { error } = reqSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const list = error.details.map((issue) => ({ message: issue.message }));
      return res.status(400).json(list);
    }

    const normalizedEmail = email?.trim().toLowerCase();
    const trimmeduserName = userName?.trim();

    // 1 query kiểm tra email hoặc userName đã tồn tại
    const existing = await UserModel.findOne({
      $or: [{ email: normalizedEmail }, { userName: trimmeduserName }],
    }).lean();

    if (existing) {
      if (existing.email === normalizedEmail) {
        return res.status(400).json({ message: "Email đã tồn tại" });
      }
      return res.status(400).json({ message: "userName đã tồn tại" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await UserModel.create({
      userName: trimmeduserName,
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res
      .status(201)
      .json({ message: "Đăng ký thành công", userId: newUser._id });
  } catch (err) {
    // duplicate key (race condition)
    if (err && err.code === 11000 && err.keyValue) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(409).json({ message: `${field} đã tồn tại` });
    }

    console.error("Signup error:", err);
    return res
      .status(500)
      .json({ message: "Đăng ký thất bại", error: err.message });
  }
};

export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { error } = loginSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const list = error.details.map((issue) => ({ message: issue.message }));
      return res.status(400).json({ errors: list });
    }

    const normalizedEmail = email?.trim().toLowerCase();

    const user = await UserModel.findOne({ email: normalizedEmail }).lean();
    if (!user) {
      return res
        .status(400)
        .json({ message: "Thông tin đăng nhập không hợp lệ" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Thông tin đăng nhập không hợp lệ" });
    }
    const JWT_SECRET =
      "76ca127f19145007f2723d48ce8cbf296fb7427ac4ffe557daa38952697dabb272c181f843bccfd89065158f44470be37eca0f6e6ba9da90a107f2dc0b90164a";
    if (!JWT_SECRET) {
      console.error("JWT_SECRET is not set");
      return res
        .status(500)
        .json({ message: "Cấu hình server chưa hoàn chỉnh" });
    }

    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: _pwd, ...sanitizedUser } = user;

    return res.status(200).json({
      user: sanitizedUser,
      token: accessToken,
      message: "Đăng nhập thành công",
    });
  } catch (error) {
    console.error("Signin error:", error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

export const getUser = async (req, res) => {
  try {
    const data = await UserModel.findById(req.params.id).select("-password");
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { userName } = req.body;

    const checkname = await UserModel.findOne({ userName });

    if (checkname && checkname._id.toString() !== id) {
      return res.status(400).json({
        message: "Tên người dùng đã có",
      });
    }

    await UserModel.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    return res.status(201).json({
      message: "Cập nhật người dùng thành công",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await UserModel.findByIdAndDelete(req.params.id);
    return res.status(201).json({
      message: "Xóa người dùng thành công",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};