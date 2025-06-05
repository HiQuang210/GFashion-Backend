const mongoose = require("mongoose");

const productReviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: false,
    maxlength: 1000,
  },
  color: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
});

const reviewSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true, 
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    overallRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    overallComment: {
      type: String,
      required: false,
      maxlength: 1000,
    },
    productReviews: [productReviewSchema],

    deliveryRating: {
      type: Number,
      required: false,
      min: 1,
      max: 5,
    },
    serviceRating: {
      type: Number,
      required: false,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ userId: 1 });
reviewSchema.index({ "productReviews.productId": 1 });

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;