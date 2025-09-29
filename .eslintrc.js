import js from "@eslint/js";
import globals from "globals";

export default [
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      sourceType: "module", // Hỗ trợ ES Modules
    },
    ...js.configs.recommended, // Kế thừa cấu hình khuyến nghị từ @eslint/js
    rules: {
      // Thêm các quy tắc tùy chỉnh nếu cần
      "no-unused-vars": [
        "error",
        { vars: "all", args: "after-used", ignoreRestSiblings: true },
      ],
      "no-console": "warn", // Cảnh báo khi sử dụng console.log
    },
  },
];
