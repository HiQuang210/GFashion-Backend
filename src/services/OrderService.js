const Order = require("../models/OrderModel");
const User = require("../models/UserModel");
const Product = require("../models/ProductModel");
const cloudinary = require("../cloudinary");
const axios = require("axios");
const { ObjectId } = require("mongoose").Types;

const uploadSnapshotFromUrl = (imageUrl) => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
      const buffer = Buffer.from(response.data, "binary");

      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          folder: "order_snapshots",
          transformation: [{ width: 1000, height: 1000, crop: "limit" }],
        },
        (err, result) => {
          if (err) return reject(err);
          resolve(result.secure_url);
        }
      );

      stream.end(buffer);
    } catch (err) {
      reject(err);
    }
  });
};

const createOrder = (newOrder, userId) => {
  return new Promise(async (resolve, reject) => {
    const { delivery, address, payment, recipient } = newOrder;

    try {
      const user = await User.findById(userId);
      if (!user) {
        return reject({ status: "ERROR", message: "User not found" });
      }

      if (!recipient) {
        return reject({ status: "ERROR", message: "Recipient name is required" });
      }

      const sourceProducts = Array.isArray(newOrder.products) && newOrder.products.length > 0
        ? newOrder.products
        : user.cart;

      if (!sourceProducts || sourceProducts.length === 0) {
        return reject({ status: "ERROR", message: "No products to order" });
      }

      const refinedProducts = [];

      for (const item of sourceProducts) {
        const productId = item.productId || item.product;
        const product = await Product.findById(productId);

        if (!product) {
          return reject({
            status: "ERROR",
            message: `Product with ID ${productId} not found.`,
          });
        }

        const variant = product.variants.find(v => v.color === item.color);
        if (!variant) {
          return reject({
            status: "ERROR",
            message: `Variant with color '${item.color}' not found in product '${product.name}'.`,
          });
        }

        const sizeObj = variant.sizes.find(s => s.size === item.size);
        if (!sizeObj) {
          return reject({
            status: "ERROR",
            message: `Size '${item.size}' not found in product '${product.name}' with color '${item.color}'.`,
          });
        }

        if (sizeObj.stock < item.quantity) {
          return reject({
            status: "ERROR",
            message: `Not enough stock for product '${product.name}', color '${item.color}', size '${item.size}'.`,
          });
        }

        sizeObj.stock -= item.quantity;
        product.sold = (product.sold || 0) + item.quantity;

        await product.save();

        // Tạo snapshot ảnh
        let snapshotImage = "";
        const firstImage = product.images?.[0];
        if (firstImage) {
          try {
            snapshotImage = await uploadSnapshotFromUrl(firstImage);
          } catch (err) {
            console.warn("Failed to snapshot image, fallback to original:", err.message);
            snapshotImage = firstImage; // fallback nếu snapshot thất bại
          }
        }

        refinedProducts.push({
          productId,
          color: item.color,
          size: item.size,
          quantity: item.quantity,
          name: product.name,
          price: product.price,
          image: snapshotImage,
          type: product.type,
          producer: product.producer,
          material: product.material,
          description: product.description,
        });
      }

      const createdOrder = await Order.create({
        userId,
        recipient,
        delivery,
        address,
        payment,
        products: refinedProducts,
      });

      await User.findByIdAndUpdate(userId, { $set: { cart: [] } });

      resolve({
        status: "OK",
        message: "Order created successfully",
        data: createdOrder,
      });
    } catch (error) {
      reject({
        status: "ERROR",
        message: error.message || "Failed to create order",
      });
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
      const allOrder = await Order.find({ userId }).sort({ createdAt: -1 });

      const refinedAllOrder = allOrder.map((order) => {
        const total = order.products.reduce((acc, product) => {
          return acc + product.price * product.quantity; 
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

const adminAllOrders = (page = 1, size = 10) => {
  return new Promise(async (resolve, reject) => {
    try {
      const orders = await Order.find({})
        .sort({ createdAt: -1 })
        .skip((page - 1) * size)
        .limit(size)
        .lean();

      const refinedOrders = orders.map((order) => {
        const totalProductPrice = order.products.reduce((acc, product) => {
          return acc + product.price * product.quantity;
        }, 0);

        const shippingFee = order.delivery === "standard" ? 20000 : 50000;
        const total = totalProductPrice + shippingFee;

        return {
          id: order._id,
          userId: order.userId,
          recipient: order.recipient,
          address: order.address,
          delivery: order.delivery,
          payment: order.payment,
          status: order.status || "pending",
          createdAt: order.createdAt,
          products: order.products.map((p) => ({
            productId: p.productId,
            name: p.name,
            price: p.price,
            quantity: p.quantity,
            color: p.color,
            size: p.size,
            image: p.image,
            type: p.type,
            producer: p.producer,
            material: p.material,
            description: p.description,
          })),
          total,
        };
      });

      const totalOrder = await Order.countDocuments({});

      resolve({
        status: "OK",
        message: "Get all orders success",
        data: refinedOrders,
        totalOrder,
      });
    } catch (e) {
      reject({
        status: "ERROR",
        message: e.message || "Failed to get orders",
      });
    }
  });
};

const adminGetOrderDetail = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await Order.findById(id)
        .populate({
          path: "userId",
          select: "phone email firstName lastName img",
        })
        .lean(); 

      if (!order) {
        return resolve({
          status: "ERR",
          message: "Order not found!",
        });
      }

      const totalProductPrice = order.products.reduce((acc, product) => {
        return acc + product.price * product.quantity;
      }, 0);

      const shippingFee = order.delivery === "standard" ? 20000 : 50000;
      const total = totalProductPrice + shippingFee;

      const refinedOrder = {
        id: order._id,
        userId: order.userId?._id || order.userId,
        recipient: order.recipient,
        address: order.address,
        delivery: order.delivery,
        payment: order.payment,
        status: order.status || "pending",
        createdAt: order.createdAt,
        products: order.products.map((product) => ({
          productId: product.productId,
          name: product.name || "Unknown Product",
          price: product.price || 0,
          quantity: product.quantity,
          color: product.color || "N/A",
          size: product.size || "N/A",
          image: product.image || "",
          type: product.type || "N/A",
          producer: product.producer || "N/A",
          material: product.material || "N/A",
          description: product.description || "",
        })),
        total,
        user: {
          id: order.userId?._id || order.userId,
          firstName: order.userId?.firstName || "",
          lastName: order.userId?.lastName || "",
          email: order.userId?.email || "",
          phone: order.userId?.phone || "",
          img: order.userId?.img || "",
          fullName:
            order.userId?.firstName && order.userId?.lastName
              ? `${order.userId.firstName} ${order.userId.lastName}`
              : `User #${order.userId?._id || order.userId}`,
        },
      };

      resolve({
        status: "OK",
        message: "Get Detail Order success",
        data: refinedOrder,
      });
    } catch (e) {
      console.error("adminGetOrderDetail error:", e);
      reject({
        status: "ERR",
        message: e.message || "Failed to get order detail",
      });
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
            const sold = product.sold;
            const oldRating = product.rating;
            const newRating = (oldRating * (sold - 1) + rating.rating) / sold;
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
  adminAllOrders,
  adminGetOrderDetail,
  updateOrderStatus,
  searchAsAdmin,
  ratingOrder,
};
