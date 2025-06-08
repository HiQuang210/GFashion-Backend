const express = require("express");
const router = express.Router();
const ReportController = require('../controllers/ReportController');
const { authMiddleware } = require("../middlewares/authMiddleware");

// Revenue routes
router.get('/exportRevenue', authMiddleware, ReportController.exportRevenue);
router.get('/revenue', authMiddleware, ReportController.getRevenue);
router.get('/revenue-stats', authMiddleware, ReportController.getRevenueStats);

// User routes
router.get('/users', authMiddleware, ReportController.getUsers);
router.get('/user-stats', authMiddleware, ReportController.getUsersStats);
router.get('/total-users', authMiddleware, ReportController.getTotalUsers);

// Product routes
router.get('/products', authMiddleware, ReportController.getProducts);
router.get('/product-stats', authMiddleware, ReportController.getProductsStats);
router.get('/total-products', authMiddleware, ReportController.getTotalProducts);

// Order routes
router.get('/orders', authMiddleware, ReportController.getOrders);
router.get('/order-stats', authMiddleware, ReportController.getOrdersStats);
router.get('/total-orders', authMiddleware, ReportController.getTotalOrders);

module.exports = router;