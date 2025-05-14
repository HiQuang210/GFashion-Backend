const express = require("express");
const router = express.Router()
const ReportController = require('../controllers/ReportController');
const authMiddleware = require("../middlewares/authMiddleware");

router.get('/exportRevenue', authMiddleware, ReportController.exportRevenue)
router.get('/revenue', authMiddleware, ReportController.getRevenue)

module.exports = router