const Order = require("../models/OrderModel");
const User = require("../models/UserModel");
const Product = require("../models/ProductModel");
const { ObjectId } = require("mongoose").Types;

const createOrder = (newOrder, userId) => {
  return new Promise(async (resolve, reject) => {
    const { delivery, address, payment, products } = newOrder;
    const refinedProducts = products.map((product) => {
      return {
        productId: product.productId,
        color: product.color,
        size: product.size,
        quantity: product.quantity,
      };
    });
    try {
      const createdOrder = await Order.create({
        delivery,
        address,
        payment,
        products: refinedProducts,
        userId,
      });

      if (createdOrder) {
        await User.findByIdAndUpdate(userId, {
          $set: {
            cart: [],
          },
        });
        resolve({
          status: "OK",
          message: "Success",
          data: createdOrder,
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

const updateOrder = (id, data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkOrder = await Order.findOne({
        _id: id,
      });
      if (checkOrder === null) {
        resolve({
          status: "OK",
          message: "The Order is not defined!",
        });
      }
      const updatedOrder = await Order.findByIdAndUpdate(id, data, {
        new: true,
      });
      resolve({
        status: "OK",
        message: "Success",
        data: updatedOrder,
      });
    } catch (e) {
      reject(e);
    }
  });
};

const deleteOrder = (userId, id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkOrder = await Order.findOne({
        _id: id,
        userId: userId,
      });
      if (checkOrder === null) {
        return resolve({
          status: "OK",
          message: "The Order is not defined or you are not authorized!",
        });
      }

      if (checkOrder.status === "pending") {
        await Order.findByIdAndDelete(id);
      } else {
        return resolve({
          status: "ERROR",
          message: "The Order is not allowed to delete!",
        });
      }

      resolve({
        status: "OK",
        message: "Delete Order success",
      });
    } catch (e) {
      reject(e);
    }
  });
};

const getAllOrders = (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const allOrder = await Order.find({ userId })
        .sort({ createdAt: -1 })
        .populate({
          path: "products.productId",
          select: "name price images",
        });

      const refinedAllOrder = allOrder.map((order) => {
        const total = order.products.reduce((acc, product) => {
          return acc + product.productId.price * product.quantity;
        }, 0);
        return {
          ...order._doc,
          total,
        };
      });

      resolve({
        status: "OK",
        message: "Get all Order success",
        data: refinedAllOrder,
      });
    } catch (e) {
      reject(e);
    }
  });
};

const getDetailOrder = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const Order = await Order.findOne({
        _id: id,
      });
      if (Order === null) {
        resolve({
          status: "OK",
          message: "The Order is not defined!",
        });
      }
      resolve({
        status: "OK",
        message: "Get Detail Order success",
        data: Order,
      });
    } catch (e) {
      reject(e);
    }
  });
};

const getAllOrdersAsAdmin = (page, size, isCompletedIncluded) => {
  return new Promise(async (resolve, reject) => {
    try {
      const allOrder = await Order.find({
        status:
          isCompletedIncluded == "false" ? { $ne: "" } : { $ne: "completed" },
      })
        .sort({ createdAt: -1 })

        .skip((page - 1) * size)
        .limit(size)
        .populate({
          path: "userId",
          select: "phone email",
        })
        .populate({
          path: "products.productId",
          select: "price",
        });

      const addedTotalAllOrder = allOrder.map((order) => {
        const total = order.products.reduce((acc, product) => {
          return acc + product.productId.price * product.quantity;
        }, 0);
        return {
          ...order._doc,
          total,
        };
      });

      const refinedAllOrder = addedTotalAllOrder.map((order) => ({
        id: order._id,
        customerPhone: order.userId.phone,
        customerEmail: order.userId.email,
        total: order.total + (order.delivery === "standard" ? 30000 : 50000),
        date: order.createdAt,
        status: order.status,
      }));

      resolve({
        status: "OK",
        message: "Get all Order success",
        data: refinedAllOrder,
        totalOrder: refinedAllOrder.length,
      });
    } catch (e) {
      reject(e);
    }
  });
};

const getDetailOrderAsAdmin = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await Order.findOne({
        _id: id,
      })
        .populate({
          path: "userId",
          select: "phone email",
        })
        .populate({
          path: "products.productId",
          select: "price name images",
        });

      const total = order.products.reduce((acc, product) => {
        return acc + product.productId.price * product.quantity;
      }, 0);

      const refinedOrder = {
        id: order._id,
        customerPhone: order.userId.phone,
        customerEmail: order.userId.email,
        total: total + (order.delivery === "standard" ? 30000 : 50000),
        delivery: order.delivery,
        date: order.createdAt,
        status: order.status,
        products: order.products.map((product) => ({
          id: product.productId._id,
          name: product.productId.name,
          price: product.productId.price,
          quantity: product.quantity,
          image: product.productId.images[0],
          total: product.productId.price * product.quantity,
        })),
      };

      resolve({
        status: "OK",
        message: "Get Detail Order success",
        data: refinedOrder,
      });
    } catch (e) {
      reject(e);
    }
  });
};

const updateOrderStatus = (id, status) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkOrder = await Order.findOne({
        _id: id,
      });
      if (checkOrder === null) {
        return resolve({
          status: "OK",
          message: "The Order is not defined!",
        });
      }

      checkOrder.status = status;

      await checkOrder.save();

      resolve({
        status: "OK",
        message: "Update Order status success",
      });
    } catch (e) {
      reject(e);
    }
  });
};

const searchAsAdmin = async (query, option, isCompletedIncluded) => {
  return new Promise(async (resolve, reject) => {
    try {
      const searchedOrders = await Order.find({
        status:
          isCompletedIncluded == "false" ? { $ne: "" } : { $ne: "completed" },
      })
        .sort({ createdAt: -1 })
        .populate({
          path: "userId",
          select: "phone email",
        })
        .populate({
          path: "products.productId",
          select: "price",
        })
        .then((orders) => {
          return orders.filter((order) => {
            if (option === "id") {
                return order._id.equals(ObjectId.createFromHexString(query));
            } else if (option === "phone") {
              return order.userId.phone.match(new RegExp(query, "i"));
            } else if (option === "email") {
              return order.userId.email.match(new RegExp(query, "i"));
            } else {
              return order;
            }
          });
        });

      const addedTotalAllOrders = searchedOrders.map((order) => {
        const total = order.products.reduce((acc, product) => {
          return acc + product.productId.price * product.quantity;
        }, 0);
        return {
          ...order._doc,
          total,
        };
      });

      const refinedSearchedOrders = addedTotalAllOrders.map((order) => ({
        id: order._id,
        customerPhone: order.userId.phone,
        customerEmail: order.userId.email,
        total: order.total + (order.delivery === "standard" ? 30000 : 50000),
        date: order.createdAt,
        status: order.status,
      }));

      resolve({
        status: "OK",
        message: "Search orders success",
        data: refinedSearchedOrders,
      });
    } catch (e) {
      reject(e);
    }
  });
};

const ratingOrder = async (orderId, ratings) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await Order.findOne({
        _id: orderId,
      });
      if (order === null) {
        return resolve({
          status: "OK",
          message: "The Order is not defined!",
        });
      }

      order.rated = true;
      await order.save();

      if (ratings && Array.isArray(ratings)) {
        ratings.map(async (rating) => {
          const product = await Product.findOne({
            _id: rating.productId,
          });
          console.log(product);
          if (product) {
            const sale = product.sale;
            const oldRating = product.rating;
            const newRating = (oldRating * (sale - 1) + rating.rating) / sale;
            product.rating = newRating;
            await product.save();
          }
        });
      }

      resolve({
        status: "OK",
        message: "Rating Order success",
      });
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = {
  createOrder,
  updateOrder,
  deleteOrder,
  getAllOrders,
  getDetailOrder,
  getAllOrdersAsAdmin,
  getDetailOrderAsAdmin,
  updateOrderStatus,
  searchAsAdmin,
  ratingOrder,
};
