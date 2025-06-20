const OrderService = require("../services/OrderService");

const createOrder = async (req, res) => {
  try {
    const { delivery, address, payment, recipient, phone } = req.body;

    if (!delivery || !address || !payment || !recipient || !phone) {
      return res.status(400).json({
        status: "ERROR",
        message: "Missing required fields: delivery, address, payment, recipient, or phone",
      });
    }

    const response = await OrderService.createOrder(req.body, req.user.id);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(500).json({
      status: "ERROR",
      message: e.message || "Failed to create order",
    });
  }
};

const getDetailOrder = async (req, res) => {
  try {
    const OrderId = req.params.id;
    if (!OrderId) {
      return res.status(200).json({
        status: "ERR",
        message: "Order ID is required",
      });
    }
    const response = await OrderService.getDetailOrder(OrderId);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e,
    });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const response = await OrderService.getAllOrders(userId);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e,
    });
  }
};

const adminAllOrders = async (req, res) => {
  try {
    const { page = 1, size = 10 } = req.query; 
    const response = await OrderService.adminAllOrders(Number(page), Number(size));
    return res.status(200).json(response);
  } catch (e) {
    return res.status(500).json({
      status: "ERROR",
      message: e.message || "Failed to get orders",
    });
  }
};

const adminGetOrderDetail = async (req, res) => {
  try {
    const OrderId = req.params.id;
    if (!OrderId) {
      return res.status(200).json({
        status: "ERR",
        message: "Order ID is required",
      });
    }
    const response = await OrderService.adminGetOrderDetail(OrderId);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e.message,
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const status = req.query.status;

    if (!orderId || !status) {
      return res.status(400).json({
        status: "ERR",
        message: "Order ID and status are required",
      });
    }

    const allowedStatuses = ["pending", "processing", "shipping", "completed", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        status: "ERR",
        message: "Invalid status value",
      });
    }

    const response = await OrderService.updateOrderStatus(orderId, status);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(500).json({
      status: "ERR",
      message: "Error updating order",
      error: e.message,
    });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    if (!orderId) {
      return res.status(400).json({
        status: "ERR",
        message: "Order ID is required",
      });
    }

    const response = await OrderService.cancelOrder(req.user.id, orderId);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(500).json({
      status: "ERR",
      message: "Error cancelling order",
      error: e.message,
    });
  }
};

module.exports = {
  createOrder,
  cancelOrder,
  getDetailOrder,
  getAllOrders,
  adminAllOrders,
  adminGetOrderDetail,
  updateOrderStatus,
};
