const express = require("express");
const ReviewController = require("../controllers/ReviewController");
const { authUserMiddleware } = require("../middlewares/authMiddleware"); 

const router = express.Router();

router.post("/create", authUserMiddleware, ReviewController.createReview);
router.get("/order/:orderId", ReviewController.getReview);
router.get("/product/:productId", ReviewController.getProductReviews);
router.get("/user", authUserMiddleware, ReviewController.getUserReviews);
router.get("/admin/all", ReviewController.getAllReviews);
router.put("/update/:reviewId", authUserMiddleware, ReviewController.updateReview);
router.delete("/delete/:reviewId", authUserMiddleware, ReviewController.deleteReview);

module.exports = router;
