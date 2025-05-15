const express = require("express");
const router = express.Router();
const userController = require("../controllers/UserController");
const { authMiddleware, authUserMiddleware } = require("../middlewares/authMiddleware");

router.post("/sign-up", userController.createUser);
router.post("/sign-in", userController.loginUser);
router.post("/admin-sign-in", userController.adminLoginUser);
router.get("/debug-user/:email", userController.debugUser); 
router.put("/update-user/:id", authUserMiddleware, userController.updateUser);
router.put("/admin-update-user/:id", authMiddleware, userController.adminUpdateUser);
router.delete("/delete-user/:id", authMiddleware, userController.deleteUser);
router.get("/getAll", authMiddleware, userController.getAllUser);
router.get("/get-detail/:id", authUserMiddleware, userController.getDetailUser);

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

module.exports = router;
