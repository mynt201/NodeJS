const yup = require("yup");

/**
 * Tạo middleware validate bằng Yup cho body / query / params.
 *
 * - Nếu hợp lệ: gán dữ liệu đã stripUnknown vào req[source] rồi next()
 * - Nếu sai: trả về 400 với dạng:
 *   {
 *     success: false,
 *     error: "Dữ liệu không hợp lệ",
 *     errors: { field: "message", ... }
 *   }
 *
 * @param {yup.ObjectSchema} schema
 * @param {"body"|"query"|"params"} source
 */
const validateYup = (schema, source = "body") => {
  return async (req, res, next) => {
    try {
      const value = await schema.validate(req[source], {
        abortEarly: false,
        stripUnknown: true,
      });
      req[source] = value;
      return next();
    } catch (err) {
      if (err.name !== "ValidationError") {
        return next(err);
      }

      const fieldErrors = {};
      err.inner?.forEach((e) => {
        if (e.path && !fieldErrors[e.path]) {
          fieldErrors[e.path] = e.message;
        }
      });

      return res.status(400).json({
        success: false,
        error: "Dữ liệu không hợp lệ",
        errors: fieldErrors,
      });
    }
  };
};

module.exports = {
  validateYup,
};

