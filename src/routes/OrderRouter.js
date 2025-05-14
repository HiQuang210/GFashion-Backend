const express = require("express");
const router = express.Router()
const OrderController = require('../controllers/OrderController');
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/multerMiddleware");

router.post('/create', authMiddleware, upload, OrderController.createOrder)
router.put('/update/:id', authMiddleware, OrderController.updateOrder)
router.get('/get-detail/:id', OrderController.getDetailOrder)
router.delete('/delete/:id', OrderController.deleteOrder)
router.get('/get-all', OrderController.getAllOrder)

module.exports = router