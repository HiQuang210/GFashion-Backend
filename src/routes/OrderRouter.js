const express = require("express");
const router = express.Router()
const OrderController = require('../controllers/OrderController');
const { authMiddleware, authUserMiddleware } = require("../middlewares/authMiddleware");

// user
router.post('/create', authUserMiddleware, OrderController.createOrder)
router.put('/cancel/:id', authUserMiddleware, OrderController.cancelOrder)
router.get('/get-all', authUserMiddleware, OrderController.getAllOrders)
router.get('/get-detail/:id', authUserMiddleware, OrderController.getDetailOrder)

// admin
router.get('/admin-get-detail/:id', OrderController.adminGetOrderDetail)
router.get('/admin-get-all', authMiddleware, OrderController.adminAllOrders)
router.put('/update-status/:id', authMiddleware, OrderController.updateOrderStatus)

module.exports = router