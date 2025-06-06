const Review = require("../models/ReviewModel");
const Order = require("../models/OrderModel");
const Product = require("../models/ProductModel");

const createReview = (reviewData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const {
        orderId,
        userId,
        overallRating,
        overallComment,
        productReviews,
        deliveryRating,
        serviceRating,
      } = reviewData;

      const order = await Order.findOne({ _id: orderId, userId, status: "completed" });
      if (!order) {
        return resolve({ status: "ERR", message: "Order not found or not completed yet!" });
      }

      let review = await Review.findOne({ orderId });

      if (!review) {
        review = await Review.create({
          orderId,
          userId,
          overallRating,
          overallComment,
          productReviews,
          deliveryRating,
          serviceRating,
        });

        await updateProductRatings(productReviews);
      } else {
        const existingKeys = new Set(
          review.productReviews.map(pr => `${pr.productId}_${pr.color}_${pr.size}`)
        );

        const newReviews = productReviews.filter(pr => {
          const key = `${pr.productId}_${pr.color}_${pr.size}`;
          return !existingKeys.has(key);
        });

        if (newReviews.length === 0) {
          return resolve({ status: "ERR", message: "All products already reviewed!" });
        }

        review.productReviews.push(...newReviews);
        if (overallComment) review.overallComment = overallComment;
        if (overallRating) review.overallRating = overallRating;
        if (deliveryRating) review.deliveryRating = deliveryRating;
        if (serviceRating) review.serviceRating = serviceRating;

        await review.save();
        await updateProductRatings(newReviews);
      }

      const allProductKeys = new Set(order.products.map(p => `${p.productId}_${p.color}_${p.size}`));
      const reviewedKeys = new Set(
        review.productReviews.map(pr => `${pr.productId}_${pr.color}_${pr.size}`)
      );
      const allReviewed = [...allProductKeys].every(k => reviewedKeys.has(k));
      if (allReviewed && !order.rated) {
        await Order.findByIdAndUpdate(orderId, { rated: true });
      }

      resolve({
        status: "OK",
        message: "Review created/updated successfully",
        data: review,
      });

    } catch (e) {
      console.error("createReview error:", e);
      reject({
        status: "ERR",
        message: e.message || "Failed to create/update review",
      });
    }
  });
};

// Update product ratings based on all reviews
const updateProductRatings = async (productReviews) => {
  try {
    for (const productReview of productReviews) {
      await calculateAndUpdateProductRating(productReview.productId);
    }
  } catch (error) {
    console.error("Error updating product ratings:", error);
  }
};

const calculateAndUpdateProductRating = async (productId) => {
  try {
    const reviews = await Review.aggregate([
      { $unwind: "$productReviews" },
      { $match: { "productReviews.productId": productId } },
      {
        $group: {
          _id: "$productReviews.productId",
          averageRating: { $avg: "$productReviews.rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (reviews.length > 0) {
      const { averageRating } = reviews[0];
      await Product.findByIdAndUpdate(productId, {
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      });
    }
  } catch (error) {
    console.error("Error calculating product rating:", error);
  }
};


const getReview = (orderId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const review = await Review.findOne({ orderId })
        .populate("userId", "firstName lastName email")
        .populate("orderId")
        .populate("productReviews.productId", "name images type producer");

      if (!review) {
        return resolve({
          status: "ERR",
          message: "Review not found!",
        });
      }

      resolve({
        status: "OK",
        message: "Get review success",
        data: review,
      });
    } catch (e) {
      console.error("getReview error:", e);
      reject({
        status: "ERR",
        message: e.message || "Failed to get review",
      });
    }
  });
};

// Get all reviews for a specific product
const getProductReviews = (productId, page = 1, limit = 10) => {
  return new Promise(async (resolve, reject) => {
    try {
      const currentPage = Number(page) || 1;
      const limitItems = Number(limit) || 10;
      const skip = (currentPage - 1) * limitItems;

      const reviews = await Review.aggregate([
        { $unwind: "$productReviews" },
        { $match: { "productReviews.productId": new mongoose.Types.ObjectId(productId) } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            _id: 1,
            orderId: 1,
            userId: 1,
            "user.firstName": 1,
            "user.lastName": 1,
            "user.img": 1,
            rating: "$productReviews.rating",
            comment: "$productReviews.comment",
            color: "$productReviews.color",
            size: "$productReviews.size",
            createdAt: 1,
            updatedAt: 1,
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limitItems },
      ]);

      const totalReviews = await Review.aggregate([
        { $unwind: "$productReviews" },
        { $match: { "productReviews.productId": new mongoose.Types.ObjectId(productId) } },
        { $count: "total" },
      ]);

      const total = totalReviews.length > 0 ? totalReviews[0].total : 0;

      resolve({
        status: "OK",
        message: "Get product reviews success",
        data: reviews,
        currentPage,
        totalPage: Math.ceil(total / limitItems),
        totalReviews: total,
      });
    } catch (e) {
      console.error("getProductReviews error:", e);
      reject({
        status: "ERR",
        message: e.message || "Failed to get product reviews",
      });
    }
  });
};

// Get user's reviews
const getUserReviews = (userId, page = 1, limit = 10) => {
  return new Promise(async (resolve, reject) => {
    try {
      const currentPage = Number(page) || 1;
      const limitItems = Number(limit) || 10;
      const skip = (currentPage - 1) * limitItems;

      const reviews = await Review.find({ userId })
        .populate("orderId", "recipient address createdAt")
        .populate("productReviews.productId", "name images type producer price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitItems);

      const totalReviews = await Review.countDocuments({ userId });

      resolve({
        status: "OK",
        message: "Get user reviews success",
        data: reviews,
        currentPage,
        totalPage: Math.ceil(totalReviews / limitItems),
        totalReviews,
      });
    } catch (e) {
      console.error("getUserReviews error:", e);
      reject({
        status: "ERR",
        message: e.message || "Failed to get user reviews",
      });
    }
  });
};
// Helper function to build base query filters
const buildBaseQuery = (filter) => {
  let query = {};
  
  // Handle rating filter - "greater than or equal to" logic
  if (filter && !isNaN(filter)) {
    const rating = Number(filter);
    if (rating >= 1 && rating <= 5) {
      query.overallRating = { $gte: rating };
    }
  }
  
  return query;
};

// Helper function to build sort object
const buildSortObject = (sort) => {
  let sortObject = {};
  if (sort.startsWith('-')) {
    sortObject[sort.substring(1)] = -1; // Descending
  } else {
    sortObject[sort] = 1; // Ascending
  }
  return sortObject;
};

// Helper function for simple search without populated fields
const performSimpleSearch = async (searchQuery, baseQuery, sortObject, skip, limitItems) => {
  const searchRegex = new RegExp(searchQuery.trim(), 'i');
  
  const query = {
    ...baseQuery,
    $or: [
      { overallComment: searchRegex },
      { 'productReviews.comment': searchRegex }
    ]
  };

  const reviews = await Review.find(query)
    .populate("userId", "firstName lastName email img")
    .populate("orderId", "recipient address createdAt")
    .populate("productReviews.productId", "name images type producer price")
    .sort(sortObject)
    .skip(skip)
    .limit(limitItems);

  const totalReviews = await Review.countDocuments(query);

  return { reviews, totalReviews };
};

// Helper function for complex search with populated fields using aggregation
const performComplexSearch = async (searchQuery, filter, sortObject, skip, limitItems) => {
  const searchRegex = new RegExp(searchQuery.trim(), 'i');
  
  // Build match conditions
  const matchConditions = [
    // Rating filter
    filter && !isNaN(filter) ? { overallRating: { $gte: Number(filter) } } : {},
    // Search criteria
    {
      $or: [
        { overallComment: searchRegex },
        { 'productReviews.comment': searchRegex },
        { 'userId.firstName': searchRegex },
        { 'userId.lastName': searchRegex },
        { 'orderId.recipient': searchRegex },
        { 'productData.name': searchRegex }
      ]
    }
  ].filter(condition => Object.keys(condition).length > 0);

  const aggregationPipeline = [
    // Lookup user data
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userId'
      }
    },
    { $unwind: '$userId' },
    
    // Lookup order data
    {
      $lookup: {
        from: 'orders',
        localField: 'orderId',
        foreignField: '_id',
        as: 'orderId'
      }
    },
    { $unwind: '$orderId' },
    
    // Lookup product data
    {
      $lookup: {
        from: 'products',
        localField: 'productReviews.productId',
        foreignField: '_id',
        as: 'productData'
      }
    },
    
    // Match search criteria
    {
      $match: {
        $and: matchConditions
      }
    },
    
    // Add product data back to productReviews
    {
      $addFields: {
        'productReviews': {
          $map: {
            input: '$productReviews',
            as: 'review',
            in: {
              $mergeObjects: [
                '$$review',
                {
                  productId: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$productData',
                          cond: { $eq: ['$$this._id', '$$review.productId'] }
                        }
                      },
                      0
                    ]
                  }
                }
              ]
            }
          }
        }
      }
    },
    
    // Remove temporary productData field
    { $unset: 'productData' },
    
    // Sort
    { $sort: sortObject },
    
    // Facet for pagination and count
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limitItems }
        ],
        totalCount: [
          { $count: 'count' }
        ]
      }
    }
  ];
  
  const result = await Review.aggregate(aggregationPipeline);
  const reviews = result[0].data;
  const totalReviews = result[0].totalCount[0]?.count || 0;

  return { reviews, totalReviews };
};

// Helper function for simple query without search
const performSimpleQuery = async (baseQuery, sortObject, skip, limitItems) => {
  const reviews = await Review.find(baseQuery)
    .populate("userId", "firstName lastName email img")
    .populate("orderId", "recipient address createdAt")
    .populate("productReviews.productId", "name images type producer price")
    .sort(sortObject)
    .skip(skip)
    .limit(limitItems);

  const totalReviews = await Review.countDocuments(baseQuery);

  return { reviews, totalReviews };
};

// Get all reviews (for admin)
const getAllReviews = async (page = 1, limit = 10, sort = '-createdAt', filter = '', searchQuery = '') => {
  try {
    const currentPage = Number(page) || 1;
    const limitItems = Number(limit) || 10;
    const skip = (currentPage - 1) * limitItems;

    // Build base query and sort object
    const baseQuery = buildBaseQuery(filter);
    const sortObject = buildSortObject(sort);

    let reviews;
    let totalReviews;

    // Determine which search strategy to use
    if (searchQuery && searchQuery.trim()) {
      // Check if we need complex search (searching in populated fields)
      const needsComplexSearch = true; // Always use complex search for comprehensive results
      
      if (needsComplexSearch) {
        const result = await performComplexSearch(searchQuery, filter, sortObject, skip, limitItems);
        reviews = result.reviews;
        totalReviews = result.totalReviews;
      } else {
        const result = await performSimpleSearch(searchQuery, baseQuery, sortObject, skip, limitItems);
        reviews = result.reviews;
        totalReviews = result.totalReviews;
      }
    } else {
      // No search query - use simple query
      const result = await performSimpleQuery(baseQuery, sortObject, skip, limitItems);
      reviews = result.reviews;
      totalReviews = result.totalReviews;
    }

    return {
      status: "OK",
      message: "Get all reviews success",
      data: reviews,
      currentPage,
      totalPage: Math.ceil(totalReviews / limitItems),
      totalReviews,
    };
  } catch (e) {
    console.error("getAllReviews error:", e);
    throw {
      status: "ERR",
      message: e.message || "Failed to get all reviews",
    };
  }
};

const updateReview = (reviewId, updateData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const {
        overallRating,
        overallComment,
        productReviews,
        deliveryRating,
        serviceRating,
      } = updateData;

      const existingReview = await Review.findById(reviewId);
      if (!existingReview) {
        return resolve({ status: "ERR", message: "Review not found!" });
      }

      const existingKeys = new Set(
        existingReview.productReviews.map(pr => `${pr.productId}_${pr.color}_${pr.size}`)
      );

      const newProductReviews = (productReviews || []).filter(pr => {
        const key = `${pr.productId}_${pr.color}_${pr.size}`;
        return !existingKeys.has(key);
      });

      if (newProductReviews.length === 0 && !overallRating && !overallComment && !deliveryRating && !serviceRating) {
        return resolve({ status: "ERR", message: "Nothing to update or all products already reviewed!" });
      }

      if (newProductReviews.length > 0) {
        existingReview.productReviews.push(...newProductReviews);
        await updateProductRatings(newProductReviews);
      }

      if (overallRating) existingReview.overallRating = overallRating;
      if (overallComment) existingReview.overallComment = overallComment;
      if (deliveryRating) existingReview.deliveryRating = deliveryRating;
      if (serviceRating) existingReview.serviceRating = serviceRating;

      await existingReview.save();

      const order = await Order.findById(existingReview.orderId);
      const allProductKeys = new Set(order.products.map(p => `${p.productId}_${p.color}_${p.size}`));
      const reviewedKeys = new Set(
        existingReview.productReviews.map(pr => `${pr.productId}_${pr.color}_${pr.size}`)
      );
      const allReviewed = [...allProductKeys].every(k => reviewedKeys.has(k));
      if (allReviewed && !order.rated) {
        await Order.findByIdAndUpdate(order._id, { rated: true });
      }

      resolve({
        status: "OK",
        message: "Review updated successfully",
        data: existingReview,
      });

    } catch (e) {
      console.error("updateReview error:", e);
      reject({
        status: "ERR",
        message: e.message || "Failed to update review",
      });
    }
  });
};

// Delete a review
const deleteReview = (reviewId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const review = await Review.findById(reviewId);
      if (!review) {
        return resolve({
          status: "ERR",
          message: "Review not found!",
        });
      }

      await Review.findByIdAndDelete(reviewId);

      // Update product ratings after deletion
      const productIds = review.productReviews.map(pr => pr.productId);
      for (const productId of productIds) {
        await calculateAndUpdateProductRating(productId);
      }

      resolve({
        status: "OK",
        message: "Review deleted successfully",
      });
    } catch (e) {
      console.error("deleteReview error:", e);
      reject({
        status: "ERR",
        message: e.message || "Failed to delete review",
      });
    }
  });
};

module.exports = {
  createReview,
  getReview,
  getProductReviews,
  getUserReviews,
  getAllReviews,
  updateReview,
  deleteReview,
  calculateAndUpdateProductRating,
};