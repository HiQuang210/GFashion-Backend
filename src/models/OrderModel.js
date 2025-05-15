const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    recipient: {
      type: String,
      required: true,
    },
    delivery: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    payment: {
      type: String,
      required: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        color: { type: String, required: true },
        size: { type: String, required: true },
        quantity: { type: Number, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        image: { type: String, required: false },
        type: { type: String, required: true },
        producer: { type: String, required: true },
        material: { type: String, required: false },
        description: { type: String, required: false },
      },
    ],
    status: {
      type: String,
      default: "pending",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
