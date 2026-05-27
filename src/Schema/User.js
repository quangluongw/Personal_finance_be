import Joi from "joi";
export const reqSchema = Joi.object({
  userName: Joi.string().required().min(3).trim().messages({
    "any.required": "Tên đăng ký không được để trống",
    "string.min": "Tên đăng ký phải có ít nhất 3 ký tự",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Địa chỉ email không hợp lệ",
    "any.required": "Email không được để trống",
  }),
  password: Joi.string().required().min(8).messages({
    "any.required": "Mật khẩu không được để trống",
    "string.min": "Mật khẩu phải có ít nhất 8 ký tự",
  }),
  confirmPassword: Joi.string().required().valid(Joi.ref("password")).messages({
    "any.required": "Xác nhận mật khẩu không được để trống",
    "any.only": "Xác nhận mật khẩu không đúng",
  }),
  role: Joi.string().valid("admin", "user").default("user"),
});
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Địa chỉ email không hợp lệ",
    "any.required": "Email không được để trống",
  }),
  password: Joi.string().required().min(8).messages({
    "any.required": "Mật khẩu không được để trống",
    "string.min": "Mật khẩu phải có ít nhất 8 ký tự",
  }),
});
