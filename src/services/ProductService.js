const mongoose = require('mongoose');
const Product = require("../models/ProductModel");
const Review = require("../models/ReviewModel");
const cloudinary = require("../cloudinary");
const User = require('../models/UserModel'); 

const uploadProductImageToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    if (!file?.buffer || !cloudinary?.uploader) {
      return reject(new Error("Cloudinary config error or invalid file"));
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: "product_images",
        transformation: [{ width: 1000, height: 1000, crop: "limit" }],
      },
      (err, result) => {
        if (err)
          return reject(new Error("Cloudinary upload failed: " + err.message));
        resolve(result.secure_url);
      }
    );

    stream.end(file.buffer);
  });
};

const deleteImageFromCloudinary = (imageUrl) => {
  return new Promise((resolve, reject) => {
    if (!imageUrl) return resolve();

    const publicId = imageUrl
      .split('/')
      .slice(-2)
      .join('/')
      .replace(/\.[^/.]+$/, ""); 

    cloudinary.uploader.destroy(publicId, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

const calculateProductRatingFromReviews = async (productId) => {
  try {
    const reviews = await Review.aggregate([
      { $unwind: "$productReviews" },
      { $match: { "productReviews.productId": new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: "$productReviews.productId",
          averageRating: { $avg: "$productReviews.rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (reviews.length > 0) {
      return {
        rating: Math.round(reviews[0].averageRating * 10) / 10, // Round to 1 decimal place
        reviewCount: reviews[0].totalReviews
      };
    }
    
    return { rating: 0, reviewCount: 0 };
  } catch (error) {
    console.error("Error calculating product rating from reviews:", error);
    return { rating: 0, reviewCount: 0 };
  }
};

const createProduct = (newProduct, files) => {
  return new Promise(async (resolve, reject) => {
    const {
      name,
      type,
      price,
      variants,
      description,
      material,
      producer,
    } = newProduct;

    try {
      const checkProduct = await Product.findOne({ name });
      if (checkProduct !== null) {
        return resolve({
          status: "OK",
          message: "The name of Product is already exist!",
        });
      }

      const imageUrls = await Promise.all(
        files.map((file) => uploadProductImageToCloudinary(file))
      );

      const createdProduct = await Product.create({
        name,
        images: imageUrls,
        type,
        price,
        producer,
        variants,
        rating: 0, 
        description,
        material,
      });

      resolve({
        status: "OK",
        message: "Success",
        data: createdProduct,
      });
    } catch (e) {
      reject(e);
    }
  });
};

const buildFilter = (filter, producer, searchQuery, minPrice, maxPrice) => {
  const objectFilter = {};

  if (filter && filter !== 'all') {
    objectFilter.type = { $regex: new RegExp(`^${filter}`, 'i') };
  }
  if (producer && producer !== 'all') {
    objectFilter.producer = { $regex: new RegExp(`^${producer.trim()}$`, 'i') };
  }
  if (searchQuery) {
    objectFilter.name = { $regex: searchQuery, $options: "i" };
  }
  if (minPrice || maxPrice) {
    objectFilter.price = {};
    if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
      const minPriceNum = Number(minPrice);
      if (!isNaN(minPriceNum) && minPriceNum >= 0) {
        objectFilter.price.$gte = minPriceNum;
      }
    }
    if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
      const maxPriceNum = Number(maxPrice);
      if (!isNaN(maxPriceNum) && maxPriceNum >= 0) {
        objectFilter.price.$lte = maxPriceNum;
      }
    }
    if (Object.keys(objectFilter.price).length === 0) {
      delete objectFilter.price;
    }
  }

  return objectFilter;
};

const buildSort = (sort) => {
  const sortMap = {
    "newest": { updatedAt: -1 },
    "best-seller": { sold: -1 },
    "price-asc": { price: 1 },
    "price-low": { price: 1 },
    "price-desc": { price: -1 },
    "price-high": { price: -1 }
  };
  
  return sortMap[sort] || { createdAt: -1 };
};

const buildAggregationPipeline = (objectFilter, sort, currentPage, limit) => {
  const pipeline = [
    { $match: objectFilter },
    {
      $lookup: {
        from: "reviews",
        let: { productId: "$_id" },
        pipeline: [
          { $unwind: "$productReviews" },
          { $match: { $expr: { $eq: ["$productReviews.productId", "$$productId"] } } },
          {
            $group: {
              _id: "$productReviews.productId",
              averageRating: { $avg: "$productReviews.rating" },
              reviewCount: { $sum: 1 }
            }
          }
        ],
        as: "reviewData"
      }
    },
    {
      $addFields: {
        actualRating: {
          $cond: {
            if: { $gt: [{ $size: "$reviewData" }, 0] },
            then: { $round: [{ $arrayElemAt: ["$reviewData.averageRating", 0] }, 1] },
            else: 0
          }
        },
        reviewCount: {
          $cond: {
            if: { $gt: [{ $size: "$reviewData" }, 0] },
            then: { $arrayElemAt: ["$reviewData.reviewCount", 0] },
            else: 0
          }
        }
      }
    }
  ];

  if (sort === "highest-rating") {
    pipeline.push({ $sort: { actualRating: -1, createdAt: -1 } });
  } else {
    pipeline.push({ $sort: buildSort(sort) });
  }

  pipeline.push(
    { $skip: (currentPage - 1) * limit },
    { $limit: limit },
    {
      $project: {
        _id: 1, name: 1, images: 1, type: 1, producer: 1, price: 1,
        variants: 1, sold: 1, rating: "$actualRating", reviewCount: 1,
        createdAt: 1, updatedAt: 1
      }
    }
  );

  return pipeline;
};

const getAllProduct = (limitItem, page, sort, filter, searchQuery, producer, minPrice, maxPrice) => {
  return new Promise(async (resolve, reject) => {
    try {
      const limit = Number(limitItem) || 10;
      const currentPage = Number(page) || 1;
      
      const objectFilter = buildFilter(filter, producer, searchQuery, minPrice, maxPrice);
      const totalProduct = await Product.countDocuments(objectFilter);
      const pipeline = buildAggregationPipeline(objectFilter, sort, currentPage, limit);
      const allProduct = await Product.aggregate(pipeline);

      resolve({
        status: "OK",
        message: "Get all Product success",
        data: allProduct,
        totalProd: totalProduct,
        currentPage,
        totalPage: Math.ceil(totalProduct / limit),
      });
    } catch (e) {
      console.error('getAllProduct error:', e);
      reject(e);
    }
  });
};

const getTotalPages = (limitItem, filter, producer, minPrice, maxPrice) => {
  return new Promise(async (resolve, reject) => {
    try {
      const objectFilter = buildFilter(filter, producer, undefined, minPrice, maxPrice);
      const totalProduct = await Product.countDocuments(objectFilter);

      resolve({
        status: "OK",
        message: "Get total pages success",
        totalPage: Math.ceil(totalProduct / Number(limitItem)),
      });
    } catch (e) {
      console.error('getTotalPages error:', e);
      reject(e);
    }
  });
};

const getDetailProduct = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const pipeline = [
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
        {
          $lookup: {
            from: "reviews",
            let: { productId: "$_id" },
            pipeline: [
              { $unwind: "$productReviews" },
              { $match: { $expr: { $eq: ["$productReviews.productId", "$$productId"] } } },
              {
                $group: {
                  _id: "$productReviews.productId",
                  averageRating: { $avg: "$productReviews.rating" },
                  reviewCount: { $sum: 1 },
                  ratings: { $push: "$productReviews.rating" }
                }
              }
            ],
            as: "reviewData"
          }
        },
        {
          $addFields: {
            actualRating: {
              $cond: {
                if: { $gt: [{ $size: "$reviewData" }, 0] },
                then: { $round: [{ $arrayElemAt: ["$reviewData.averageRating", 0] }, 1] },
                else: 0
              }
            },
            reviewCount: {
              $cond: {
                if: { $gt: [{ $size: "$reviewData" }, 0] },
                then: { $arrayElemAt: ["$reviewData.reviewCount", 0] },
                else: 0
              }
            },
            ratingDistribution: {
              $cond: {
                if: { $gt: [{ $size: "$reviewData" }, 0] },
                then: {
                  $let: {
                    vars: {
                      ratings: { $arrayElemAt: ["$reviewData.ratings", 0] }
                    },
                    in: {
                      5: { $size: { $filter: { input: "$$ratings", cond: { $eq: ["$$this", 5] } } } },
                      4: { $size: { $filter: { input: "$$ratings", cond: { $eq: ["$$this", 4] } } } },
                      3: { $size: { $filter: { input: "$$ratings", cond: { $eq: ["$$this", 3] } } } },
                      2: { $size: { $filter: { input: "$$ratings", cond: { $eq: ["$$this", 2] } } } },
                      1: { $size: { $filter: { input: "$$ratings", cond: { $eq: ["$$this", 1] } } } }
                    }
                  }
                },
                else: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
              }
            }
          }
        },
        {
          $project: {
            name: 1,
            images: 1,
            type: 1,
            price: 1,
            producer: 1,
            variants: 1,
            rating: "$actualRating", 
            reviewCount: 1,
            ratingDistribution: 1,
            description: 1,
            material: 1,
            createdAt: 1,
            updatedAt: 1,
            sold: 1
          }
        }
      ];

      const products = await Product.aggregate(pipeline);
      const product = products.length > 0 ? products[0] : null;

      if (!product) {
        return resolve({
          status: "NOT_FOUND",
          message: "The product is not defined!",
        });
      }

      resolve({
        status: "OK",
        message: "Get Detail Product success",
        data: product,
      });
    } catch (e) {
      reject(e);
    }
  });
};

const updateProduct = (id, data, files) => {
  return new Promise(async (resolve, reject) => {
    const {
      name,
      type,
      price,
      producer,
      variants,
      description,
      material,
      removedImages = [],
    } = data;

    try {
      const existingProduct = await Product.findById(id);

      if (!existingProduct) {
        return resolve({
          status: "NOT_FOUND",
          message: "The Product is not defined!",
        });
      }

      let updatedImages = existingProduct.images || [];

      if (removedImages && removedImages.length > 0) {
        const deletePromises = removedImages.map((url) =>
          deleteImageFromCloudinary(url)
        );
        await Promise.all(deletePromises);

        updatedImages = updatedImages.filter(
          (imgUrl) => !removedImages.includes(imgUrl)
        );
      }

      if (files && files.length > 0) {
        const uploadPromises = files.map((file) =>
          uploadProductImageToCloudinary(file)
        );
        const newImageUrls = await Promise.all(uploadPromises);
        updatedImages.push(...newImageUrls);
      }

      // Get current rating from reviews (don't update rating manually)
      const ratingData = await calculateProductRatingFromReviews(id);

      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        {
          name,
          type,
          price,
          producer,
          variants,
          description,
          material,
          images: updatedImages,
          rating: ratingData.rating, // Update with calculated rating
          updatedAt: new Date(), 
        },
        { new: true }
      );

      resolve({
        status: "OK",
        message: "Update product success",
        data: {
          ...updatedProduct.toObject(),
          reviewCount: ratingData.reviewCount
        },
      });
    } catch (error) {
      reject(error);
    }
  });
};

const adminAllProducts = (limitItem, page, sort, filter, searchQuery) => {
  return new Promise(async (resolve, reject) => {
    try {
      const objectSort = {};
      const objectFilter = {};

      if (filter) {
        objectFilter.type = filter;
      }

      if (sort) {
        switch (sort) {
          case "highest-rating":
            objectSort.rating = -1;
            break;
          case "newest":
            objectSort.updatedAt = -1;
            break;
          case "best-seller":
            objectSort.sold = -1;
            break;
          case "price-asc":
            objectSort.price = 1;
            break;
          case "price-desc":
            objectSort.price = -1;
            break;
        }
      }

      if (searchQuery) {
        objectFilter.name = { $regex: searchQuery, $options: "i" };
      }

      const pipeline = [
        { $match: objectFilter },
        {
          $lookup: {
            from: "reviews",
            let: { productId: "$_id" },
            pipeline: [
              { $unwind: "$productReviews" },
              { $match: { $expr: { $eq: ["$productReviews.productId", "$$productId"] } } },
              {
                $group: {
                  _id: "$productReviews.productId",
                  averageRating: { $avg: "$productReviews.rating" },
                  reviewCount: { $sum: 1 }
                }
              }
            ],
            as: "reviewData"
          }
        },
        {
          $addFields: {
            actualRating: {
              $cond: {
                if: { $gt: [{ $size: "$reviewData" }, 0] },
                then: { $round: [{ $arrayElemAt: ["$reviewData.averageRating", 0] }, 1] },
                else: 0
              }
            },
            reviewCount: {
              $cond: {
                if: { $gt: [{ $size: "$reviewData" }, 0] },
                then: { $arrayElemAt: ["$reviewData.reviewCount", 0] },
                else: 0
              }
            },
            stock: {
              $sum: {
                $map: {
                  input: "$variants",
                  as: "variant",
                  in: {
                    $sum: "$$variant.sizes.stock",
                  },
                },
              },
            }
          }
        }
      ];

      if (Object.keys(objectSort).length > 0) {
        if (objectSort.rating) {
          delete objectSort.rating;
          objectSort.actualRating = -1;
        }
        pipeline.push({ $sort: objectSort });
      }

      const totalProductPipeline = [...pipeline, { $count: "total" }];
      const totalProductResult = await Product.aggregate(totalProductPipeline);
      const totalProd =
        totalProductResult.length > 0 ? totalProductResult[0].total : 0;

      pipeline.push(
        { $skip: (page - 1) * limitItem },
        { $limit: limitItem },
        {
          $project: {
            _id: 1,
            name: 1,
            type: 1,
            price: 1,
            rating: "$actualRating", 
            reviewCount: 1,
            description: 1,
            material: 1,
            producer: 1,
            inStock: 1,
            sold: 1,
            createdAt: 1,
            updatedAt: 1,
            images: 1,
            variants: 1,
            stock: 1,
          },
        }
      );

      const allProduct = await Product.aggregate(pipeline);

      resolve({
        status: "OK",
        message: "Get all Product success",
        data: allProduct,
        totalProd,
        currentPage: Number(page),
        totalPage: Math.ceil(totalProd / Number(limitItem)),
      });
    } catch (e) {
      reject(e);
    }
  });
};

const deleteProduct = (ids) => {
  return new Promise(async (resolve, reject) => {
    try {
      const productIds = Array.isArray(ids) ? ids : [ids];

      const validIds = productIds.filter(id => mongoose.Types.ObjectId.isValid(id));

      if (validIds.length === 0) {
        return resolve({ 
          status: "ERR", 
          message: "No valid product ID(s) provided" 
        });
      }

      const products = await Product.find({ _id: { $in: validIds } });

      if (products.length === 0) {
        return resolve({ 
          status: "ERR", 
          message: "No matching products found" 
        });
      }

      const imageUrls = products.flatMap(p => p.images || []);
      
      // Delete the products
      await Product.deleteMany({ _id: { $in: validIds } });
      
      // Remove products from user favorites
      await User.updateMany(
        { favorite: { $in: validIds }, isAdmin: { $ne: true } },
        { $pull: { favorite: { $in: validIds } } }
      );

      // Remove products from user carts
      await User.updateMany(
        { "cart.product": { $in: validIds }, isAdmin: { $ne: true } },
        { $pull: { cart: { product: { $in: validIds } } } }
      );

      // Handle review cleanup more precisely
      await handleReviewCleanup(validIds);

      // Clean up images from cloud storage
      if (imageUrls.length > 0) {
        await Promise.all(imageUrls.map(deleteImageFromCloudinary));
      }

      resolve({
        status: "OK",
        message: `Deleted ${validIds.length} product(s) successfully`,
        data: {
          deletedCount: validIds.length,
          deletedIds: validIds
        }
      });
    } catch (error) {
      console.error('Delete product error:', error);
      reject({
        status: "ERR",
        message: error.message || "Something went wrong while deleting product(s)",
      });
    }
  });
};

const handleReviewCleanup = async (deletedProductIds) => {
  try {
    const reviewsWithDeletedProducts = await Review.find({
      "productReviews.productId": { $in: deletedProductIds }
    });

    for (const review of reviewsWithDeletedProducts) {
      const updatedProductReviews = review.productReviews.filter(
        pr => !deletedProductIds.some(id => id.toString() === pr.productId.toString())
      );

      await Review.findByIdAndUpdate(review._id, {
        productReviews: updatedProductReviews
      });
    }

    const remainingReviews = await Review.find({});
    const productRatingUpdates = new Map();

    for (const review of remainingReviews) {
      for (const productReview of review.productReviews) {
        const productId = productReview.productId.toString();
        if (!productRatingUpdates.has(productId)) {
          productRatingUpdates.set(productId, []);
        }
        productRatingUpdates.get(productId).push(productReview.rating);
      }
    }

    for (const [productId, ratings] of productRatingUpdates) {
      const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      await Product.findByIdAndUpdate(productId, {
        rating: Number(avgRating.toFixed(1)),
        reviewCount: ratings.length
      });
    }

    const productsWithoutReviews = await Product.find({
      _id: { $nin: Array.from(productRatingUpdates.keys()) }
    });

    for (const product of productsWithoutReviews) {
      await Product.findByIdAndUpdate(product._id, {
        rating: 0,
        reviewCount: 0
      });
    }

  } catch (error) {
    console.error('Error handling review cleanup:', error);
    throw error;
  }
};

const syncAllProductRatings = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const products = await Product.find({}, '_id');
      
      for (const product of products) {
        const ratingData = await calculateProductRatingFromReviews(product._id);
        await Product.findByIdAndUpdate(product._id, {
          rating: ratingData.rating
        });
      }

      resolve({
        status: "OK",
        message: `Successfully synced ratings for ${products.length} products`,
        data: { updatedCount: products.length }
      });
    } catch (error) {
      console.error('Sync ratings error:', error);
      reject({
        status: "ERR",
        message: error.message || "Failed to sync product ratings"
      });
    }
  });
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  handleReviewCleanup,
  getAllProduct,
  getTotalPages,
  getDetailProduct,
  adminAllProducts,
  syncAllProductRatings,
  calculateProductRatingFromReviews,
};