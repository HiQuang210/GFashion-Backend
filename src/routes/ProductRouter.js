const express = require("express");
const router = express.Router();
const ProductController = require('../controllers/ProductController');
const { authMiddleware } = require("../middlewares/authMiddleware");
const { uploadMultiple } = require("../middlewares/multerMiddleware");

// User routes
router.get('/get-detail/:id', ProductController.getDetailProduct);
router.get('/get-all', ProductController.getAllProduct);
router.get('/get-total-pages', ProductController.getTotalPages);

// Admin routes
router.post('/create', authMiddleware, uploadMultiple, ProductController.createProduct);
router.delete("/delete/:id", authMiddleware, ProductController.deleteProduct);
router.delete("/delete", authMiddleware, ProductController.deleteProduct);
router.put('/update/:id', authMiddleware, uploadMultiple, ProductController.updateProduct);
router.get('/get-all-admin', authMiddleware, ProductController.adminAllProducts);

module.exports = router;
