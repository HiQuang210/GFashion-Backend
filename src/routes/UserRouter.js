const express = require("express");
const router = express.Router();
const userController = require("../controllers/UserController");
const { authMiddleware, authUserMiddleware } = require("../middlewares/authMiddleware");
const { uploadSingle } = require("../middlewares/multerMiddleware");

router.post("/sign-up", userController.createUser);
router.post("/sign-in", userController.loginUser);
router.post("/admin-sign-in", userController.adminLoginUser);
router.get("/debug-user/:email", userController.debugUser); 
router.put("/update-user/:id", authUserMiddleware, uploadSingle, userController.updateUser);
router.put("/admin-update-user/:id", authMiddleware, uploadSingle, userController.adminUpdateUser);
router.put("/change-password/:id", authUserMiddleware, userController.changePassword);
router.delete("/delete-user/:id", authMiddleware, userController.deleteUser);
router.get("/getAll", authMiddleware, userController.getAllUser);
router.get("/get-detail/:id", authUserMiddleware, userController.getDetailUser);
router.post("/request-password-reset", userController.requestPasswordReset);
router.post("/verify-reset-code", userController.verifyResetCode);
router.post("/reset-password", userController.resetPassword);

// favorite
router.get(
  "/get-user-favorites",
  authUserMiddleware,
  userController.getUserFavorites
);
router.post(
  "/handle-favorite",
  authUserMiddleware,
  userController.handleFavoriteAction
);

// cart
router.get("/get-user-cart", authUserMiddleware, userController.getUserCart);
router.post(
  "/handle-cart",
  authUserMiddleware,
  userController.handleCartAction
);

router.post("/refresh-token", userController.refreshToken);

router.get("/get-dashboard", authMiddleware, userController.getDashboard);

// Gửi email xác thực trước khi tạo user
router.post("/request-email-verification", userController.requestEmailVerification);
router.get("/verify-email", userController.verifyEmail);
module.exports = router;
