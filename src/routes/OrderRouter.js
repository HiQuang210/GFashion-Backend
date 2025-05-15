const express = require("express");
const router = express.Router()
const OrderController = require('../controllers/OrderController');
const { authMiddleware, authUserMiddleware } = require("../middlewares/authMiddleware");

// user
router.post('/create', authUserMiddleware, OrderController.createOrder)
router.delete('/cancel/:id', authUserMiddleware, OrderController.deleteOrder)
router.get('/get-all', authUserMiddleware, OrderController.getAllOrders)
router.get('/get-detail/:id', OrderController.getDetailOrder)
router.post('/rating/:id', authUserMiddleware, OrderController.ratingOrder)

// admin
router.get('/admin-get-detail/:id', OrderController.adminGetOrderDetail)
router.get('/admin-get-all', authMiddleware, OrderController.adminAllOrders)
router.put('/update-status/:id', authMiddleware, OrderController.updateOrderStatus)
router.get('/search', authMiddleware, OrderController.searchAsAdmin)

module.exports = router