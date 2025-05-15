const OrderService = require("../services/OrderService");

const createOrder = async (req, res) => {
  try {
    const { delivery, address, payment, recipient } = req.body;

    if (!delivery || !address || !payment || !recipient) {
      return res.status(400).json({
        status: "ERROR",
        message: "Missing required fields: delivery, address, payment, or recipient",
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

const updateOrder = async (req, res) => {
  try {
    const OrderId = req.params.id;
    const data = req.body;
    if (!OrderId) {
      return res.status(200).json({
        status: "ERR",
        message: "Order ID is required",
      });
    }
    const response = await OrderService.updateOrder(OrderId, data);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: "Error update Order",
      error: e.message,
    });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const OrderId = req.params.id;
    if (!OrderId) {
      return res.status(200).json({
        status: "ERR",
        message: "Order ID is required",
      });
    }
    const response = await OrderService.deleteOrder(req.user.id, OrderId);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e,
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
    const OrderId = req.params.id;
    const status = req.query.status;
    if (!OrderId) {
      return res.status(200).json({
        status: "ERR",
        message: "Order ID is required",
      });
    }
    const response = await OrderService.updateOrderStatus(OrderId, status);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: "Error update Order",
      error: e.message,
    });
  }
};

const searchAsAdmin = async (req, res) => {
  try {
    const { searchQuery, option, isCompletedIncluded } = req.query;
    const response = await OrderService.searchAsAdmin(searchQuery, option, isCompletedIncluded);

    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e.message,
    });
  }
};

const ratingOrder = async (req, res) => {
  try {
    const OrderId = req.params.id;
    const { ratings } = req.body;
    console.log(ratings);
    if (!OrderId) {
      return res.status(200).json({
        status: "ERR",
        message: "Order ID is required",
      });
    }
    const response = await OrderService.ratingOrder(OrderId, ratings);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e.message,
    });
  }
};

module.exports = {
  createOrder,
  updateOrder,
  deleteOrder,
  getDetailOrder,
  getAllOrders,
  adminAllOrders,
  adminGetOrderDetail,
  updateOrderStatus,
  searchAsAdmin,
  ratingOrder,
};
