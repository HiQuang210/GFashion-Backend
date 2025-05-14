const Product = require("../models/ProductModel");
const bcrypt = require("bcrypt");
const cloudinary = require("../cloudinary");
const { ObjectId } = require("mongoose").Types;

const createProduct = (newProduct, files) => {
  return new Promise(async (resolve, reject) => {
    const { name, type, price, variants, rating, description, material } =
      newProduct;

    try {
      const checkProduct = await Product.findOne({
        name: name,
      });
      if (checkProduct !== null) {
        return resolve({
          status: "OK",
          message: "The name of Product is already exist!",
        });
      }

      // Upload files to Cloudinary
      const uploadPromises = files.map((file) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.v2.uploader.upload_stream(
            { resource_type: "image" },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                console.log("result", result);
                resolve(result.secure_url);
              }
            }
          );
          uploadStream.end(file.buffer);
        });
      });

      const imageUrls = await Promise.all(uploadPromises);

      const createdProduct = await Product.create({
        name,
        images: imageUrls,
        type,
        price,
        variants,
        rating,
        description,
        material,
      });
      if (createdProduct) {
        resolve({
          status: "OK",
          message: "Success",
          data: createdProduct,
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

const updateProduct = (id, data, files) => {
  return new Promise(async (resolve, reject) => {
    const { name, type, price, variants, description, material } = data;

    try {
      const checkProduct = await Product.findOne({
        _id: id,
      });

      if (checkProduct === null) {
        resolve({
          status: "OK",
          message: "The Product is not defined!",
        });
      }

      const images = checkProduct.images;

      // Upload files to Cloudinary
      if (files) {
        const uploadPromises = files.map((file) => {
          return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.v2.uploader.upload_stream(
              { resource_type: "image" },
              (error, result) => {
                if (error) {
                  reject(error);
                } else {
                  console.log("result", result);
                  resolve(result.secure_url);
                }
              }
            );
            uploadStream.end(file.buffer);
          });
        });
        const imageUrls = await Promise.all(uploadPromises);
        images.push(...imageUrls);
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        {
          name,
          images,
          type,
          price,
          variants,
          description,
          material,
        },
        {
          new: true,
        }
      );

      resolve({
        status: "OK",
        message: "Success",
        data: updatedProduct,
      });
    } catch (e) {
      reject(e);
    }
  });
};

const deleteProduct = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkProduct = await Product.findOne({
        _id: id,
      });

      console.log("checkProduct", checkProduct);

      if (checkProduct === null) {
        resolve({
          status: "OK",
          message: "The Product is not defined!",
        });
      }

      const images = checkProduct.images;

      await Product.findByIdAndDelete(id);
      resolve({
        status: "OK",
        message: "Delete Product success",
      });

      await User.updateMany(
        { favorite: id, isAdmin: { $ne: true } },
        { $pull: { favorite: id } }
      );

      // Update user documents to remove the reference to the deleted product from cart
      await User.updateMany(
        { "cart.product": id, isAdmin: { $ne: true } },
        { $pull: { cart: { product: id } } }
      );

      // Delete images from Cloudinary
      images.forEach(async (image) => {
        const publicId = image.split("/").pop().split(".")[0];
        await cloudinary.v2.uploader.destroy(publicId);
      });
    } catch (e) {
      reject({
        status: "ERR",
        message: e.message,
      });
    }
  });
};

const getAllProduct = (limitItem, page, sort, filter, searchQuery) => {
  return new Promise(async (resolve, reject) => {
    try {
      const totalProduct = await Product.countDocuments();
      const objectSort = {};
      const objectFilter = {};
      //console.log('filter', filter)

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
            objectSort.sale = -1;
            break;
          case "price-asc":
            objectSort.price = 1;
            break;
          case "price-desc":
            objectSort.price = -1;
            break;
          default:
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

      pipeline.push(
        { $skip: (page - 1) * limitItem },
        { $limit: limitItem },
        {
          $project: {
            _id: 1,
            name: 1,
            image: { $arrayElemAt: ["$images", 0] },
            price: 1,
          },
        }
      );

      const allProduct = await Product.aggregate(pipeline);

      resolve({
        status: "OK",
        message: "Get all Product success",
        data: allProduct,
        totalProd: allProduct.length,
        currentPage: Number(page),
        totalPage: Math.ceil(totalProduct / Number(limitItem)),
      });
    } catch (e) {
      reject(e);
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

const getDetailProduct = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const product = await Product.findOne({
        _id: id,
      }).select("name images type price variants rating description material");
      if (product === null) {
        resolve({
          status: "OK",
          message: "The Product is not defined!",
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

// Admin Service
const getAllProductsAsAdmin = (limitItem, page, sort, filter, searchQuery) => {
  return new Promise(async (resolve, reject) => {
    try {
      const totalProduct = await Product.countDocuments();
      const objectSort = {};
      const objectFilter = {};
      //console.log('filter', filter)

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
            objectSort.sale = -1;
            break;
          case "price-asc":
            objectSort.price = 1;
            break;
          case "price-desc":
            objectSort.price = -1;
            break;
          default:
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

      // Count total products
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
            image: { $arrayElemAt: ["$images", 0] },
            type: 1,
            price: 1,
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
        totalProd: totalProd,
        currentPage: Number(page),
      });
    } catch (e) {
      reject(e);
    }
  });
};

const deleteImage = (id, imageId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkProduct = await Product.findOne({
        _id: id,
      });

      if (checkProduct === null) {
        return resolve({
          status: "OK",
          message: "The Product is not defined!",
        });
      }

      // Delete image from Cloudinary
      const publicId = imageId.split("/").pop().split(".")[0];
      await cloudinary.v2.uploader.destroy(publicId);

      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        {
          $pull: { images: imageId },
        },
        { new: true }
      );

      resolve({
        status: "OK",
        message: "Success",
        data: updatedProduct,
      });
    } catch (e) {
      reject(e);
    }
  });
};

const searchAsAdmin = async (searchQuery, option) => {
  return new Promise(async (resolve, reject) => {
    try {
      const objectFilter = {};

      if (option === "name") {
        objectFilter.name = { $regex: searchQuery, $options: "i" };
      } else if (option === "id") {
        objectFilter._id = new ObjectId.createFromHexString(searchQuery);
      }

      const searchedProducts = await Product.aggregate([
        { $match: objectFilter },
        { $limit: 10 },
        {
          $project: {
            _id: 1,
            name: 1,
            image: { $arrayElemAt: ["$images", 0] },
            type: 1,
            price: 1,
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
        },
      ]);

      resolve({
        status: "OK",
        message: "Search Products success",
        data: searchedProducts,
      });
    } catch (e) {
      reject(e);
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
  getAllProductsAsAdmin,
  deleteImage,
  searchAsAdmin,
};
