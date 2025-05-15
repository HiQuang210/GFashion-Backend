const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const createAuthMiddleware = (requireAdmin = false) => {
  return (req, res, next) => {
    let token;

    // 1. Lấy token từ Authorization header hoặc cookie
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.adminToken) {
      token = req.cookies.adminToken;
    }

    // 2. Nếu không có token
    if (!token) {
      return res.status(401).json({
        message: "Token not provided",
        status: "ERROR",
      });
    }

    // 3. Xác thực token
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          message: "Invalid or expired token",
          status: "ERROR",
        });
      }

      const { payload } = decoded;

      // 4. Kiểm tra quyền admin nếu cần
      if (requireAdmin && !payload?.isAdmin) {
        return res.status(401).json({
          message: "Admin access required",
          status: "ERROR",
        });
      }

      req.user = payload;
      next();
    });
  };
};

module.exports = {
  authMiddleware: createAuthMiddleware(true),
  authUserMiddleware: createAuthMiddleware(false),
};
