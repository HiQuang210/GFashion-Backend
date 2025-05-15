const mongoose = require('mongoose');
const Product = require("../models/ProductModel");
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

const createProduct = (newProduct, files) => {
  return new Promise(async (resolve, reject) => {
    const {
      name,
      type,
      price,
      variants,
      rating,
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
        rating,
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

const getAllProduct = (limitItem, page, sort, filter, searchQuery) => {
  return new Promise(async (resolve, reject) => {
    try {
      const limit = Number(limitItem) || 10;
      const currentPage = Number(page) || 1;

      const objectSort = {};
      const objectFilter = {};

      if (filter) {
        objectFilter.type = filter;
      }

      if (searchQuery) {
        objectFilter.name = { $regex: searchQuery, $options: "i" };
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
          default:
            objectSort.createdAt = -1;
        }
      } else {
        objectSort.createdAt = -1;
      }

      const totalProduct = await Product.countDocuments(objectFilter);

      const pipeline = [{ $match: objectFilter }];

      pipeline.push({ $sort: objectSort });

      pipeline.push(
        { $skip: (currentPage - 1) * limit },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            name: 1,
            images: 1,
            price: 1,
            variants: 1,
            sold: 1,
            createdAt: 1,
            updatedAt: 1, 
          },
        }
      );

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
      reject(e);
    }
  });
};

const getDetailProduct = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const product = await Product.findOne({ _id: id }).select(
        "name images type price producer variants rating description material createdAt updatedAt sold"
      );

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
          updatedAt: new Date(), 
        },
        { new: true }
      );

      resolve({
        status: "OK",
        message: "Update product success",
        data: updatedProduct,
      });
    } catch (error) {
      reject(error);
    }
  });
};

const getTotalPages = (limitItem, filter) => {
  return new Promise(async (resolve, reject) => {
    try {
      const objectFilter = {};

      if (filter) {
        objectFilter.type = filter;
      }

      const totalProduct = await Product.find(objectFilter).countDocuments();

      resolve({
        status: "OK",
        message: "Get total pages success",
        totalPage: Math.ceil(totalProduct / Number(limitItem)),
      });
    } catch (e) {
      reject(e);
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

      const pipeline = [{ $match: objectFilter }];

      if (Object.keys(objectSort).length > 0) {
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
            rating: 1,
            description: 1,
            material: 1,
            producer: 1,
            inStock: 1,
            sold: 1,
            createdAt: 1,
            updatedAt: 1,
            images: 1,
            variants: 1,
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
            },
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
      
      await Product.deleteMany({ _id: { $in: validIds } });
      
      await User.updateMany(
        { favorite: { $in: validIds }, isAdmin: { $ne: true } },
        { $pull: { favorite: { $in: validIds } } }
      );

      await User.updateMany(
        { "cart.product": { $in: validIds }, isAdmin: { $ne: true } },
        { $pull: { cart: { product: { $in: validIds } } } }
      );

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

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProduct,
  getTotalPages,
  getDetailProduct,
  adminAllProducts,
};
