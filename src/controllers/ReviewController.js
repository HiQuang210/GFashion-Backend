const ReviewService = require("../services/ReviewService");

// Create a new review
const createReview = async (req, res) => {
  try {
    const { orderId, overallRating, overallComment, productReviews, deliveryRating, serviceRating } = req.body;
    const userId = req.user.id; // Assuming you have user authentication middleware

    // Validate required fields
    if (!orderId || !overallRating || !productReviews || productReviews.length === 0) {
      return res.status(400).json({
        status: "ERR",
        message: "Missing required fields: orderId, overallRating, and productReviews are required!",
      });
    }

    // Validate rating values
    if (overallRating < 1 || overallRating > 5) {
      return res.status(400).json({
        status: "ERR",
        message: "Overall rating must be between 1 and 5!",
      });
    }

    // Validate product reviews
    for (const productReview of productReviews) {
      if (!productReview.productId || !productReview.rating || !productReview.color || !productReview.size) {
        return res.status(400).json({
          status: "ERR",
          message: "Each product review must have productId, rating, color, and size!",
        });
      }
      if (productReview.rating < 1 || productReview.rating > 5) {
        return res.status(400).json({
          status: "ERR",
          message: "Product rating must be between 1 and 5!",
        });
      }
    }

    const response = await ReviewService.createReview({
      orderId,
      userId,
      overallRating,
      overallComment,
      productReviews,
      deliveryRating,
      serviceRating,
    });

    return res.status(response.status === "OK" ? 200 : 400).json(response);
  } catch (error) {
    console.error("createReview controller error:", error);
    return res.status(500).json({
      status: "ERR",
      message: "Internal server error",
    });
  }
};

// Get review for a specific order
const getReview = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        status: "ERR",
        message: "Order ID is required!",
      });
    }

    const response = await ReviewService.getReview(orderId);
    return res.status(response.status === "OK" ? 200 : 404).json(response);
  } catch (error) {
    console.error("getReview controller error:", error);
    return res.status(500).json({
      status: "ERR",
      message: "Internal server error",
    });
  }
};

// Get all reviews for a specific product
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!productId) {
      return res.status(400).json({
        status: "ERR",
        message: "Product ID is required!",
      });
    }

    const response = await ReviewService.getProductReviews(productId, page, limit);
    return res.status(200).json(response);
  } catch (error) {
    console.error("getProductReviews controller error:", error);
    return res.status(500).json({
      status: "ERR",
      message: "Internal server error",
    });
  }
};

// Get user's reviews
const getUserReviews = async (req, res) => {
  try {
    const userId = req.user.id; // From authentication middleware
    const { page = 1, limit = 10 } = req.query;

    const response = await ReviewService.getUserReviews(userId, page, limit);
    return res.status(200).json(response);
  } catch (error) {
    console.error("getUserReviews controller error:", error);
    return res.status(500).json({
      status: "ERR",
      message: "Internal server error",
    });
  }
};


// Update an existing review
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { overallRating, overallComment, productReviews, deliveryRating, serviceRating } = req.body;

    if (!reviewId) {
      return res.status(400).json({
        status: "ERR",
        message: "Review ID is required!",
      });
    }

    if (overallRating && (overallRating < 1 || overallRating > 5)) {
      return res.status(400).json({
        status: "ERR",
        message: "Overall rating must be between 1 and 5!",
      });
    }

    if (productReviews) {
      for (const productReview of productReviews) {
        if (productReview.rating && (productReview.rating < 1 || productReview.rating > 5)) {
          return res.status(400).json({
            status: "ERR",
            message: "Product rating must be between 1 and 5!",
          });
        }
      }
    }

    const response = await ReviewService.updateReview(reviewId, {
      overallRating,
      overallComment,
      productReviews,
      deliveryRating,
      serviceRating,
    });

    return res.status(response.status === "OK" ? 200 : 400).json(response);
  } catch (error) {
    console.error("updateReview controller error:", error);
    return res.status(500).json({
      status: "ERR",
      message: "Internal server error",
    });
  }
};

const getAllReviews = async (req, res) => {
  try {
    const { 
      page = 1, 
      limitItem = 10,  
      sort = '-createdAt', 
      filter = '', 
      searchQuery = '' 
    } = req.query;

    const response = await ReviewService.getAllReviews(
      page, 
      limitItem, 
      sort, 
      filter, 
      searchQuery
    );
    
    return res.status(200).json(response);
  } catch (error) {
    console.error("getAllReviews controller error:", error);
    return res.status(500).json({
      status: "ERR",
      message: error.message || "Internal server error",
    });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!reviewId) {
      return res.status(400).json({
        status: "ERR",
        message: "Review ID is required!",
      });
    }

    const response = await ReviewService.deleteReview(reviewId);
    return res.status(response.status === "OK" ? 200 : 400).json(response);
  } catch (error) {
    console.error("deleteReview controller error:", error);
    return res.status(500).json({
      status: "ERR",
      message: "Internal server error",
    });
  }
};

module.exports = {
  createReview,
  getReview,
  getProductReviews,
  getUserReviews,
  getAllReviews,
  updateReview,
  deleteReview,
};