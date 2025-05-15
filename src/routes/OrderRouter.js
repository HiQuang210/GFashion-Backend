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
router.get('/get-detail-admin/:id', OrderController.getDetailOrderAsAdmin)
router.get('/get-all-admin', authMiddleware, OrderController.getAllOrdersAsAdmin)
router.put('/update-status/:id', authMiddleware, OrderController.updateOrderStatus)
router.get('/search', authMiddleware, OrderController.searchAsAdmin)

module.exports = router