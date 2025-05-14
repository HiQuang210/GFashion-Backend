const express = require("express");
const router = express.Router()
const ProductController = require('../controllers/ProductController');
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/multerMiddleware");


router.get('/get-detail/:id', ProductController.getDetailProduct)
router.get('/get-all', ProductController.getAllProduct)
router.get('/get-total-pages', ProductController.getTotalPages)

// Admin routes
router.post('/create', authMiddleware, upload, ProductController.createProduct)
router.delete('/delete/:id', authMiddleware, ProductController.deleteProduct)
router.put('/update/:id', authMiddleware, upload, ProductController.updateProduct)
router.get('/get-all-admin', authMiddleware, ProductController.getAllProductsAsAdmin)
router.delete('/delete-image/:productId', authMiddleware, ProductController.deleteImage)
router.get('/search-admin', authMiddleware, ProductController.searchAsAdmin)


module.exports = router